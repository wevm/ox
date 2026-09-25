import { FrameReceipt } from 'ox'
import { describe, expect, test } from 'vitest'

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
    ['0x0', 'reverted'],
    ['0x1', 'success'],
    ['0x2', 'skipped'],
  ] as const)('status %s', (status, expected) => {
    expect(
      FrameReceipt.fromRpc({
        executionGasUsed: '0x20000000000001',
        gasUsed: '0x20000000000003',
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
      executionGasUsed: 9007199254740993n,
      gasUsed: 9007199254740995n,
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
    ['reverted', '0x0'],
    ['success', '0x1'],
    ['skipped', '0x2'],
  ] as const)('status %s', (status, expected) => {
    const receipt = FrameReceipt.fromRpc({
      executionGasUsed: '0x20000000000001',
      gasUsed: '0x20000000000003',
      logs: [],
      stateGasUsed: '0x2',
      status: expected,
    })
    expect(FrameReceipt.toRpc({ ...receipt, status })).toEqual({
      executionGasUsed: '0x20000000000001',
      gasUsed: '0x20000000000003',
      logs: [],
      stateGasUsed: '0x2',
      status: expected,
    })
  })

  test('numberish gas', () => {
    expect(
      FrameReceipt.toRpc({
        executionGasUsed: '0x5208',
        gasUsed: '0x520a',
        logs: [],
        stateGasUsed: 2,
        status: 'success',
      }),
    ).toMatchInlineSnapshot(`
      {
        "executionGasUsed": "0x5208",
        "gasUsed": "0x520a",
        "logs": [],
        "stateGasUsed": "0x2",
        "status": "0x1",
      }
    `)
  })
})
