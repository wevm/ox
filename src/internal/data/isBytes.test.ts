import { Data } from 'ox'
import { expect, test } from 'vitest'

test('default', () => {
  expect(Data.isBytes(new Uint8Array([1, 69, 420])))
  expect(Data.isBytes('0x1')).toBeFalsy()
  expect(Data.isBytes({})).toBeFalsy()
  expect(Data.isBytes(undefined)).toBeFalsy()
})
