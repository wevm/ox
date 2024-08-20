import { expect, test } from 'vitest'
import * as exports from './Signature.js'

test('exports', () => {
  expect(Object.keys(exports)).toMatchInlineSnapshot(`
    [
      "compactSignatureToSignature",
      "fromCompact",
      "deserializeSignature",
      "deserialize",
      "serializeSignature",
      "serialize",
      "signatureToCompactSignature",
      "toCompact",
      "toSignature",
      "from",
    ]
  `)
})
