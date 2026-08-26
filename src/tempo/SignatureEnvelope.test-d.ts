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

test('MultisigRpc carries one complete witness shape', () => {
  const rpc = {
    account: '0x1111111111111111111111111111111111111111',
    config: MultisigConfig.toRpc(config),
    signatures: [signatureRpc],
  } as const satisfies SignatureEnvelope.MultisigRpc

  expectTypeOf(rpc.config).toMatchTypeOf<MultisigConfig.Rpc>()
  expectTypeOf(rpc.signatures).toMatchTypeOf<
    readonly SignatureEnvelope.SignatureEnvelopeRpc[]
  >()
  expectTypeOf<
    SignatureEnvelope.GetType<typeof rpc>
  >().toEqualTypeOf<'multisig'>()
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
    config: { ...config, version: 1n },
    signatures: [signature],
  })

  const multisig = SignatureEnvelope.from({
    account: '0x2222222222222222222222222222222222222222',
    config: { ...config, version: 1n },
    signatures: [signature],
  })
  expectTypeOf(multisig).toMatchTypeOf<SignatureEnvelope.Multisig>()
})

test('MultisigRpc rejects old witness shapes', () => {
  const accountOnly = {
    account: '0x1111111111111111111111111111111111111111',
    signatures: [signatureRpc],
  } as const
  // @ts-expect-error Multisig RPC signatures require config.
  const accountOnlyRpc: SignatureEnvelope.MultisigRpc = accountOnly

  const init = {
    init: config,
    signatures: [signatureRpc],
  } as const
  // @ts-expect-error Multisig RPC signatures no longer accept init.
  const initRpc: SignatureEnvelope.MultisigRpc = init

  const serialized = {
    account: '0x1111111111111111111111111111111111111111',
    config: MultisigConfig.toRpc(config),
    signatures: ['0x1234'],
  } as const
  // @ts-expect-error Owner approvals use structured RPC envelopes.
  const serializedRpc: SignatureEnvelope.MultisigRpc = serialized

  const tagged = {
    account: '0x1111111111111111111111111111111111111111',
    config: MultisigConfig.toRpc(config),
    signatures: [signatureRpc],
    type: 'multisig',
  } as const
  // @ts-expect-error Multisig RPC signatures are untagged.
  const taggedRpc: SignatureEnvelope.MultisigRpc = tagged

  expectTypeOf(accountOnlyRpc).toEqualTypeOf<SignatureEnvelope.MultisigRpc>()
  expectTypeOf(initRpc).toEqualTypeOf<SignatureEnvelope.MultisigRpc>()
  expectTypeOf(serializedRpc).toEqualTypeOf<SignatureEnvelope.MultisigRpc>()
  expectTypeOf(taggedRpc).toEqualTypeOf<SignatureEnvelope.MultisigRpc>()
})
