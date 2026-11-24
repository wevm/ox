import { fc, test } from '@fast-check/vitest'
import * as ethers from 'ethers'
import { Address, Hex } from 'ox'
import * as viem from 'viem'
import { describe, expect } from 'vitest'
import { numRuns } from '../../../test/fuzz/numRuns.js'

const forms = [
  'lower',
  'upper',
  'checksum',
  'flipped',
  'short',
  'long',
  'nohex',
] as const

describe('Address against ethers and viem', () => {
  test.prop(
    {
      bytes: fc.uint8Array({ minLength: 20, maxLength: 20 }),
      form: fc.constantFrom(...forms),
      at: fc.nat(39),
    },
    { numRuns },
  )(
    'checksum, from and validate agree with ethers.getAddress and viem.isAddress',
    ({ bytes, form, at }) => {
      const lower = Hex.fromBytes(bytes)
      const checksummed = ethers.getAddress(lower)
      expect(viem.getAddress(lower)).toBe(checksummed)
      const flip = (text: string) => {
        const chars = [...text]
        const char = chars[2 + at]!
        chars[2 + at] =
          char === char.toLowerCase() ? char.toUpperCase() : char.toLowerCase()
        return chars.join('')
      }
      const value = {
        lower,
        upper: `0x${lower.slice(2).toUpperCase()}`,
        checksum: checksummed,
        flipped: flip(checksummed),
        short: lower.slice(0, -2),
        long: `${lower}00`,
        nohex: `0xg${lower.slice(3)}`,
      }[form]

      // viem and ox check an all-uppercase address's checksum in strict mode,
      // where ethers takes it as unchecksummed.
      const valid = viem.isAddress(value, { strict: true })
      expect(Address.validate(value)).toBe(valid)
      expect(Address.validate(value, { strict: false })).toBe(
        /^0x[0-9a-fA-F]{40}$/.test(value),
      )
      if (!valid) {
        expect(() => Address.assert(value)).toThrow()
        expect(() => Address.from(value)).toThrow()
        return
      }
      expect(Address.checksum(value)).toBe(checksummed)
      expect(Address.from(value, { checksum: true })).toBe(checksummed)
      expect(Address.from(value)).toBe(value)
      expect(Address.isEqual(value, lower)).toBe(true)
    },
  )

  test.prop(
    {
      addresses: fc.array(fc.uint8Array({ minLength: 20, maxLength: 20 }), {
        minLength: 1,
        maxLength: 8,
      }),
    },
    { numRuns },
  )(
    'checksum gives the same answer for any spelling, first call or cached',
    ({ addresses }) => {
      for (const bytes of addresses) {
        const lower = Hex.fromBytes(bytes)
        const checksummed = ethers.getAddress(lower)
        expect(Address.checksum(`0x${lower.slice(2).toUpperCase()}`)).toBe(
          checksummed,
        )
        expect(Address.checksum(lower)).toBe(checksummed)
        expect(Address.checksum(checksummed)).toBe(checksummed)
      }
    },
  )
})
