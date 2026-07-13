import { StateOverrides } from 'ox'
import { describe, expect, test } from 'vp/test'

describe('fromRpc', () => {
  test('default', () => {
    expect(
      StateOverrides.fromRpc({
        '0x0000000000000000000000000000000000000000': {
          balance: '0x1',
        },
      }),
    ).toMatchInlineSnapshot(`
      {
        "0x0000000000000000000000000000000000000000": {
          "balance": 1n,
        },
      }
    `)

    expect(
      StateOverrides.fromRpc({
        '0x0000000000000000000000000000000000000000': {
          balance: '0x1',
        },
        '0x0000000000000000000000000000000000000001': {
          balance: '0x1',
          code: '0xdeadbeef',
          movePrecompileToAddress: '0x0000000000000000000000000000000000000000',
          nonce: '0x2',
          stateDiff: {
            '0x0000000000000000000000000000000000000000000000000000000000000000':
              '0x2',
          },
        },
      }),
    ).toMatchInlineSnapshot(`
      {
        "0x0000000000000000000000000000000000000000": {
          "balance": 1n,
        },
        "0x0000000000000000000000000000000000000001": {
          "balance": 1n,
          "code": "0xdeadbeef",
          "movePrecompileToAddress": "0x0000000000000000000000000000000000000000",
          "nonce": 2n,
          "stateDiff": {
            "0x0000000000000000000000000000000000000000000000000000000000000000": "0x2",
          },
        },
      }
    `)
  })
})

describe('toRpc', () => {
  test('default', () => {
    expect(
      StateOverrides.toRpc({
        '0x0000000000000000000000000000000000000000': {
          balance: 1n,
        },
      }),
    ).toMatchInlineSnapshot(`
      {
        "0x0000000000000000000000000000000000000000": {
          "balance": "0x1",
        },
      }
    `)

    expect(
      StateOverrides.toRpc({
        '0x0000000000000000000000000000000000000000': {
          balance: 1n,
        },
        '0x0000000000000000000000000000000000000001': {
          balance: 1n,
          code: '0xdeadbeef',
          movePrecompileToAddress: '0x0000000000000000000000000000000000000000',
          nonce: 2n,
          stateDiff: {
            '0x0000000000000000000000000000000000000000000000000000000000000000':
              '0x2',
          },
        },
      }),
    ).toMatchInlineSnapshot(`
      {
        "0x0000000000000000000000000000000000000000": {
          "balance": "0x1",
        },
        "0x0000000000000000000000000000000000000001": {
          "balance": "0x1",
          "code": "0xdeadbeef",
          "movePrecompileToAddress": "0x0000000000000000000000000000000000000000",
          "nonce": "0x2",
          "stateDiff": {
            "0x0000000000000000000000000000000000000000000000000000000000000000": "0x2",
          },
        },
      }
    `)
  })

  test('numberish inputs', () => {
    const fromBigint = StateOverrides.toRpc({
      '0x0000000000000000000000000000000000000000': {
        balance: 1n,
      },
      '0x0000000000000000000000000000000000000001': {
        balance: 1n,
        code: '0xdeadbeef',
        movePrecompileToAddress: '0x0000000000000000000000000000000000000000',
        nonce: 2n,
        stateDiff: {
          '0x0000000000000000000000000000000000000000000000000000000000000000':
            '0x2',
        },
      },
    })
    const fromNumber = StateOverrides.toRpc({
      '0x0000000000000000000000000000000000000000': {
        balance: 1,
      },
      '0x0000000000000000000000000000000000000001': {
        balance: 1,
        code: '0xdeadbeef',
        movePrecompileToAddress: '0x0000000000000000000000000000000000000000',
        nonce: 2,
        stateDiff: {
          '0x0000000000000000000000000000000000000000000000000000000000000000':
            '0x2',
        },
      },
    })
    const fromHex = StateOverrides.toRpc({
      '0x0000000000000000000000000000000000000000': {
        balance: '0x1',
      },
      '0x0000000000000000000000000000000000000001': {
        balance: '0x1',
        code: '0xdeadbeef',
        movePrecompileToAddress: '0x0000000000000000000000000000000000000000',
        nonce: '0x2',
        stateDiff: {
          '0x0000000000000000000000000000000000000000000000000000000000000000':
            '0x2',
        },
      },
    })

    expect(fromBigint).toEqual(fromNumber)
    expect(fromBigint).toEqual(fromHex)
  })
})
