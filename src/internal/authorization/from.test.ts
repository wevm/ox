import { Authorization, Secp256k1 } from 'ox'
import { expect, expectTypeOf, test } from 'vitest'
import { accounts } from '../../../test/constants/accounts.js'

test('default', () => {
  {
    const authorization = Authorization.from({
      contractAddress: '0xbe95c3f554e9fc85ec51be69a3d807a0d55bcf2c',
      chainId: 1,
      nonce: 40n,
    })
    expectTypeOf(authorization).toEqualTypeOf<{
      readonly contractAddress: '0xbe95c3f554e9fc85ec51be69a3d807a0d55bcf2c'
      readonly chainId: 1
      readonly nonce: 40n
    }>()
    expectTypeOf(authorization).toMatchTypeOf<
      Authorization.Authorization<false>
    >()
    expect(authorization).toMatchInlineSnapshot(
      `
    {
      "chainId": 1,
      "contractAddress": "0xbe95c3f554e9fc85ec51be69a3d807a0d55bcf2c",
      "nonce": 40n,
    }
  `,
    )
  }

  {
    const authorization = Authorization.from({
      contractAddress: '0xbe95c3f554e9fc85ec51be69a3d807a0d55bcf2c',
      chainId: 1,
      nonce: 40n,
      r: 49782753348462494199823712700004552394425719014458918871452329774910450607807n,
      s: 33726695977844476214676913201140481102225469284307016937915595756355928419768n,
      yParity: 0,
    })
    expectTypeOf(authorization).toEqualTypeOf<{
      readonly contractAddress: '0xbe95c3f554e9fc85ec51be69a3d807a0d55bcf2c'
      readonly chainId: 1
      readonly nonce: 40n
      readonly r: 49782753348462494199823712700004552394425719014458918871452329774910450607807n
      readonly s: 33726695977844476214676913201140481102225469284307016937915595756355928419768n
      readonly yParity: 0
    }>()
    expectTypeOf(authorization).toMatchTypeOf<
      Authorization.Authorization<true>
    >()
    expect(authorization).toMatchInlineSnapshot(
      `
      {
        "chainId": 1,
        "contractAddress": "0xbe95c3f554e9fc85ec51be69a3d807a0d55bcf2c",
        "nonce": 40n,
        "r": 49782753348462494199823712700004552394425719014458918871452329774910450607807n,
        "s": 33726695977844476214676913201140481102225469284307016937915595756355928419768n,
        "yParity": 0,
      }
    `,
    )
  }
})

test('options: signature', () => {
  const authorization = Authorization.from({
    contractAddress: '0xbe95c3f554e9fc85ec51be69a3d807a0d55bcf2c',
    chainId: 1,
    nonce: 40n,
  })
  const signature = Secp256k1.sign({
    payload: Authorization.getSignPayload(authorization),
    privateKey: accounts[0].privateKey,
  })
  const authorization_signed = Authorization.from(authorization, { signature })
  expectTypeOf(authorization_signed).toEqualTypeOf<{
    readonly contractAddress: '0xbe95c3f554e9fc85ec51be69a3d807a0d55bcf2c'
    readonly chainId: 1
    readonly nonce: 40n
    readonly r: bigint
    readonly s: bigint
    readonly yParity: 0 | 1
  }>()
  expectTypeOf(authorization_signed).toMatchTypeOf<
    Authorization.Authorization<true>
  >()
  expect(authorization_signed).toMatchInlineSnapshot(
    `
    {
      "chainId": 1,
      "contractAddress": "0xbe95c3f554e9fc85ec51be69a3d807a0d55bcf2c",
      "nonce": 40n,
      "r": 74666311849961653398815470296948700361392062371901161364182304079113687952627n,
      "s": 24912990662134805731506157958890440652926649106845286943280690489391727501383n,
      "yParity": 1,
    }
  `,
  )
})
