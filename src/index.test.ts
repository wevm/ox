import { expect, test } from 'vitest'
import * as exports from './index.js'

test('exports', () => {
  expect(Object.keys(exports)).toMatchInlineSnapshot(`
    [
      "Abi",
      "Address",
      "Authorization",
      "Blobs",
      "Caches",
      "Constants",
      "ContractAddress",
      "Bytes",
      "Errors",
      "Hash",
      "Hex",
      "Internal",
      "Kzg",
      "Secp256k1",
      "Signature",
      "Rlp",
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
