import {
  TransactionEnvelope,
  type TransactionRequest as TransactionRequestNs,
  TransactionRequest,
  type TxEnvelopeEip1559,
  type TxEnvelopeEip4844,
} from 'ox'
import { describe, expectTypeOf, test } from 'vp/test'

describe('TransactionRequest type', () => {
  test('carries optional signature fields (r, s, yParity, v)', () => {
    const request: TransactionRequestNs.TransactionRequest = {
      chainId: 1,
      r: '0x01',
      s: '0x02',
      v: 27,
      yParity: 0,
    }
    expectTypeOf(request.r).toEqualTypeOf<`0x${string}` | undefined>()
    expectTypeOf(request.s).toEqualTypeOf<`0x${string}` | undefined>()
    expectTypeOf(request.yParity).toEqualTypeOf<number | undefined>()
    expectTypeOf(request.v).toEqualTypeOf<number | undefined>()
  })

  test('Rpc form encodes signature fields as Hex', () => {
    expectTypeOf<TransactionRequestNs.Rpc['r']>().toEqualTypeOf<
      `0x${string}` | undefined
    >()
    expectTypeOf<TransactionRequestNs.Rpc['yParity']>().toEqualTypeOf<
      `0x${string}` | undefined
    >()
    expectTypeOf<TransactionRequestNs.Rpc['v']>().toEqualTypeOf<
      `0x${string}` | undefined
    >()
  })
})

describe('toEnvelope', () => {
  test('returns a value assignable to TxEnvelope', () => {
    const envelope = TransactionRequest.toEnvelope({
      chainId: 1,
      maxFeePerGas: 1n,
    })
    expectTypeOf(envelope).toMatchTypeOf<TransactionEnvelope.TxEnvelope>()
  })

  test('accepts every canonical field on TransactionRequest', () => {
    // If a new field is added to TransactionRequest, this constructor call
    // forces us to decide whether `toEnvelope` should plumb it through.
    TransactionRequest.toEnvelope({
      accessList: [],
      authorizationList: undefined,
      blobs: undefined,
      blobVersionedHashes: undefined,
      chainId: 1,
      data: '0x',
      from: '0x0000000000000000000000000000000000000000',
      gas: 21000n,
      gasPrice: undefined,
      input: undefined,
      maxFeePerBlobGas: undefined,
      maxFeePerGas: 1n,
      maxPriorityFeePerGas: 1n,
      nonce: 0n,
      r: undefined,
      s: undefined,
      to: '0x0000000000000000000000000000000000000000',
      type: 'eip1559',
      v: undefined,
      value: 1n,
      yParity: undefined,
    })
  })
})

describe('TxEnvelope.toTransactionRequest', () => {
  test('returns a TransactionRequest', () => {
    const envelope: TxEnvelopeEip1559.TxEnvelopeEip1559 = {
      chainId: 1,
      type: 'eip1559',
    }
    const request = TransactionEnvelope.toTransactionRequest(envelope)
    expectTypeOf(
      request,
    ).toEqualTypeOf<TransactionRequestNs.TransactionRequest>()
  })

  test('signature fields are compatible between envelope and request', () => {
    type Envelope = TxEnvelopeEip1559.TxEnvelopeEip1559<true>
    type Request = TransactionRequestNs.TransactionRequest
    // Both shapes carry the same signature field types so a round-trip is
    // lossless at the type level.
    expectTypeOf<Envelope['r']>().toEqualTypeOf<NonNullable<Request['r']>>()
    expectTypeOf<Envelope['s']>().toEqualTypeOf<NonNullable<Request['s']>>()
    expectTypeOf<Envelope['yParity']>().toEqualTypeOf<Request['yParity']>()
    expectTypeOf<Envelope['v']>().toEqualTypeOf<Request['v']>()
  })

  test('4844 blobVersionedHashes type is assignable to request', () => {
    expectTypeOf<
      TxEnvelopeEip4844.TxEnvelopeEip4844['blobVersionedHashes']
    >().toMatchTypeOf<
      NonNullable<
        TransactionRequestNs.TransactionRequest['blobVersionedHashes']
      >
    >()
  })
})

describe('round-trip: Request → Envelope → Request', () => {
  test('preserves the request shape', () => {
    const request: TransactionRequestNs.TransactionRequest = {
      chainId: 1,
      maxFeePerGas: 1n,
      nonce: 0n,
      to: '0x0000000000000000000000000000000000000000',
      value: 1n,
    }
    const envelope = TransactionRequest.toEnvelope(request)
    const roundtripped = TransactionEnvelope.toTransactionRequest(envelope)
    expectTypeOf(
      roundtripped,
    ).toEqualTypeOf<TransactionRequestNs.TransactionRequest>()
  })
})
