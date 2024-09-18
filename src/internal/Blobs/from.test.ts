import { Blobs, Bytes, Hex } from 'ox'
import { expect, test } from 'vitest'
import { blobData } from '../../../test/kzg.js'

test('default', () => {
  {
    const data = Hex.fromString(blobData)
    const blobs = Blobs.from(data)
    expect(Blobs.toHex(blobs)).toEqual(data)
  }

  {
    const data = Bytes.fromString(blobData)
    const blobs = Blobs.from(data)
    expect(Blobs.toBytes(blobs)).toEqual(data)
  }
})

test('error: empty blob data', () => {
  expect(() =>
    Blobs.from(Hex.fromString('')),
  ).toThrowErrorMatchingInlineSnapshot(
    '[Blobs.EmptyBlobError: Blob data must not be empty.]',
  )
})

test('error: blob data too big', () => {
  expect(() =>
    Blobs.from(Hex.fromString('we are all gonna make it'.repeat(100000))),
  ).toThrowErrorMatchingInlineSnapshot(`
    [Blobs.BlobSizeTooLargeError: Blob size is too large.

    Max: 761855 bytes
    Given: 2400000 bytes]
  `)
})
