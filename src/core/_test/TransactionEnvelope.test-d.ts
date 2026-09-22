import {
  TransactionEnvelope,
  type TxEnvelopeEip1559,
  type TxEnvelopeEip2930,
  type TxEnvelopeEip4844,
  type TxEnvelopeEip7702,
  type TxEnvelopeEip8141,
  type TxEnvelopeLegacy,
} from 'ox'
import { describe, expectTypeOf, test } from 'vp/test'

describe('getType', () => {
  test('behavior: infers explicit transaction types', () => {
    expectTypeOf(
      TransactionEnvelope.getType({ type: 'legacy' }),
    ).toEqualTypeOf<'legacy'>()
    expectTypeOf(
      TransactionEnvelope.getType({ type: 'eip1559' }),
    ).toEqualTypeOf<'eip1559'>()
    expectTypeOf(
      TransactionEnvelope.getType({ type: '0x7e' }),
    ).toEqualTypeOf<'0x7e'>()
  })

  test('behavior: infers transaction types from fields', () => {
    expectTypeOf(
      TransactionEnvelope.getType({ gasPrice: 1n }),
    ).toEqualTypeOf<'legacy'>()
    expectTypeOf(
      TransactionEnvelope.getType({ accessList: [], gasPrice: 1n }),
    ).toEqualTypeOf<'eip2930'>()
    expectTypeOf(
      TransactionEnvelope.getType({ maxFeePerGas: 1n }),
    ).toEqualTypeOf<'eip1559'>()
    expectTypeOf(
      TransactionEnvelope.getType({ blobs: [] }),
    ).toEqualTypeOf<'eip4844'>()
    expectTypeOf(
      TransactionEnvelope.getType({ authorizationList: [] }),
    ).toEqualTypeOf<'eip7702'>()
  })

  test('behavior: ignores undefined discriminator fields', () => {
    expectTypeOf(
      TransactionEnvelope.getType({
        gasPrice: undefined,
        maxFeePerGas: 1n,
      }),
    ).toEqualTypeOf<'eip1559'>()
    expectTypeOf(
      TransactionEnvelope.getType({
        accessList: [],
        gasPrice: 1n,
        maxFeePerGas: undefined,
        maxPriorityFeePerGas: undefined,
      }),
    ).toEqualTypeOf<'eip2930'>()
    expectTypeOf(
      TransactionEnvelope.getType({
        gasPrice: 1n,
        maxFeePerGas: undefined,
        maxPriorityFeePerGas: undefined,
      }),
    ).toEqualTypeOf<'legacy'>()
  })

  test('behavior: defaults ambiguous transactions to EIP-1559', () => {
    expectTypeOf(TransactionEnvelope.getType({})).toEqualTypeOf<'eip1559'>()
    expectTypeOf(
      TransactionEnvelope.getType({
        chainId: 1,
        data: '0x1234',
        nonce: 69n,
      }),
    ).toEqualTypeOf<'eip1559'>()
  })
})

describe('from', () => {
  test('behavior: infers envelope return types from fields', () => {
    const legacy = TransactionEnvelope.from({ gasPrice: 1n })
    expectTypeOf(legacy.type).toEqualTypeOf<'legacy'>()
    expectTypeOf(legacy).toMatchTypeOf<TxEnvelopeLegacy.TxEnvelopeLegacy>()

    const eip2930 = TransactionEnvelope.from({
      accessList: [],
      chainId: 1,
      gasPrice: 1n,
    })
    expectTypeOf(eip2930.type).toEqualTypeOf<'eip2930'>()
    expectTypeOf(eip2930).toMatchTypeOf<TxEnvelopeEip2930.TxEnvelopeEip2930>()

    const eip1559 = TransactionEnvelope.from({
      chainId: 1,
      maxFeePerGas: 1n,
    })
    expectTypeOf(eip1559.type).toEqualTypeOf<'eip1559'>()
    expectTypeOf(eip1559).toMatchTypeOf<TxEnvelopeEip1559.TxEnvelopeEip1559>()

    const eip4844 = TransactionEnvelope.from({
      blobVersionedHashes: [
        '0x0100000000000000000000000000000000000000000000000000000000000000',
      ],
      chainId: 1,
    })
    expectTypeOf(eip4844.type).toEqualTypeOf<'eip4844'>()
    expectTypeOf(eip4844).toMatchTypeOf<TxEnvelopeEip4844.TxEnvelopeEip4844>()

    const eip7702 = TransactionEnvelope.from({
      authorizationList: [],
      chainId: 1,
    })
    expectTypeOf(eip7702.type).toEqualTypeOf<'eip7702'>()
    expectTypeOf(eip7702).toMatchTypeOf<TxEnvelopeEip7702.TxEnvelopeEip7702>()

    const defaulted = TransactionEnvelope.from({
      chainId: 1,
      data: '0x1234',
      nonce: 69n,
    })
    expectTypeOf(defaulted.type).toEqualTypeOf<'eip1559'>()
    expectTypeOf(defaulted).toMatchTypeOf<TxEnvelopeEip1559.TxEnvelopeEip1559>()
  })

  test('behavior: falls back unknown explicit types to EIP-1559', () => {
    const envelope = TransactionEnvelope.from({
      chainId: 1,
      maxFeePerGas: 1n,
      type: '0x7e',
    })
    expectTypeOf(envelope.type).toEqualTypeOf<'eip1559'>()
    expectTypeOf(envelope).toMatchTypeOf<TxEnvelopeEip1559.TxEnvelopeEip1559>()
  })
})

describe('serialize', () => {
  test('behavior: infers serialized envelope return types', () => {
    expectTypeOf(
      TransactionEnvelope.serialize({ gasPrice: 1n }),
    ).toEqualTypeOf<TxEnvelopeLegacy.Serialized>()
    expectTypeOf(
      TransactionEnvelope.serialize({
        accessList: [],
        chainId: 1,
        gasPrice: 1n,
      }),
    ).toEqualTypeOf<TxEnvelopeEip2930.Serialized>()
    expectTypeOf(
      TransactionEnvelope.serialize({ chainId: 1, maxFeePerGas: 1n }),
    ).toEqualTypeOf<TxEnvelopeEip1559.Serialized>()
    expectTypeOf(
      TransactionEnvelope.serialize({
        chainId: 1,
        data: '0x1234',
        nonce: 69n,
      }),
    ).toEqualTypeOf<TxEnvelopeEip1559.Serialized>()
    expectTypeOf(
      TransactionEnvelope.serialize({
        authorizationList: [],
        chainId: 1,
      }),
    ).toEqualTypeOf<TxEnvelopeEip7702.Serialized>()
  })
})

describe('deserialize', () => {
  test('behavior: infers envelope return types from serialized types', () => {
    expectTypeOf(
      TransactionEnvelope.deserialize('0x02' as TxEnvelopeEip1559.Serialized),
    ).toEqualTypeOf<TxEnvelopeEip1559.TxEnvelopeEip1559>()
  })
})

describe('toRpc', () => {
  test('behavior: infers RPC return types from fields', () => {
    const rpc = TransactionEnvelope.toRpc({
      chainId: 1,
      maxFeePerGas: 1n,
    })
    expectTypeOf(rpc).toEqualTypeOf<TxEnvelopeEip1559.Rpc>()
  })
})

describe('eip8141', () => {
  test('preserves constructor literals', () => {
    const envelope = TransactionEnvelope.from({
      chainId: 1n,
      frames: [],
      sender: '0x1111111111111111111111111111111111111111',
    })
    expectTypeOf(envelope).toEqualTypeOf<{
      readonly chainId: 1n
      readonly frames: readonly []
      readonly sender: '0x1111111111111111111111111111111111111111'
      readonly type: 'eip8141'
    }>()
    expectTypeOf(
      TransactionEnvelope.serialize(envelope),
    ).toEqualTypeOf<TxEnvelopeEip8141.Serialized>()
    expectTypeOf(
      TransactionEnvelope.deserialize('0x06c0'),
    ).toEqualTypeOf<TxEnvelopeEip8141.TxEnvelopeEip8141>()
    expectTypeOf(
      TransactionEnvelope.from('0x06c0'),
    ).toEqualTypeOf<TxEnvelopeEip8141.TxEnvelopeEip8141>()
    expectTypeOf(
      TransactionEnvelope.getSerializedType('0x06c0'),
    ).toEqualTypeOf<'eip8141'>()
    expectTypeOf(envelope).toMatchTypeOf<TransactionEnvelope.TxEnvelope<true>>()
    // @ts-expect-error Frame RPC conversion is not supported yet.
    TransactionEnvelope.toRpc(envelope)
  })

  test('frames take precedence over blob and fee fields', () => {
    expectTypeOf(
      TransactionEnvelope.getType({
        blobVersionedHashes: [],
        frames: [],
        maxFeePerGas: 1n,
      }),
    ).toEqualTypeOf<'eip8141'>()
    expectTypeOf(
      TransactionEnvelope.getType({ frames: undefined, maxFeePerGas: 1n }),
    ).toEqualTypeOf<'eip1559'>()
    expectTypeOf(
      TransactionEnvelope.getType({ frames: [], type: 'eip1559' }),
    ).toEqualTypeOf<'eip1559'>()
  })
})


test('toRpc rejects implicit frame envelopes until RPC support is available', () => {
  const envelope = { chainId: 1, frames: [{}], sender: '0x1111111111111111111111111111111111111111' } as const
  // @ts-expect-error Frame RPC conversion is not supported here.
  TransactionEnvelope.toRpc(envelope)
})
