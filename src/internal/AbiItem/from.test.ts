import { AbiItem } from 'ox'
import { expect, test } from 'vitest'

test('default', () => {
  {
    const abiItem = AbiItem.from({
      type: 'function',
      name: 'approve',
      stateMutability: 'nonpayable',
      inputs: [
        {
          name: 'spender',
          type: 'address',
        },
        {
          name: 'amount',
          type: 'uint256',
        },
      ],
      outputs: [{ type: 'bool' }],
    })
    expect(abiItem).toMatchInlineSnapshot(`
      {
        "hash": "0x095ea7b334ae44009aa867bfb386f5c3b4b443ac6f0ee573fa91c4608fbadfba",
        "inputs": [
          {
            "name": "spender",
            "type": "address",
          },
          {
            "name": "amount",
            "type": "uint256",
          },
        ],
        "name": "approve",
        "outputs": [
          {
            "type": "bool",
          },
        ],
        "stateMutability": "nonpayable",
        "type": "function",
      }
    `)
  }

  {
    const abiItem = AbiItem.from(
      'function approve(address spender, uint256 amount) returns (bool)',
    )
    expect(abiItem).toMatchInlineSnapshot(`
      {
        "hash": "0x095ea7b334ae44009aa867bfb386f5c3b4b443ac6f0ee573fa91c4608fbadfba",
        "inputs": [
          {
            "name": "spender",
            "type": "address",
          },
          {
            "name": "amount",
            "type": "uint256",
          },
        ],
        "name": "approve",
        "outputs": [
          {
            "type": "bool",
          },
        ],
        "stateMutability": "nonpayable",
        "type": "function",
      }
    `)
  }

  {
    const abiItem = AbiItem.from([
      'struct Foo { address owner; address spender; uint256 amount; }',
      'function approve(Foo foo) returns (bool)',
    ])
    expect(abiItem).toMatchInlineSnapshot(`
      {
        "hash": "0xe0ac316e47844d88260c3fd7bfe62c3348cee1a015524358c41abe32d0d91266",
        "inputs": [
          {
            "components": [
              {
                "name": "owner",
                "type": "address",
              },
              {
                "name": "spender",
                "type": "address",
              },
              {
                "name": "amount",
                "type": "uint256",
              },
            ],
            "name": "foo",
            "type": "tuple",
          },
        ],
        "name": "approve",
        "outputs": [
          {
            "type": "bool",
          },
        ],
        "stateMutability": "nonpayable",
        "type": "function",
      }
    `)
  }
})

test('options: prepare', () => {
  const abiItem = AbiItem.from(
    {
      type: 'function',
      name: 'approve',
      stateMutability: 'nonpayable',
      inputs: [
        {
          name: 'spender',
          type: 'address',
        },
        {
          name: 'amount',
          type: 'uint256',
        },
      ],
      outputs: [{ type: 'bool' }],
    },
    { prepare: false },
  )
  expect(abiItem).toMatchInlineSnapshot(`
    {
      "inputs": [
        {
          "name": "spender",
          "type": "address",
        },
        {
          "name": "amount",
          "type": "uint256",
        },
      ],
      "name": "approve",
      "outputs": [
        {
          "type": "bool",
        },
      ],
      "stateMutability": "nonpayable",
      "type": "function",
    }
  `)
})
