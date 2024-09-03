import { AbiParameters } from 'ox'
import { expect, test } from 'vitest'

test('default', () => {
  {
    const abiItem = AbiParameters.from([
      {
        name: 'spender',
        type: 'address',
      },
      {
        name: 'amount',
        type: 'uint256',
      },
    ])
    expect(abiItem).toMatchInlineSnapshot(`
      [
        {
          "name": "spender",
          "type": "address",
        },
        {
          "name": "amount",
          "type": "uint256",
        },
      ]
    `)
  }

  {
    const abiItem = AbiParameters.from('address spender, uint256 amount')
    expect(abiItem).toMatchInlineSnapshot(`
      [
        {
          "name": "spender",
          "type": "address",
        },
        {
          "name": "amount",
          "type": "uint256",
        },
      ]
    `)
  }

  {
    const abiItem = AbiParameters.from([
      'struct Foo { address owner; address spender; uint256 amount; }',
      'Foo foo, address bar',
    ])
    expect(abiItem).toMatchInlineSnapshot(`
      [
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
        {
          "name": "bar",
          "type": "address",
        },
      ]
    `)
  }
})
