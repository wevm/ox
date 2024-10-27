import { Bytes } from 'ox'
import { expect, test } from 'vitest'

test('default', () => {
  expect(Bytes.fromString('')).toMatchInlineSnapshot('Uint8Array []')
  expect(Bytes.fromString('a')).toMatchInlineSnapshot(`
      Uint8Array [
        97,
      ]
    `)
  expect(Bytes.fromString('abc')).toMatchInlineSnapshot(`
      Uint8Array [
        97,
        98,
        99,
      ]
    `)
  expect(Bytes.fromString('Hello World!')).toMatchInlineSnapshot(
    `
      Uint8Array [
        72,
        101,
        108,
        108,
        111,
        32,
        87,
        111,
        114,
        108,
        100,
        33,
      ]
    `,
  )
})

test('args: size', () => {
  expect(Bytes.fromString('Hello World!', { size: 16 })).toMatchInlineSnapshot(
    `
      Uint8Array [
        72,
        101,
        108,
        108,
        111,
        32,
        87,
        111,
        114,
        108,
        100,
        33,
        0,
        0,
        0,
        0,
      ]
    `,
  )
  expect(Bytes.fromString('Hello World!', { size: 32 })).toMatchInlineSnapshot(
    `
      Uint8Array [
        72,
        101,
        108,
        108,
        111,
        32,
        87,
        111,
        114,
        108,
        100,
        33,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
      ]
    `,
  )
})

test('error: size overflow', () => {
  expect(() =>
    Bytes.fromString('Hello World!', { size: 8 }),
  ).toThrowErrorMatchingInlineSnapshot(
    '[Bytes.SizeOverflowError: Size cannot exceed `8` bytes. Given size: `12` bytes.]',
  )
})
