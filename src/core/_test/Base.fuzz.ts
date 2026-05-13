import { test } from '@fast-check/vitest'
import { Base32, Base58, Base64 } from 'ox'
import { describe, expect } from 'vitest'

import { arbitraryBytes } from '../../../test/fuzz/arbitraries/bytes.js'

const numRuns = Number(process.env.FC_NUM_RUNS) || 100

describe('Base32 round-trip', () => {
  test.prop({ bytes: arbitraryBytes() }, { numRuns })(
    'toBytes(fromBytes(b)) ≡ b',
    ({ bytes }) => {
      expect(Base32.decode(Base32.encode(bytes))).toEqual(bytes)
    },
  )
})

describe('Base58 round-trip', () => {
  test.prop({ bytes: arbitraryBytes() }, { numRuns })(
    'toBytes(fromBytes(b)) ≡ b',
    ({ bytes }) => {
      expect(Base58.decode(Base58.encode(bytes))).toEqual(bytes)
    },
  )
})

describe('Base64 round-trip', () => {
  test.prop({ bytes: arbitraryBytes() }, { numRuns })(
    'toBytes(fromBytes(b)) ≡ b',
    ({ bytes }) => {
      expect(Base64.decode(Base64.encode(bytes))).toEqual(bytes)
    },
  )

  test.prop({ bytes: arbitraryBytes() }, { numRuns })(
    'toBytes(fromBytes(b, { url: true })) ≡ b',
    ({ bytes }) => {
      expect(Base64.decode(Base64.encode(bytes, { url: true }))).toEqual(bytes)
    },
  )
})
