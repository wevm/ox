import { expectTypeOf, test } from 'vitest'
import type * as Hex from '../core/Hex.js'
import * as SignatureEnvelope from './SignatureEnvelope.js'

const primitive = SignatureEnvelope.from({ r: 1n, s: 2n, yParity: 0 })
const envelope = SignatureEnvelope.from({
  account: '0x2222222222222222222222222222222222222222',
  config: {
    threshold: 1,
    version: 0n,
    owners: [
      { owner: '0x1111111111111111111111111111111111111111', weight: 1 },
    ],
  },
  signatures: [primitive],
})

test('preserves primitive and multisig RPC types', () => {
  expectTypeOf(
    SignatureEnvelope.toRpc(primitive),
  ).toEqualTypeOf<SignatureEnvelope.Secp256k1Rpc>()
  expectTypeOf(SignatureEnvelope.toRpc(envelope)).toEqualTypeOf<Hex.Hex>()
  expectTypeOf<
    SignatureEnvelope.GetType<typeof envelope>
  >().toEqualTypeOf<'multisig'>()
  expectTypeOf(envelope).toMatchTypeOf<SignatureEnvelope.Multisig>()
})

test('requires config and primitive approvals', () => {
  // @ts-expect-error Every multisig signature carries its current config.
  SignatureEnvelope.from({ account: envelope.account, signatures: [primitive] })
  // @ts-expect-error Multisig owners cannot recursively approve with multisigs.
  SignatureEnvelope.from({ ...envelope, signatures: [envelope] })
  // @ts-expect-error Multisig RPC signatures are hex-encoded RLP.
  const rpc: SignatureEnvelope.MultisigRpc = {
    account: envelope.account,
    signatures: [],
  }
  expectTypeOf(rpc).toEqualTypeOf<Hex.Hex>()
})

const zk = SignatureEnvelope.from({
  accessKeySignature: primitive,
  addressSeed: `0x${'01'.repeat(32)}`,
  issuedAt: 1760000000,
  issuer: `0x${'02'.repeat(32)}`,
  keyHash: `0x${'03'.repeat(32)}`,
  proof: `0x${'04'.repeat(256)}`,
  publisherId: `0x${'05'.repeat(32)}`,
  scheme: 1,
  validUntil: 1760000540,
})

test('infers ZK signatures and their RPC type', () => {
  expectTypeOf<SignatureEnvelope.GetType<typeof zk>>().toEqualTypeOf<'zk'>()
  expectTypeOf(zk).toMatchTypeOf<SignatureEnvelope.Zk>()
  expectTypeOf(
    SignatureEnvelope.toRpc(zk),
  ).toEqualTypeOf<SignatureEnvelope.ZkRpc>()
})

test('requires a primitive access key signature', () => {
  // @ts-expect-error Access keys sign with primitive signatures.
  SignatureEnvelope.from({ ...zk, accessKeySignature: envelope })
})
