import { expectTypeOf, test } from 'vitest'
import * as KeyAuthorization from './KeyAuthorization.js'
import type * as SignatureEnvelope from './SignatureEnvelope.js'

const authorization = {
  address: '0x1111111111111111111111111111111111111111',
  chainId: 1n,
  type: 'secp256k1',
} as const satisfies KeyAuthorization.Input

const signature = {
  signature: {
    r: 1n,
    s: 2n,
    yParity: 0,
  },
  type: 'secp256k1',
} as const satisfies SignatureEnvelope.Secp256k1

const multisig = {
  account: '0x2222222222222222222222222222222222222222',
  signatures: [signature],
  type: 'multisig',
} as const satisfies SignatureEnvelope.Multisig

test('accepts primitive signatures', () => {
  const signed = KeyAuthorization.from(authorization, { signature })

  expectTypeOf(signed.signature).toMatchTypeOf<
    KeyAuthorization.Signed['signature']
  >()
})

test('rejects multisig signatures', () => {
  KeyAuthorization.from(authorization, {
    // @ts-expect-error Key authorizations accept only primitive signatures.
    signature: multisig,
  })

  const multisigRpc = {
    account: multisig.account,
    signatures: [
      {
        r: '0x01',
        s: '0x02',
        type: 'secp256k1',
        yParity: '0x0',
      },
    ],
  } as const satisfies SignatureEnvelope.MultisigRpc

  const rpc: KeyAuthorization.Rpc = {
    chainId: '0x1',
    expiry: null,
    keyId: authorization.address,
    keyType: authorization.type,
    // @ts-expect-error Key authorizations accept only primitive RPC signatures.
    signature: multisigRpc,
  }

  expectTypeOf(rpc).toEqualTypeOf<KeyAuthorization.Rpc>()
})
