import { expect, test } from 'vitest'
import * as exports from './index.js'

test('exports', () => {
  expect(Object.keys(exports)).toMatchInlineSnapshot(`
    [
      "Abi",
      "Address",
      "Authorization",
      "Blobs",
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
      "TransactionEnvelope",
      "TransactionEnvelopeLegacy",
      "TransactionEnvelopeEip1559",
      "TransactionEnvelopeEip2930",
      "TransactionEnvelopeEip4844",
      "TransactionEnvelopeEip7702",
      "TypedData",
      "Types",
      "Value",
    ]
  `)
})
