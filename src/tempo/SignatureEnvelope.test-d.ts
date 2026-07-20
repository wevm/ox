import { expectTypeOf, test } from 'vitest'
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

test('toRpc preserves the signature type', () => {
  expectTypeOf(
    SignatureEnvelope.toRpc(signature),
  ).toEqualTypeOf<SignatureEnvelope.Secp256k1Rpc>()
})

test('MultisigRpc uses static initialized and bootstrap shapes', () => {
  const initialized = {
    account: '0x1111111111111111111111111111111111111111',
    signatures: [signatureRpc],
  } as const satisfies SignatureEnvelope.MultisigRpc
  const bootstrap = {
    init: {
      owners: [
        {
          owner: '0x1111111111111111111111111111111111111111',
          weight: 1,
        },
      ],
      threshold: 1,
    },
    signatures: [signatureRpc],
  } as const satisfies SignatureEnvelope.MultisigRpc
  const bootstrapWithAccountUndefined: SignatureEnvelope.MultisigRpc = {
    ...bootstrap,
    account: undefined,
  }

  expectTypeOf(initialized.signatures).toMatchTypeOf<
    readonly SignatureEnvelope.SignatureEnvelopeRpc[]
  >()
  expectTypeOf(bootstrap.signatures).toMatchTypeOf<
    readonly SignatureEnvelope.SignatureEnvelopeRpc[]
  >()
  expectTypeOf(
    bootstrapWithAccountUndefined,
  ).toMatchTypeOf<SignatureEnvelope.MultisigRpc>()
  expectTypeOf<
    SignatureEnvelope.GetType<typeof bootstrap>
  >().toEqualTypeOf<'multisig'>()
})

test('MultisigRpc rejects legacy shapes', () => {
  const combined = {
    account: '0x1111111111111111111111111111111111111111',
    init: {
      owners: [
        {
          owner: '0x1111111111111111111111111111111111111111',
          weight: 1,
        },
      ],
      threshold: 1,
    },
    signatures: [signatureRpc],
  } as const
  // @ts-expect-error Bootstrap RPC signatures omit `account`.
  const combinedRpc: SignatureEnvelope.MultisigRpc = combined

  const serialized = {
    account: '0x1111111111111111111111111111111111111111',
    signatures: ['0x1234'],
  } as const
  // @ts-expect-error Owner approvals use structured RPC envelopes.
  const serializedRpc: SignatureEnvelope.MultisigRpc = serialized

  const tagged = {
    account: '0x1111111111111111111111111111111111111111',
    signatures: [signatureRpc],
    type: 'multisig',
  } as const
  // @ts-expect-error Multisig RPC signatures are untagged.
  const taggedRpc: SignatureEnvelope.MultisigRpc = tagged

  expectTypeOf(combinedRpc).toEqualTypeOf<SignatureEnvelope.MultisigRpc>()
  expectTypeOf(serializedRpc).toEqualTypeOf<SignatureEnvelope.MultisigRpc>()
  expectTypeOf(taggedRpc).toEqualTypeOf<SignatureEnvelope.MultisigRpc>()
})
