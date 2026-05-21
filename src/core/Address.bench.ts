import { bench, describe } from 'vp/test'

import * as Address from './Address.js'
import * as Caches from './Caches.js'

const lower = '0xa0cf798816d4b9b9866b5330eea46a18382f251e'
const checksummed = '0xA0Cf798816D4b9b9866b5330EEa46a18382f251e'
const mixedNoChecksum = '0xA0Cf798816D4b9b9866b5330Eea46a18382f251e'
const tooShort = '0xa'
const garbage = 'hello world'
const wrongLength = '0xa5cc3c03994db5b0d9a5eEdD10Cabab0813678aff'
const badHex = '0xa5cc3c03994db5b0d9a5eEdD10Cabab0813678az'

describe('Address.assert (valid)', () => {
  bench('checksummed input (strict)', () => {
    Address.assert(checksummed)
  })

  bench('lowercase input (strict)', () => {
    Address.assert(lower)
  })

  bench('lowercase input (strict: false)', () => {
    Address.assert(lower, { strict: false })
  })
})

describe('Address.validate (valid)', () => {
  bench('checksummed input (strict)', () => {
    Address.validate(checksummed)
  })

  bench('lowercase input (strict)', () => {
    Address.validate(lower)
  })

  bench('lowercase input (strict: false)', () => {
    Address.validate(lower, { strict: false })
  })
})

describe('Address.validate (invalid)', () => {
  bench('too short', () => {
    Address.validate(tooShort)
  })

  bench('garbage string', () => {
    Address.validate(garbage)
  })

  bench('wrong length', () => {
    Address.validate(wrongLength)
  })

  bench('bad hex char', () => {
    Address.validate(badHex)
  })

  bench('mixed-case bad checksum', () => {
    Address.validate(mixedNoChecksum)
  })
})

describe('Address.checksum', () => {
  // Hot cache: same address requested repeatedly.
  bench('cache hit (lowercase key)', () => {
    Address.checksum(lower)
  })

  bench('cache hit (mixed-case input)', () => {
    Address.checksum(mixedNoChecksum)
  })

  bench('cache miss (cleared each iter)', () => {
    Caches.clear()
    Address.checksum(lower)
  })
})

describe('Address.isEqual', () => {
  bench('equal lowercase / checksummed', () => {
    Address.isEqual(lower, checksummed)
  })

  bench('equal lowercase / lowercase', () => {
    Address.isEqual(lower, lower)
  })

  bench('different addresses', () => {
    Address.isEqual(lower, '0xA0Cf798816D4b9b9866b5330EEa46a18382f251f')
  })
})
