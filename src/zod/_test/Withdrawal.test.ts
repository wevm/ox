import { describe, expect, test } from 'vp/test'
import * as z_Withdrawal from '../Withdrawal.js'
import * as z from 'zod/mini'

describe('Withdrawal', () => {
  test('decodes and encodes withdrawals', () => {
    const rpc = {
      address: '0x0000000000000000000000000000000000000000',
      amount: '0x620323',
      index: '0x0',
      validatorIndex: '0x1',
    } as const

    expect(z.decode(z_Withdrawal.Withdrawal, rpc)).toMatchInlineSnapshot(`
      {
        "address": "0x0000000000000000000000000000000000000000",
        "amount": 6423331n,
        "index": 0,
        "validatorIndex": 1,
      }
    `)
    expect(
      z.encode(z_Withdrawal.Withdrawal, {
        address: rpc.address,
        amount: 6423331n,
        index: 0,
        validatorIndex: 1,
      }),
    ).toMatchInlineSnapshot(`
      {
        "address": "0x0000000000000000000000000000000000000000",
        "amount": "0x620323",
        "index": "0x0",
        "validatorIndex": "0x1",
      }
    `)
  })

  test('WithdrawalToRpc accepts numberish encode inputs', () => {
    const address = '0x0000000000000000000000000000000000000000'
    const expected = {
      address,
      amount: '0x620323',
      index: '0x0',
      validatorIndex: '0x1',
    }

    expect(
      z.encode(z_Withdrawal.WithdrawalToRpc, {
        address,
        amount: 6423331n,
        index: 0,
        validatorIndex: 1,
      }),
    ).toEqual(expected)
    expect(
      z.encode(z_Withdrawal.WithdrawalToRpc, {
        address,
        amount: 6423331,
        index: 0,
        validatorIndex: 1,
      }),
    ).toEqual(expected)
    expect(
      z.encode(z_Withdrawal.WithdrawalToRpc, {
        address,
        amount: '0x620323',
        index: '0x0',
        validatorIndex: '0x1',
      }),
    ).toEqual(expected)
  })
})
