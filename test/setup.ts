import { Caches } from 'ox'
import { afterAll, beforeAll, beforeEach, vi } from 'vitest'
import * as Entropy from '../src/core/internal/entropy.js'
import * as instances from './anvil.js'

Entropy.setExtraEntropy(false)

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

  // Reset the anvil instances to the same state it was in before the tests started.
  await Promise.all(
    Object.values(instances).map((instance) => instance.restart()),
  )
})
