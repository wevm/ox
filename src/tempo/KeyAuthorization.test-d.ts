import { expectTypeOf, test } from 'vp/test'
import * as KeyAuthorization from './KeyAuthorization.js'
import * as SignatureEnvelope from './SignatureEnvelope.js'

const authorization = {
  address: '0x1111111111111111111111111111111111111111',
  chainId: 1n,
  type: 'secp256k1',
} as const satisfies KeyAuthorization.Input

const signature = {
  signature: {
    r: '0x01',
    s: '0x02',
    yParity: 0,
  },
  type: 'secp256k1',
} as const satisfies SignatureEnvelope.Secp256k1

const configurable = {
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
  type: 'configurable',
} as const satisfies SignatureEnvelope.Configurable

test('accepts primitive signatures', () => {
  const signed = KeyAuthorization.from(authorization, { signature })

  expectTypeOf(signed.signature).toMatchTypeOf<
    KeyAuthorization.Signed['signature']
  >()
})

test('accepts configurable signatures and account-bound grants', () => {
  const signed = KeyAuthorization.from(
    { ...authorization, account: configurable.account, type: 'configurable' },
    { signature: configurable },
  )
  expectTypeOf(signed).toMatchTypeOf<KeyAuthorization.Signed>()
  expectTypeOf(
    KeyAuthorization.toRpc(signed),
  ).toMatchTypeOf<KeyAuthorization.Rpc>()
})

test('Tuple: skipped limits slot may be the RLP null placeholder', () => {
  type Authorization = KeyAuthorization.Tuple[0]
  type Limits = Extract<Authorization, { length: 5 }>[4]
  expectTypeOf<'0x'>().toMatchTypeOf<Limits>()
  expectTypeOf<
    readonly [token: `0x${string}`, limit: `0x${string}`][]
  >().toMatchTypeOf<Limits>()
})
