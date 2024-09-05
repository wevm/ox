import { AbiError } from 'ox'
import { expect, test } from 'vitest'

test('default', () => {
  expect(AbiError.getSelector('error BadSignatureV(uint8 v)')).toEqual(
    '0x1f003d0a',
  )
  expect(AbiError.getSelector('BadSignatureV(uint8 v)')).toEqual('0x1f003d0a')
})

test('behavior: from `AbiError`', () => {
  expect(
    AbiError.getSelector(AbiError.from('error BadSignatureV(uint8 v)')),
  ).toEqual('0x1f003d0a')
})
