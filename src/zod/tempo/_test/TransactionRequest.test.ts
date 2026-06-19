import { describe, expect, test } from 'vp/test'
import * as core_TransactionRequest from '../../../tempo/TransactionRequest.js'
import * as z_TransactionRequest from '../TransactionRequest.js'
import * as z from 'zod/mini'

const rpc = {
  calls: [
    {
      data: '0xdeadbeef',
      to: '0xcafebabecafebabecafebabecafebabecafebabe',
      value: '0x9b6e64a8ec60000',
    },
  ],
  chainId: '0x1',
  feeToken: '0x20c0000000000000000000000000000000000000',
  from: '0x814e5e0e31016b9a7f138c76b7e7b2bb5c1ab6a6',
  maxFeePerGas: '0x2',
  type: '0x76',
} as const

describe('TransactionRequest', () => {
  test('decodes an rpc tempo transaction request', () => {
    const decoded = z.decode(z_TransactionRequest.TransactionRequest, rpc)
    expect(decoded).toMatchObject({
      chainId: 1,
      feeToken: '0x20c0000000000000000000000000000000000000',
      from: '0x814e5e0e31016b9a7f138c76b7e7b2bb5c1ab6a6',
      maxFeePerGas: 2n,
      type: 'tempo',
    })
    expect(decoded.calls).toEqual([
      {
        data: '0xdeadbeef',
        to: '0xcafebabecafebabecafebabecafebabecafebabe',
        value: 700000000000000000n,
      },
    ])
  })

  test('round-trips via encode', () => {
    const decoded = z.decode(z_TransactionRequest.TransactionRequest, rpc)
    expect(z.encode(z_TransactionRequest.TransactionRequest, decoded)).toEqual(
      core_TransactionRequest.toRpc(decoded),
    )
  })

  test('rejects an invalid request', () => {
    expect(
      z.safeDecode(z_TransactionRequest.TransactionRequest, {
        chainId: 1,
      } as never).success,
    ).toBe(false)
  })
})

describe('TransactionRequestToRpc', () => {
  test('accepts numberish encode inputs', () => {
    const decoded = z.decode(z_TransactionRequest.TransactionRequest, rpc)
    const strict = z.encode(z_TransactionRequest.TransactionRequest, decoded)

    // numberish: bigint quantities as `number`/hex, calls value as `number`
    expect(
      z.encode(z_TransactionRequest.TransactionRequestToRpc, {
        ...decoded,
        maxFeePerGas: 2,
        calls: [
          {
            data: '0xdeadbeef',
            to: '0xcafebabecafebabecafebabecafebabecafebabe',
            value: 700000000000000000n,
          },
        ],
      }),
    ).toEqual(strict)

    expect(
      z.encode(z_TransactionRequest.TransactionRequestToRpc, {
        ...decoded,
        maxFeePerGas: '0x2',
      }),
    ).toEqual(strict)
  })
})
