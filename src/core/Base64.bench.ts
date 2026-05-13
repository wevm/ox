import { bench, describe } from 'vitest'
import * as Base64 from './Base64.js'

const small = new Uint8Array(32).map((_, i) => i)
const medium = new Uint8Array(256).map((_, i) => i & 0xff)
const large = new Uint8Array(4096).map((_, i) => i & 0xff)

const smallEncoded = Base64.encode(small)
const mediumEncoded = Base64.encode(medium)
const largeEncoded = Base64.encode(large)

const smallEncodedNoPad = Base64.encode(small, { pad: false })
const smallEncodedUrl = Base64.encode(small, { url: true })

const helloString = 'hello world'
const loremString = 'lorem ipsum '.repeat(64)

describe('Base64.encode (Bytes input)', () => {
  bench('32 bytes (padded)', () => {
    Base64.encode(small)
  })
  bench('256 bytes (padded)', () => {
    Base64.encode(medium)
  })
  bench('4096 bytes (padded)', () => {
    Base64.encode(large)
  })
  bench('32 bytes (no pad)', () => {
    Base64.encode(small, { pad: false })
  })
  bench('32 bytes (url)', () => {
    Base64.encode(small, { url: true })
  })
})

describe('Base64.decode', () => {
  bench('32 bytes (padded)', () => {
    Base64.decode(smallEncoded)
  })
  bench('256 bytes (padded)', () => {
    Base64.decode(mediumEncoded)
  })
  bench('4096 bytes (padded)', () => {
    Base64.decode(largeEncoded)
  })
  bench('32 bytes (no pad)', () => {
    Base64.decode(smallEncodedNoPad)
  })
  bench('32 bytes (url)', () => {
    Base64.decode(smallEncodedUrl)
  })
})

describe('Base64.encode (String input) / decode (String output)', () => {
  const helloEncoded = Base64.encode(helloString)
  const loremEncoded = Base64.encode(loremString)

  bench('fromString hello', () => {
    Base64.encode(helloString)
  })
  bench('fromString lorem (768 chars)', () => {
    Base64.encode(loremString)
  })
  bench('toString hello', () => {
    Base64.decode(helloEncoded, { as: 'String' })
  })
  bench('toString lorem (768 chars)', () => {
    Base64.decode(loremEncoded, { as: 'String' })
  })
})
