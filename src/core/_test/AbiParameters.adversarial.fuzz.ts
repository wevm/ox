import { fc, test } from '@fast-check/vitest'
import { AbiParameters, Bytes, Hex } from 'ox'
import { describe, expect } from 'vp/test'

import { arbitraryAbiCase } from '../../../test/fuzz/arbitraries/abi.js'

const numRuns = Number(process.env.FC_NUM_RUNS) || 100

/**
 * Whitelist of error names ox is allowed to throw on adversarial-but-
 * structurally-plausible ABI input. Anything outside this set is a
 * regression -- the decoder should not surface raw `TypeError`s,
 * `RangeError`s, or unrelated internal errors.
 */
const allowedErrorNames = new Set<string>([
  'AbiParameters.DataSizeTooSmallError',
  'AbiParameters.InvalidTypeError',
  'AbiParameters.InvalidArrayError',
  'AbiParameters.ArrayLengthMismatchError',
  'AbiParameters.BytesSizeMismatchError',
  'AbiParameters.LengthMismatchError',
  'AbiParameters.ZeroDataError',
  'BaseError',
  'Cursor.PositionOutOfBoundsError',
  'Cursor.NegativeOffsetError',
  'Cursor.RecursiveReadLimitExceededError',
  'Hex.InvalidHexValueError',
  'Hex.InvalidLengthError',
  'Hex.IntegerOutOfRangeError',
  'Hex.SizeOverflowError',
  'Bytes.SizeOverflowError',
  'Bytes.SizeExceedsPaddingSizeError',
  'Bytes.InvalidBytesBooleanError',
  'Bytes.InvalidBytesTypeError',
  'Address.InvalidAddressError',
  'Address.InvalidChecksumError',
  'Address.InvalidInputError',
])

describe('AbiParameters adversarial decode', () => {
  test.prop(
    {
      input: arbitraryAbiCase(),
      mutation: fc.record({
        // Pick a 32-byte slot to mutate.
        slotIndex: fc.nat(),
        // Replace strategy.
        strategy: fc.constantFrom(
          'zero',
          'all-ones',
          'small',
          'near-end',
          'past-end',
          'random',
        ),
        random: fc.uint8Array({ minLength: 32, maxLength: 32 }),
      }),
    },
    { numRuns },
  )(
    'mutated decode either succeeds or throws a whitelisted error',
    ({ input, mutation }) => {
      const encoded = AbiParameters.encode(
        input.parameters,
        input.values as never,
      )
      const bytes = Bytes.fromHex(encoded)

      // Skip if the encoding is too small to hold a 32-byte slot.
      if (bytes.length < 32) return

      const slotCount = Math.floor(bytes.length / 32)
      const slot = mutation.slotIndex % slotCount
      const offset = slot * 32

      const replacement = pickReplacement(
        mutation.strategy,
        bytes.length,
        mutation.random,
      )
      const mutated = new Uint8Array(bytes)
      mutated.set(replacement, offset)

      let threw: unknown
      let returned: unknown
      try {
        returned = AbiParameters.decode(
          input.parameters,
          Hex.fromBytes(mutated),
        )
      } catch (error) {
        threw = error
      }

      if (!threw) {
        // Successful decode is allowed -- the mutation may have produced
        // another valid encoding for the same schema.
        expect(returned).toBeDefined()
        return
      }

      const err = threw as Error
      expect(allowedErrorNames.has(err.name)).toBe(true)
    },
  )
})

function pickReplacement(
  strategy: string,
  totalLength: number,
  random: Uint8Array,
): Uint8Array {
  if (strategy === 'zero') return new Uint8Array(32)
  if (strategy === 'all-ones') {
    const out = new Uint8Array(32)
    out.fill(0xff)
    return out
  }
  if (strategy === 'small') {
    // Encode `1` as a 32-byte big-endian word.
    const out = new Uint8Array(32)
    out[31] = 1
    return out
  }
  if (strategy === 'near-end') {
    return encodeWord(Math.max(0, totalLength - 32))
  }
  if (strategy === 'past-end') {
    return encodeWord(totalLength + 32)
  }
  return random
}

function encodeWord(value: number): Uint8Array {
  const out = new Uint8Array(32)
  let v = value
  for (let i = 31; i >= 0 && v > 0; i--) {
    out[i] = v & 0xff
    v = Math.floor(v / 256)
  }
  return out
}
