import { describe, expect, test } from 'vp/test'

import * as async from '../async.js'

/**
 * The driver's ordering guarantee.
 *
 * Whether two concurrent operations interleave badly through a public entry point
 * depends on timing, so the property is asserted where it lives: operations run
 * one after another, never overlapping.
 */

function driver() {
  return async.driver({
    getAccount: async () => undefined,
    getBlockHash: async () => `0x${'00'.repeat(32)}`,
    getCodeByHash: async () => new Uint8Array(),
    getStorage: async () => 0n,
  })
}

const tick = () => new Promise((resolve) => setTimeout(resolve, 0))

describe('serialize', () => {
  test('behavior: queued operations never overlap', async () => {
    const source = driver()
    const order: string[] = []

    await Promise.all([
      source.serialize(async () => {
        order.push('a:start')
        await tick()
        order.push('a:end')
      }),
      source.serialize(async () => {
        order.push('b:start')
        await tick()
        order.push('b:end')
      }),
    ])

    // Unserialized, both starts land before either end.
    expect(order).toEqual(['a:start', 'a:end', 'b:start', 'b:end'])
  })

  test('behavior: a rejection does not poison the queue', async () => {
    const source = driver()
    const order: string[] = []

    const [first, second] = await Promise.allSettled([
      source.serialize(async () => {
        order.push('a')
        throw new Error('failed')
      }),
      source.serialize(async () => {
        order.push('b')
        return 'ok'
      }),
    ])

    expect(first.status).toBe('rejected')
    expect(second).toEqual({ status: 'fulfilled', value: 'ok' })
    expect(order).toEqual(['a', 'b'])
  })

  test('behavior: results reach the operation that asked for them', async () => {
    const source = driver()

    const results = await Promise.all([
      source.serialize(async () => 1),
      source.serialize(async () => 2),
      source.serialize(async () => 3),
    ])

    expect(results).toEqual([1, 2, 3])
  })
})
