import { bench, describe } from 'vitest'
import * as Base64 from './Base64.js'

const small = new Uint8Array(32).map((_, i) => i)
const medium = new Uint8Array(256).map((_, i) => i & 0xff)
const large = new Uint8Array(4096).map((_, i) => i & 0xff)

const smallEncoded = Base64.fromBytes(small)
const mediumEncoded = Base64.fromBytes(medium)
const largeEncoded = Base64.fromBytes(large)

const smallEncodedNoPad = Base64.fromBytes(small, { pad: false })
const smallEncodedUrl = Base64.fromBytes(small, { url: true })

const helloString = 'hello world'
const loremString = 'lorem ipsum '.repeat(64)

describe('Base64.fromBytes', () => {
  bench('32 bytes (padded)', () => {
    Base64.fromBytes(small)
  })
  bench('256 bytes (padded)', () => {
    Base64.fromBytes(medium)
  })
  bench('4096 bytes (padded)', () => {
    Base64.fromBytes(large)
  })
  bench('32 bytes (no pad)', () => {
    Base64.fromBytes(small, { pad: false })
  })
  bench('32 bytes (url)', () => {
    Base64.fromBytes(small, { url: true })
  })
})

describe('Base64.toBytes', () => {
  bench('32 bytes (padded)', () => {
    Base64.toBytes(smallEncoded)
  })
  bench('256 bytes (padded)', () => {
    Base64.toBytes(mediumEncoded)
  })
  bench('4096 bytes (padded)', () => {
    Base64.toBytes(largeEncoded)
  })
  bench('32 bytes (no pad)', () => {
    Base64.toBytes(smallEncodedNoPad)
  })
  bench('32 bytes (url)', () => {
    Base64.toBytes(smallEncodedUrl)
  })
})

describe('Base64.fromString / toString', () => {
  const helloEncoded = Base64.fromString(helloString)
  const loremEncoded = Base64.fromString(loremString)

  bench('fromString hello', () => {
    Base64.fromString(helloString)
  })
  bench('fromString lorem (768 chars)', () => {
    Base64.fromString(loremString)
  })
  bench('toString hello', () => {
    Base64.toString(helloEncoded)
  })
  bench('toString lorem (768 chars)', () => {
    Base64.toString(loremEncoded)
  })
})
