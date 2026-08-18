import { AesGcm } from 'ox'
import { expectTypeOf, test } from 'vp/test'

test('fromMnemonic', () => {
  const mnemonic = 'test test test test test test test test test test test junk'

  expectTypeOf(AesGcm.fromMnemonic(mnemonic)).toEqualTypeOf<
    Promise<CryptoKey>
  >()
  expectTypeOf(
    AesGcm.fromMnemonic(mnemonic, { passphrase: 'qwerty' }),
  ).toEqualTypeOf<Promise<CryptoKey>>()
})

test('fromSeed', () => {
  expectTypeOf(AesGcm.fromSeed(new Uint8Array(32))).toEqualTypeOf<
    Promise<CryptoKey>
  >()
})
