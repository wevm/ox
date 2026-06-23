import { expect, test } from 'vp/test'

import { seaportAbi } from '../../../../test/abis/json.js'
import { formatAbi } from './formatAbi.js'

const customSolidityErrorsAbi = [
  { inputs: [], stateMutability: 'nonpayable', type: 'constructor' },
  { inputs: [], name: 'ApprovalCallerNotOwnerNorApproved', type: 'error' },
  { inputs: [], name: 'ApprovalQueryForNonexistentToken', type: 'error' },
] as const

test('formatAbi', () => {
  const result = formatAbi(seaportAbi)
  expect(result).toMatchSnapshot()

  expect(formatAbi(customSolidityErrorsAbi)).toMatchInlineSnapshot(`
    [
      "constructor()",
      "error ApprovalCallerNotOwnerNorApproved()",
      "error ApprovalQueryForNonexistentToken()",
    ]
  `)
})
