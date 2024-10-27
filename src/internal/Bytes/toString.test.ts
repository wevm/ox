import { Bytes } from 'ox'
import { expect, test } from 'vitest'

test('default', () => {
  expect(Bytes.toString(Bytes.fromArray([]))).toMatchInlineSnapshot(`""`)
  expect(Bytes.toString(Bytes.fromArray([97]))).toMatchInlineSnapshot(`"a"`)
  expect(Bytes.toString(Bytes.fromArray([97, 98, 99]))).toMatchInlineSnapshot(
    `"abc"`,
  )
  expect(
    Bytes.toString(
      Bytes.fromArray([72, 101, 108, 108, 111, 32, 87, 111, 114, 108, 100, 33]),
    ),
  ).toMatchInlineSnapshot(`"Hello World!"`)
})

test('args: size', () => {
  expect(
    Bytes.toString(Bytes.fromString('wagmi', { size: 32 }), {
      size: 32,
    }),
  ).toEqual('wagmi')
})

test('error: size overflow', () => {
  expect(() =>
    Bytes.toString(Bytes.fromString('wagmi', { size: 64 }), {
      size: 32,
    }),
  ).toThrowErrorMatchingInlineSnapshot(
    '[Bytes.SizeOverflowError: Size cannot exceed `32` bytes. Given size: `64` bytes.]',
  )
})
