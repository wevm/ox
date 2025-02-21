import { Caches } from 'ox'
import { afterAll, beforeAll, beforeEach, vi } from 'vitest'
import * as instances from './anvil.js'

beforeAll(() => {
  vi.mock('../src/core/internal/errors.ts', async () => ({
    ...(await vi.importActual('../src/core/internal/errors.ts')),
    getVersion: vi.fn().mockReturnValue('x.y.z'),
    getUrl: vi.fn().mockReturnValue('https://oxlib.sh/rpc'),
  }))
})

beforeEach(() => {
  Caches.clear()
})

afterAll(async () => {
  vi.restoreAllMocks()

  await Promise.all(
    Object.values(instances).map((instance) => instance.restart()),
  )
})
