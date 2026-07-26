import { Engine } from 'ox'
import { describe, expectTypeOf, test } from 'vp/test'

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
  })
})
