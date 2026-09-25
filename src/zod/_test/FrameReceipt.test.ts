import { FrameReceipt } from 'ox'
import { z } from 'ox/zod'
import { describe, expect, test } from 'vp/test'

describe('FrameReceipt', () => {
  test('safe codecs reject invalid gas without throwing', () => {
    expect(
      z.safeDecode(z.FrameReceipt.FrameReceipt, {
        executionGasUsed: '0x',
        gasUsed: '0x',
        logs: [],
        stateGasUsed: '0x0',
        status: '0x1',
      }).success,
    ).toBe(false)
    expect(
      z.safeEncode(z.FrameReceipt.FrameReceipt, {
        executionGasUsed: 0n,
        gasUsed: -1n,
        logs: [],
        stateGasUsed: 0n,
        status: 'success',
      }).success,
    ).toBe(false)
    for (const gasUsed of [-1, Number.MAX_SAFE_INTEGER + 1, '0x'] as const)
      expect(
        z.safeEncode(z.FrameReceipt.FrameReceiptToRpc, {
          executionGasUsed: 0n,
          gasUsed,
          logs: [],
          stateGasUsed: 0n,
          status: 'success',
        }).success,
      ).toBe(false)
  })

  test('roundtrip', () => {
    const rpc = {
      executionGasUsed: '0x20000000000001',
      gasUsed: '0x20000000000001',
      logs: [],
      stateGasUsed: '0x0',
      status: '0x2',
    } as const
    const receipt = FrameReceipt.fromRpc(rpc)
    expect(z.decode(z.FrameReceipt.FrameReceipt, rpc)).toEqual(receipt)
    expect(z.encode(z.FrameReceipt.FrameReceipt, receipt)).toEqual(rpc)
  })

  test('invalid status', () => {
    expect(
      z.safeDecode(z.FrameReceipt.FrameReceipt, {
        executionGasUsed: '0x0',
        gasUsed: '0x0',
        logs: [],
        stateGasUsed: '0x0',
        // @ts-expect-error Invalid RPC status.
        status: '0x3',
      }).success,
    ).toBe(false)
  })
})

describe('FrameReceiptToRpc', () => {
  test('numberish gas', () => {
    expect(
      z.encode(z.FrameReceipt.FrameReceiptToRpc, {
        executionGasUsed: 21000,
        gasUsed: 21000,
        logs: [],
        stateGasUsed: '0x0',
        status: 'success',
      }),
    ).toEqual({
      executionGasUsed: '0x5208',
      gasUsed: '0x5208',
      logs: [],
      stateGasUsed: '0x0',
      status: '0x1',
    })
  })
})
