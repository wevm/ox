import { Blobs, Bytes, Hex } from 'ox'
import { expect, test } from 'vitest'
import { blobData } from '../../../test/kzg.js'

test('default', () => {
  const data_hex = Hex.from(blobData)
  const data_bytes = Bytes.from(blobData)

  {
    const blobs = Blobs.from(data_hex)
    expect(Blobs.to(blobs)).toEqual(data_hex)
  }

  {
    const blobs = Blobs.from(data_bytes)
    expect(Blobs.to(blobs)).toEqual(data_bytes)
  }
})

test('error: empty blob data', () => {
  expect(() => Blobs.from(Hex.from(''))).toThrowErrorMatchingInlineSnapshot(
    '[EmptyBlobError: Blob data must not be empty.]',
  )
})

test('error: blob data too big', () => {
  expect(() =>
    Blobs.from(Hex.from('we are all gonna make it'.repeat(100000))),
  ).toThrowErrorMatchingInlineSnapshot(`
    [BlobSizeTooLargeError: Blob size is too large.

    Max: 761855 bytes
    Given: 2400000 bytes]
  `)
})
