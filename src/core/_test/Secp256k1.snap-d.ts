import { Secp256k1, type Signature } from 'ox'
import { expect, expectTypeOf, test } from 'vitest'
import { accounts } from '../../../test/constants/accounts.js'

test('verify', () => {
  const payload = '0xdeadbeef'
  const signature = Secp256k1.sign({
    payload,
    privateKey: accounts[0].privateKey,
  })
  const { yParity: _yParity, ...unrecoveredSignature } = signature

  expectTypeOf(
    Secp256k1.verify({
      address: accounts[0].address,
      payload,
      signature,
    }),
  ).toEqualTypeOf<boolean>()

  expectTypeOf(
    Secp256k1.verify({
      publicKey: Secp256k1.getPublicKey({ privateKey: accounts[0].privateKey }),
      payload,
      signature: unrecoveredSignature as Signature.Signature<false>,
    }),
  ).toEqualTypeOf<boolean>()

  expect(
    Secp256k1.verify({
      address: accounts[0].address,
      payload,
      signature,
    }),
  ).toBe(true)

  expect(
    Secp256k1.verify({
      publicKey: Secp256k1.getPublicKey({ privateKey: accounts[0].privateKey }),
      payload,
      signature: unrecoveredSignature as Signature.Signature<false>,
    }),
  ).toBe(true)
})
