import { describe, expect, test } from 'vp/test'
import * as core_SignatureEnvelope from '../../../tempo/SignatureEnvelope.js'
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
  test('rejects unbound multisig grants through every schema', () => {
    const domain = {
      ...z.decode(z_KeyAuthorization.KeyAuthorization, rpc),
      type: 'multisig',
    } as const
    for (const account of [undefined, null])
      expect(
        z.safeDecode(z_KeyAuthorization.KeyAuthorization, {
          ...rpc,
          keyType: 'multisig',
          account,
        }).success,
      ).toMatchInlineSnapshot(`false`)
    for (const schema of [
      z_KeyAuthorization.Domain,
      z_KeyAuthorization.DomainToRpc,
    ]) {
      expect(z.safeParse(schema, domain).success).toMatchInlineSnapshot(`false`)
      expect(
        z.safeParse(schema, { ...domain, account: rpc.keyId }).success,
      ).toMatchInlineSnapshot(`true`)
    }
    for (const codec of [
      z_KeyAuthorization.KeyAuthorization,
      z_KeyAuthorization.KeyAuthorizationToRpc,
    ])
      expect(z.safeEncode(codec, domain).success).toMatchInlineSnapshot(`false`)
  })

  test('decodes an RPC key authorization', () => {
    expect(z.decode(z_KeyAuthorization.KeyAuthorization, rpc)).toEqual(
      core_KeyAuthorization.fromRpc(rpc),
    )
  })

  test('decodes node-null optional fields', () => {
    const withNulls = {
      ...rpc,
      allowedCalls: null,
      expiry: null,
      limits: null,
    } as const
    expect(z.decode(z_KeyAuthorization.KeyAuthorization, withNulls)).toEqual(
      core_KeyAuthorization.fromRpc(withNulls),
    )
  })

  test('decodes nested node-null optional fields', () => {
    const withNestedNulls = {
      ...rpc,
      allowedCalls: [
        {
          selectorRules: [{ recipients: null, selector: '0xa9059cbb' }],
          target: '0x20c0000000000000000000000000000000000001',
        },
        {
          selectorRules: null,
          target: '0x20c0000000000000000000000000000000000002',
        },
      ],
      limits: [
        {
          limit: '0x989680',
          period: null,
          token: '0x20c0000000000000000000000000000000000001',
        },
      ],
    } as const
    expect(
      z.decode(z_KeyAuthorization.KeyAuthorization, withNestedNulls),
    ).toEqual(core_KeyAuthorization.fromRpc(withNestedNulls))
  })

  test('decodes witness and admin fields', () => {
    const withAdmin = {
      ...rpc,
      account: '0x814e5e0e31016b9a7f138c76b7e7b2bb5c1ab6a6',
      isAdmin: true,
      witness:
        '0x0000000000000000000000000000000000000000000000000000000000000001',
    } as const
    const decoded = z.decode(z_KeyAuthorization.KeyAuthorization, withAdmin)
    expect(decoded).toEqual(core_KeyAuthorization.fromRpc(withAdmin))
    expect(z.encode(z_KeyAuthorization.KeyAuthorization, decoded)).toEqual(
      core_KeyAuthorization.toRpc(decoded),
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

  test('rejects legacy multisig signatures', () => {
    const multisigRpc = {
      account: '0x1111111111111111111111111111111111111111',
      signatures: [rpc.signature],
    } as const
    expect(
      z.safeDecode(z_KeyAuthorization.KeyAuthorization, {
        ...rpc,
        signature: multisigRpc,
      } as never).success,
    ).toBe(false)

    const authorization = core_KeyAuthorization.fromRpc(rpc)
    expect(
      z.safeEncode(z_KeyAuthorization.KeyAuthorization, {
        ...authorization,
        signature: {
          account: multisigRpc.account,
          signatures: [authorization.signature],
          type: 'multisig',
        },
      } as never).success,
    ).toBe(false)
  })
  test('round-trips account-bound multisig grants', () => {
    const signature = core_SignatureEnvelope.from({
      account: '0x2222222222222222222222222222222222222222',
      config: {
        threshold: 1,
        owners: [
          { owner: '0x1111111111111111111111111111111111111111', weight: 1 },
        ],
      },
      signatures: [
        core_SignatureEnvelope.fromRpc(
          rpc.signature,
        ) as core_SignatureEnvelope.Primitive,
      ],
    })
    const signed = core_KeyAuthorization.from(
      {
        account: signature.account,
        address: '0x3333333333333333333333333333333333333333',
        chainId: 1n,
        type: 'multisig',
      },
      { signature },
    )
    const encoded = z.encode(z_KeyAuthorization.KeyAuthorization, signed)
    const decoded = z.decode(z_KeyAuthorization.KeyAuthorization, encoded)
    expect(decoded).toEqual(
      core_KeyAuthorization.fromRpc(core_KeyAuthorization.toRpc(signed)),
    )
    expect(decoded.account).toBe(signature.account)
  })
})
