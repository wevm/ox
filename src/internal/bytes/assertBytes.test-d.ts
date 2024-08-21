import { Bytes, Hex } from 'ox'
import { expectTypeOf, test } from 'vitest'

test('asserts', () => {
  {
    const bytes = Bytes.from('0xdeadbeef')
    Bytes.assert(bytes)
    expectTypeOf(bytes).toMatchTypeOf<Bytes.Bytes>()
  }

  {
    const bytes = Hex.from('0xdeadbeef')
    Bytes.assert(bytes)
    expectTypeOf(bytes).toMatchTypeOf<Bytes.Bytes>()
  }
})
