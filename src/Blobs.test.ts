import { expect, test } from 'vitest'
import * as exports from './Blobs.js'

test('exports', () => {
  expect(Object.keys(exports)).toMatchInlineSnapshot(`
    [
      "blobsToCommitments",
      "toCommitments",
      "blobsToProofs",
      "toProofs",
      "blobsToVersionedHashes",
      "toVersionedHashes",
      "commitmentToVersionedHash",
      "commitmentsToVersionedHashes",
      "fromBlobs",
      "to",
      "blobsToBytes",
      "toBytes",
      "blobsToHex",
      "toHex",
      "sidecarsToVersionedHashes",
      "toBlobs",
      "from",
      "toBlobSidecars",
      "toSidecars",
    ]
  `)
})
