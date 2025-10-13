import { describe, it, expect, vi, beforeEach } from 'vitest'
import { autoRenameSession, AutoRenameError } from './session-title'

// Mock dependencies
vi.mock('@ai-sdk/google', () => ({
  createGoogleGenerativeAI: vi.fn(() => (modelName: string) => ({ modelName }))
}))

vi.mock('ai', () => ({
  generateText: vi.fn()
}))

vi.mock('../../lib/prisma', () => ({
  prisma: {
    chatSession: {
      findFirst: vi.fn(),
      update: vi.fn()
    },
    message: {
      findFirst: vi.fn()
    },
    $transaction: vi.fn()
  }
}))

describe('session-title', () => {
  let mockPrisma: any
  let mockGenerateText: any

  beforeEach(async () => {
    vi.clearAllMocks()
    
    // Import mocked modules
    const prismaModule = await import('../../lib/prisma')
    const aiModule = await import('ai')
    
    mockPrisma = vi.mocked(prismaModule).prisma
    mockGenerateText = vi.mocked(aiModule).generateText
  })

  describe('AutoRenameError', () => {
    it('should create error with SESSION_NOT_FOUND code', () => {
      const error = new AutoRenameError('SESSION_NOT_FOUND')
      
      expect(error.name).toBe('AutoRenameError')
      expect(error.code).toBe('SESSION_NOT_FOUND')
      expect(error.message).toBe('SESSION_NOT_FOUND')
    })

    it('should create error with NO_MESSAGES code', () => {
      const error = new AutoRenameError('NO_MESSAGES', 'Custom message')
      
      expect(error.name).toBe('AutoRenameError')
      expect(error.code).toBe('NO_MESSAGES')
      expect(error.message).toBe('Custom message')
    })
  })

  describe('autoRenameSession', () => {
    it('should throw SESSION_NOT_FOUND when session does not exist', async () => {
      mockPrisma.chatSession.findFirst.mockResolvedValue(null)

      await expect(
        autoRenameSession({
          sessionId: 'non-existent',
          apiKey: 'test-key'
        })
      ).rejects.toThrow(AutoRenameError)

      await expect(
        autoRenameSession({
          sessionId: 'non-existent',
          apiKey: 'test-key'
        })
      ).rejects.toMatchObject({ code: 'SESSION_NOT_FOUND' })
    })

    it('should throw NO_MESSAGES when session has no messages', async () => {
      mockPrisma.chatSession.findFirst.mockResolvedValue({
        id: 'session-1',
        title: 'Old Title',
        userId: 'user-1',
        messages: []
      })

      await expect(
        autoRenameSession({
          sessionId: 'session-1',
          apiKey: 'test-key',
          userId: 'user-1'
        })
      ).rejects.toThrow(AutoRenameError)

      await expect(
        autoRenameSession({
          sessionId: 'session-1',
          apiKey: 'test-key',
          userId: 'user-1'
        })
      ).rejects.toMatchObject({ code: 'NO_MESSAGES' })
    })

    it('should generate and update session title successfully', async () => {

      const mockSession = {
        id: 'session-1',
        title: 'Old Title',
        userId: 'user-1',
        createdAt: new Date('2024-01-01'),
        messages: [
          { role: 'user', content: 'Hello', createdAt: new Date('2024-01-01') },
          { role: 'assistant', content: 'Hi there!', createdAt: new Date('2024-01-01') }
        ]
      }

      const updatedSession = {
        id: 'session-1',
        title: 'Percakapan Sapaan',
        createdAt: new Date('2024-01-01')
      }

      const latestMessage = {
        createdAt: new Date('2024-01-02')
      }

      mockPrisma.chatSession.findFirst.mockResolvedValue(mockSession)
      mockGenerateText.mockResolvedValue({ text: 'Percakapan Sapaan' })
      mockPrisma.$transaction.mockResolvedValue([updatedSession, latestMessage])

      const result = await autoRenameSession({
        sessionId: 'session-1',
        apiKey: 'test-key',
        userId: 'user-1'
      })

      expect(result).toEqual({
        id: 'session-1',
        title: 'Percakapan Sapaan',
        createdAt: updatedSession.createdAt.toISOString(),
        updatedAt: latestMessage.createdAt.toISOString()
      })

      expect(mockGenerateText).toHaveBeenCalledWith(
        expect.objectContaining({
          prompt: expect.stringContaining('user: Hello'),
          temperature: 0.4
        })
      )
    })

    it('should sanitize generated title by removing quotes', async () => {

      const mockSession = {
        id: 'session-1',
        title: 'Old Title',
        userId: 'user-1',
        createdAt: new Date('2024-01-01'),
        messages: [
          { role: 'user', content: 'Test', createdAt: new Date('2024-01-01') }
        ]
      }

      const updatedSession = {
        id: 'session-1',
        title: 'Clean Title',
        createdAt: new Date('2024-01-01')
      }

      mockPrisma.chatSession.findFirst.mockResolvedValue(mockSession)
      mockGenerateText.mockResolvedValue({ text: '"Clean Title"' })
      mockPrisma.$transaction.mockResolvedValue([updatedSession, null])

      const result = await autoRenameSession({
        sessionId: 'session-1',
        apiKey: 'test-key'
      })

      // Verify transaction was called and title was sanitized
      expect(mockPrisma.$transaction).toHaveBeenCalled()
      expect(result.title).toBe('Clean Title')
    })

    it('should truncate title if longer than 50 characters', async () => {

      const longTitle = 'This is a very long title that exceeds the maximum length of fifty characters'
      
      const mockSession = {
        id: 'session-1',
        title: 'Old Title',
        userId: 'user-1',
        createdAt: new Date('2024-01-01'),
        messages: [
          { role: 'user', content: 'Test', createdAt: new Date('2024-01-01') }
        ]
      }

      const updatedSession = {
        id: 'session-1',
        title: longTitle.slice(0, 50),
        createdAt: new Date('2024-01-01')
      }

      mockPrisma.chatSession.findFirst.mockResolvedValue(mockSession)
      mockGenerateText.mockResolvedValue({ text: longTitle })
      mockPrisma.$transaction.mockResolvedValue([updatedSession, null])

      const result = await autoRenameSession({
        sessionId: 'session-1',
        apiKey: 'test-key'
      })

      // Verify transaction was called and title was truncated
      expect(mockPrisma.$transaction).toHaveBeenCalled()
      expect(result.title).toBe(longTitle.slice(0, 50))
    })

    it('should use fallback title on network error', async () => {

      const mockSession = {
        id: 'session-1',
        title: 'Old Title',
        userId: 'user-1',
        createdAt: new Date('2024-01-01'),
        messages: [
          { role: 'user', content: 'Test', createdAt: new Date('2024-01-01') }
        ]
      }

      const updatedSession = {
        id: 'session-1',
        title: 'Percakapan 1/1/2024',
        createdAt: new Date('2024-01-01')
      }

      mockPrisma.chatSession.findFirst.mockResolvedValue(mockSession)
      
      const networkError = new Error('Network error')
      ;(networkError as any).code = 'ENOTFOUND'
      mockGenerateText.mockRejectedValue(networkError)
      
      mockPrisma.$transaction.mockResolvedValue([updatedSession, null])

      const result = await autoRenameSession({
        sessionId: 'session-1',
        apiKey: 'test-key'
      })

      expect(result.title).toContain('Percakapan')
    })

    it('should use fallback title on rate limit error', async () => {

      const mockSession = {
        id: 'session-1',
        title: 'Old Title',
        userId: 'user-1',
        createdAt: new Date('2024-01-01'),
        messages: [
          { role: 'user', content: 'Test', createdAt: new Date('2024-01-01') }
        ]
      }

      const updatedSession = {
        id: 'session-1',
        title: 'Percakapan 1/1/2024',
        createdAt: new Date('2024-01-01')
      }

      mockPrisma.chatSession.findFirst.mockResolvedValue(mockSession)
      
      const rateLimitError = new Error('Rate limit')
      ;(rateLimitError as any).status = 429
      mockGenerateText.mockRejectedValue(rateLimitError)
      
      mockPrisma.$transaction.mockResolvedValue([updatedSession, null])

      const result = await autoRenameSession({
        sessionId: 'session-1',
        apiKey: 'test-key'
      })

      expect(result.title).toContain('Percakapan')
    })

    it('should handle multimodal content with images', async () => {

      const multimodalContent = JSON.stringify({
        type: 'multimodal',
        text: 'Check this image',
        images: [{ data: 'base64data' }]
      })

      const mockSession = {
        id: 'session-1',
        title: 'Old Title',
        userId: 'user-1',
        createdAt: new Date('2024-01-01'),
        messages: [
          { role: 'user', content: multimodalContent, createdAt: new Date('2024-01-01') }
        ]
      }

      const updatedSession = {
        id: 'session-1',
        title: 'Image Discussion',
        createdAt: new Date('2024-01-01')
      }

      mockPrisma.chatSession.findFirst.mockResolvedValue(mockSession)
      mockGenerateText.mockResolvedValue({ text: 'Image Discussion' })
      mockPrisma.$transaction.mockResolvedValue([updatedSession, null])

      const result = await autoRenameSession({
        sessionId: 'session-1',
        apiKey: 'test-key'
      })

      expect(mockGenerateText).toHaveBeenCalledWith(
        expect.objectContaining({
          prompt: expect.stringContaining('[1 gambar]')
        })
      )
    })
  })
})
