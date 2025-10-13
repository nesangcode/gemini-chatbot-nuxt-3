import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getUserFromSession, requireAuth } from './auth'
import type { H3Event } from 'h3'

// Mock dependencies
vi.mock('#logto', () => ({
  logtoEventHandler: vi.fn()
}))

vi.mock('../../lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      create: vi.fn()
    }
  }
}))

// Mock createError from h3
const mockCreateError = vi.fn((error) => {
  const err = new Error(error.statusMessage) as any
  err.statusCode = error.statusCode
  err.statusMessage = error.statusMessage
  return err
})

vi.mock('h3', async () => {
  const actual = await vi.importActual('h3')
  return {
    ...actual,
    createError: mockCreateError
  }
})

describe('auth', () => {
  let mockPrisma: any
  let mockLogtoHandler: any

  beforeEach(async () => {
    vi.clearAllMocks()
    
    // Import mocked modules
    const prismaModule = await import('../../lib/prisma')
    const logtoModule = await import('#logto')
    
    mockPrisma = vi.mocked(prismaModule).prisma
    mockLogtoHandler = vi.mocked(logtoModule).logtoEventHandler
  })

  const createMockEvent = (logtoUser?: any): Partial<H3Event> => ({
    context: {
      logtoUser
    }
  } as any)

  describe('getUserFromSession', () => {
    it('should return null when no logto user in context', async () => {
      mockLogtoHandler.mockResolvedValue(undefined)

      const event = createMockEvent()
      const result = await getUserFromSession(event as H3Event)

      expect(result).toBeNull()
    })

    it('should return null when logto user has no sub', async () => {
      mockLogtoHandler.mockResolvedValue(undefined)

      const event = createMockEvent({ email: 'test@example.com' })
      const result = await getUserFromSession(event as H3Event)

      expect(result).toBeNull()
    })

    it('should return existing user from database', async () => {

      const mockLogtoUser = {
        sub: 'logto-user-123',
        email: 'test@example.com'
      }

      const mockUser = {
        id: 'user-1',
        logtoId: 'logto-user-123',
        email: 'test@example.com',
        createdAt: new Date(),
        updatedAt: new Date()
      }

      mockLogtoHandler.mockResolvedValue(undefined)
      const event = createMockEvent(mockLogtoUser)
      mockPrisma.user.findUnique.mockResolvedValue(mockUser)

      const result = await getUserFromSession(event as H3Event)

      expect(result).toEqual(mockUser)
      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { logtoId: 'logto-user-123' }
      })
    })

    it('should create new user if not found in database', async () => {

      const mockLogtoUser = {
        sub: 'logto-user-456',
        email: 'newuser@example.com'
      }

      const mockNewUser = {
        id: 'user-2',
        logtoId: 'logto-user-456',
        email: 'newuser@example.com',
        createdAt: new Date(),
        updatedAt: new Date()
      }

      mockLogtoHandler.mockResolvedValue(undefined)
      const event = createMockEvent(mockLogtoUser)
      mockPrisma.user.findUnique.mockResolvedValue(null)
      mockPrisma.user.create.mockResolvedValue(mockNewUser)

      const result = await getUserFromSession(event as H3Event)

      expect(result).toEqual(mockNewUser)
      expect(mockPrisma.user.create).toHaveBeenCalledWith({
        data: {
          logtoId: 'logto-user-456',
          email: 'newuser@example.com'
        }
      })
    })

    it('should create user with default email when logto user has no email', async () => {

      const mockLogtoUser = {
        sub: 'logto-user-789'
      }

      const mockNewUser = {
        id: 'user-3',
        logtoId: 'logto-user-789',
        email: 'user-logto-user-789@example.com',
        createdAt: new Date(),
        updatedAt: new Date()
      }

      mockLogtoHandler.mockResolvedValue(undefined)
      const event = createMockEvent(mockLogtoUser)
      mockPrisma.user.findUnique.mockResolvedValue(null)
      mockPrisma.user.create.mockResolvedValue(mockNewUser)

      const result = await getUserFromSession(event as H3Event)

      expect(result).toEqual(mockNewUser)
      expect(mockPrisma.user.create).toHaveBeenCalledWith({
        data: {
          logtoId: 'logto-user-789',
          email: 'user-logto-user-789@example.com'
        }
      })
    })

    it('should return null on error', async () => {
      mockLogtoHandler.mockResolvedValue(undefined)
      const event = createMockEvent({ sub: 'logto-user-error' })
      mockPrisma.user.findUnique.mockRejectedValue(new Error('Database error'))

      const result = await getUserFromSession(event as H3Event)

      expect(result).toBeNull()
    })
  })

  describe('requireAuth', () => {
    it('should return user when authenticated', async () => {

      const mockLogtoUser = {
        sub: 'logto-user-123',
        email: 'test@example.com'
      }

      const mockUser = {
        id: 'user-1',
        logtoId: 'logto-user-123',
        email: 'test@example.com',
        createdAt: new Date(),
        updatedAt: new Date()
      }

      mockLogtoHandler.mockResolvedValue(undefined)
      const event = createMockEvent(mockLogtoUser)
      mockPrisma.user.findUnique.mockResolvedValue(mockUser)

      const result = await requireAuth(event as H3Event)

      expect(result).toEqual(mockUser)
    })

    it('should throw error when user is not authenticated', async () => {
      mockLogtoHandler.mockResolvedValue(undefined)

      const event = createMockEvent()

      await expect(requireAuth(event as H3Event)).rejects.toThrow()
    })

    it('should throw error when getUserFromSession returns null', async () => {
      mockLogtoHandler.mockResolvedValue(undefined)
      const event = createMockEvent({ sub: 'logto-user-error' })
      mockPrisma.user.findUnique.mockRejectedValue(new Error('Database error'))

      await expect(requireAuth(event as H3Event)).rejects.toThrow()
    })
  })
})
