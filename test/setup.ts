import { afterAll, beforeAll, vi } from 'vitest'

beforeAll(() => {
  vi.mock('../src/internal/errors/utils.ts', () => ({
    getVersion: vi.fn().mockReturnValue('x.y.z'),
  }))
})

afterAll(() => {
  vi.restoreAllMocks()
})
