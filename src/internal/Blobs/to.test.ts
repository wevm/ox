import { Blobs, Bytes, Hex } from 'ox'
import { expect, test } from 'vitest'
import { blobData } from '../../../test/kzg.js'

test('default', () => {
  const data = Hex.fromString('we are all gonna make it'.repeat(5))
  const blobs = Blobs.from(data)
  expect(Blobs.to(blobs)).toEqual(data)
  expect(Blobs.toHex(blobs)).toEqual(data)
  expect(Blobs.toBytes(blobs)).toEqual(Bytes.fromHex(data))
})

test('large', () => {
  const blobs = Blobs.from(Hex.fromString(blobData))
  expect(Blobs.to(blobs, 'Hex')).toEqual(Hex.fromString(blobData))
})

test('https://github.com/wevm/viem/issues/1986', () => {
  const data = new Uint8Array([1, 2, 128, 3, 4, 5, 6, 7, 8, 9, 10])
  const blobs = Blobs.from(data)
  expect(Blobs.to(blobs, 'Bytes')).toEqual(data)
})
