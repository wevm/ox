import { AbiItem, Caches } from 'ox'
import { expect, test } from 'vitest'
import { caches } from '../internal/caches.js'

test('exports', () => {
  expect(Object.keys(Caches)).toMatchInlineSnapshot(`
    [
      "checksum",
      "clear",
    ]
  `)
})

test('default', () => {
  Caches.checksum.set('foo', '0x0000000000000000000000000000000000000000')
  Caches.checksum.set('bar', '0x0000000000000000000000000000000000000001')

  expect(Caches.checksum.size).toBe(2)
  Caches.clear()
  expect(Caches.checksum.size).toBe(0)
})

test('behavior: clears signature hashes', () => {
  Caches.clear()
  AbiItem.getSignatureHash('function ownerOf(uint256)')
  expect(caches.signatureHash.size).toBe(1)
  Caches.clear()
  expect(caches.signatureHash.size).toBe(0)
})
