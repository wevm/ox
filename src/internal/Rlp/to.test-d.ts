import { Bytes, type Hex, Rlp } from 'ox'
import { expectTypeOf, test } from 'vitest'
import type { RecursiveArray } from '../types.js'

test('default', () => {
  expectTypeOf(Rlp.toHex('0x')).toEqualTypeOf<RecursiveArray<Hex>>()
  expectTypeOf(Rlp.toBytes(Bytes.fromArray([]))).toEqualTypeOf<
    RecursiveArray<Bytes.Bytes>
  >()
})
