import { fc, test } from '@fast-check/vitest'
import { TempoAddress, TokenId } from 'ox/tempo'
import { describe, expect } from 'vitest'
import { numRuns } from '../../test/fuzz/numRuns.js'

// `toAddress` writes the ID into the 18 bytes after the `0x20c0` prefix.
const maxId = 2n ** 144n - 1n

const id = fc.oneof(
  fc.bigInt({ min: 0n, max: maxId }),
  fc.constantFrom(0n, 1n, 2n ** 112n - 1n, 2n ** 112n, 2n ** 128n, maxId),
)

const nibbles = (minLength: number, maxLength: number) =>
  fc
    .array(fc.integer({ min: 0, max: 15 }), { minLength, maxLength })
    .map((digits) => digits.map((digit) => digit.toString(16)).join(''))

const spelling = fc.constantFrom('lower', 'upper', 'tempo')

describe('TokenId addresses', () => {
  test.prop({ id, spelling }, { numRuns })(
    'fromAddress reads back what toAddress writes, in any spelling',
    ({ id, spelling }) => {
      const address = TokenId.toAddress(id)
      expect(address).toBe(`0x20c0${id.toString(16).padStart(36, '0')}`)

      const input =
        spelling === 'upper'
          ? `0x${address.slice(2).toUpperCase()}`
          : spelling === 'tempo'
            ? TempoAddress.format(address)
            : address
      expect(TokenId.fromAddress(input as TempoAddress.Address)).toBe(id)
      expect(TokenId.from(input as `0x${string}`)).toBe(id)
      // `toAddress` asserts the checksum, which an all-uppercase spelling fails.
      if (spelling !== 'upper')
        expect(
          TokenId.toAddress(input as TempoAddress.Address).toLowerCase(),
        ).toBe(address)
    },
  )

  test.prop(
    // Lengths next to 36 nibbles, odd ones included, are where a size check
    // that rounds up lets a malformed address through.
    { digits: fc.oneof(nibbles(0, 44), nibbles(34, 38)) },
    { numRuns },
  )(
    'fromAddress throws for a TIP-20 prefix not followed by exactly 18 bytes',
    ({ digits }) => {
      fc.pre(digits.length !== 36)
      expect(() =>
        TokenId.fromAddress(`0x20c0${digits}` as TempoAddress.Address),
      ).toThrowError('invalid tip20 address.')
    },
  )

  test.prop(
    {
      digits: nibbles(36, 36),
      at: fc.nat({ max: 35 }),
      char: fc.constantFrom('g', 'z', 'x', ' ', '-', '.'),
    },
    { numRuns },
  )(
    'fromAddress throws its own error for non-hex characters after the prefix',
    ({ digits, at, char }) => {
      const address = `0x20c0${digits.slice(0, at)}${char}${digits.slice(at + 1)}`
      expect(() =>
        TokenId.fromAddress(address as TempoAddress.Address),
      ).toThrowError('invalid tip20 address.')
    },
  )

  test.prop({ digits: nibbles(40, 40) }, { numRuns })(
    'fromAddress throws for addresses without the TIP-20 prefix',
    ({ digits }) => {
      fc.pre(!digits.startsWith('20c0'))
      expect(() =>
        TokenId.fromAddress(`0x${digits}` as TempoAddress.Address),
      ).toThrowError('invalid tip20 address.')
    },
  )
})
