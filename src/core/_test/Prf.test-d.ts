import { expectTypeOf, test } from 'vp/test'
import type * as Bytes from '../Bytes.js'
import { Prf } from 'ox'

test('tag', () => {
  expectTypeOf(Prf.tag('account.1')).toEqualTypeOf<{
    input: Bytes.Bytes
  }>()
})
