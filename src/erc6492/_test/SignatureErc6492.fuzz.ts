import { fc, test } from '@fast-check/vitest'
import { Address, Errors, type Hex } from 'ox'
import { SignatureErc6492 } from 'ox/erc6492'
import { describe, expect } from 'vp/test'

import {
  arbitraryHex,
  arbitraryHexOfByteLength,
} from '../../../test/fuzz/arbitraries/bytes.js'
import { numRuns } from '../../../test/fuzz/numRuns.js'

const magicDigits = SignatureErc6492.magicBytes.slice(2)

describe('SignatureErc6492', () => {
  test.prop(
    {
      data: arbitraryHex(80),
      signature: arbitraryHex(100),
      to: arbitraryHexOfByteLength(20),
    },
    { numRuns },
  )(
    'unwrap(wrap(x)) ≡ x, and validate accepts it',
    ({ data, signature, to }) => {
      const wrapped = SignatureErc6492.wrap({ data, signature, to })
      expect(SignatureErc6492.unwrap(wrapped)).toEqual({
        data,
        signature,
        to: Address.checksum(to),
      })
      expect(SignatureErc6492.validate(wrapped)).toBe(true)
    },
  )

  test.prop(
    {
      edit: fc.option(fc.tuple(fc.nat(), fc.constantFrom('0', 'A', 'f'))),
      prefix: fc.oneof(
        arbitraryHex(40),
        // An odd number of digits before the suffix.
        arbitraryHex(40).map((hex) => `${hex}a` as Hex.Hex),
      ),
      suffix: fc.constantFrom('magic', 'none', 'short'),
    },
    { numRuns },
  )(
    'validate is true exactly when assert does not throw',
    ({ edit, prefix, suffix }) => {
      // Most values end in the magic suffix, some with one digit changed.
      const tail = (() => {
        if (suffix === 'none') return ''
        const digits = suffix === 'short' ? magicDigits.slice(2) : magicDigits
        if (!edit) return digits
        const [at, digit] = edit
        const index = at % digits.length
        return `${digits.slice(0, index)}${digit}${digits.slice(index + 1)}`
      })()
      const value = `${prefix}${tail}` as Hex.Hex
      const asserted = (() => {
        try {
          SignatureErc6492.assert(value)
          return true
        } catch (error) {
          if (!(error instanceof Errors.BaseError)) throw error
          return false
        }
      })()
      expect(SignatureErc6492.validate(value)).toBe(asserted)
    },
  )
})
