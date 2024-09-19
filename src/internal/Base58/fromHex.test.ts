import { Base58 } from 'ox'
import { expect, test } from 'vitest'

test('default', () => {
  expect(Base58.fromHex('0x00000000287fb4cd')).toBe('1111233QC4')
})
