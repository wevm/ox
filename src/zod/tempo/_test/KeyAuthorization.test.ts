import { describe, expect, test } from 'vp/test'
import * as core_KeyAuthorization from '../../../tempo/KeyAuthorization.js'
import * as z_KeyAuthorization from '../KeyAuthorization.js'
import * as z from 'zod/mini'

const rpc = {
  chainId: '0x1',
  expiry: '0x499602d2',
  keyId: '0xbe95c3f554e9fc85ec51be69a3d807a0d55bcf2c',
  keyType: 'secp256k1',
  limits: [
    { limit: '0x989680', token: '0x20c0000000000000000000000000000000000001' },
  ],
  signature: {
    r: '0x635dc2033e60185bb36709c29c75d64ea51dfbd91c32ef4be198e4ceb169fb4d',
    s: '0x50c2667ac4c771072746acfdcf1f1483336dcca8bd2df47cd83175dbe60f0540',
    type: 'secp256k1',
    yParity: '0x0',
  },
} as const

describe('KeyAuthorization', () => {
  test('decodes an RPC key authorization', () => {
    expect(z.decode(z_KeyAuthorization.KeyAuthorization, rpc)).toEqual(
      core_KeyAuthorization.fromRpc(rpc),
    )
  })

  test('decodes nested allowedCalls into scopes', () => {
    const withScopes = {
      ...rpc,
      allowedCalls: [
        {
          selectorRules: [{ selector: '0xa9059cbb' }],
          target: '0x20c0000000000000000000000000000000000001',
        },
      ],
    } as const
    expect(z.decode(z_KeyAuthorization.KeyAuthorization, withScopes)).toEqual(
      core_KeyAuthorization.fromRpc(withScopes),
    )
  })

  test('round-trips via encode', () => {
    const decoded = z.decode(z_KeyAuthorization.KeyAuthorization, rpc)
    expect(z.encode(z_KeyAuthorization.KeyAuthorization, decoded)).toEqual(
      core_KeyAuthorization.toRpc(decoded),
    )
  })

  test('KeyAuthorizationToRpc accepts numberish encode inputs', () => {
    const decoded = z.decode(z_KeyAuthorization.KeyAuthorization, rpc)
    const strict = z.encode(z_KeyAuthorization.KeyAuthorization, decoded)

    expect(
      z.encode(z_KeyAuthorization.KeyAuthorizationToRpc, {
        ...decoded,
        chainId: 1,
        expiry: 1234567890,
        limits: [
          {
            limit: 10000000,
            token: '0x20c0000000000000000000000000000000000001',
          },
        ],
      }),
    ).toEqual(strict)
    expect(
      z.encode(z_KeyAuthorization.KeyAuthorizationToRpc, {
        ...decoded,
        chainId: '0x1',
        expiry: '0x499602d2',
        limits: [
          {
            limit: '0x989680',
            token: '0x20c0000000000000000000000000000000000001',
          },
        ],
      }),
    ).toEqual(strict)
  })

  test('rejects an invalid key authorization', () => {
    expect(
      z.safeDecode(z_KeyAuthorization.KeyAuthorization, {
        chainId: '0x1',
      } as never).success,
    ).toBe(false)
  })
})
