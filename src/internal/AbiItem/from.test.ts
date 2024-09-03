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
