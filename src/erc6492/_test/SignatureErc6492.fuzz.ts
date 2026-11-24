import { fc, test } from '@fast-check/vitest'
import type { Hex } from 'ox'
import { SignatureErc6492 } from 'ox/erc6492'
import * as viem from 'viem'
import { describe, expect } from 'vitest'
import {
  arbitraryAddressHex,
  arbitraryHex,
} from '../../../test/fuzz/arbitraries/bytes.js'
import { numRuns } from '../../../test/fuzz/numRuns.js'

const unwrapped = fc.record({
  data: arbitraryHex(60),
  signature: arbitraryHex(70),
  to: arbitraryAddressHex(),
})

describe('SignatureErc6492 against viem', () => {
  test.prop({ value: unwrapped }, { numRuns })(
    'wrap writes what viem writes; unwrap, from and validate read it back',
    ({ value }) => {
      const wrapped = SignatureErc6492.wrap(value)
      expect(wrapped).toBe(
        viem.serializeErc6492Signature({
          address: value.to,
          data: value.data,
          signature: value.signature,
        }),
      )
      expect(canonical(SignatureErc6492.unwrap(wrapped))).toEqual(
        canonical(value),
      )
      expect(canonical(SignatureErc6492.from(wrapped))).toEqual(
        canonical(value),
      )
      expect(canonical(SignatureErc6492.from(value))).toEqual(canonical(value))
      expect(() => SignatureErc6492.assert(wrapped)).not.toThrow()
      expect(SignatureErc6492.validate(wrapped)).toBe(true)
      expect(viem.isErc6492Signature(wrapped)).toBe(true)
    },
  )

  test.prop(
    {
      value: unwrapped,
      cut: fc.integer({ min: 1, max: 40 }),
      // A byte of the 32-byte magic suffix, counted from the end.
      at: fc.integer({ min: 1, max: 32 }),
      byte: fc.integer({ min: 0, max: 255 }),
    },
    { numRuns },
  )(
    'validate agrees with viem on signatures with a damaged magic suffix, and on plain ones',
    ({ value, cut, at, byte }) => {
      const wrapped = SignatureErc6492.wrap(value)
      const truncated = wrapped.slice(0, -cut * 2) as Hex.Hex
      const offset = wrapped.length - 2 * at
      const changed =
        `${wrapped.slice(0, offset)}${byte.toString(16).padStart(2, '0')}${wrapped.slice(offset + 2)}` as Hex.Hex
      for (const signature of [value.signature, truncated, changed]) {
        const valid = SignatureErc6492.validate(signature)
        expect(valid).toBe(viem.isErc6492Signature(signature))
        // `validate` is true exactly when `assert` does not throw.
        let asserts = true
        try {
          SignatureErc6492.assert(signature)
        } catch {
          asserts = false
        }
        expect(valid).toBe(asserts)
      }
    },
  )
})

/** Lowercases hex strings. */
function canonical(value: Record<string, unknown>) {
  return Object.fromEntries(
    Object.entries(value).map(([key, item]) => [
      key,
      typeof item === 'string' ? item.toLowerCase() : item,
    ]),
  ) as Record<string, Hex.Hex>
}
