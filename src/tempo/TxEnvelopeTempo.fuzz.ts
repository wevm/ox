import { fc, test } from '@fast-check/vitest'
import { Address, Hex, Rlp, Secp256k1, Value } from 'ox'
import { describe, expect } from 'vitest'
import { arbitraryHexOfByteLength } from '../../test/fuzz/arbitraries/bytes.js'
import {
  arbitraryRecursiveRlpHex,
  type RecursiveArray,
} from '../../test/fuzz/arbitraries/rlp.js'
import { numRuns } from '../../test/fuzz/numRuns.js'
import * as AuthorizationTempo from './AuthorizationTempo.js'
import * as KeyAuthorization from './KeyAuthorization.js'
import * as SignatureEnvelope from './SignatureEnvelope.js'
import * as TokenId from './TokenId.js'
import * as TxEnvelopeTempo from './TxEnvelopeTempo.js'

const privateKey =
  '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80'
const sender = Address.fromPublicKey(Secp256k1.getPublicKey({ privateKey }))

// The fixtures from `TxEnvelopeTempo.test.ts`, so envelopes also carry the
// nested tuples that `deserialize` reads.
const keyAuthorization = KeyAuthorization.from({
  expiry: 1234567890,
  address: '0xbe95c3f554e9fc85ec51be69a3d807a0d55bcf2c',
  chainId: 1n,
  type: 'secp256k1',
  limits: [
    {
      token: '0x20c0000000000000000000000000000000000001',
      limit: Value.from('10', 6),
    },
  ],
  signature: SignatureEnvelope.from({
    r: 44944627813007772897391531230081695102703289123332187696115181104739239197517n,
    s: 36528503505192438307355164441104001310566505351980369085208178712678799181120n,
    yParity: 0,
  }),
})
const authorizationList = [
  AuthorizationTempo.from({
    address: '0xbe95c3f554e9fc85ec51be69a3d807a0d55bcf2c',
    chainId: 1,
    nonce: 40n,
    signature: SignatureEnvelope.from({
      r: 49782753348462494199823712700004552394425719014458918871452329774910450607807n,
      s: 33726695977844476214676913201140481102225469284307016937915595756355928419768n,
      yParity: 0,
    }),
  }),
]

const address = arbitraryHexOfByteLength(20)
const uint = (max: bigint) =>
  fc.oneof(
    fc.bigInt({ min: 1n, max }),
    fc.constantFrom(
      ...[1n, 0x7fn, 0x80n, 0xffn, 0x100n, max].filter((n) => n <= max),
    ),
  )

const call = fc.record(
  {
    to: address,
    value: uint(2n ** 256n - 1n),
    data: fc.integer({ min: 1, max: 80 }).chain(arbitraryHexOfByteLength),
  },
  { requiredKeys: [] },
)

const fees = fc
  .option(uint(2n ** 256n - 1n), { nil: undefined })
  .chain((maxFeePerGas) =>
    fc.record({
      maxFeePerGas: fc.constant(maxFeePerGas),
      // `deserialize` reads an empty fee cap as zero, so a tip needs a cap.
      maxPriorityFeePerGas:
        maxFeePerGas === undefined
          ? fc.constant(undefined)
          : fc.option(uint(maxFeePerGas), { nil: undefined }),
    }),
  )

const validity = fc
  .tuple(
    fc.option(fc.nat({ max: 2 ** 40 }), { nil: undefined }),
    fc.option(fc.nat({ max: 2 ** 40 }), { nil: undefined }),
  )
  .map(([a, b]) => {
    if (a === undefined || b === undefined || a === b)
      return { validAfter: a, validBefore: a === b ? undefined : b }
    return { validAfter: Math.min(a, b), validBefore: Math.max(a, b) }
  })

const envelope = fc
  .record({
    chainId: fc.oneof(
      fc.integer({ min: 1, max: 2 ** 32 }),
      fc.constant(Number.MAX_SAFE_INTEGER),
    ),
    calls: fc.array(call, { minLength: 1, maxLength: 3 }),
    nonce: fc.oneof(fc.constant(0n), uint(2n ** 64n - 1n)),
    nonceKey: fc.oneof(fc.constant(0n), uint(2n ** 256n - 1n)),
    gas: fc.option(uint(2n ** 64n - 1n), { nil: undefined }),
    fees,
    validity,
    feeToken: fc.option(fc.bigInt({ min: 0n, max: 2n ** 144n - 1n }), {
      nil: undefined,
    }),
    accessList: fc.array(
      fc.record({
        address,
        storageKeys: fc.array(arbitraryHexOfByteLength(32), { maxLength: 2 }),
      }),
      { maxLength: 2 },
    ),
    keyAuthorization: fc.option(fc.constant(keyAuthorization), {
      nil: undefined,
    }),
    authorizationList: fc.option(fc.constant(authorizationList), {
      nil: undefined,
    }),
    signed: fc.boolean(),
  })
  .map(({ fees, validity, ...rest }) => ({ ...rest, ...fees, ...validity }))

type Generated = typeof envelope extends fc.Arbitrary<infer T> ? T : never

function serialize({ signed, feeToken, ...fields }: Generated) {
  const transaction = TxEnvelopeTempo.from({
    ...fields,
    ...(feeToken === undefined ? {} : { feeToken }),
  })
  if (!signed) return TxEnvelopeTempo.serialize(transaction)
  const signature = Secp256k1.sign({
    payload: TxEnvelopeTempo.getSignPayload(transaction),
    privateKey,
  })
  return TxEnvelopeTempo.serialize(transaction, { signature })
}

/** What `deserialize` reads back: zero and empty fields are omitted. */
function expected(generated: Generated, serialized: Hex.Hex) {
  const { signed, feeToken, accessList, calls, ...fields } = generated
  const result: Record<string, unknown> = {
    ...fields,
    type: 'tempo',
    calls: calls.map((call) => ({ ...call, to: call.to?.toLowerCase() })),
  }
  if (accessList.length) result.accessList = accessList
  if (feeToken !== undefined) result.feeToken = TokenId.toAddress(feeToken)
  if (signed) {
    const list = Rlp.toHex(Hex.slice(serialized, 1)) as readonly unknown[]
    result.signature = SignatureEnvelope.deserialize(
      list[list.length - 1] as Hex.Hex,
    )
    result.from = sender
  }
  return result
}

// Replaces, drops or appends the item at a random path in the decoded list.
type Mutation = {
  path: readonly number[]
  kind: 'replace' | 'drop' | 'append'
  item: RecursiveArray<Hex.Hex>
}

function mutate(
  value: RecursiveArray<Hex.Hex>,
  { path, kind, item }: Mutation,
): RecursiveArray<Hex.Hex> {
  if (!Array.isArray(value) || value.length === 0)
    return kind === 'append' ? [value, item] : item
  const list = value as readonly RecursiveArray<Hex.Hex>[]
  const index = (path[0] ?? 0) % list.length
  const [head, ...rest] = path
  if (head === undefined || rest.length === 0) {
    if (kind === 'drop') return list.filter((_, i) => i !== index)
    if (kind === 'append') return [...list, item]
    return list.map((child, i) => (i === index ? item : child))
  }
  return list.map((child, i) =>
    i === index ? mutate(child, { path: rest, kind, item }) : child,
  )
}

const mutation = fc.record({
  path: fc.array(fc.nat({ max: 15 }), { minLength: 1, maxLength: 4 }),
  kind: fc.constantFrom('replace', 'drop', 'append'),
  item: fc.oneof(
    fc.constantFrom<RecursiveArray<Hex.Hex>>('0x', '0x00', '0x80', [], ['0x']),
    arbitraryRecursiveRlpHex({ maxDepth: 2, maxWidth: 3, maxLeafBytes: 40 }),
  ),
}) satisfies fc.Arbitrary<Mutation>

/** Runs `fn`, which may return or throw anything but a built-in error. */
function expectNoBuiltinError(fn: () => unknown) {
  try {
    fn()
  } catch (error) {
    // A malformed field fails as ox's own error, never a built-in one such
    // as reading a BigInt from a list. (`KeyAuthorization`'s errors extend
    // `Error` rather than `Errors.BaseError`.)
    for (const builtin of [TypeError, SyntaxError, RangeError, ReferenceError])
      expect(error).not.toBeInstanceOf(builtin)
  }
}

function expectDeserializeToReturnOrThrowOxError(serialized: Hex.Hex) {
  expectNoBuiltinError(() =>
    TxEnvelopeTempo.deserialize(serialized as TxEnvelopeTempo.Serialized),
  )
}

describe('TxEnvelopeTempo serialization', () => {
  test.prop({ envelope }, { numRuns })(
    'deserialize reads back what serialize writes',
    (generated) => {
      const serialized = serialize(generated.envelope)
      const deserialized = TxEnvelopeTempo.deserialize(serialized)
      expect(deserialized).toEqual(expected(generated.envelope, serialized))
      // An unsigned envelope serializes again to the same bytes.
      if (!generated.envelope.signed)
        expect(TxEnvelopeTempo.serialize(deserialized)).toBe(serialized)
    },
  )

  test.prop({ envelope, mutation }, { numRuns })(
    'deserialize of a mutated RLP list returns or throws an ox error',
    ({ envelope, mutation }) => {
      const list = Rlp.toHex(Hex.slice(serialize(envelope), 1))
      expectDeserializeToReturnOrThrowOxError(
        Hex.concat('0x76', Rlp.fromHex(mutate(list, mutation))),
      )
    },
  )

  test.prop(
    {
      envelope,
      at: fc.nat(),
      byte: fc.integer({ min: 0, max: 255 }),
      cut: fc.boolean(),
    },
    { numRuns },
  )(
    'deserialize of damaged bytes returns or throws an ox error',
    ({ envelope, at, byte, cut }) => {
      const serialized = serialize(envelope)
      // Keep the type byte; damage or truncate the RLP after it.
      const offset = 2 + 2 * (1 + (at % (Hex.size(serialized) - 1)))
      const damaged = cut
        ? serialized.slice(0, offset)
        : serialized.slice(0, offset) +
          byte.toString(16).padStart(2, '0') +
          serialized.slice(offset + 2)
      expectDeserializeToReturnOrThrowOxError(damaged as Hex.Hex)
    },
  )

  test.prop(
    {
      tree: arbitraryRecursiveRlpHex({
        maxDepth: 3,
        maxWidth: 16,
        maxLeafBytes: 70,
      }),
      type: fc.constantFrom('0x00', '0x01', '0x02', '0x03', '0x04', '0x05'),
    },
    { numRuns },
  )(
    'TxEnvelopeTempo, KeyAuthorization and SignatureEnvelope deserialize random RLP without a built-in error',
    ({ tree, type }) => {
      const rlp = Rlp.fromHex(tree)
      expectDeserializeToReturnOrThrowOxError(Hex.concat('0x76', rlp))
      expectNoBuiltinError(() => KeyAuthorization.deserialize(rlp))
      expectNoBuiltinError(() =>
        SignatureEnvelope.deserialize(
          Hex.concat(type, rlp) as SignatureEnvelope.Serialized,
        ),
      )
    },
  )

  test.prop(
    {
      address,
      chainId: fc.oneof(fc.constant(0n), uint(2n ** 64n - 1n)),
      type: fc.constantFrom('secp256k1', 'p256', 'webAuthn'),
      expiry: fc.option(fc.integer({ min: 1, max: 2 ** 40 }), {
        nil: undefined,
      }),
      limits: fc.option(
        fc.array(fc.record({ token: address, limit: uint(2n ** 256n - 1n) }), {
          maxLength: 2,
        }),
        { nil: undefined },
      ),
      signed: fc.boolean(),
    },
    { numRuns },
  )(
    'KeyAuthorization.deserialize reads back what serialize writes, signed and unsigned',
    ({ signed, ...fields }) => {
      const authorization = KeyAuthorization.from({
        ...fields,
        ...(signed ? { signature: keyAuthorization.signature } : {}),
      } as KeyAuthorization.Input)
      const serialized = KeyAuthorization.serialize(authorization)
      const deserialized = KeyAuthorization.deserialize(serialized)
      expect(KeyAuthorization.serialize(deserialized)).toBe(serialized)
      expect(deserialized.address).toBe(fields.address)
      expect(deserialized.chainId).toBe(fields.chainId)
      expect(deserialized.type).toBe(fields.type)
      expect(deserialized.expiry ?? undefined).toBe(fields.expiry)
      expect(deserialized.signature !== undefined).toBe(signed)
    },
  )
})
