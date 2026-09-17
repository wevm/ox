import { expectTypeOf, test } from 'vitest'
import * as KeyAuthorization from './KeyAuthorization.js'
import type * as SignatureEnvelope from './SignatureEnvelope.js'
import * as TempoAddress from './TempoAddress.js'

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
  config: {
    salt: `0x${'00'.repeat(32)}`,
    version: 0n,
    threshold: 1,
    owners: [
      { owner: '0x1111111111111111111111111111111111111111', weight: 1 },
    ],
  },
  signatures: [signature],
  type: 'multisig',
} as const satisfies SignatureEnvelope.Multisig

test('accepts primitive signatures', () => {
  const signed = KeyAuthorization.from(authorization, { signature })

  expectTypeOf(signed.signature).toMatchTypeOf<
    KeyAuthorization.Signed['signature']
  >()
})

test('accepts multisig signatures and account-bound grants', () => {
  const signed = KeyAuthorization.from(
    { ...authorization, account: multisig.account, type: 'multisig' },
    { signature: multisig },
  )
  expectTypeOf(signed).toMatchTypeOf<KeyAuthorization.Signed>()
  expectTypeOf(
    KeyAuthorization.toRpc(signed),
  ).toMatchTypeOf<KeyAuthorization.Rpc>()
})

test('requires an account for multisig grants', () => {
  type Multisig = Extract<KeyAuthorization.Input, { type: 'multisig' }>
  expectTypeOf<Multisig['account']>().toEqualTypeOf<TempoAddress.Address>()
  expectTypeOf<
    Extract<KeyAuthorization.Signed, { type: 'multisig' }>['account']
  >().toEqualTypeOf<`0x${string}`>()
  expectTypeOf<
    Omit<Extract<KeyAuthorization.Rpc, { keyType: 'multisig' }>, 'account'>
  >().not.toExtend<KeyAuthorization.Rpc>()
  expectTypeOf<{
    address: `0x${string}`
    chainId: bigint
    type: 'multisig'
  }>().not.toExtend<KeyAuthorization.Input>()
  expectTypeOf<{
    account: undefined
    address: `0x${string}`
    chainId: bigint
    type: 'multisig'
  }>().not.toExtend<KeyAuthorization.Input>()
  expectTypeOf<{
    account: null
    chainId: '0x1'
    expiry: null
    keyId: `0x${string}`
    keyType: 'multisig'
    signature: KeyAuthorization.SignatureRpc
  }>().not.toExtend<KeyAuthorization.Rpc>()
  expectTypeOf<
    Extract<KeyAuthorization.Rpc, { keyType: 'multisig' }>['account']
  >().toEqualTypeOf<`0x${string}`>()
})

test('rejects keychain signatures', () => {
  const keychain = {
    inner: signature,
    type: 'keychain',
    userAddress: authorization.address,
  } as const
  KeyAuthorization.from(authorization, {
    // @ts-expect-error Key authorizations do not accept keychain signatures.
    signature: keychain,
  })

  const keychainRpc = {
    signature: {
      r: '0x01',
      s: '0x02',
      type: 'secp256k1',
      yParity: '0x0',
    },
    type: 'keychain',
    userAddress: authorization.address,
  } as const satisfies SignatureEnvelope.KeychainRpc

  const rpc: KeyAuthorization.Rpc = {
    chainId: '0x1',
    expiry: null,
    keyId: authorization.address,
    keyType: authorization.type,
    // @ts-expect-error Key authorizations do not accept keychain RPC signatures.
    signature: keychainRpc,
  }

  expectTypeOf(rpc).toMatchTypeOf<KeyAuthorization.Rpc>()
})

test('resolves Tempo address bindings for multisig grants', () => {
  const signed = KeyAuthorization.from(
    {
      account: TempoAddress.format(authorization.address),
      address: TempoAddress.format(authorization.address),
      chainId: 1n,
      type: 'multisig',
    },
    { signature },
  )
  expectTypeOf(signed.account).toMatchTypeOf<`0x${string}`>()
  expectTypeOf(signed.address).toMatchTypeOf<`0x${string}`>()
})
