import { TransactionReceipt } from 'ox'
import { describe, expect, test } from 'vitest'
import { anvilMainnet } from '../../../test/anvil.js'

describe('fromRpc', () => {
  test('default', () => {
    const receipt = TransactionReceipt.fromRpc({
      blobGasPrice: '0x42069',
      blobGasUsed: '0x1337',
      blockHash:
        '0xc350d807505fb835650f0013632c5515592987ba169bbc6626d9fc54d91f0f0b',
      blockNumber: '0x12f296f',
      contractAddress: null,
      cumulativeGasUsed: '0x82515',
      effectiveGasPrice: '0x21c2f6c09',
      from: '0x814e5e0e31016b9a7f138c76b7e7b2bb5c1ab6a6',
      gasUsed: '0x2abba',
      logs: [],
      logsBloom:
        '0x00200000000000000000008080000000000000000040000000000000000000000000000000000000000000000000000022000000080000000000000000000000000000080000000000000008000000200000000000000000000200008020400000000000000000280000000000100000000000000000000000000010000000000000000000020000000000000020000000000001000000080000004000000000000000000000000000000000000000000000400000000000001000000000000000000002000000000000000020000000000000000000001000000000000000000000200000000000000000000000000000001000000000c00000000000000000',
      status: '0x1',
      to: '0x3fc91a3afd70395cd496c647d5a6cc9d4b2b7fad',
      transactionHash:
        '0x353fdfc38a2f26115daadee9f5b8392ce62b84f410957967e2ed56b35338cdd0',
      transactionIndex: '0x2',
      type: '0x2',
    })
    expect(receipt).toMatchInlineSnapshot(`
    {
      "blobGasPrice": 270441n,
      "blobGasUsed": 4919n,
      "blockHash": "0xc350d807505fb835650f0013632c5515592987ba169bbc6626d9fc54d91f0f0b",
      "blockNumber": 19868015n,
      "contractAddress": null,
      "cumulativeGasUsed": 533781n,
      "effectiveGasPrice": 9062804489n,
      "from": "0x814e5e0e31016b9a7f138c76b7e7b2bb5c1ab6a6",
      "gasUsed": 175034n,
      "logs": [],
      "logsBloom": "0x00200000000000000000008080000000000000000040000000000000000000000000000000000000000000000000000022000000080000000000000000000000000000080000000000000008000000200000000000000000000200008020400000000000000000280000000000100000000000000000000000000010000000000000000000020000000000000020000000000001000000080000004000000000000000000000000000000000000000000000400000000000001000000000000000000002000000000000000020000000000000000000001000000000000000000000200000000000000000000000000000001000000000c00000000000000000",
      "status": "success",
      "to": "0x3fc91a3afd70395cd496c647d5a6cc9d4b2b7fad",
      "transactionHash": "0x353fdfc38a2f26115daadee9f5b8392ce62b84f410957967e2ed56b35338cdd0",
      "transactionIndex": 2,
      "type": "eip1559",
    }
  `)
  })

  test('behavior: null', () => {
    const receipt = TransactionReceipt.fromRpc(null)
    expect(receipt).toBeNull()
  })

  test('behavior: nullish values', () => {
    // @ts-expect-error
    const receipt = TransactionReceipt.fromRpc({
      blockHash:
        '0xc350d807505fb835650f0013632c5515592987ba169bbc6626d9fc54d91f0f0b',
      contractAddress: null,
      from: '0x814e5e0e31016b9a7f138c76b7e7b2bb5c1ab6a6',
      logs: [
        {
          address: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
          blockHash:
            '0xc350d807505fb835650f0013632c5515592987ba169bbc6626d9fc54d91f0f0b',
          blockNumber: '0x12f296f',
          data: '0x00000000000000000000000000000000000000000000000009b6e64a8ec60000',
          logIndex: '0x11',
          removed: false,
          topics: [
            '0xe1fffcc4923d04b559f4d29a8bfc6cda04eb5b0d3c460751c2402c5c5cc9109c',
            '0x0000000000000000000000003fc91a3afd70395cd496c647d5a6cc9d4b2b7fad',
          ],
          transactionHash:
            '0x353fdfc38a2f26115daadee9f5b8392ce62b84f410957967e2ed56b35338cdd0',
          transactionIndex: '0x2',
        },
      ],
      logsBloom:
        '0x00200000000000000000008080000000000000000040000000000000000000000000000000000000000000000000000022000000080000000000000000000000000000080000000000000008000000200000000000000000000200008020400000000000000000280000000000100000000000000000000000000010000000000000000000020000000000000020000000000001000000080000004000000000000000000000000000000000000000000000400000000000001000000000000000000002000000000000000020000000000000000000001000000000000000000000200000000000000000000000000000001000000000c00000000000000000',
      status: '0x1',
      to: '0x3fc91a3afd70395cd496c647d5a6cc9d4b2b7fad',
      transactionHash:
        '0x353fdfc38a2f26115daadee9f5b8392ce62b84f410957967e2ed56b35338cdd0',
      type: '0x69',
    })
    expect(receipt).toMatchInlineSnapshot(`
    {
      "blobGasPrice": undefined,
      "blobGasUsed": undefined,
      "blockHash": "0xc350d807505fb835650f0013632c5515592987ba169bbc6626d9fc54d91f0f0b",
      "blockNumber": 0n,
      "contractAddress": null,
      "cumulativeGasUsed": 0n,
      "effectiveGasPrice": 0n,
      "from": "0x814e5e0e31016b9a7f138c76b7e7b2bb5c1ab6a6",
      "gasUsed": 0n,
      "logs": [
        {
          "address": "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2",
          "blockHash": "0xc350d807505fb835650f0013632c5515592987ba169bbc6626d9fc54d91f0f0b",
          "blockNumber": 19868015n,
          "data": "0x00000000000000000000000000000000000000000000000009b6e64a8ec60000",
          "logIndex": 17,
          "removed": false,
          "topics": [
            "0xe1fffcc4923d04b559f4d29a8bfc6cda04eb5b0d3c460751c2402c5c5cc9109c",
            "0x0000000000000000000000003fc91a3afd70395cd496c647d5a6cc9d4b2b7fad",
          ],
          "transactionHash": "0x353fdfc38a2f26115daadee9f5b8392ce62b84f410957967e2ed56b35338cdd0",
          "transactionIndex": 2,
        },
      ],
      "logsBloom": "0x00200000000000000000008080000000000000000040000000000000000000000000000000000000000000000000000022000000080000000000000000000000000000080000000000000008000000200000000000000000000200008020400000000000000000280000000000100000000000000000000000000010000000000000000000020000000000000020000000000001000000080000004000000000000000000000000000000000000000000000400000000000001000000000000000000002000000000000000020000000000000000000001000000000000000000000200000000000000000000000000000001000000000c00000000000000000",
      "status": "success",
      "to": "0x3fc91a3afd70395cd496c647d5a6cc9d4b2b7fad",
      "transactionHash": "0x353fdfc38a2f26115daadee9f5b8392ce62b84f410957967e2ed56b35338cdd0",
      "transactionIndex": 0,
      "type": "0x69",
    }
  `)
  })

  test('behavior: network', async () => {
    const receipt = await anvilMainnet
      .request({
        method: 'eth_getTransactionReceipt',
        params: [
          '0x353fdfc38a2f26115daadee9f5b8392ce62b84f410957967e2ed56b35338cdd0',
        ],
      })
      .then(TransactionReceipt.fromRpc)

    expect(receipt).toMatchInlineSnapshot(`
    {
      "blobGasPrice": undefined,
      "blobGasUsed": undefined,
      "blockHash": "0xc350d807505fb835650f0013632c5515592987ba169bbc6626d9fc54d91f0f0b",
      "blockNumber": 19868015n,
      "contractAddress": null,
      "cumulativeGasUsed": 533781n,
      "effectiveGasPrice": 9062804489n,
      "from": "0x814e5e0e31016b9a7f138c76b7e7b2bb5c1ab6a6",
      "gasUsed": 175034n,
      "logs": [
        {
          "address": "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2",
          "blockHash": "0xc350d807505fb835650f0013632c5515592987ba169bbc6626d9fc54d91f0f0b",
          "blockNumber": 19868015n,
          "data": "0x00000000000000000000000000000000000000000000000009b6e64a8ec60000",
          "logIndex": 17,
          "removed": false,
          "topics": [
            "0xe1fffcc4923d04b559f4d29a8bfc6cda04eb5b0d3c460751c2402c5c5cc9109c",
            "0x0000000000000000000000003fc91a3afd70395cd496c647d5a6cc9d4b2b7fad",
          ],
          "transactionHash": "0x353fdfc38a2f26115daadee9f5b8392ce62b84f410957967e2ed56b35338cdd0",
          "transactionIndex": 2,
        },
        {
          "address": "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2",
          "blockHash": "0xc350d807505fb835650f0013632c5515592987ba169bbc6626d9fc54d91f0f0b",
          "blockNumber": 19868015n,
          "data": "0x00000000000000000000000000000000000000000000000009b6e64a8ec60000",
          "logIndex": 18,
          "removed": false,
          "topics": [
            "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef",
            "0x0000000000000000000000003fc91a3afd70395cd496c647d5a6cc9d4b2b7fad",
            "0x0000000000000000000000002aeee741fa1e21120a21e57db9ee545428e683c9",
          ],
          "transactionHash": "0x353fdfc38a2f26115daadee9f5b8392ce62b84f410957967e2ed56b35338cdd0",
          "transactionIndex": 2,
        },
        {
          "address": "0xc56c7a0eaa804f854b536a5f3d5f49d2ec4b12b8",
          "blockHash": "0xc350d807505fb835650f0013632c5515592987ba169bbc6626d9fc54d91f0f0b",
          "blockNumber": 19868015n,
          "data": "0x000000000000000000000000000000000000000000000000019124be4a8f00a6",
          "logIndex": 19,
          "removed": false,
          "topics": [
            "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef",
            "0x0000000000000000000000002aeee741fa1e21120a21e57db9ee545428e683c9",
            "0x0000000000000000000000003fc91a3afd70395cd496c647d5a6cc9d4b2b7fad",
          ],
          "transactionHash": "0x353fdfc38a2f26115daadee9f5b8392ce62b84f410957967e2ed56b35338cdd0",
          "transactionIndex": 2,
        },
        {
          "address": "0x2aeee741fa1e21120a21e57db9ee545428e683c9",
          "blockHash": "0xc350d807505fb835650f0013632c5515592987ba169bbc6626d9fc54d91f0f0b",
          "blockNumber": 19868015n,
          "data": "0x000000000000000000000000000000000000000000000004901b436cc0e2d1b8000000000000000000000000000000000000000000000000bb69f9aa54feb579",
          "logIndex": 20,
          "removed": false,
          "topics": [
            "0x1c411e9a96e071241c2f21f7726b17ae89e3cab4c78be50e062b03a9fffbbad1",
          ],
          "transactionHash": "0x353fdfc38a2f26115daadee9f5b8392ce62b84f410957967e2ed56b35338cdd0",
          "transactionIndex": 2,
        },
        {
          "address": "0x2aeee741fa1e21120a21e57db9ee545428e683c9",
          "blockHash": "0xc350d807505fb835650f0013632c5515592987ba169bbc6626d9fc54d91f0f0b",
          "blockNumber": 19868015n,
          "data": "0x00000000000000000000000000000000000000000000000009b6e64a8ec6000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000019124be4a8f00a6",
          "logIndex": 21,
          "removed": false,
          "topics": [
            "0xd78ad95fa46c994b6551d0da85fc275fe613ce37657fb8d5e3d130840159d822",
            "0x0000000000000000000000003fc91a3afd70395cd496c647d5a6cc9d4b2b7fad",
            "0x0000000000000000000000003fc91a3afd70395cd496c647d5a6cc9d4b2b7fad",
          ],
          "transactionHash": "0x353fdfc38a2f26115daadee9f5b8392ce62b84f410957967e2ed56b35338cdd0",
          "transactionIndex": 2,
        },
        {
          "address": "0xc56c7a0eaa804f854b536a5f3d5f49d2ec4b12b8",
          "blockHash": "0xc350d807505fb835650f0013632c5515592987ba169bbc6626d9fc54d91f0f0b",
          "blockNumber": 19868015n,
          "data": "0x000000000000000000000000000000000000000000000000000100bb5b10ff5c",
          "logIndex": 22,
          "removed": false,
          "topics": [
            "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef",
            "0x0000000000000000000000003fc91a3afd70395cd496c647d5a6cc9d4b2b7fad",
            "0x000000000000000000000000000000fee13a103a10d593b9ae06b3e05f2e7e1c",
          ],
          "transactionHash": "0x353fdfc38a2f26115daadee9f5b8392ce62b84f410957967e2ed56b35338cdd0",
          "transactionIndex": 2,
        },
        {
          "address": "0xc56c7a0eaa804f854b536a5f3d5f49d2ec4b12b8",
          "blockHash": "0xc350d807505fb835650f0013632c5515592987ba169bbc6626d9fc54d91f0f0b",
          "blockNumber": 19868015n,
          "data": "0x00000000000000000000000000000000000000000000000001902402ef7e014a",
          "logIndex": 23,
          "removed": false,
          "topics": [
            "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef",
            "0x0000000000000000000000003fc91a3afd70395cd496c647d5a6cc9d4b2b7fad",
            "0x000000000000000000000000814e5e0e31016b9a7f138c76b7e7b2bb5c1ab6a6",
          ],
          "transactionHash": "0x353fdfc38a2f26115daadee9f5b8392ce62b84f410957967e2ed56b35338cdd0",
          "transactionIndex": 2,
        },
      ],
      "logsBloom": "0x00200000000000000000008080000000000000000040000000000000000000000000000000000000000000000000000022000000080000000000000000000000000000080000000000000008000000200000000000000000000200008020400000000000000000280000000000100000000000000000000000000010000000000000000000020000000000000020000000000001000000080000004000000000000000000000000000000000000000000000400000000000001000000000000000000002000000000000000020000000000000000000001000000000000000000000200000000000000000000000000000001000000000c00000000000000000",
      "status": "success",
      "to": "0x3fc91a3afd70395cd496c647d5a6cc9d4b2b7fad",
      "transactionHash": "0x353fdfc38a2f26115daadee9f5b8392ce62b84f410957967e2ed56b35338cdd0",
      "transactionIndex": 2,
      "type": "eip1559",
    }
  `)
  })
})

describe('toRpc', () => {
  test('default', () => {
    const receipt = TransactionReceipt.toRpc({
      blobGasPrice: 270441n,
      blobGasUsed: 4919n,
      blockHash:
        '0xc350d807505fb835650f0013632c5515592987ba169bbc6626d9fc54d91f0f0b',
      blockNumber: 19868015n,
      contractAddress: null,
      cumulativeGasUsed: 533781n,
      effectiveGasPrice: 9062804489n,
      from: '0x814e5e0e31016b9a7f138c76b7e7b2bb5c1ab6a6',
      gasUsed: 175034n,
      logs: [],
      logsBloom:
        '0x00200000000000000000008080000000000000000040000000000000000000000000000000000000000000000000000022000000080000000000000000000000000000080000000000000008000000200000000000000000000200008020400000000000000000280000000000100000000000000000000000000010000000000000000000020000000000000020000000000001000000080000004000000000000000000000000000000000000000000000400000000000001000000000000000000002000000000000000020000000000000000000001000000000000000000000200000000000000000000000000000001000000000c00000000000000000',
      root: undefined,
      status: 'success',
      to: '0x3fc91a3afd70395cd496c647d5a6cc9d4b2b7fad',
      transactionHash:
        '0x353fdfc38a2f26115daadee9f5b8392ce62b84f410957967e2ed56b35338cdd0',
      transactionIndex: 2,
      type: 'eip1559',
    })
    expect(receipt).toMatchInlineSnapshot(`
      {
        "blobGasPrice": "0x42069",
        "blobGasUsed": "0x1337",
        "blockHash": "0xc350d807505fb835650f0013632c5515592987ba169bbc6626d9fc54d91f0f0b",
        "blockNumber": "0x12f296f",
        "contractAddress": null,
        "cumulativeGasUsed": "0x82515",
        "effectiveGasPrice": "0x21c2f6c09",
        "from": "0x814e5e0e31016b9a7f138c76b7e7b2bb5c1ab6a6",
        "gasUsed": "0x2abba",
        "logs": [],
        "logsBloom": "0x00200000000000000000008080000000000000000040000000000000000000000000000000000000000000000000000022000000080000000000000000000000000000080000000000000008000000200000000000000000000200008020400000000000000000280000000000100000000000000000000000000010000000000000000000020000000000000020000000000001000000080000004000000000000000000000000000000000000000000000400000000000001000000000000000000002000000000000000020000000000000000000001000000000000000000000200000000000000000000000000000001000000000c00000000000000000",
        "root": undefined,
        "status": "0x1",
        "to": "0x3fc91a3afd70395cd496c647d5a6cc9d4b2b7fad",
        "transactionHash": "0x353fdfc38a2f26115daadee9f5b8392ce62b84f410957967e2ed56b35338cdd0",
        "transactionIndex": "0x2",
        "type": "0x2",
      }
    `)
  })

  test('behavior: nullish values', () => {
    const receipt = TransactionReceipt.toRpc({
      blobGasPrice: undefined,
      blobGasUsed: undefined,
      blockHash:
        '0xc350d807505fb835650f0013632c5515592987ba169bbc6626d9fc54d91f0f0b',
      blockNumber: 0n,
      contractAddress: null,
      cumulativeGasUsed: 0n,
      effectiveGasPrice: 0n,
      from: '0x814e5e0e31016b9a7f138c76b7e7b2bb5c1ab6a6',
      gasUsed: 0n,
      logs: [
        {
          address: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
          blockHash:
            '0xc350d807505fb835650f0013632c5515592987ba169bbc6626d9fc54d91f0f0b',
          blockNumber: 19868015n,
          data: '0x00000000000000000000000000000000000000000000000009b6e64a8ec60000',
          logIndex: 17,
          removed: false,
          topics: [
            '0xe1fffcc4923d04b559f4d29a8bfc6cda04eb5b0d3c460751c2402c5c5cc9109c',
            '0x0000000000000000000000003fc91a3afd70395cd496c647d5a6cc9d4b2b7fad',
          ],
          transactionHash:
            '0x353fdfc38a2f26115daadee9f5b8392ce62b84f410957967e2ed56b35338cdd0',
          transactionIndex: 2,
        },
      ],
      logsBloom:
        '0x00200000000000000000008080000000000000000040000000000000000000000000000000000000000000000000000022000000080000000000000000000000000000080000000000000008000000200000000000000000000200008020400000000000000000280000000000100000000000000000000000000010000000000000000000020000000000000020000000000001000000080000004000000000000000000000000000000000000000000000400000000000001000000000000000000002000000000000000020000000000000000000001000000000000000000000200000000000000000000000000000001000000000c00000000000000000',
      root: undefined,
      status: 'success',
      to: '0x3fc91a3afd70395cd496c647d5a6cc9d4b2b7fad',
      transactionHash:
        '0x353fdfc38a2f26115daadee9f5b8392ce62b84f410957967e2ed56b35338cdd0',
      transactionIndex: 0,
      type: '0x69',
    })
    expect(receipt).toMatchInlineSnapshot(`
      {
        "blobGasPrice": undefined,
        "blobGasUsed": undefined,
        "blockHash": "0xc350d807505fb835650f0013632c5515592987ba169bbc6626d9fc54d91f0f0b",
        "blockNumber": "0x0",
        "contractAddress": null,
        "cumulativeGasUsed": "0x0",
        "effectiveGasPrice": "0x0",
        "from": "0x814e5e0e31016b9a7f138c76b7e7b2bb5c1ab6a6",
        "gasUsed": "0x0",
        "logs": [
          {
            "address": "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2",
            "blockHash": "0xc350d807505fb835650f0013632c5515592987ba169bbc6626d9fc54d91f0f0b",
            "blockNumber": "0x12f296f",
            "data": "0x00000000000000000000000000000000000000000000000009b6e64a8ec60000",
            "logIndex": "0x11",
            "removed": false,
            "topics": [
              "0xe1fffcc4923d04b559f4d29a8bfc6cda04eb5b0d3c460751c2402c5c5cc9109c",
              "0x0000000000000000000000003fc91a3afd70395cd496c647d5a6cc9d4b2b7fad",
            ],
            "transactionHash": "0x353fdfc38a2f26115daadee9f5b8392ce62b84f410957967e2ed56b35338cdd0",
            "transactionIndex": "0x2",
          },
        ],
        "logsBloom": "0x00200000000000000000008080000000000000000040000000000000000000000000000000000000000000000000000022000000080000000000000000000000000000080000000000000008000000200000000000000000000200008020400000000000000000280000000000100000000000000000000000000010000000000000000000020000000000000020000000000001000000080000004000000000000000000000000000000000000000000000400000000000001000000000000000000002000000000000000020000000000000000000001000000000000000000000200000000000000000000000000000001000000000c00000000000000000",
        "root": undefined,
        "status": "0x1",
        "to": "0x3fc91a3afd70395cd496c647d5a6cc9d4b2b7fad",
        "transactionHash": "0x353fdfc38a2f26115daadee9f5b8392ce62b84f410957967e2ed56b35338cdd0",
        "transactionIndex": "0x0",
        "type": "0x69",
      }
    `)
  })
})

test('exports', () => {
  expect(Object.keys(TransactionReceipt)).toMatchInlineSnapshot(`
    [
      "fromRpcStatus",
      "toRpcStatus",
      "fromRpcType",
      "toRpcType",
      "fromRpc",
      "toRpc",
    ]
  `)
})