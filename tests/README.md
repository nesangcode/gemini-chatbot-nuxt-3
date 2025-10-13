# Testing Guide

This project uses **Vitest** and **@nuxt/test-utils** for unit testing.

## Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with UI
npm run test:ui

# Run tests with coverage report
npm run test:coverage
```

## Test Structure

### Server Utils Tests
- **`server/utils/auth.test.ts`** - Tests for authentication utilities
- **`server/utils/message-transformer.test.ts`** - Tests for message transformation logic
- **`server/utils/session-title.test.ts`** - Tests for session title generation

### Composables Tests
- **`composables/use-chat-messages.test.ts`** - Tests for message fetching and pagination
- **`composables/use-chat-sessions.test.ts`** - Tests for session management

## Test Coverage

Run `npm run test:coverage` to generate a coverage report. The report will be available in the `coverage/` directory.

### Coverage Goals
- **Server Utils**: 80%+
- **Composables**: 80%+
- **Components**: 70%+

## Writing Tests

### Example: Testing a Composable

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { myComposable } from './my-composable'

describe('myComposable', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should return expected value', () => {
    const { result } = myComposable()
    expect(result.value).toBe('expected')
  })
})
```

### Example: Testing a Server Utility

```typescript
import { describe, it, expect, vi } from 'vitest'
import { myUtil } from './my-util'

vi.mock('../../lib/prisma', () => ({
  prisma: {
    model: {
      findUnique: vi.fn()
    }
  }
}))

describe('myUtil', () => {
  it('should process data correctly', async () => {
    const result = await myUtil('input')
    expect(result).toBeDefined()
  })
})
```

## Mocking

### Mocking External Dependencies

External dependencies are mocked in `tests/setup.ts` or within individual test files:

- `$fetch` - Global fetch utility
- `useRuntimeConfig` - Nuxt runtime config
- `navigateTo` - Nuxt navigation
- `useRoute` / `useRouter` - Vue Router

### Mocking Prisma

```typescript
vi.mock('../../lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      create: vi.fn()
    }
  }
}))
```

### Mocking AI SDK

```typescript
vi.mock('ai', () => ({
  generateText: vi.fn().mockResolvedValue({ text: 'Generated text' })
}))
```

## Debugging Tests

1. Use `console.log()` statements in your tests
2. Run tests with `--reporter=verbose` flag
3. Use VS Code debugger with vitest configuration
4. Check test output in the terminal for detailed error messages

## Best Practices

1. **Isolate tests** - Each test should be independent
2. **Clear mocks** - Use `beforeEach(() => vi.clearAllMocks())`
3. **Test edge cases** - Include error scenarios and boundary conditions
4. **Use descriptive names** - Test descriptions should explain what is being tested
5. **Mock external services** - Don't make real API calls or database queries
6. **Keep tests fast** - Unit tests should run quickly

## CI/CD Integration

Tests can be integrated into CI/CD pipelines:

```yaml
# Example GitHub Actions workflow
- name: Run tests
  run: npm test

- name: Generate coverage
  run: npm run test:coverage

- name: Upload coverage
  uses: codecov/codecov-action@v3
```
