import { Frame } from 'ox'
import { z } from 'ox/zod'
import { describe, expect, test } from 'vp/test'

describe('Frame', () => {
  test('decodes RPC budgets and encodes named flags', () => {
    const frame = Frame.from({
      executionGas: 50_000n,
      flags: 'approveExecutionAndPayment',
      mode: 'verify',
      to: '0x1111111111111111111111111111111111111111',
    })
    const rpc = z.encode(z.Frame.Frame, frame)
    expect(rpc).toEqual({
      data: '0x',
      executionGas: '0xc350',
      flags: '0x3',
      mode: '0x1',
      stateGas: '0x0',
      target: '0x1111111111111111111111111111111111111111',
      value: '0x0',
    })
    expect(z.decode(z.Frame.Frame, rpc)).toEqual({
      data: '0x',
      executionGas: 50_000n,
      flags: 3,
      mode: 1,
      stateGas: 0n,
      to: '0x1111111111111111111111111111111111111111',
      value: 0n,
    })
  })
  test('rejects invalid mode and budget', () => {
    expect(z.safeParse(z.Frame.Decoded, { mode: 3 }).success).toBe(false)
    expect(z.safeParse(z.Frame.Decoded, { executionGas: -1n }).success).toBe(
      false,
    )
  })
  test('encodes numberish values', () => {
    expect(
      z.encode(z.Frame.FrameToRpc, { executionGas: '0xc350', stateGas: 0 })
        .executionGas,
    ).toBe('0xc350')
  })
})

describe('FrameToRpc validation', () => {
  test.each([
    { mode: 3 },
    { flags: 8 },
    { executionGas: 2n ** 64n },
    { stateGas: -1 },
    { executionGas: '0x10000000000000000' },
  ])('rejects invalid frame %#', (frame) => {
    expect(
      z.safeEncode(z.Frame.FrameToRpc, frame as Frame.toRpc.Input).success,
    ).toBe(false)
  })
})
