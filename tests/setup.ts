import { vi } from 'vitest'

// Mock Nuxt auto-imports
global.ref = vi.fn((value) => ({ value })) as any
global.computed = vi.fn((fn) => ({ value: fn() })) as any
global.watch = vi.fn() as any
global.watchEffect = vi.fn() as any
global.onMounted = vi.fn() as any
global.onUnmounted = vi.fn() as any
global.nextTick = vi.fn().mockResolvedValue(undefined) as any
global.useRuntimeConfig = vi.fn(() => ({
  geminiApiKey: 'test-key',
  public: {}
})) as any

// Mock $fetch
global.$fetch = vi.fn() as any

// Mock navigateTo
global.navigateTo = vi.fn() as any

// Mock useRoute and useRouter
global.useRoute = vi.fn(() => ({
  params: {},
  query: {}
})) as any

global.useRouter = vi.fn(() => ({
  push: vi.fn(),
  replace: vi.fn(),
  back: vi.fn()
})) as any

// Mock console methods to reduce test noise
global.console = {
  ...console,
  log: vi.fn(),
  error: vi.fn(),
  warn: vi.fn(),
  info: vi.fn()
}
