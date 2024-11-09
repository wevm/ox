import { TransactionRequest, Value } from 'ox'
import { describe, expect, test } from 'vitest'
import { anvilMainnet } from '../../../test/anvil.js'

describe('toRpc', () => {
  test('default', () => {
    const request = TransactionRequest.toRpc({
      to: '0x0000000000000000000000000000000000000000',
      value: Value.fromEther('0.01'),
    })
    expect(request).toMatchInlineSnapshot(`
    {
      "to": "0x0000000000000000000000000000000000000000",
      "value": "0x2386f26fc10000",
    }
  `)
  })

  test('behavior: all', () => {
    const request = TransactionRequest.toRpc({
      accessList: [],
      authorizationList: [],
      blobs: ['0xdeadbeef'],
      blobVersionedHashes: ['0xdeadbeef'],
      chainId: 1,
      data: '0xdeadbeef',
      from: '0x0000000000000000000000000000000000000000',
      gas: 1000000n,
      gasPrice: 1000000000n,
      maxFeePerBlobGas: 1000000000n,
      maxFeePerGas: 1000000000n,
      maxPriorityFeePerGas: 1000000000n,
      nonce: 1n,
      to: '0x0000000000000000000000000000000000000000',
      type: '0x2',
      value: 1000000000n,
    })
    expect(request).toMatchInlineSnapshot(`
    {
      "accessList": [],
      "authorizationList": [],
      "blobVersionedHashes": [
        "0xdeadbeef",
      ],
      "blobs": [
        "0xdeadbeef",
      ],
      "chainId": "0x01",
      "data": "0xdeadbeef",
      "from": "0x0000000000000000000000000000000000000000",
      "gas": "0x0f4240",
      "gasPrice": "0x3b9aca00",
      "input": "0xdeadbeef",
      "maxFeePerBlobGas": "0x3b9aca00",
      "maxFeePerGas": "0x3b9aca00",
      "maxPriorityFeePerGas": "0x3b9aca00",
      "nonce": "0x01",
      "to": "0x0000000000000000000000000000000000000000",
      "type": "0x2",
      "value": "0x3b9aca00",
    }
  `)
  })

  test('behavior: input', () => {
    const request = TransactionRequest.toRpc({
      input: '0xdeadbeef',
    })
    expect(request).toMatchInlineSnapshot(`
    {
      "data": "0xdeadbeef",
      "input": "0xdeadbeef",
    }
  `)
  })

  test('behavior: empty', () => {
    const request = TransactionRequest.toRpc({})
    expect(request).toMatchInlineSnapshot('{}')
  })

  test('behavior: network', async () => {
    const request = TransactionRequest.toRpc({
      to: '0x0000000000000000000000000000000000000000',
      value: Value.fromEther('0.01'),
    })

    const hash = await anvilMainnet.request({
      method: 'eth_sendTransaction',
      params: [request],
    })

    expect(hash).toBeDefined()
  })
})

test('exports', () => {
  expect(Object.keys(TransactionRequest)).toMatchInlineSnapshot(`
    [
      "toRpc",
    ]
  `)
})
