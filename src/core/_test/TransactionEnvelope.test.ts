import {
  TransactionEnvelope,
  TxEnvelopeEip1559,
  TxEnvelopeEip2930,
  TxEnvelopeEip4844,
  TxEnvelopeEip7702,
  TxEnvelopeLegacy,
} from 'ox'
import { describe, expect, test } from 'vitest'

const legacy = TxEnvelopeLegacy.from({
  chainId: 1,
  gas: 21000n,
  gasPrice: 10n,
  nonce: 0n,
  to: '0x0000000000000000000000000000000000000000',
  value: 1n,
})

const eip2930 = TxEnvelopeEip2930.from({
  accessList: [],
  chainId: 1,
  gas: 21000n,
  gasPrice: 10n,
  nonce: 0n,
  to: '0x0000000000000000000000000000000000000000',
  value: 1n,
})

const eip1559 = TxEnvelopeEip1559.from({
  chainId: 1,
  gas: 21000n,
  maxFeePerGas: 10n,
  maxPriorityFeePerGas: 1n,
  nonce: 0n,
  to: '0x0000000000000000000000000000000000000000',
  value: 1n,
})

const eip4844 = TxEnvelopeEip4844.from({
  blobVersionedHashes: [
    '0x0100000000000000000000000000000000000000000000000000000000000000',
  ],
  chainId: 1,
  gas: 21000n,
  maxFeePerBlobGas: 10n,
  maxFeePerGas: 10n,
  maxPriorityFeePerGas: 1n,
  nonce: 0n,
  to: '0x0000000000000000000000000000000000000000',
  value: 1n,
})

const eip7702 = TxEnvelopeEip7702.from({
  authorizationList: [],
  chainId: 1,
  gas: 21000n,
  maxFeePerGas: 10n,
  maxPriorityFeePerGas: 1n,
  nonce: 0n,
  to: '0x0000000000000000000000000000000000000000',
  value: 1n,
})

test('exports', () => {
  expect(Object.keys(TransactionEnvelope)).toMatchInlineSnapshot(`
    [
      "assert",
      "deserialize",
      "from",
      "getSignPayload",
      "getType",
      "getSerializedType",
      "hash",
      "serialize",
      "toRpc",
      "validate",
      "FeeCapTooHighError",
      "GasPriceTooHighError",
      "InvalidChainIdError",
      "InvalidSerializedError",
      "InvalidSerializedTypeError",
      "InvalidTypeError",
      "TipAboveFeeCapError",
    ]
  `)
})

describe('getType', () => {
  test('behavior: routes explicit transaction types', () => {
    expect(TransactionEnvelope.getType(legacy)).toBe('legacy')
    expect(TransactionEnvelope.getType(eip2930)).toBe('eip2930')
    expect(TransactionEnvelope.getType(eip1559)).toBe('eip1559')
    expect(TransactionEnvelope.getType(eip4844)).toBe('eip4844')
    expect(TransactionEnvelope.getType(eip7702)).toBe('eip7702')
  })

  test('behavior: routes implicit transaction types', () => {
    expect(TransactionEnvelope.getType({ gasPrice: 1n })).toBe('legacy')
    expect(TransactionEnvelope.getType({ accessList: [] })).toBe('eip2930')
    expect(TransactionEnvelope.getType({ maxFeePerGas: 1n })).toBe('eip1559')
    expect(TransactionEnvelope.getType({ maxFeePerBlobGas: 1n })).toBe(
      'eip4844',
    )
    expect(TransactionEnvelope.getType({ authorizationList: [] })).toBe(
      'eip7702',
    )
  })

  test('behavior: rejects invalid transaction types', () => {
    expect(() =>
      TransactionEnvelope.getType({ type: 'invalid' } as never),
    ).toThrowErrorMatchingInlineSnapshot(
      `[TransactionEnvelope.InvalidTypeError: Transaction type "invalid" is invalid.]`,
    )
  })
})

describe('getSerializedType', () => {
  test('behavior: routes serialized transaction types', () => {
    expect(
      TransactionEnvelope.getSerializedType(TxEnvelopeLegacy.serialize(legacy)),
    ).toBe('legacy')
    expect(
      TransactionEnvelope.getSerializedType(
        TxEnvelopeEip2930.serialize(eip2930),
      ),
    ).toBe('eip2930')
    expect(
      TransactionEnvelope.getSerializedType(
        TxEnvelopeEip1559.serialize(eip1559),
      ),
    ).toBe('eip1559')
    expect(
      TransactionEnvelope.getSerializedType(
        TxEnvelopeEip4844.serialize(eip4844),
      ),
    ).toBe('eip4844')
    expect(
      TransactionEnvelope.getSerializedType(
        TxEnvelopeEip7702.serialize(eip7702),
      ),
    ).toBe('eip7702')
  })

  test('behavior: rejects invalid serialized transaction types', () => {
    expect(() =>
      TransactionEnvelope.getSerializedType('0x00'),
    ).toThrowErrorMatchingInlineSnapshot(`
      [TransactionEnvelope.InvalidSerializedTypeError: Serialized transaction type is invalid.

      Serialized Transaction: "0x00"]
    `)
  })
})

describe('deserialize', () => {
  test('behavior: routes to the matching concrete deserializer', () => {
    const serialized = TxEnvelopeEip1559.serialize(eip1559)

    expect(TransactionEnvelope.deserialize(serialized)).toEqual(
      TxEnvelopeEip1559.deserialize(serialized),
    )
  })
})

describe('from', () => {
  test('behavior: routes objects to the matching concrete converter', () => {
    expect(TransactionEnvelope.from({ maxFeePerGas: 10n, chainId: 1 })).toEqual(
      TxEnvelopeEip1559.from({ maxFeePerGas: 10n, chainId: 1 }),
    )
  })

  test('behavior: routes serialized envelopes to the matching concrete converter', () => {
    const serialized = TxEnvelopeEip2930.serialize(eip2930)

    expect(TransactionEnvelope.from(serialized)).toEqual(
      TxEnvelopeEip2930.from(serialized),
    )
  })
})

describe('getSignPayload', () => {
  test('behavior: routes to the matching concrete payload helper', () => {
    expect(TransactionEnvelope.getSignPayload(eip1559)).toBe(
      TxEnvelopeEip1559.getSignPayload(eip1559),
    )
  })
})

describe('hash', () => {
  test('behavior: routes to the matching concrete hash helper', () => {
    expect(TransactionEnvelope.hash(eip1559, { presign: true })).toBe(
      TxEnvelopeEip1559.hash(eip1559, { presign: true }),
    )
  })
})

describe('serialize', () => {
  test('behavior: routes to the matching concrete serializer', () => {
    expect(TransactionEnvelope.serialize(eip1559)).toBe(
      TxEnvelopeEip1559.serialize(eip1559),
    )
  })
})

describe('toRpc', () => {
  test('behavior: routes to the matching concrete RPC converter', () => {
    expect(TransactionEnvelope.toRpc(eip1559)).toEqual(
      TxEnvelopeEip1559.toRpc(eip1559),
    )
  })
})

describe('assert', () => {
  test('behavior: routes to the matching concrete assertion', () => {
    expect(() =>
      TransactionEnvelope.assert({
        chainId: 1,
        maxFeePerGas: 1n,
        maxPriorityFeePerGas: 2n,
      }),
    ).toThrowErrorMatchingInlineSnapshot(
      `[TransactionEnvelope.TipAboveFeeCapError: The provided tip (\`maxPriorityFeePerGas\` = 0.000000002 gwei) cannot be higher than the fee cap (\`maxFeePerGas\` = 0.000000001 gwei).]`,
    )
  })
})

describe('validate', () => {
  test('behavior: returns validation result for routed envelope', () => {
    expect(TransactionEnvelope.validate(eip1559)).toBe(true)
    expect(
      TransactionEnvelope.validate({
        chainId: 1,
        maxFeePerGas: 1n,
        maxPriorityFeePerGas: 2n,
      }),
    ).toBe(false)
  })
})
