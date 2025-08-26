import { Secp256k1, Signature } from 'ox'
import { SignatureErc6492 } from 'ox/erc6492'
import { describe, expect, test } from 'vitest'
import { accounts } from '../../../test/constants/accounts.js'

describe('assert', () => {
  test('default', () => {
    const signature = Secp256k1.sign({
      payload: '0xdeadbeef',
      privateKey: accounts[0].privateKey,
    })

    const wrapped = SignatureErc6492.wrap({
      data: '0xdeadbeef',
      signature: Signature.toHex(signature),
      to: '0xcafebabecafebabecafebabecafebabecafebabe',
    })

    SignatureErc6492.assert(wrapped)
    expect(() =>
      SignatureErc6492.assert('0xdeadbeef'),
    ).toThrowErrorMatchingInlineSnapshot(
      '[SignatureErc6492.InvalidWrappedSignatureError: Value `0xdeadbeef` is an invalid ERC-6492 wrapped signature.]',
    )
  })
})

describe('wrap', () => {
  test('default', () => {
    const signature = Secp256k1.sign({
      payload: '0xdeadbeef',
      privateKey: accounts[0].privateKey,
    })

    expect(
      SignatureErc6492.wrap({
        data: '0xdeadbeef',
        signature: Signature.toHex(signature),
        to: '0xcafebabecafebabecafebabecafebabecafebabe',
      }),
    ).toMatchInlineSnapshot(
      `"0x000000000000000000000000cafebabecafebabecafebabecafebabecafebabe000000000000000000000000000000000000000000000000000000000000006000000000000000000000000000000000000000000000000000000000000000a00000000000000000000000000000000000000000000000000000000000000004deadbeef000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000041fa78c5905fb0b9d6066ef531f962a62bc6ef0d5eb59ecb134056d206f75aaed7780926ff2601a935c2c79707d9e1799948c9f19dcdde1e090e903b19a07923d01c000000000000000000000000000000000000000000000000000000000000006492649264926492649264926492649264926492649264926492649264926492"`,
    )
  })
})

describe('from', () => {
  test('default', () => {
    const signature = Secp256k1.sign({
      payload: '0xdeadbeef',
      privateKey: accounts[0].privateKey,
    })

    const args = {
      data: '0xdeadbeef',
      signature: Signature.toHex(signature),
      to: '0xcafebabecafebabecafebabecafebabecafebabe',
    } as const

    const wrapped = SignatureErc6492.from(args)
    expect(wrapped).toEqual(args)
  })

  test('behavior: hex', () => {
    const signature = Secp256k1.sign({
      payload: '0xdeadbeef',
      privateKey: accounts[0].privateKey,
    })

    const args = {
      data: '0xdeadbeef',
      signature: Signature.toHex(signature),
      to: '0xcafebabecafebabecafebabecafebabecafebabe',
    } as const

    const serialized = SignatureErc6492.wrap(args)
    const wrapped = SignatureErc6492.from(serialized)
    expect(wrapped).toEqual(args)
  })
})

describe('unwrap', () => {
  test('default', () => {
    const signature = Secp256k1.sign({
      payload: '0xdeadbeef',
      privateKey: accounts[0].privateKey,
    })

    const args = {
      data: '0xdeadbeef',
      signature: Signature.toHex(signature),
      to: '0xcafebabecafebabecafebabecafebabecafebabe',
    } as const

    const wrapped = SignatureErc6492.wrap(args)
    const unwrapped = SignatureErc6492.unwrap(wrapped)
    expect(unwrapped).toEqual(args)
  })
})

describe('validate', () => {
  test('default', () => {
    const signature = Secp256k1.sign({
      payload: '0xdeadbeef',
      privateKey: accounts[0].privateKey,
    })

    const wrapped = SignatureErc6492.wrap({
      data: '0xdeadbeef',
      signature: Signature.toHex(signature),
      to: '0xcafebabecafebabecafebabecafebabecafebabe',
    })

    const valid = SignatureErc6492.validate(wrapped)
    expect(valid).toBe(true)
    expect(SignatureErc6492.validate('0xdeadbeef')).toBe(false)
  })
})
