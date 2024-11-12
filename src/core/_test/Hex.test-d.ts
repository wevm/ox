import { Bytes, Hex } from 'ox'
import { expectTypeOf, test } from 'vitest'

test('asserts', () => {
  {
    const hex = '0x0123456789abcdefABCDEF' as const
    Hex.assert(hex)
    expectTypeOf(hex).toMatchTypeOf<Hex.Hex>()
  }

  {
    const hex = Bytes.fromHex('0x0123456789abcdefABCDEF')
    Hex.assert(hex)
    expectTypeOf(hex).toMatchTypeOf<Hex.Hex>()
  }
})
