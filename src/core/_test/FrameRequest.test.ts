import { FrameRequest } from 'ox'
import { describe, expect, test } from 'vp/test'

test('exports', () => {
  expect(Object.keys(FrameRequest).sort()).toMatchInlineSnapshot(`
    [
      "fromRpc",
      "toRpc",
    ]
  `)
})

describe('fromRpc', () => {
  test('preserves omitted execution gas and explicit zero state gas', () => {
    expect(FrameRequest.fromRpc({ mode: '0x2', stateGas: '0x0' }))
      .toMatchInlineSnapshot(`
      {
        "data": "0x",
        "flags": 0,
        "mode": 2,
        "stateGas": 0n,
        "value": 0n,
      }
    `)
  })
})

describe('toRpc', () => {
  test('preserves omitted gas and encodes numberish values', () => {
    expect(FrameRequest.toRpc({ mode: 'sender', stateGas: 0, value: '0x1' }))
      .toMatchInlineSnapshot(`
      {
        "data": "0x",
        "flags": "0x0",
        "mode": "0x2",
        "stateGas": "0x0",
        "value": "0x1",
      }
    `)
  })
})
