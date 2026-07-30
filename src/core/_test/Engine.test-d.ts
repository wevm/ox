import { Engine } from 'ox'
import { describe, expectTypeOf, test } from 'vp/test'
import type { primitives } from '../internal/engine.js'

/**
 * Primitives on a slot contract that the runtime name table omits.
 *
 * `set` rejects any name absent from that table, so anything showing up here
 * would be a valid override refused at runtime.
 */
type Unlisted = {
  // `-?` because the slots are optional, which would otherwise leave
  // `undefined` in the union and mask a genuinely missing name.
  [key in keyof Engine.Engine]-?: Exclude<
    keyof NonNullable<Engine.Engine[key]>,
    (typeof primitives)[key][number]
  >
}[keyof Engine.Engine]

describe('install', () => {
  test('accepts raw and promised slots and preserves their resolved shape', () => {
    const keccak256 = (input: Uint8Array) => input
    const toSeed = (_mnemonic: string) => new Uint8Array(64)

    expectTypeOf(
      Engine.install({
        Hash: Promise.resolve({ keccak256 }),
        Mnemonic: { toSeed },
      }),
    ).toEqualTypeOf<
      Promise<{
        Hash: { keccak256: typeof keccak256 }
        Mnemonic: { toSeed: typeof toSeed }
      }>
    >()
  })

  test('rejects an unknown slot', () => {
    // @ts-expect-error
    void Engine.install({ Keccak: Promise.resolve({}) })
  })

  test('rejects an unknown slot alongside a valid slot', () => {
    void Engine.install({
      Hash: { keccak256: (input) => input },
      // @ts-expect-error
      Keccak: {},
    })
  })

  test('rejects a misspelled function', () => {
    void Engine.install({
      // @ts-expect-error
      Hash: Promise.resolve({ keccak_256: (input: Uint8Array) => input }),
    })
  })

  test('rejects a misspelled function alongside a valid function', () => {
    void Engine.install({
      // @ts-expect-error
      Hash: {
        keccak256: (input: Uint8Array) => input,
        keccak_256: (input: Uint8Array) => input,
      },
    })
  })

  test('rejects a mistyped promised function', () => {
    void Engine.install({
      // @ts-expect-error
      Hash: Promise.resolve({ keccak256: (input: string) => input }),
    })
  })
})

describe('set', () => {
  test('accepts a partial engine', () => {
    expectTypeOf(Engine.set).parameter(0).toEqualTypeOf<Engine.Engine>()
  })

  test('rejects an unknown slot', () => {
    // @ts-expect-error
    Engine.set({ Keccak: {} })
  })

  test('rejects a misspelled function', () => {
    // @ts-expect-error
    Engine.set({ Hash: { keccak_256: (input: Uint8Array) => input } })
  })

  test('rejects a mistyped function', () => {
    // @ts-expect-error
    Engine.set({ Hash: { keccak256: (input: string) => input } })
  })

  test('the runtime name table lists every primitive it must accept', () => {
    expectTypeOf<Unlisted>().toEqualTypeOf<never>()
  })
})

describe('get', () => {
  test('default', () => {
    expectTypeOf(Engine.get()).toEqualTypeOf<Engine.Engine>()
  })
})

describe('reset', () => {
  test('accepts a slot name', () => {
    expectTypeOf(Engine.reset)
      .parameter(0)
      .toEqualTypeOf<keyof Engine.Engine | undefined>()
  })
})

describe('with', () => {
  test('preserves the return type', () => {
    expectTypeOf(Engine.with({}, () => 1 as const)).toEqualTypeOf<1>()
  })
})

describe('Engine', () => {
  test('the Secp256k1 and P256 slots share the Ecdsa contract', () => {
    expectTypeOf<Engine.Engine['Secp256k1']>().toEqualTypeOf<
      Engine.Ecdsa | undefined
    >()
    expectTypeOf<Engine.Engine['P256']>().toEqualTypeOf<
      Engine.Ecdsa | undefined
    >()
  })

  test('every slot is optional', () => {
    expectTypeOf<Engine.Engine>().toEqualTypeOf<Partial<Engine.Engine>>()
  })

  test('contracts speak raw bytes, not branded ox types', () => {
    expectTypeOf<NonNullable<Engine.Hash['keccak256']>>().toEqualTypeOf<
      (input: Uint8Array) => Uint8Array
    >()
    expectTypeOf<NonNullable<Engine.Hash['createKeccak256']>>().toEqualTypeOf<
      () => Engine.HashState
    >()
    expectTypeOf<Engine.HashState>().toEqualTypeOf<{
      clone(): Engine.HashState
      destroy(): void
      digestInto(output: Uint8Array): void
      update(input: Uint8Array): void
    }>()
  })
})
