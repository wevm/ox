import {
  Blobs,
  FrameSignature,
  Hex,
  Rlp,
  Secp256k1,
  TxEnvelopeEip8141,
} from 'ox'
import { describe, expect, test } from 'vite-plus/test'

const sender = '0x1111111111111111111111111111111111111111'
const envelope = TxEnvelopeEip8141.from({ chainId: 1, frames: [{}], sender })
// Independently encoded with a standalone RLP writer and noble keccak256.
const serialized =
  '0x06e70180941111111111111111111111111111111111111111c9c8808080c280808080c0c3808080c0'
const hash =
  '0xa795b6de44696d46c096aaa3d6401d6eaa21b9b639408c82be7e9e60358e4387'

test('exports', () => {
  expect(Object.keys(TxEnvelopeEip8141).sort()).toEqual([
    'InvalidError',
    'assert',
    'deserialize',
    'from',
    'getSignPayload',
    'hash',
    'serialize',
    'serializedType',
    'type',
    'validate',
  ])
})

test('matches independent encoding and hash vectors', () => {
  expect(TxEnvelopeEip8141.serialize(envelope)).toBe(serialized)
  expect(TxEnvelopeEip8141.hash(envelope)).toBe(hash)
  expect(TxEnvelopeEip8141.getSignPayload(envelope)).toBe(hash)
  expect(TxEnvelopeEip8141.from(serialized)).toEqual({
    blobVersionedHashes: [],
    chainId: 1,
    frames: [
      { data: '0x', flags: 0, gas: 0n, mode: 0, stateGas: 0n, value: 0n },
    ],
    maxFeePerBlobGas: 0n,
    maxFeePerGas: 0n,
    maxPriorityFeePerGas: 0n,
    nonce: 0n,
    sender,
    signatures: [],
    type: 'eip8141',
  })
})

test('preserves unsigned placeholders and full-width chain IDs', () => {
  const input = {
    ...envelope,
    chainId: 2n ** 256n - 1n,
    signatures: [
      FrameSignature.from({ scheme: 'p256' }),
      FrameSignature.from({ scheme: 'secp256k1' }),
    ],
  }
  const decoded = TxEnvelopeEip8141.deserialize(
    TxEnvelopeEip8141.serialize(input),
  )
  expect(decoded.chainId).toBe(input.chainId)
  expect(decoded.signatures).toEqual(input.signatures)
})

test('elides only canonical-payload signature bytes without mutation', () => {
  const canonical = FrameSignature.from('0xaabb')
  const explicit = FrameSignature.from({
    payload: `0x${'ab'.repeat(32)}`,
    signature: '0xccdd',
  })
  const input = { ...envelope, signatures: [canonical, explicit] }
  expect(TxEnvelopeEip8141.hash(input)).toBe(
    '0xee871bbb2466152f79e357e1cfcbdd71b1587c5b3a9060d9cd91545c1a3a5220',
  )
  expect(TxEnvelopeEip8141.getSignPayload(input)).toBe(
    '0x85ec4544ddb227c5425add4b606f71ddfc0852100d14066d0061a1b092bad6d3',
  )
  const original = structuredClone(input)
  const expected = TxEnvelopeEip8141.hash({
    ...input,
    signatures: [FrameSignature.from('0x'), explicit],
  })
  expect(TxEnvelopeEip8141.getSignPayload(input)).toBe(expected)
  expect(TxEnvelopeEip8141.hash(input, { presign: true })).toBe(expected)
  expect(TxEnvelopeEip8141.hash(input)).not.toBe(expected)
  expect(input).toEqual(original)
  expect(
    TxEnvelopeEip8141.getSignPayload({
      ...input,
      signatures: [
        canonical,
        FrameSignature.from({ ...explicit, signature: '0xee' }),
      ],
    }),
  ).not.toBe(expected)
})

test('signing digest remains stable after attaching a protocol signature', () => {
  const input = {
    ...envelope,
    signatures: [FrameSignature.from({ scheme: 'secp256k1' })],
  }
  const payload = TxEnvelopeEip8141.getSignPayload(input)
  const signature = Secp256k1.sign({
    payload,
    privateKey: Secp256k1.randomPrivateKey(),
  })
  const signed = {
    ...input,
    signatures: [FrameSignature.fromSecp256k1(signature)],
  }
  expect(TxEnvelopeEip8141.getSignPayload(signed)).toBe(payload)
  expect(
    TxEnvelopeEip8141.deserialize(TxEnvelopeEip8141.serialize(signed))
      .signatures,
  ).toEqual(signed.signatures)
})

describe('validation', () => {
  test.each([
    { chainId: -1 },
    { chainId: 1.5 },
    { chainId: Number.MAX_SAFE_INTEGER + 1 },
    { chainId: 2n ** 256n },
    { nonce: -1n },
    { nonce: 2n ** 64n },
    { nonce: null },
    { maxFeePerGas: -1n },
    { maxFeePerGas: 2n ** 256n },
    { maxPriorityFeePerGas: 1n },
    { maxFeePerBlobGas: 1n },
    { blobVersionedHashes: ['0x01'] },
    { blobVersionedHashes: [`0x02${'00'.repeat(31)}`] },
    { frames: [] },
    { frames: Array.from({ length: 65 }, () => ({})) },
    { frames: [{ gas: 2n ** 64n - 1n }, { stateGas: 1n }] },
    { frames: [{ gas: 16_777_216n }] },
    {
      frames: [
        {
          flags: 'approveExecution',
          target: '0x2222222222222222222222222222222222222222',
        },
      ],
    },
    { frames: [{ flags: 'atomicBatch' }] },
    { frames: [{ flags: 'atomicBatch' }, { mode: 'verify' }] },
    { frames: [{ flags: 'atomicBatch' }, { flags: 'approvePayment' }] },
    {
      frames: [
        {
          mode: 'verify',
          target: '0x0000000000000000000000000000000000008141',
        },
      ],
    },
    { sender: '0x' },
  ])('rejects invalid input %#', (fields) => {
    const input = {
      ...envelope,
      ...fields,
    } as TxEnvelopeEip8141.TxEnvelopeEip8141
    expect(TxEnvelopeEip8141.validate(input)).toBe(false)
    expect(() => TxEnvelopeEip8141.assert(input)).toThrow()
  })
  test('accepts atomic batches and implicit sender approval', () => {
    expect(
      TxEnvelopeEip8141.validate({
        ...envelope,
        frames: [{ flags: 'approveExecution' }, { flags: 'atomicBatch' }, {}],
      }),
    ).toBe(true)
  })
  test('validates expiry shape and uniqueness', () => {
    const frame = {
      data: '0x0000000000000001',
      gas: 5000n,
      mode: 'verify',
      target: '0x0000000000000000000000000000000000008141',
    } as const
    expect(TxEnvelopeEip8141.validate({ ...envelope, frames: [frame] })).toBe(
      true,
    )
    expect(
      TxEnvelopeEip8141.validate({ ...envelope, frames: [frame, frame] }),
    ).toBe(false)
    expect(
      TxEnvelopeEip8141.validate({
        ...envelope,
        frames: [{ ...frame, stateGas: 1n }],
      }),
    ).toBe(false)
  })
})

describe('deserialization', () => {
  test.each(['0x06', '0x06c0', '0x06a0', '0x05c0', '0x06c180'])(
    'rejects malformed encoding %s',
    (value) => {
      expect(() =>
        TxEnvelopeEip8141.deserialize(value as TxEnvelopeEip8141.Serialized),
      ).toThrow()
    },
  )
  test('rejects nonminimal integers', () => {
    const fields = Rlp.toHex(Hex.slice(serialized, 1)) as Hex.Hex[]
    fields[0] = '0x0001'
    expect(() =>
      TxEnvelopeEip8141.deserialize(
        Hex.concat('0x06', Rlp.fromHex(fields)) as TxEnvelopeEip8141.Serialized,
      ),
    ).toThrow()
  })
})

describe('PeerDAS wrappers', () => {
  const commitment = `0x${'00'.repeat(48)}` as const
  const sidecars = {
    blobs: [`0x${'00'.repeat(131072)}` as const],
    cellProofs: Array.from({ length: 128 }, () => commitment),
    commitments: [commitment],
  }
  const input = {
    ...envelope,
    blobVersionedHashes: [Blobs.commitmentToVersionedHash(commitment)],
    sidecars,
  }
  test('round-trips the version 1 network wrapper', () => {
    const encoded = TxEnvelopeEip8141.serialize(input)
    const tuple = Rlp.toHex(Hex.slice(encoded, 1))
    expect(tuple[1]).toBe('0x01')
    expect(tuple.length).toBe(5)
    expect(TxEnvelopeEip8141.deserialize(encoded).sidecars).toEqual(sidecars)
    expect(TxEnvelopeEip8141.hash(input)).toBe(
      TxEnvelopeEip8141.hash({ ...input, sidecars: undefined }),
    )
    expect(TxEnvelopeEip8141.getSignPayload(input)).toBe(
      TxEnvelopeEip8141.getSignPayload({ ...input, sidecars: undefined }),
    )
  })
  test.each([
    { blobs: [] },
    { commitments: [] },
    { cellProofs: [] },
    { blobs: ['0x'] },
    { commitments: ['0x'] },
    { cellProofs: Array.from({ length: 128 }, () => '0x') },
    { commitments: [`0x${'11'.repeat(48)}`] },
  ])('rejects malformed sidecars %#', (fields) => {
    expect(() =>
      TxEnvelopeEip8141.serialize({
        ...input,
        sidecars: { ...sidecars, ...fields } as typeof sidecars,
      }),
    ).toThrow()
  })
  test('rejects a wrapper without blob hashes', () => {
    expect(() =>
      TxEnvelopeEip8141.serialize({ ...envelope, sidecars }),
    ).toThrow()
  })
})
