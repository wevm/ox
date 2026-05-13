import { ProviderEvents } from 'ox'
import { describe, expect, test } from 'vitest'

describe('ProviderEvents.createEmitter', () => {
  test('default', () => {
    const emitter = ProviderEvents.createEmitter()

    expect(typeof emitter.on).toBe('function')
    expect(typeof emitter.emit).toBe('function')
    expect(typeof emitter.off).toBe('function')
  })

  test('emits and listens to events', () => {
    const emitter = ProviderEvents.createEmitter()

    const calls: unknown[] = []
    emitter.on('accountsChanged', (accounts) => calls.push(accounts))

    emitter.emit('accountsChanged', [
      '0x0000000000000000000000000000000000000000',
    ])

    expect(calls).toEqual([['0x0000000000000000000000000000000000000000']])
  })
})

test('exports', () => {
  expect(Object.keys(ProviderEvents).sort()).toMatchInlineSnapshot(`
    [
      "ProviderRpcError",
      "createEmitter",
    ]
  `)
})
