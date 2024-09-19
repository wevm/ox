import { Hex } from 'ox'
import { expect, test } from 'vitest'

test('default', () => {
  expect(Hex.toString('0x')).toMatchInlineSnapshot(`""`)
  expect(Hex.toString('0x61')).toMatchInlineSnapshot(`"a"`)
  expect(Hex.toString('0x616263')).toMatchInlineSnapshot(`"abc"`)
  expect(Hex.toString('0x48656c6c6f20576f726c6421')).toMatchInlineSnapshot(
    `"Hello World!"`,
  )
})

test('args: size', () => {
  expect(
    Hex.toString(Hex.fromString('wagmi', { size: 32 }), {
      size: 32,
    }),
  ).toEqual('wagmi')
})

test('error: size overflow', () => {
  expect(() =>
    Hex.toString(Hex.fromString('wagmi', { size: 64 }), {
      size: 32,
    }),
  ).toThrowErrorMatchingInlineSnapshot(`
      [Bytes.SizeOverflowError: Size cannot exceed \`32\` bytes. Given size: \`64\` bytes.

      See: https://oxlib.sh/errors#bytessizeoverflowerror]
    `)
})
