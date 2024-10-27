import { Hex } from 'ox'
import { expect, test } from 'vitest'

test('default', () => {
  expect(Hex.padLeft('0xa4e12a45')).toMatchInlineSnapshot(
    '"0x00000000000000000000000000000000000000000000000000000000a4e12a45"',
  )

  expect(Hex.padRight('0xa4e12a45')).toMatchInlineSnapshot(
    `"0xa4e12a4500000000000000000000000000000000000000000000000000000000"`,
  )

  expect(Hex.padLeft('0x1')).toMatchInlineSnapshot(
    '"0x0000000000000000000000000000000000000000000000000000000000000001"',
  )

  expect(Hex.padLeft('0xa4e12a45')).toMatchInlineSnapshot(
    '"0x00000000000000000000000000000000000000000000000000000000a4e12a45"',
  )

  expect(Hex.padLeft('0x1a4e12a45')).toMatchInlineSnapshot(
    '"0x00000000000000000000000000000000000000000000000000000001a4e12a45"',
  )

  expect(() =>
    Hex.padLeft(
      '0x1a4e12a45a21323123aaa87a897a897a898a6567a578a867a98778a667a85a875a87a6a787a65a675a6a9',
    ),
  ).toThrowErrorMatchingInlineSnapshot(
    '[Hex.SizeExceedsPaddingSizeError: Hex size (`43`) exceeds padding size (`32`).]',
  )
})

test('args: size', () => {
  expect(Hex.padLeft('0x1', 4)).toMatchInlineSnapshot('"0x00000001"')

  expect(Hex.padLeft('0xa4e12a45', 4)).toMatchInlineSnapshot('"0xa4e12a45"')

  expect(Hex.padLeft('0xa4e12a45ab', 0)).toMatchInlineSnapshot('"0xa4e12a45ab"')

  expect(() =>
    Hex.padLeft('0x1a4e12a45', 4),
  ).toThrowErrorMatchingInlineSnapshot(
    '[Hex.SizeExceedsPaddingSizeError: Hex size (`5`) exceeds padding size (`4`).]',
  )
})
