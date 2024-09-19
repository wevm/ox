import { Hex } from 'ox'
import { expect, test } from 'vitest'

test('default', () => {
  expect(Hex.toBoolean('0x0')).toMatchInlineSnapshot('false')
  expect(Hex.toBoolean('0x1')).toMatchInlineSnapshot('true')
})

test('args: size', () => {
  expect(
    Hex.toBoolean(Hex.fromBoolean(true, { size: 32 }), { size: 32 }),
  ).toEqual(true)
})

test('error: size overflow', () => {
  expect(() =>
    Hex.toBoolean(Hex.fromBoolean(true, { size: 64 }), { size: 32 }),
  ).toThrowErrorMatchingInlineSnapshot(`
      [Hex.SizeOverflowError: Size cannot exceed \`32\` bytes. Given size: \`64\` bytes.

      See: https://oxlib.sh/errors#hexsizeoverflowerror]
    `)
})

test('error: invalid boolean', () => {
  expect(() => Hex.toBoolean('0xa')).toThrowErrorMatchingInlineSnapshot(
    `
      [Hex.InvalidHexBooleanError: Hex value \`"0xa"\` is not a valid boolean.

      The hex value must be \`"0x0"\` (false) or \`"0x1"\` (true).

      See: https://oxlib.sh/errors#hexinvalidhexbooleanerror]
    `,
  )
})
