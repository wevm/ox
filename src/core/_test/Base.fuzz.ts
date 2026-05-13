import { test } from '@fast-check/vitest'
import { Base32, Base58, Base64 } from 'ox'
import { describe, expect } from 'vitest'

import { arbitraryBytes } from '../../../test/fuzz/arbitraries/bytes.js'

const numRuns = Number(process.env.FC_NUM_RUNS) || 100

describe('Base32 round-trip', () => {
  test.prop({ bytes: arbitraryBytes() }, { numRuns })(
    'toBytes(fromBytes(b)) ≡ b',
    ({ bytes }) => {
      expect(Base32.toBytes(Base32.fromBytes(bytes))).toEqual(bytes)
    },
  )
})

describe('Base58 round-trip', () => {
  test.prop({ bytes: arbitraryBytes() }, { numRuns })(
    'toBytes(fromBytes(b)) ≡ b',
    ({ bytes }) => {
      expect(Base58.toBytes(Base58.fromBytes(bytes))).toEqual(bytes)
    },
  )
})

describe('Base64 round-trip', () => {
  test.prop({ bytes: arbitraryBytes() }, { numRuns })(
    'toBytes(fromBytes(b)) ≡ b',
    ({ bytes }) => {
      expect(Base64.toBytes(Base64.fromBytes(bytes))).toEqual(bytes)
    },
  )

  test.prop({ bytes: arbitraryBytes() }, { numRuns })(
    'toBytes(fromBytes(b, { url: true })) ≡ b',
    ({ bytes }) => {
      expect(Base64.toBytes(Base64.fromBytes(bytes, { url: true }))).toEqual(
        bytes,
      )
    },
  )
})
