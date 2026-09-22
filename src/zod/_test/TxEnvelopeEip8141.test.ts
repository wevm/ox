import {
  Frame,
  FrameSignature,
  TransactionEnvelope,
  TxEnvelopeEip8141,
} from 'ox'
import { z } from 'ox/zod'
import { describe, expect, test } from 'vp/test'
import { accounts } from '../../../test/constants/accounts.js'

describe('TxEnvelopeEip8141', () => {
  test('RPC codec preserves chain ID precision and signing payloads', () => {
    const envelope = TxEnvelopeEip8141.from({
      chainId: 9007199254740993n,
      frames: [Frame.from({})],
      sender: accounts[0].address,
      signatures: [FrameSignature.from({ scheme: 'secp256k1' })],
    })
    const rpc = z.encode(z.TxEnvelopeEip8141.TxEnvelopeEip8141, envelope)
    expect(rpc.chainId).toBe('0x20000000000001')
    const decoded = z.decode(z.TransactionEnvelope.TransactionEnvelope, rpc)
    expect(decoded.chainId).toBe(9007199254740993n)
    expect(TransactionEnvelope.getSignPayload(decoded)).toBe(
      TxEnvelopeEip8141.getSignPayload(envelope),
    )
  })
  test('generic serialized codec supports unsigned frame entries', () => {
    const envelope = TxEnvelopeEip8141.from({
      chainId: 1,
      frames: [Frame.from({})],
      sender: '0x1111111111111111111111111111111111111111',
    })
    const serialized =
      '0x06e70180941111111111111111111111111111111111111111c9c8808080c280808080c0c3808080c0'
    expect(z.encode(z.TxEnvelopeEip8141.serialized, envelope)).toBe(serialized)
    const decoded = z.decode(z.TransactionEnvelope.serialized, serialized)
    expect(decoded.type).toBe('eip8141')
    expect(z.encode(z.TransactionEnvelope.serialized, decoded)).toBe(serialized)
  })
  test('rejects invalid envelope constraints', () => {
    expect(
      z.safeParse(z.TxEnvelopeEip8141.Decoded, {
        chainId: 1,
        frames: [],
        sender: accounts[0].address,
        type: 'eip8141',
      }).success,
    ).toBe(false)
  })
  test('numberish encoder preserves defaults', () => {
    expect(
      z.encode(z.TxEnvelopeEip8141.TxEnvelopeEip8141ToRpc, {
        chainId: '0x1',
        frames: [{ gas: 50_000 }],
        sender: accounts[0].address,
        type: 'eip8141',
      }).frames[0]!.executionGasLimit,
    ).toBe('0xc350')
  })
})

describe('invalid envelopes', () => {
  const envelope = TxEnvelopeEip8141.from({
    chainId: 1,
    frames: [Frame.from({})],
    sender: accounts[0].address,
  })
  test.each([
    { frames: [] },
    { frames: Array.from({ length: 65 }, () => Frame.from({})) },
    { maxFeePerBlobGas: 1n },
    { maxFeePerGas: 1n, maxPriorityFeePerGas: 2n },
  ])('rejects numberish envelope %#', (fields) => {
    const invalid = { ...envelope, ...fields }
    expect(
      z.safeEncode(z.TxEnvelopeEip8141.TxEnvelopeEip8141ToRpc, invalid).success,
    ).toBe(false)
    const rpc = TxEnvelopeEip8141.toRpc(invalid)
    expect(
      z.safeDecode(z.TxEnvelopeEip8141.TxEnvelopeEip8141, rpc).success,
    ).toBe(false)
  })
  test('rejects malformed nested RPC signatures without throwing', () => {
    const rpc = {
      ...TxEnvelopeEip8141.toRpc(envelope),
      signatures: [{ msg: '0x', scheme: 1, signature: '0x01' }],
    } as const
    expect(
      z.safeDecode(z.TxEnvelopeEip8141.TxEnvelopeEip8141, rpc).success,
    ).toBe(false)
  })
})
