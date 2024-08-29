import { expect, test } from 'vitest'
import * as exports from './index.js'

test('exports', () => {
  expect(Object.keys(exports)).toMatchInlineSnapshot(`
    [
      "Abi",
      "AccountProof",
      "Address",
      "Authorization",
      "Blobs",
      "Block",
      "Bytes",
      "Caches",
      "Constants",
      "ContractAddress",
      "Errors",
      "Filter",
      "Hash",
      "Hex",
      "Internal",
      "Kzg",
      "Log",
      "Rlp",
      "Secp256k1",
      "Signature",
      "Siwe",
      "Transaction",
      "TransactionLegacy",
      "TransactionEip1559",
      "TransactionEip2930",
      "TransactionEip4844",
      "TransactionEip7702",
      "TransactionEnvelope",
      "TransactionEnvelopeLegacy",
      "TransactionEnvelopeEip1559",
      "TransactionEnvelopeEip2930",
      "TransactionEnvelopeEip4844",
      "TransactionEnvelopeEip7702",
      "TransactionReceipt",
      "TypedData",
      "Types",
      "Value",
      "Withdrawal",
    ]
  `)
})
