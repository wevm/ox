import { Caches } from 'ox'
import { expect, test } from 'vitest'

test('default', () => {
  Caches.checksum.set('foo', '0x0000000000000000000000000000000000000000')
  Caches.checksum.set('bar', '0x0000000000000000000000000000000000000001')

  expect(Caches.checksum.size).toBe(2)
  Caches.clear()
  expect(Caches.checksum.size).toBe(0)
})
