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
