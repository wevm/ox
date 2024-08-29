import { expect, test } from 'vitest'
import * as exports from './index.js'

test('exports', () => {
  expect(Object.keys(exports)).toMatchInlineSnapshot(`
    [
      "Abi",
      "Address",
      "Authorization",
      "Blobs",
      "Block",
      "Bytes",
      "Caches",
      "Constants",
      "ContractAddress",
      "Errors",
      "Hash",
      "Hex",
      "Internal",
      "Kzg",
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
      "TypedData",
      "Types",
      "Value",
      "Withdrawal",
    ]
  `)
})
