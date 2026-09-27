import { z } from 'ox/zod'
import { describe, expect, test } from 'vp/test'

describe('FrameRequest', () => {
  test('round-trips omitted gas through the public codec', () => {
    const frame = z.decode(z.FrameRequest.FrameRequest, {
      mode: '0x2',
      stateGas: '0x0',
    })
    expect(frame).toEqual({
      mode: 2,
      flags: 0,
      stateGas: 0n,
      value: 0n,
      data: '0x',
    })
    expect(z.encode(z.FrameRequest.FrameRequest, frame)).toEqual({
      mode: '0x2',
      flags: '0x0',
      stateGas: '0x0',
      value: '0x0',
      data: '0x',
    })
  })
})

describe('FrameRequestToRpc', () => {
  test('encodes numberish values through the public codec', () => {
    expect(
      z.encode(z.FrameRequest.FrameRequestToRpc, {
        mode: 'sender',
        executionGas: 50000,
        stateGas: '0x0',
      }),
    ).toEqual({
      mode: '0x2',
      flags: '0x0',
      executionGas: '0xc350',
      stateGas: '0x0',
      value: '0x0',
      data: '0x',
    })
  })
})
