import { FrameReceipt } from 'ox'
import { describe, expect, test } from 'vp/test'

test('exports', () => {
  expect(Object.keys(FrameReceipt).sort()).toMatchInlineSnapshot(`
    [
      "fromRpc",
      "fromRpcStatus",
      "toRpc",
      "toRpcStatus",
    ]
  `)
})

describe('fromRpc', () => {
  test.each([
    [0, 'reverted'],
    [1, 'success'],
    [2, 'skipped'],
  ] as const)('status %s', (status, expected) => {
    expect(
      FrameReceipt.fromRpc({
        executionGasUsed: '0x20000000000001',
        logs: [
          {
            address: '0x1111111111111111111111111111111111111111',
            data: '0xab',
            topics: ['0xcd'],
          },
        ],
        stateGasUsed: '0x2',
        status,
      }),
    ).toEqual({
      gasUsed: 9007199254740993n,
      logs: [
        {
          address: '0x1111111111111111111111111111111111111111',
          data: '0xab',
          topics: ['0xcd'],
        },
      ],
      stateGasUsed: 2n,
      status: expected,
    })
  })
})

describe('toRpc', () => {
  test.each([
    ['reverted', 0],
    ['success', 1],
    ['skipped', 2],
  ] as const)('status %s', (status, expected) => {
    const receipt = FrameReceipt.fromRpc({
      executionGasUsed: '0x20000000000001',
      logs: [],
      stateGasUsed: '0x2',
      status: expected,
    })
    expect(FrameReceipt.toRpc({ ...receipt, status })).toEqual({
      executionGasUsed: '0x20000000000001',
      logs: [],
      stateGasUsed: '0x2',
      status: expected,
    })
  })

  test('numberish gas', () => {
    expect(
      FrameReceipt.toRpc({
        gasUsed: '0x5208',
        logs: [],
        stateGasUsed: 2,
        status: 'success',
      }),
    ).toMatchInlineSnapshot(`
      {
        "executionGasUsed": "0x5208",
        "logs": [],
        "stateGasUsed": "0x2",
        "status": 1,
      }
    `)
  })
})
