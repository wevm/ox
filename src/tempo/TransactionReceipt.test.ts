import { TransactionReceipt } from 'ox/tempo'
import { describe, expect, test } from 'vite-plus/test'

const rpc = {
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
} as const satisfies TransactionReceipt.Rpc

describe('fromRpc', () => {
  test('default', () => {
    const receipt = TransactionReceipt.fromRpc(rpc)
    expect(receipt).toMatchInlineSnapshot(`
      {
        "blobGasPrice": undefined,
        "blobGasUsed": undefined,
        "blockHash": "0xc350d807505fb835650f0013632c5515592987ba169bbc6626d9fc54d91f0f0b",
        "blockNumber": 19868015n,
        "contractAddress": null,
        "cumulativeGasUsed": 533781n,
        "effectiveGasPrice": 9062804489n,
        "feePayer": "0x814e5e0e31016b9a7f138c76b7e7b2bb5c1ab6a6",
        "feeToken": "0x20c0000000000000000000000000000000000001",
        "from": "0x814e5e0e31016b9a7f138c76b7e7b2bb5c1ab6a6",
        "gasUsed": 175034n,
        "logs": [],
        "logsBloom": "0x00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
        "status": "success",
        "to": "0x3fc91a3afd70395cd496c647d5a6cc9d4b2b7fad",
        "transactionHash": "0x353fdfc38a2f26115daadee9f5b8392ce62b84f410957967e2ed56b35338cdd0",
        "transactionIndex": 2,
        "type": "tempo",
      }
    `)
  })

  test('behavior: non-tempo type passes through the generic mapping', () => {
    const receipt = TransactionReceipt.fromRpc({ ...rpc, type: '0x2' })
    expect(receipt.type).toBe('eip1559')
  })

  test('behavior: null', () => {
    expect(TransactionReceipt.fromRpc(null)).toBeNull()
  })
})

describe('toRpc', () => {
  test('default', () => {
    const receipt = TransactionReceipt.fromRpc(rpc)
    const encoded = TransactionReceipt.toRpc(receipt)
    expect(encoded.type).toBe('0x76')
    expect(encoded.feePayer).toBe(rpc.feePayer)
    expect(encoded.feeToken).toBe(rpc.feeToken)
    expect(TransactionReceipt.fromRpc(encoded)).toEqual(receipt)
  })

  test('behavior: non-tempo type passes through the generic mapping', () => {
    const receipt = TransactionReceipt.fromRpc({ ...rpc, type: '0x2' })
    expect(TransactionReceipt.toRpc(receipt).type).toBe('0x2')
  })
})
