import { expect, test } from 'vitest'
import { AbiConstructor } from 'ox'

test('default', () => {
  const constructor_ = AbiConstructor.from({
    inputs: [{ name: 'owner', type: 'address' }],
    payable: false,
    stateMutability: 'nonpayable',
    type: 'constructor',
  })

  expect(constructor_).toMatchInlineSnapshot(`
    {
      "hash": "0xf8a6c595894ab588edd59e406425331fe9ad3266445da35ab4aa27007b7a602a",
      "inputs": [
        {
          "name": "owner",
          "type": "address",
        },
      ],
      "payable": false,
      "stateMutability": "nonpayable",
      "type": "constructor",
    }
  `)
})

test('behavior: human readable', () => {
  const constructor_ = AbiConstructor.from('constructor(address owner)')

  expect(constructor_).toMatchInlineSnapshot(`
    {
      "hash": "0xf8a6c595894ab588edd59e406425331fe9ad3266445da35ab4aa27007b7a602a",
      "inputs": [
        {
          "name": "owner",
          "type": "address",
        },
      ],
      "stateMutability": "nonpayable",
      "type": "constructor",
    }
  `)
})

test('behavior: human readable (struct)', () => {
  const constructor_ = AbiConstructor.from([
    'struct Foo { address owner }',
    'constructor(Foo foo)',
  ])

  expect(constructor_).toMatchInlineSnapshot(`
    {
      "hash": "0x046f6226ce02998a10b2101bbeb1a3bd095efb55989b57f3781e659a4a2a8011",
      "inputs": [
        {
          "components": [
            {
              "name": "owner",
              "type": "address",
            },
          ],
          "name": "foo",
          "type": "tuple",
        },
      ],
      "stateMutability": "nonpayable",
      "type": "constructor",
    }
  `)
})
