import { expect, test } from 'vp/test'

import { seaportHumanReadableAbi } from '../../../../test/abis/human-readable.js'
import { parseAbi } from './parseAbi.js'

const customSolidityErrorsHumanReadableAbi = [
  'constructor()',
  'error ApprovalCallerNotOwnerNorApproved()',
  'error ApprovalQueryForNonexistentToken()',
] as const

test('parseAbi', () => {
  const result = parseAbi(seaportHumanReadableAbi)
  expect(result).toMatchSnapshot()

  expect(parseAbi(customSolidityErrorsHumanReadableAbi)).toMatchInlineSnapshot(`
    [
      {
        "inputs": [],
        "stateMutability": "nonpayable",
        "type": "constructor",
      },
      {
        "inputs": [],
        "name": "ApprovalCallerNotOwnerNorApproved",
        "type": "error",
      },
      {
        "inputs": [],
        "name": "ApprovalQueryForNonexistentToken",
        "type": "error",
      },
    ]
  `)
})

test('busts cache', () => {
  const result1 = parseAbi([
    'function balanceOf(Baz baz)',
    'struct Baz {uint amount; string role;}',
  ])
  expect(result1[0].inputs).toMatchInlineSnapshot(`
    [
      {
        "components": [
          {
            "name": "amount",
            "type": "uint256",
          },
          {
            "name": "role",
            "type": "string",
          },
        ],
        "name": "baz",
        "type": "tuple",
      },
    ]
  `)
  const result2 = parseAbi([
    'function balanceOf(Baz baz)',
    'struct Baz {uint price; string role;}',
  ])
  expect(result2[0].inputs).toMatchInlineSnapshot(`
    [
      {
        "components": [
          {
            "name": "price",
            "type": "uint256",
          },
          {
            "name": "role",
            "type": "string",
          },
        ],
        "name": "baz",
        "type": "tuple",
      },
    ]
  `)
})
