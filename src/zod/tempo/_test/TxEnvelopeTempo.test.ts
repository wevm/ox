import { describe, expect, test } from 'vp/test'
import * as core_SignatureEnvelope from '../../../tempo/SignatureEnvelope.js'
import * as core_TxEnvelopeTempo from '../../../tempo/TxEnvelopeTempo.js'
import * as z_TxEnvelopeTempo from '../TxEnvelopeTempo.js'
import * as z from 'zod/mini'

const envelope = {
  calls: [
    {
      to: '0x70997970c51812dc3a010c7d01b50e0d17dc79c8',
    },
  ],
  chainId: 1,
  maxFeePerGas: 2_000_000_000n,
  maxPriorityFeePerGas: 2_000_000_000n,
  nonce: 785n,
  nonceKey: 0n,
  type: 'tempo',
} as const

const signature = core_SignatureEnvelope.from({
  type: 'secp256k1',
  signature: {
    r: '0x635dc2033e60185bb36709c29c75d64ea51dfbd91c32ef4be198e4ceb169fb4d',
    s: '0x50c2667ac4c771072746acfdcf1f1483336dcca8bd2df47cd83175dbe60f0540',
    yParity: 0,
  },
})

describe('TxEnvelopeTempo', () => {
  test('validates an envelope', () => {
    expect(
      z.safeDecode(z_TxEnvelopeTempo.TxEnvelopeTempo, envelope).success,
    ).toBe(true)
  })

  test('validates a signed envelope', () => {
    expect(
      z.safeDecode(z_TxEnvelopeTempo.Signed, { ...envelope, signature })
        .success,
    ).toBe(true)
  })

  test('rejects a signed envelope missing the signature', () => {
    expect(
      z.safeDecode(z_TxEnvelopeTempo.Signed, envelope as never).success,
    ).toBe(false)
  })

  test('rejects an invalid envelope', () => {
    expect(
      z.safeDecode(z_TxEnvelopeTempo.TxEnvelopeTempo, {
        type: 'tempo',
      } as never).success,
    ).toBe(false)
  })

  test('decodes the tempo type literal', () => {
    expect(z.decode(z_TxEnvelopeTempo.Type, 'tempo')).toBe('tempo')
  })
})

describe('serialized', () => {
  test('decodes a serialized envelope', () => {
    const signed = core_TxEnvelopeTempo.from(envelope, { signature })
    const serialized = core_TxEnvelopeTempo.serialize(signed)
    expect(z.decode(z_TxEnvelopeTempo.serialized, serialized)).toMatchObject({
      chainId: 1,
      type: 'tempo',
    })
  })

  test('round-trips a serialized envelope via encode', () => {
    const signed = core_TxEnvelopeTempo.from(envelope, { signature })
    const serialized = core_TxEnvelopeTempo.serialize(signed)
    const decoded = z.decode(z_TxEnvelopeTempo.serialized, serialized)
    expect(z.encode(z_TxEnvelopeTempo.serialized, decoded)).toBe(serialized)
  })
})
