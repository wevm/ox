import { Base58 } from 'ox'
import { expect, test } from 'vitest'

test('default', () => {
  expect(Base58.toHex('233QC4')).toBe('0x287fb4cd')
  expect(Base58.toHex('11233QC4')).toBe('0x0000287fb4cd')
  expect(() => Base58.toHex('233QC4I')).toThrowErrorMatchingInlineSnapshot(
    '[Error: invalid base58 character: I]',
  )
})
