import { Frame } from 'ox'
import { z } from 'ox/zod'
import { describe, expect, test } from 'vp/test'

describe('Frame', () => {
  test('decodes RPC budgets and encodes named flags', () => {
    const frame = Frame.from({
      flags: 'approveExecutionAndPayment',
      gas: 50_000n,
      mode: 'verify',
    })
    const rpc = z.encode(z.Frame.Frame, frame)
    expect(rpc).toEqual({
      data: '0x',
      executionGasLimit: '0xc350',
      flags: 3,
      mode: 1,
      stateGasLimit: '0x0',
      value: '0x0',
    })
    expect(z.decode(z.Frame.Frame, rpc)).toEqual({
      data: '0x',
      flags: 3,
      gas: 50_000n,
      mode: 1,
      stateGas: 0n,
      value: 0n,
    })
  })
  test('rejects invalid mode and budget', () => {
    expect(z.safeParse(z.Frame.Decoded, { mode: 3 }).success).toBe(false)
    expect(z.safeParse(z.Frame.Decoded, { gas: -1n }).success).toBe(false)
  })
  test('encodes numberish values', () => {
    expect(
      z.encode(z.Frame.FrameToRpc, { gas: '0xc350', stateGas: 0 })
        .executionGasLimit,
    ).toBe('0xc350')
  })
})

describe('FrameToRpc validation', () => {
  test.each([
    { mode: 3 },
    { flags: 8 },
    { gas: 2n ** 64n },
    { stateGas: -1 },
    { gas: '0x10000000000000000' },
  ])('rejects invalid frame %#', (frame) => {
    expect(
      z.safeEncode(z.Frame.FrameToRpc, frame as Frame.toRpc.Input).success,
    ).toBe(false)
  })
})
