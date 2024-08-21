import { Blobs, Bytes, Hex } from 'ox'
import { expect, test } from 'vitest'
import { blobData } from '../../../test/kzg.js'

test('default', () => {
  const data_hex = Hex.from(blobData)
  const blobs_hex = Blobs.from({ data: data_hex })
  expect(Blobs.to({ blobs: blobs_hex })).toEqual(data_hex)

  const data_bytes = Bytes.from(blobData)
  const blobs_bytes = Blobs.from({ data: data_hex, to: 'bytes' })
  expect(Blobs.to({ blobs: blobs_bytes })).toEqual(data_bytes)

  const blobs_bytes_2 = Blobs.from({ data: data_bytes })
  expect(Blobs.to({ blobs: blobs_bytes_2 })).toEqual(data_bytes)

  const blobs_hex_2 = Blobs.from({ data: data_bytes, to: 'hex' })
  expect(Blobs.to({ blobs: blobs_hex_2 })).toEqual(data_hex)
})

test('error: empty blob data', () => {
  expect(() =>
    Blobs.from({ data: Hex.from('') }),
  ).toThrowErrorMatchingInlineSnapshot(
    '[EmptyBlobError: Blob data must not be empty.]',
  )
})

test('error: blob data too big', () => {
  expect(() =>
    Blobs.from({ data: Hex.from('we are all gonna make it'.repeat(100000)) }),
  ).toThrowErrorMatchingInlineSnapshot(`
    [BlobSizeTooLargeError: Blob size is too large.

    Max: 761855 bytes
    Given: 2400000 bytes]
  `)
})
