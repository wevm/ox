import { Caches } from 'ox'
import { afterAll, beforeAll, beforeEach, vi } from 'vitest'
import * as instances from './anvil.js'

beforeAll(() => {
  vi.mock('../src/internal/Errors/utils.ts', () => ({
    getVersion: vi.fn().mockReturnValue('x.y.z'),
  }))
})

beforeEach(() => {
  Caches.clear()
})

afterAll(async () => {
  vi.restoreAllMocks()

  // Reset the anvil instances to the same state it was in before the tests started.
  await Promise.all(
    Object.values(instances).map((instance) => instance.restart()),
  )
})
