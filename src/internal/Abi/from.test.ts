import { Abi } from 'ox'
import { expect, test } from 'vitest'

test('default', () => {
  {
    const abi = Abi.from([
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
    ])
    expect(abi).toMatchInlineSnapshot(`
      [
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
        },
      ]
    `)
  }

  {
    const abi = Abi.from([
      'function approve(address spender, uint256 amount) returns (bool)',
    ])
    expect(abi).toMatchInlineSnapshot(`
      [
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
        },
      ]
    `)
  }
})
