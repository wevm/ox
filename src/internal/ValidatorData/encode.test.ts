import { Bytes, Hex, ValidatorData } from 'ox'
import { expect, test } from 'vitest'

test('default', () => {
  expect(
    ValidatorData.encode({
      data: Hex.fromString('hello world'),
      validator: '0xd8da6bf26964af9d7eed9e03e53415d37aa96045',
    }),
  ).toMatchInlineSnapshot(
    `"0x1900d8da6bf26964af9d7eed9e03e53415d37aa9604568656c6c6f20776f726c64"`,
  )
  expect(
    ValidatorData.encode({
      data: Bytes.fromString('hello world'),
      validator: '0xd8da6bf26964af9d7eed9e03e53415d37aa96045',
    }),
  ).toMatchInlineSnapshot(
    `"0x1900d8da6bf26964af9d7eed9e03e53415d37aa9604568656c6c6f20776f726c64"`,
  )
})
