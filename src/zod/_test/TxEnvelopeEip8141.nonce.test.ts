import { TxEnvelopeEip8141 } from 'ox'
import { z } from 'ox/zod'
import { describe, expect, test } from 'vp/test'

const envelope = TxEnvelopeEip8141.from({
  chainId: 1,
  frames: [{}],
  sender: '0x1111111111111111111111111111111111111111',
  nonceKeys: [1n, 2n ** 256n - 1n],
  nonce: 2n ** 64n - 2n,
})
const rpc = TxEnvelopeEip8141.toRpc(envelope)

describe('TxEnvelopeEip8141', () => {
  test('retains keyed nonces through envelope codecs', () => {
    const decoded = z.decode(z.TransactionEnvelope.TransactionEnvelope, rpc)
    expect(decoded).toEqual(TxEnvelopeEip8141.fromRpc(rpc))
    expect(
      z.encode(z.TransactionEnvelope.TransactionEnvelope, envelope),
    ).toEqual(rpc)
    expect(
      z.encode(z.TransactionEnvelope.TransactionEnvelopeToRpc, {
        ...envelope,
        nonceKeys: ['0x1', 2n ** 256n - 1n],
        nonce: '0xfffffffffffffffe',
      }),
    ).toEqual(rpc)
    const serialized = z.encode(z.TransactionEnvelope.serialized, envelope)
    expect(z.decode(z.TransactionEnvelope.serialized, serialized)).toEqual(
      decoded,
    )
    expect(z.encode(z.TransactionEnvelope.Signed, envelope)).toEqual(rpc)
  })

  test.each([
    { nonceKeys: [] },
    { nonceKeys: ['0x0', '0x1'] },
    { nonceKeys: ['0x2', '0x1'] },
    { nonceKeys: ['0x1', '0x1'] },
    { nonceKeys: ['0x01'] },
    { nonceKeys: ['0x0'], nonce: '0xffffffffffffffff' },
    { nonce: '0x10000000000000000' },
    { nonce: '0x00' },
    { nonce: undefined },
    { nonceKeys: null },
  ])('rejects invalid keyed RPC envelope %#', (fields) => {
    expect(
      z.safeDecode(z.TxEnvelopeEip8141.TxEnvelopeEip8141, {
        ...rpc,
        ...fields,
      } as never).success,
    ).toBe(false)
  })

  test('rejects invalid decoded and numberish keys', () => {
    for (const keys of [[], [0n, 1n], [2n, 1n], [1n, 1n], [2n ** 256n]]) {
      expect(
        z.safeEncode(z.TxEnvelopeEip8141.TxEnvelopeEip8141, {
          ...envelope,
          nonceKeys: keys,
        }).success,
      ).toBe(false)
      expect(
        z.safeEncode(z.TxEnvelopeEip8141.TxEnvelopeEip8141ToRpc, {
          ...envelope,
          nonceKeys: keys,
        }).success,
      ).toBe(false)
    }
  })
})

describe('TransactionRequest', () => {
  test('retains keys while leaving sequence and frame limits unassigned', () => {
    const input = {
      type: '0x6',
      nonceKeys: ['0x1', '0x2'],
      frames: [{ mode: '0x2' }, { mode: '0x2', executionGas: '0x0' }],
    } as const
    const decoded = z.decode(z.TransactionRequest.TransactionRequest, input)
    expect(decoded.nonceKeys).toMatchInlineSnapshot(`
      [
        1n,
        2n,
      ]
    `)
    expect(decoded.nonce).toBeUndefined()
    expect(decoded.frames?.map((frame) => frame.executionGas)).toEqual([
      undefined,
      0n,
    ])
    const encoded = z.encode(z.TransactionRequest.TransactionRequest, decoded)
    expect(encoded.nonceKeys).toEqual(input.nonceKeys)
    expect(encoded.nonce).toBeUndefined()
    expect(
      z.encode(z.TransactionRequest.TransactionRequestToRpc, {
        nonceKeys: [1, '0x2'],
        nonce: 0,
      }).nonceKeys,
    ).toEqual(input.nonceKeys)
  })
  test.each([[], ['0x0', '0x1'], ['0x2', '0x1'], ['0x01'], ['0x1', '0x1']])(
    'rejects invalid keys %#',
    (...nonceKeys) => {
      expect(
        z.safeDecode(z.TransactionRequest.TransactionRequest, {
          nonceKeys,
        } as never).success,
      ).toBe(false)
    },
  )
  test('rejects an exhausted sequence', () => {
    expect(
      z.safeDecode(z.TransactionRequest.TransactionRequest, {
        nonceKeys: ['0x1'],
        nonce: '0xffffffffffffffff',
      }).success,
    ).toBe(false)
    expect(
      z.safeEncode(z.TransactionRequest.TransactionRequestToRpc, {
        nonceKeys: [1],
        nonce: '0xffffffffffffffff',
      }).success,
    ).toBe(false)
  })
})

describe('Transaction', () => {
  const pending = {
    ...rpc,
    blockHash: null,
    blockNumber: null,
    transactionIndex: null,
    hash: `0x${'11'.repeat(32)}`,
  } as const
  const mined = {
    ...pending,
    blockHash: `0x${'22'.repeat(32)}`,
    blockNumber: '0x1',
    transactionIndex: '0x0',
  } as const
  test('preserves pending and mined keyed transaction results', () => {
    const decoded = z.decode(z.Transaction.PendingEip8141, pending)
    expect(decoded.nonceKeys).toEqual(envelope.nonceKeys)
    expect(z.encode(z.Transaction.PendingEip8141, decoded)).toEqual(pending)
    const result = z.decode(z.Transaction.Transaction, mined)
    expect('nonceKeys' in result && result.nonceKeys).toEqual(
      envelope.nonceKeys,
    )
    expect(z.encode(z.Transaction.Transaction, result)).toEqual(mined)
    expect(z.encode(z.Transaction.TransactionToRpc, result)).toEqual(mined)
  })
  test('rejects invalid keyed transaction results', () => {
    for (const fields of [
      { nonceKeys: ['0x2', '0x1'] },
      { nonceKeys: ['0x0', '0x1'] },
      { nonce: '0xffffffffffffffff' },
      { nonce: undefined },
    ]) {
      expect(
        z.safeDecode(z.Transaction.Transaction, {
          ...mined,
          ...fields,
        } as never).success,
      ).toBe(false)
      expect(
        z.safeDecode(z.Transaction.PendingEip8141, {
          ...pending,
          ...fields,
        } as never).success,
      ).toBe(false)
    }
  })
})
