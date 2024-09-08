import { AbiError } from 'ox'
import { expect, test } from 'vitest'

test('default', () => {
  const error = AbiError.from('error Example()')
  expect(AbiError.encode(error)).toMatchInlineSnapshot(`"0xb085b9a5"`)
})

test('behavior: with args', () => {
  const error = AbiError.from('error Example(uint256)')
  expect(AbiError.encode(error, [69420n])).toMatchInlineSnapshot(
    `"0xdbecc3720000000000000000000000000000000000000000000000000000000000010f2c"`,
  )
})

test('behavior: no hash', () => {
  const error = AbiError.from('error Example()')
  expect(AbiError.encode({ ...error, hash: undefined })).toMatchInlineSnapshot(
    `"0xb085b9a5"`,
  )
})
