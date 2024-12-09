import { Secp256k1, Signature } from 'ox'
import { WrappedSignature } from 'ox/erc6492'
import { describe, expect, test } from 'vitest'
import { accounts } from '../../../test/constants/accounts.js'

describe('assert', () => {
  test('default', () => {
    const signature = Secp256k1.sign({
      payload: '0xdeadbeef',
      privateKey: accounts[0].privateKey,
    })

    const wrapped = WrappedSignature.toHex({
      data: '0xdeadbeef',
      signature,
      to: '0xcafebabecafebabecafebabecafebabecafebabe',
    })

    WrappedSignature.assert(wrapped)
    expect(() =>
      WrappedSignature.assert('0xdeadbeef'),
    ).toThrowErrorMatchingInlineSnapshot(
      '[WrappedSignature.InvalidWrappedSignatureError: Value `0xdeadbeef` is an invalid ERC-6492 wrapped signature.]',
    )
  })
})

describe('toHex', () => {
  test('default', () => {
    const signature = Secp256k1.sign({
      payload: '0xdeadbeef',
      privateKey: accounts[0].privateKey,
    })

    expect(
      WrappedSignature.toHex({
        data: '0xdeadbeef',
        signature,
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
      signature,
      to: '0xcafebabecafebabecafebabecafebabecafebabe',
    } as const

    const wrapped = WrappedSignature.from(args)
    expect(wrapped).toEqual(args)
  })

  test('behavior: hex', () => {
    const signature = Secp256k1.sign({
      payload: '0xdeadbeef',
      privateKey: accounts[0].privateKey,
    })

    const args = {
      data: '0xdeadbeef',
      signature,
      to: '0xcafebabecafebabecafebabecafebabecafebabe',
    } as const

    const serialized = WrappedSignature.toHex(args)
    const wrapped = WrappedSignature.from(serialized)
    expect(wrapped).toEqual(args)
  })

  test('behavior: hex (plain sig)', () => {
    const signature = Secp256k1.sign({
      payload: '0xdeadbeef',
      privateKey: accounts[0].privateKey,
    })

    const wrapped = WrappedSignature.from(Signature.toHex(signature))
    expect(wrapped).toEqual({ signature })
  })
})

describe('fromHex', () => {
  test('default', () => {
    const signature = Secp256k1.sign({
      payload: '0xdeadbeef',
      privateKey: accounts[0].privateKey,
    })

    const args = {
      data: '0xdeadbeef',
      signature,
      to: '0xcafebabecafebabecafebabecafebabecafebabe',
    } as const

    const serialized = WrappedSignature.toHex(args)
    const wrapped = WrappedSignature.fromHex(serialized)
    expect(wrapped).toEqual(args)
  })

  test('behavior: plain sig', () => {
    const signature = Secp256k1.sign({
      payload: '0xdeadbeef',
      privateKey: accounts[0].privateKey,
    })

    const wrapped = WrappedSignature.fromHex(Signature.toHex(signature))
    expect(wrapped).toEqual({ signature })
  })
})

describe('validate', () => {
  test('default', () => {
    const signature = Secp256k1.sign({
      payload: '0xdeadbeef',
      privateKey: accounts[0].privateKey,
    })

    const wrapped = WrappedSignature.toHex({
      data: '0xdeadbeef',
      signature,
      to: '0xcafebabecafebabecafebabecafebabecafebabe',
    })

    const valid = WrappedSignature.validate(wrapped)
    expect(valid).toBe(true)
    expect(WrappedSignature.validate('0xdeadbeef')).toBe(false)
  })
})
