import { expectTypeOf, test } from 'vitest'
import type * as Hex from '../core/Hex.js'
import type * as KeyAuthorization from './KeyAuthorization.js'
import type * as SignatureEnvelope from './SignatureEnvelope.js'
import * as SignaturePreAuthorized from './SignaturePreAuthorized.js'

test('magicBytes', () => {
  expectTypeOf(
    SignaturePreAuthorized.magicBytes,
  ).toEqualTypeOf<'0x1165116511651165116511651165116511651165116511651165116511651165'>()
})

test('unwrap', () => {
  const unwrapped = SignaturePreAuthorized.unwrap('0x')
  expectTypeOf(
    unwrapped.keyAuthorization,
  ).toEqualTypeOf<KeyAuthorization.Signed>()
  expectTypeOf(unwrapped.signature).toEqualTypeOf<SignatureEnvelope.Keychain>()
  expectTypeOf(
    SignaturePreAuthorized.from('0x'),
  ).toEqualTypeOf<SignaturePreAuthorized.Unwrapped>()
})

test('wrap', () => {
  expectTypeOf(SignaturePreAuthorized.wrap).returns.toEqualTypeOf<Hex.Hex>()
  expectTypeOf(SignaturePreAuthorized.wrap)
    .parameter(0)
    .toEqualTypeOf<SignaturePreAuthorized.Unwrapped>()
})
