import { expect, test } from 'vitest'
import * as exports from './index.js'

test('exports', () => {
  expect(Object.keys(exports)).toMatchInlineSnapshot(`
    [
      "Abi",
      "Address",
      "Blobs",
      "Caches",
      "Constants",
      "ContractAddress",
      "Bytes",
      "Data",
      "Errors",
      "Hash",
      "Hex",
      "Kzg",
      "Secp256k1",
      "Signature",
      "Rlp",
      "Siwe",
      "TransactionEnvelope",
      "TypedData",
      "Types",
      "Value",
    ]
  `)
})
