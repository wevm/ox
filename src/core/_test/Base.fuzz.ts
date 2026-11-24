import { fc, test } from '@fast-check/vitest'
import { Base32, Base58, Base64 } from 'ox'
import { describe, expect } from 'vp/test'

import { arbitraryBytes } from '../../../test/fuzz/arbitraries/bytes.js'
import { numRuns } from '../../../test/fuzz/numRuns.js'

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

describe('Base64 strings', () => {
  test.prop(
    {
      value: fc.oneof(
        fc.string({ maxLength: 80, unit: 'grapheme' }),
        fc.string({ maxLength: 80, unit: 'binary' }),
      ),
    },
    { numRuns },
  )('fromString encodes UTF-8, and toString decodes it back', ({ value }) => {
    const encoded = Base64.fromString(value)
    expect(encoded).toBe(Base64.fromBytes(new TextEncoder().encode(value)))
    // A lone surrogate encodes as U+FFFD.
    expect(Base64.toString(encoded)).toBe(
      new TextDecoder().decode(new TextEncoder().encode(value)),
    )
  })
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
