import { describe, expect, test } from 'vp/test'
import * as z_StateOverrides from '../StateOverrides.js'
import * as z from 'zod/mini'

const address = '0x0000000000000000000000000000000000000000'
const movedAddress = '0x0000000000000000000000000000000000000001'
const slot = `0x${'11'.repeat(32)}` as const
const value = `0x${'22'.repeat(32)}` as const

describe('StateOverrides', () => {
  test('decodes and encodes account overrides', () => {
    expect(
      z.decode(z_StateOverrides.AccountOverrides, {
        balance: '0x1',
        code: '0xdeadbeef',
        movePrecompileToAddress: movedAddress,
        nonce: '0x2',
        state: { [slot]: value },
      }),
    ).toMatchInlineSnapshot(`
      {
        "balance": 1n,
        "code": "0xdeadbeef",
        "movePrecompileToAddress": "0x0000000000000000000000000000000000000001",
        "nonce": 2n,
        "state": {
          "0x1111111111111111111111111111111111111111111111111111111111111111": "0x2222222222222222222222222222222222222222222222222222222222222222",
        },
      }
    `)
    expect(
      z.encode(z_StateOverrides.AccountOverrides, {
        balance: 1n,
        code: '0xdeadbeef',
        movePrecompileToAddress: movedAddress,
        nonce: 2n,
        stateDiff: { [slot]: value },
      }),
    ).toMatchInlineSnapshot(`
      {
        "balance": "0x1",
        "code": "0xdeadbeef",
        "movePrecompileToAddress": "0x0000000000000000000000000000000000000001",
        "nonce": "0x2",
        "stateDiff": {
          "0x1111111111111111111111111111111111111111111111111111111111111111": "0x2222222222222222222222222222222222222222222222222222222222222222",
        },
      }
    `)
  })

  test('decodes state override maps', () => {
    expect(
      z.decode(z_StateOverrides.StateOverrides, {
        [address]: {
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
  })

  test('AccountOverridesToRpc accepts numberish encode inputs', () => {
    const decoded = {
      balance: 1n,
      code: '0xdeadbeef',
      movePrecompileToAddress: movedAddress,
      nonce: 2n,
      stateDiff: { [slot]: value },
    } as const
    const expected = z.encode(z_StateOverrides.AccountOverrides, decoded)

    expect(
      z.encode(z_StateOverrides.AccountOverridesToRpc, {
        ...decoded,
        balance: 1,
        nonce: 2,
      }),
    ).toEqual(expected)
    expect(
      z.encode(z_StateOverrides.AccountOverridesToRpc, {
        ...decoded,
        balance: '0x1',
        nonce: '0x2',
      }),
    ).toEqual(expected)
  })

  test('rejects invalid addresses and storage keys', () => {
    expect(
      z.safeDecode(z_StateOverrides.StateOverrides, {
        '0xdeadbeef': { balance: '0x1' },
      }).success,
    ).toBe(false)
    expect(
      z.safeDecode(z_StateOverrides.AccountStorage, {
        '0xz': value,
      }).success,
    ).toBe(false)
  })
})
