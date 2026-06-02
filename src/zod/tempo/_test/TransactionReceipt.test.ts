import { describe, expect, test } from 'vp/test'
import * as core_TransactionReceipt from '../../../tempo/TransactionReceipt.js'
import * as z_TransactionReceipt from '../TransactionReceipt.js'
import * as z from 'zod/mini'

const rpc: core_TransactionReceipt.Rpc = {
  blockHash:
    '0xc350d807505fb835650f0013632c5515592987ba169bbc6626d9fc54d91f0f0b',
  blockNumber: '0x12f296f',
  contractAddress: null,
  cumulativeGasUsed: '0x82515',
  effectiveGasPrice: '0x21c2f6c09',
  feePayer: '0x814e5e0e31016b9a7f138c76b7e7b2bb5c1ab6a6',
  feeToken: '0x20c0000000000000000000000000000000000001',
  from: '0x814e5e0e31016b9a7f138c76b7e7b2bb5c1ab6a6',
  gasUsed: '0x2abba',
  logs: [],
  logsBloom: `0x${'00'.repeat(256)}`,
  status: '0x1',
  to: '0x3fc91a3afd70395cd496c647d5a6cc9d4b2b7fad',
  transactionHash:
    '0x353fdfc38a2f26115daadee9f5b8392ce62b84f410957967e2ed56b35338cdd0',
  transactionIndex: '0x2',
  type: '0x76',
}

describe('TransactionReceipt', () => {
  test('decodes a tempo receipt', () => {
    const decoded = z.decode(z_TransactionReceipt.TransactionReceipt, rpc)
    expect(decoded).toMatchObject({
      blockNumber: 19868015n,
      cumulativeGasUsed: 533781n,
      effectiveGasPrice: 9062804489n,
      feePayer: '0x814e5e0e31016b9a7f138c76b7e7b2bb5c1ab6a6',
      feeToken: '0x20c0000000000000000000000000000000000001',
      gasUsed: 175034n,
      status: 'success',
      transactionIndex: 2,
      type: 'tempo',
    })
  })

  test('round-trips a tempo receipt via encode', () => {
    const decoded = z.decode(z_TransactionReceipt.TransactionReceipt, rpc)
    expect(z.encode(z_TransactionReceipt.TransactionReceipt, decoded)).toEqual(
      rpc,
    )
  })

  test('decodes the tempo type', () => {
    expect(z.decode(z_TransactionReceipt.Type, '0x76')).toBe('tempo')
    expect(z.encode(z_TransactionReceipt.Type, 'tempo')).toBe('0x76')
  })
})
