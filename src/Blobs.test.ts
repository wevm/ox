import { expect, test } from 'vitest'
import * as exports from './Blobs.js'

test('exports', () => {
  expect(Object.keys(exports)).toMatchInlineSnapshot(`
    [
      "BlobSizeTooLargeError",
      "EmptyBlobError",
      "EmptyBlobVersionedHashesError",
      "InvalidVersionedHashSizeError",
      "InvalidVersionedHashVersionError",
      "toCommitments",
      "toProofs",
      "toVersionedHashes",
      "commitmentToVersionedHash",
      "commitmentsToVersionedHashes",
      "to",
      "toBytes",
      "toHex",
      "sidecarsToVersionedHashes",
      "from",
      "toSidecars",
    ]
  `)
})
