import { Hex } from 'ox'
import { expect, test } from 'vitest'

test('default', () => {
  expect(Hex.fromBoolean(true)).toMatchInlineSnapshot(`"0x01"`)
  expect(Hex.fromBoolean(false)).toMatchInlineSnapshot(`"0x00"`)
})

test('args: size', () => {
  expect(Hex.fromBoolean(false, { size: 16 })).toMatchInlineSnapshot(
    '"0x00000000000000000000000000000000"',
  )
  expect(Hex.fromBoolean(false, { size: 32 })).toMatchInlineSnapshot(
    '"0x0000000000000000000000000000000000000000000000000000000000000000"',
  )
})

test('error: size overflow', () => {
  expect(() =>
    Hex.fromBoolean(false, { size: 0 }),
  ).toThrowErrorMatchingInlineSnapshot(`
      [Hex.SizeOverflowError: Size cannot exceed \`0\` bytes. Given size: \`1\` bytes.

      See: https://oxlib.sh/errors#hexsizeoverflowerror]
    `)
})
