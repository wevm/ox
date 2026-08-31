import { expectTypeOf, test } from 'vp/test'
import * as MultisigConfig from './MultisigConfig.js'
import * as SignatureEnvelope from './SignatureEnvelope.js'

const signature = {
  signature: {
    r: '0x01',
    s: '0x02',
    yParity: 0,
  },
  type: 'secp256k1',
} as const satisfies SignatureEnvelope.Secp256k1

const config = MultisigConfig.from({
  owners: [
    {
      owner: '0x1111111111111111111111111111111111111111',
      weight: 1,
    },
  ],
  threshold: 1,
})

test('toRpc preserves the signature type', () => {
  expectTypeOf(
    SignatureEnvelope.toRpc(signature),
  ).toEqualTypeOf<SignatureEnvelope.Secp256k1Rpc>()
})

test('MultisigRpc contains an untagged serialized multisig signature', () => {
  const rpc = '0xf8' as const satisfies SignatureEnvelope.MultisigRpc
  expectTypeOf(rpc).toMatchTypeOf<`0x${string}`>()
})

test('from derives an initial account', () => {
  const multisig = SignatureEnvelope.from({
    config,
    signatures: [signature],
  })

  expectTypeOf(multisig).toMatchTypeOf<SignatureEnvelope.Multisig>()
  expectTypeOf(multisig.config.version).toEqualTypeOf<bigint>()
})

test('from requires an account for a current config', () => {
  // @ts-expect-error Current configurations require an explicit account.
  SignatureEnvelope.from({
    config: { ...config, version: 1 },
    signatures: [signature],
  })

  const multisig = SignatureEnvelope.from({
    account: '0x2222222222222222222222222222222222222222',
    config: { ...config, version: 1 },
    signatures: [signature],
  })
  expectTypeOf(multisig).toMatchTypeOf<SignatureEnvelope.Multisig>()
})
