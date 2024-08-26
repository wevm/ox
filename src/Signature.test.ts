import { expect, test } from 'vitest'
import * as exports from './Signature.js'

test('exports', () => {
  expect(Object.keys(exports)).toMatchInlineSnapshot(`
    [
      "InvalidSerializedSignatureSizeError",
      "InvalidSignatureRError",
      "InvalidSignatureSError",
      "InvalidSignatureVError",
      "InvalidSignatureYParityError",
      "MissingSignaturePropertiesError",
      "assert",
      "fromCompact",
      "deserialize",
      "extract",
      "fromTuple",
      "serialize",
      "toCompact",
      "from",
      "toTuple",
    ]
  `)
})
