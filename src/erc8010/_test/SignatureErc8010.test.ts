import { Authorization, Secp256k1 } from 'ox'
import { SignatureErc8010 } from 'ox/erc8010'
import { describe, expect, test } from 'vitest'
import { accounts } from '../../../test/constants/accounts.js'

const authorization_unsigned = Authorization.from({
  address: '0x0000000000000000000000000000000000000000',
  chainId: 1,
  nonce: 69n,
})
const authorization_signature = Secp256k1.sign({
  payload: Authorization.getSignPayload(authorization_unsigned),
  privateKey: accounts[0].privateKey,
})
const authorization = Authorization.from(authorization_unsigned, {
  signature: authorization_signature,
})

const signature =
  '0xfa78c5905fb0b9d6066ef531f962a62bc6ef0d5eb59ecb134056d206f75aaed7780926ff2601a935c2c79707d9e1799948c9f19dcdde1e090e903b19a07923d01c'

describe('assert', () => {
  test('default', () => {
    const wrapped = SignatureErc8010.wrap({
      authorization,
      data: '0xcafebabe',
      signature,
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
    expect(
      SignatureErc8010.wrap({
        authorization,
        data: '0xdeadbeef',
        signature,
      }),
    ).toMatchInlineSnapshot(
      `"0xfa78c5905fb0b9d6066ef531f962a62bc6ef0d5eb59ecb134056d206f75aaed7780926ff2601a935c2c79707d9e1799948c9f19dcdde1e090e903b19a07923d01c0000000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000450000000000000000000000000000000000000000000000000000000000000001e345a5dc9a8f8d6cdea46e6991bee5d93b32c5cb9313faeff4ed6aa2e1b3c6b14486b72b28fed042eff14e56d05ecbf1f6f4a622db124104b26ee6f1d0e7715a000000000000000000000000f39fd6e51aad88f6f4ce6ab8827279cfffb9226600000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000000000000000000004deadbeef0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001408010801080108010801080108010801080108010801080108010801080108010"`,
    )
  })

  test('behavior: no data', () => {
    expect(
      SignatureErc8010.wrap({
        authorization,
        signature,
      }),
    ).toMatchInlineSnapshot(
      `"0xfa78c5905fb0b9d6066ef531f962a62bc6ef0d5eb59ecb134056d206f75aaed7780926ff2601a935c2c79707d9e1799948c9f19dcdde1e090e903b19a07923d01c0000000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000450000000000000000000000000000000000000000000000000000000000000001e345a5dc9a8f8d6cdea46e6991bee5d93b32c5cb9313faeff4ed6aa2e1b3c6b14486b72b28fed042eff14e56d05ecbf1f6f4a622db124104b26ee6f1d0e7715a000000000000000000000000f39fd6e51aad88f6f4ce6ab8827279cfffb922660000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001208010801080108010801080108010801080108010801080108010801080108010"`,
    )
  })

  test('behavior: invalid auth', () => {
    expect(() =>
      SignatureErc8010.wrap({
        authorization: {
          address: '0x1234567890abcdef1234567890abcdef12345678',
          chainId: 1,
          nonce: 69n,
          r: '0x0000000000000000000000000000000000000000000000000000000000000000',
          s: '0x0000000000000000000000000000000000000000000000000000000000000000',
          yParity: -1,
        },
        data: '0xdeadbeef',
        signature,
      }),
    ).toThrowErrorMatchingInlineSnapshot(
      `[Signature.InvalidYParityError: Value \`-1\` is an invalid y-parity value. Y-parity must be 0 or 1.]`,
    )
  })
})

describe('from', () => {
  test('default', () => {
    const args = {
      authorization,
      data: '0xdeadbeef',
      signature,
    } as const

    const wrapped = SignatureErc8010.from(args)
    expect(wrapped).toEqual(args)
  })

  test('behavior: wrapped', () => {
    const args = {
      authorization,
      data: '0xdeadbeef',
      signature,
    } as const

    const serialized = SignatureErc8010.wrap(args)
    const { to, ...wrapped } = SignatureErc8010.from(serialized)
    expect(to).toBe(accounts[0].address)
    expect(wrapped).toEqual(args)
  })
})

describe('unwrap', () => {
  test('default', () => {
    const args = {
      authorization,
      data: '0xdeadbeef',
      signature,
    } as const

    const wrapped = SignatureErc8010.wrap(args)
    const { to, ...unwrapped } = SignatureErc8010.unwrap(wrapped)
    expect(to).toBe(accounts[0].address)
    expect(unwrapped).toEqual(args)
  })

  test('behavior: no data', () => {
    const args = {
      authorization,
      signature,
    } as const

    const wrapped = SignatureErc8010.wrap(args)
    const { data, to, ...unwrapped } = SignatureErc8010.unwrap(wrapped)
    expect(data).toBeUndefined()
    expect(to).toBeUndefined()
    expect(unwrapped).toEqual(args)
  })
})

describe('validate', () => {
  test('default', () => {
    const wrapped = SignatureErc8010.wrap({
      authorization,
      data: '0xdeadbeef',
      signature,
    })

    const valid = SignatureErc8010.validate(wrapped)
    expect(valid).toBe(true)
    expect(SignatureErc8010.validate('0xdeadbeef')).toBe(false)
  })
})
