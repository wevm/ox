import type * as ox_TransactionRequest from '../core/TransactionRequest.js'
import * as Signature from '../core/Signature.js'
import { describe, expectTypeOf, test } from 'vp/test'
import * as SignatureEnvelope from './SignatureEnvelope.js'
import * as TransactionRequest from './TransactionRequest.js'
import * as TxEnvelopeTempo from './TxEnvelopeTempo.js'

describe('TransactionRequest type', () => {
  test('extends core TransactionRequest (sans authorizationList)', () => {
    // Tempo's request shape is `Omit<CoreRequest, 'authorizationList'> & {
    // authorizationList?: AuthorizationTempo.ListSigned; ... }`, so a core
    // request without an `authorizationList` is structurally assignable to
    // the Tempo request.
    const { authorizationList: _, ...core } =
      {} as ox_TransactionRequest.TransactionRequest
    const tempo: TransactionRequest.TransactionRequest = core
    expectTypeOf(tempo).toMatchTypeOf<TransactionRequest.TransactionRequest>()
  })

  test('carries Tempo-specific signature fields', () => {
    const request: TransactionRequest.TransactionRequest = {
      calls: [],
      chainId: 1,
    }
    expectTypeOf(request.signature).toEqualTypeOf<
      SignatureEnvelope.SignatureEnvelope<number> | undefined
    >()
    expectTypeOf(request.feePayerSignature).toEqualTypeOf<
      Signature.Signature<true, number> | null | undefined
    >()
  })

  test('signature field types match the envelope', () => {
    type Envelope = TxEnvelopeTempo.TxEnvelopeTempo
    type Request = TransactionRequest.TransactionRequest
    expectTypeOf<Request['signature']>().toEqualTypeOf<Envelope['signature']>()
    expectTypeOf<Request['feePayerSignature']>().toEqualTypeOf<
      Envelope['feePayerSignature']
    >()
  })

  test('Rpc form re-encodes signature fields', () => {
    expectTypeOf<TransactionRequest.Rpc['signature']>().toEqualTypeOf<
      SignatureEnvelope.SignatureEnvelopeRpc | undefined
    >()
    expectTypeOf<TransactionRequest.Rpc['feePayerSignature']>().toEqualTypeOf<
      Signature.Rpc | null | undefined
    >()
  })
})

describe('toEnvelope', () => {
  test('returns a TxEnvelopeTempo', () => {
    const envelope = TransactionRequest.toEnvelope({
      calls: [{ to: '0x0000000000000000000000000000000000000000' }],
      chainId: 1,
      maxFeePerGas: 1n,
    })
    expectTypeOf(envelope).toEqualTypeOf<TxEnvelopeTempo.TxEnvelopeTempo>()
  })

  test('accepts every canonical Tempo TransactionRequest field', () => {
    // Forces us to update toEnvelope when fields are added to the request.
    TransactionRequest.toEnvelope({
      accessList: [],
      authorizationList: undefined,
      calls: undefined,
      chainId: 1,
      data: '0x',
      feePayer: false,
      feePayerSignature: null,
      feeToken: undefined,
      from: '0x0000000000000000000000000000000000000000',
      gas: 21000n,
      keyAuthorization: undefined,
      keyData: undefined,
      keyType: 'secp256k1',
      maxFeePerGas: 1n,
      maxPriorityFeePerGas: 1n,
      nonce: 0n,
      nonceKey: 'random',
      signature: undefined,
      to: '0x0000000000000000000000000000000000000000',
      type: 'tempo',
      validAfter: undefined,
      validBefore: undefined,
      value: 1n,
    })
  })
})

describe('TxEnvelopeTempo.toTransactionRequest', () => {
  test('returns a Tempo TransactionRequest', () => {
    const envelope: TxEnvelopeTempo.TxEnvelopeTempo = {
      calls: [{ to: '0x0000000000000000000000000000000000000000' }],
      chainId: 1,
      type: 'tempo',
    }
    const request = TxEnvelopeTempo.toTransactionRequest(envelope)
    expectTypeOf(request).toEqualTypeOf<TransactionRequest.TransactionRequest>()
  })
})

describe('round-trip: Request → Envelope → Request', () => {
  test('preserves the request shape', () => {
    const request: TransactionRequest.TransactionRequest = {
      calls: [{ to: '0x0000000000000000000000000000000000000000' }],
      chainId: 1,
      feeToken: '0x20c0000000000000000000000000000000000000',
      maxFeePerGas: 1n,
    }
    const envelope = TransactionRequest.toEnvelope(request)
    const roundtripped = TxEnvelopeTempo.toTransactionRequest(envelope)
    expectTypeOf(
      roundtripped,
    ).toEqualTypeOf<TransactionRequest.TransactionRequest>()
  })
})
