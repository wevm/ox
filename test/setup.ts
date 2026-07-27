import { Caches, Engine } from 'ox'
import { afterAll, beforeAll, beforeEach, vi } from 'vite-plus/test'

beforeAll(() => {
  vi.mock('../src/core/internal/errors.ts', async () => ({
    ...(await vi.importActual('../src/core/internal/errors.ts')),
    getVersion: vi.fn().mockReturnValue('x.y.z'),
    getUrl: vi.fn().mockReturnValue('https://oxlib.sh/rpc'),
  }))
})

beforeEach(() => {
  Caches.clear()
  Engine.reset()
})

afterAll(async () => {
  vi.restoreAllMocks()
})
