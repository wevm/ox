import { AesGcm } from 'ox'
import { expectTypeOf, test } from 'vp/test'

test('fromSeed', () => {
  expectTypeOf(AesGcm.fromSeed(new Uint8Array(32))).toEqualTypeOf<
    Promise<CryptoKey>
  >()
})
