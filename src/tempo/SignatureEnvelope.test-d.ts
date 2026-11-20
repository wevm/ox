import { expectTypeOf, test } from 'vp/test'
import type * as Hex from '../core/Hex.js'
import * as SignatureEnvelope from './SignatureEnvelope.js'

const primitive = SignatureEnvelope.from({ r: '0x01', s: '0x02', yParity: 0 })
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

test('preserves primitive and configurable RPC types', () => {
  expectTypeOf(
    SignatureEnvelope.toRpc(primitive),
  ).toEqualTypeOf<SignatureEnvelope.Secp256k1Rpc>()
  expectTypeOf(SignatureEnvelope.toRpc(envelope)).toEqualTypeOf<Hex.Hex>()
  expectTypeOf<
    SignatureEnvelope.GetType<typeof envelope>
  >().toEqualTypeOf<'configurable'>()
  expectTypeOf(envelope).toMatchTypeOf<SignatureEnvelope.Configurable>()
})

test('requires config and primitive approvals', () => {
  // @ts-expect-error Every configurable signature carries its current config.
  SignatureEnvelope.from({ account: envelope.account, signatures: [primitive] })
  // @ts-expect-error Configurable owners cannot recursively approve with configurable signatures.
  SignatureEnvelope.from({ ...envelope, signatures: [envelope] })
  // @ts-expect-error Configurable RPC signatures are hex-encoded RLP.
  const rpc: SignatureEnvelope.ConfigurableRpc = {
    account: envelope.account,
    signatures: [],
  }
  expectTypeOf(rpc).toEqualTypeOf<Hex.Hex>()
})

const attested = SignatureEnvelope.from({
  policyId: `0x${'aa'.repeat(32)}`,
  programKey: { prefix: 4, x: '0x01', y: '0x02' },
  signature: { r: '0x01', s: '0x02', yParity: 0 },
  slot: 1,
  userTag: `0x${'bb'.repeat(32)}`,
  validUntil: 1_800_000_600,
})

test('infers attested signatures', () => {
  expectTypeOf<
    SignatureEnvelope.GetType<typeof attested>
  >().toEqualTypeOf<'attested'>()
  expectTypeOf(attested.type).toEqualTypeOf<'attested'>()
  expectTypeOf(
    SignatureEnvelope.toRpc(attested),
  ).toEqualTypeOf<SignatureEnvelope.AttestedRpc>()
  expectTypeOf(
    SignatureEnvelope.deserialize('0x06'),
  ).toEqualTypeOf<SignatureEnvelope.SignatureEnvelope>()
})

test('accepts attested owner approvals', () => {
  const configurable = SignatureEnvelope.from({
    ...envelope,
    signatures: [attested],
  })
  expectTypeOf(configurable.signatures).toEqualTypeOf<
    readonly SignatureEnvelope.OwnerApproval[]
  >()
})
