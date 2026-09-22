import { FrameReceipt } from 'ox'
import { z } from 'ox/zod'
import { describe, expect, test } from 'vp/test'

describe('FrameReceipt', () => {
  test('roundtrip', () => {
    const rpc = {
      executionGasUsed: '0x20000000000001',
      logs: [],
      stateGasUsed: '0x0',
      status: 2,
    } as const
    const receipt = FrameReceipt.fromRpc(rpc)
    expect(z.decode(z.FrameReceipt.FrameReceipt, rpc)).toEqual(receipt)
    expect(z.encode(z.FrameReceipt.FrameReceipt, receipt)).toEqual(rpc)
  })

  test('invalid status', () => {
    expect(
      z.safeDecode(z.FrameReceipt.FrameReceipt, {
        executionGasUsed: '0x0',
        logs: [],
        stateGasUsed: '0x0',
        // @ts-expect-error Invalid RPC status.
        status: 3,
      }).success,
    ).toBe(false)
  })
})

describe('FrameReceiptToRpc', () => {
  test('numberish gas', () => {
    expect(
      z.encode(z.FrameReceipt.FrameReceiptToRpc, {
        gasUsed: 21000,
        logs: [],
        stateGasUsed: '0x0',
        status: 'success',
      }),
    ).toEqual({
      executionGasUsed: '0x5208',
      logs: [],
      stateGasUsed: '0x0',
      status: 1,
    })
  })
})
