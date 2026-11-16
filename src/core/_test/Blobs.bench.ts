import { Blobs, Bytes } from 'ox'
import { bench, describe } from 'vitest'

const small = Bytes.random(1_000)
const full = Uint8Array.from(
  { length: Blobs.maxBytesPerTransaction },
  (_, i) => (i * 31) & 0x7f,
)
// Every byte is `0x80`, the terminator byte, so a decoder that rescans the
// rest of the blob for another terminator on each one goes quadratic.
const terminators = new Uint8Array(100_000).fill(0x80)

const smallBlobs = Blobs.from(small)
const fullBlobs = Blobs.from(full)
const terminatorBlobs = Blobs.from(terminators)

describe('Blobs.from', () => {
  bench('ox: 1 KB', () => {
    Blobs.from(small)
  })

  bench('ox: 6 blobs (max data)', () => {
    Blobs.from(full)
  })
})

describe('Blobs.to', () => {
  bench('ox: 1 KB', () => {
    Blobs.to(smallBlobs)
  })

  bench('ox: 6 blobs (max data)', () => {
    Blobs.to(fullBlobs)
  })

  bench('ox: 100 KB of 0x80 bytes', () => {
    Blobs.to(terminatorBlobs)
  })
})
