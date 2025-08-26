import { Authorization, Secp256k1, Signature } from 'ox'
import { SignatureErc8010 } from 'ox/erc8010'
import { describe, expect, test } from 'vitest'
import { accounts } from '../../../test/constants/accounts.js'

describe('assert', () => {
  test('default', () => {
    const signature = Secp256k1.sign({
      payload: '0xdeadbeef',
      privateKey: accounts[0].privateKey,
    })

    const wrapped = SignatureErc8010.wrap({
      authorization: Authorization.from({
        address: '0x0000000000000000000000000000000000000000',
        chainId: 1,
        nonce: 69n,
        r: 0n,
        s: 0n,
        yParity: 0,
      }),
      data: '0xdeadbeef',
      signature: Signature.toHex(signature),
    })

    SignatureErc8010.assert(wrapped)
    expect(() =>
      SignatureErc8010.assert('0xdeadbeef'),
    ).toThrowErrorMatchingInlineSnapshot(
      '[SignatureErc8010.InvalidWrappedSignatureError: Value `0xdeadbeef` is an invalid ERC-8010 wrapped signature.]',
    )
  })
})

describe('wrap', () => {
  test('default', () => {
    const authorization = Authorization.from({
      address: '0x1234567890abcdef1234567890abcdef12345678',
      chainId: 1,
      nonce: 69n,
    })

    const authorizationSignature = Secp256k1.sign({
      payload: Authorization.getSignPayload(authorization),
      privateKey: accounts[0].privateKey,
    })

    const authorization_signed = Authorization.from(authorization, {
      signature: authorizationSignature,
    })

    const signature = Secp256k1.sign({
      payload: '0xdeadbeef',
      privateKey: accounts[0].privateKey,
    })

    expect(
      SignatureErc8010.wrap({
        authorization: authorization_signed,
        data: '0xdeadbeef',
        signature: Signature.toHex(signature),
      }),
    ).toMatchInlineSnapshot(
      `"0xfa78c5905fb0b9d6066ef531f962a62bc6ef0d5eb59ecb134056d206f75aaed7780926ff2601a935c2c79707d9e1799948c9f19dcdde1e090e903b19a07923d01c00000000000000000000000000000000000000000000000000000000000000011234567890abcdef1234567890abcdef1234567800000000000000000000000000000000000000000000000000000000000000450150e4d1c9f1fbef7bf3395ae64397eaec481b0681c672bcb2b065b8ffeba5447a12bb4d8aafb175d1ca067c15b71f16cac997a8ef267e03d1e91e9593b2d2b78cdeadbeef00000000000000000000000000000000000000000000000000000000000000998010801080108010801080108010801080108010801080108010801080108010"`,
    )
  })

  test('behavior: no data', () => {
    const authorization = Authorization.from({
      address: '0x1234567890abcdef1234567890abcdef12345678',
      chainId: 1,
      nonce: 69n,
    })

    const authorizationSignature = Secp256k1.sign({
      payload: Authorization.getSignPayload(authorization),
      privateKey: accounts[0].privateKey,
    })

    const authorization_signed = Authorization.from(authorization, {
      signature: authorizationSignature,
    })

    const signature = Secp256k1.sign({
      payload: '0xdeadbeef',
      privateKey: accounts[0].privateKey,
    })

    expect(
      SignatureErc8010.wrap({
        authorization: authorization_signed,
        signature: Signature.toHex(signature),
      }),
    ).toMatchInlineSnapshot(
      `"0xfa78c5905fb0b9d6066ef531f962a62bc6ef0d5eb59ecb134056d206f75aaed7780926ff2601a935c2c79707d9e1799948c9f19dcdde1e090e903b19a07923d01c00000000000000000000000000000000000000000000000000000000000000011234567890abcdef1234567890abcdef1234567800000000000000000000000000000000000000000000000000000000000000450150e4d1c9f1fbef7bf3395ae64397eaec481b0681c672bcb2b065b8ffeba5447a12bb4d8aafb175d1ca067c15b71f16cac997a8ef267e03d1e91e9593b2d2b78c00000000000000000000000000000000000000000000000000000000000000958010801080108010801080108010801080108010801080108010801080108010"`,
    )
  })

  test('behavior: invalid auth', () => {
    const signature = Secp256k1.sign({
      payload: '0xdeadbeef',
      privateKey: accounts[0].privateKey,
    })

    expect(() =>
      SignatureErc8010.wrap({
        authorization: {
          address: '0x1234567890abcdef1234567890abcdef12345678',
          chainId: 1,
          nonce: 69n,
          r: 0n,
          s: 0n,
          yParity: -1,
        },
        data: '0xdeadbeef',
        signature: Signature.toHex(signature),
      }),
    ).toThrowErrorMatchingInlineSnapshot(
      `[Signature.InvalidYParityError: Value \`-1\` is an invalid y-parity value. Y-parity must be 0 or 1.]`,
    )
  })
})

describe('from', () => {
  test('default', () => {
    const authorization = Authorization.from({
      address: '0x1234567890abcdef1234567890abcdef12345678',
      chainId: 1,
      nonce: 69n,
    })

    const authorizationSignature = Secp256k1.sign({
      payload: Authorization.getSignPayload(authorization),
      privateKey: accounts[0].privateKey,
    })

    const authorization_signed = Authorization.from(authorization, {
      signature: authorizationSignature,
    })

    const signature = Secp256k1.sign({
      payload: '0xdeadbeef',
      privateKey: accounts[0].privateKey,
    })

    const args = {
      authorization: authorization_signed,
      data: '0xdeadbeef',
      signature: Signature.toHex(signature),
    } as const

    const wrapped = SignatureErc8010.from(args)
    expect(wrapped).toEqual(args)
  })

  test('behavior: hex', () => {
    const authorization = Authorization.from({
      address: '0x1234567890abcdef1234567890abcdef12345678',
      chainId: 1,
      nonce: 69n,
    })

    const authorizationSignature = Secp256k1.sign({
      payload: Authorization.getSignPayload(authorization),
      privateKey: accounts[0].privateKey,
    })

    const authorization_signed = Authorization.from(authorization, {
      signature: authorizationSignature,
    })

    const signature = Secp256k1.sign({
      payload: '0xdeadbeef',
      privateKey: accounts[0].privateKey,
    })

    const args = {
      authorization: authorization_signed,
      data: '0xdeadbeef',
      signature: Signature.toHex(signature),
    } as const

    const serialized = SignatureErc8010.wrap(args)
    const wrapped = SignatureErc8010.from(serialized)
    expect(wrapped).toEqual(args)
  })
})

describe('unwrap', () => {
  test('default', () => {
    const authorization = Authorization.from({
      address: '0x1234567890abcdef1234567890abcdef12345678',
      chainId: 1,
      nonce: 69n,
    })

    const authorizationSignature = Secp256k1.sign({
      payload: Authorization.getSignPayload(authorization),
      privateKey: accounts[0].privateKey,
    })

    const authorization_signed = Authorization.from(authorization, {
      signature: authorizationSignature,
    })

    const signature = Secp256k1.sign({
      payload: '0xdeadbeef',
      privateKey: accounts[0].privateKey,
    })

    const args = {
      authorization: authorization_signed,
      data: '0xdeadbeef',
      signature: Signature.toHex(signature),
    } as const

    const wrapped = SignatureErc8010.wrap(args)
    const unwrapped = SignatureErc8010.unwrap(wrapped)
    expect(unwrapped).toEqual(args)
  })

  test('behavior: no data', () => {
    const authorization = Authorization.from({
      address: '0x1234567890abcdef1234567890abcdef12345678',
      chainId: 1,
      nonce: 69n,
    })

    const authorizationSignature = Secp256k1.sign({
      payload: Authorization.getSignPayload(authorization),
      privateKey: accounts[0].privateKey,
    })

    const authorization_signed = Authorization.from(authorization, {
      signature: authorizationSignature,
    })

    const signature = Secp256k1.sign({
      payload: '0xdeadbeef',
      privateKey: accounts[0].privateKey,
    })

    const args = {
      authorization: authorization_signed,
      signature: Signature.toHex(signature),
    } as const

    const wrapped = SignatureErc8010.wrap(args)
    const unwrapped = SignatureErc8010.unwrap(wrapped)
    expect(unwrapped).toEqual(args)
  })
})

describe('validate', () => {
  test('default', () => {
    const authorization = Authorization.from({
      address: '0x1234567890abcdef1234567890abcdef12345678',
      chainId: 1,
      nonce: 69n,
    })

    const authorizationSignature = Secp256k1.sign({
      payload: Authorization.getSignPayload(authorization),
      privateKey: accounts[0].privateKey,
    })

    const authorization_signed = Authorization.from(authorization, {
      signature: authorizationSignature,
    })

    const signature = Secp256k1.sign({
      payload: '0xdeadbeef',
      privateKey: accounts[0].privateKey,
    })

    const wrapped = SignatureErc8010.wrap({
      authorization: authorization_signed,
      data: '0xdeadbeef',
      signature: Signature.toHex(signature),
    })

    const valid = SignatureErc8010.validate(wrapped)
    expect(valid).toBe(true)
    expect(SignatureErc8010.validate('0xdeadbeef')).toBe(false)
  })
})
