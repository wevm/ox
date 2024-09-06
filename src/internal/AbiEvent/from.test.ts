import { AbiEvent } from 'ox'
import { expect, test } from 'vitest'

test('default', () => {
  {
    const abiItem = AbiEvent.from({
      type: 'event',
      name: 'Transfer',
      inputs: [
        { name: 'from', type: 'address', indexed: true },
        { name: 'to', type: 'address', indexed: true },
        { name: 'value', type: 'uint256' },
      ],
    })
    expect(abiItem).toMatchInlineSnapshot(`
      {
        "hash": "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef",
        "inputs": [
          {
            "indexed": true,
            "name": "from",
            "type": "address",
          },
          {
            "indexed": true,
            "name": "to",
            "type": "address",
          },
          {
            "name": "value",
            "type": "uint256",
          },
        ],
        "name": "Transfer",
        "type": "event",
      }
    `)
  }

  {
    const abiItem = AbiEvent.from(
      'event Transfer(address indexed from, address indexed to, uint256 value)',
    )
    expect(abiItem).toMatchInlineSnapshot(`
      {
        "hash": "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef",
        "inputs": [
          {
            "indexed": true,
            "name": "from",
            "type": "address",
          },
          {
            "indexed": true,
            "name": "to",
            "type": "address",
          },
          {
            "name": "value",
            "type": "uint256",
          },
        ],
        "name": "Transfer",
        "type": "event",
      }
    `)
  }
})

test('options: prepare', () => {
  const abiItem = AbiEvent.from(
    {
      type: 'event',
      name: 'Transfer',
      inputs: [
        { name: 'from', type: 'address', indexed: true },
        { name: 'to', type: 'address', indexed: true },
        { name: 'value', type: 'uint256' },
      ],
    },
    { prepare: false },
  )
  expect(abiItem).toMatchInlineSnapshot(`
    {
      "inputs": [
        {
          "indexed": true,
          "name": "from",
          "type": "address",
        },
        {
          "indexed": true,
          "name": "to",
          "type": "address",
        },
        {
          "name": "value",
          "type": "uint256",
        },
      ],
      "name": "Transfer",
      "type": "event",
    }
  `)
})
