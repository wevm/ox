import { expectTypeOf, test } from 'vitest'
import * as MultisigConfig from './MultisigConfig.js'
import * as SignatureEnvelope from './SignatureEnvelope.js'

const signatureRpc = {
  r: '0x01',
  s: '0x02',
  type: 'secp256k1',
  yParity: '0x0',
} as const satisfies SignatureEnvelope.SignatureEnvelopeRpc

const signature = {
  signature: {
    r: 1n,
    s: 2n,
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

test('MultisigRpc rejects structured signatures', () => {
  const structured = {
    account: '0x1111111111111111111111111111111111111111',
    config: { ...config, version: 0 },
    signatures: [signatureRpc],
  } as const
  // @ts-expect-error Multisig RPC signatures are serialized hex.
  const rpc: SignatureEnvelope.MultisigRpc = structured

  expectTypeOf(rpc).toEqualTypeOf<SignatureEnvelope.MultisigRpc>()
})
