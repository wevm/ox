import { describe, expect, test } from 'vp/test'
import * as core_AuthorizationTempo from '../../../tempo/AuthorizationTempo.js'
import * as z_AuthorizationTempo from '../AuthorizationTempo.js'
import * as z from 'zod/mini'

const signedRpc = {
  address: '0xbe95c3f554e9fc85ec51be69a3d807a0d55bcf2c',
  chainId: '0x1',
  nonce: '0x2a',
  signature: {
    r: '0x635dc2033e60185bb36709c29c75d64ea51dfbd91c32ef4be198e4ceb169fb4d',
    s: '0x50c2667ac4c771072746acfdcf1f1483336dcca8bd2df47cd83175dbe60f0540',
    type: 'secp256k1',
    yParity: '0x0',
  },
} as const

describe('AuthorizationTempo', () => {
  test('decodes a signed authorization', () => {
    expect(z.decode(z_AuthorizationTempo.Signed, signedRpc)).toEqual(
      core_AuthorizationTempo.fromRpc(signedRpc),
    )
  })

  test('decodes an unsigned authorization', () => {
    const unsigned = {
      address: '0xbe95c3f554e9fc85ec51be69a3d807a0d55bcf2c',
      chainId: '0x1',
      nonce: '0x2a',
    } as const
    expect(z.decode(z_AuthorizationTempo.Unsigned, unsigned)).toEqual({
      address: '0xbe95c3f554e9fc85ec51be69a3d807a0d55bcf2c',
      chainId: 1,
      nonce: 42n,
    })
  })

  test('decodes a signed authorization list', () => {
    expect(z.decode(z_AuthorizationTempo.ListSigned, [signedRpc])).toEqual([
      core_AuthorizationTempo.fromRpc(signedRpc),
    ])
  })

  test('UnsignedToRpc accepts numberish encode inputs', () => {
    const decoded = {
      address: '0xbe95c3f554e9fc85ec51be69a3d807a0d55bcf2c',
      chainId: 1,
      nonce: 42n,
    } as const
    const expected = z.encode(z_AuthorizationTempo.Unsigned, decoded)

    expect(
      z.encode(z_AuthorizationTempo.UnsignedToRpc, {
        ...decoded,
        chainId: 1,
        nonce: 42,
      }),
    ).toEqual(expected)
    expect(
      z.encode(z_AuthorizationTempo.UnsignedToRpc, {
        ...decoded,
        chainId: '0x1',
        nonce: '0x2a',
      }),
    ).toEqual(expected)
  })

  test('rejects an invalid authorization', () => {
    expect(
      z.safeDecode(z_AuthorizationTempo.Signed, { chainId: '0x1' } as never)
        .success,
    ).toBe(false)
  })
})
