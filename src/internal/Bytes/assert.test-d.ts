import { Bytes } from 'ox'
import { expectTypeOf, test } from 'vitest'

test('asserts', () => {
  {
    const bytes = Bytes.fromHex('0xdeadbeef')
    Bytes.assert(bytes)
    expectTypeOf(bytes).toMatchTypeOf<Bytes.Bytes>()
  }

  {
    const bytes = '0xdeadbeef' as const
    Bytes.assert(bytes)
    expectTypeOf(bytes).toMatchTypeOf<Bytes.Bytes>()
  }
})
