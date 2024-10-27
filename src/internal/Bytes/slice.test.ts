import { Bytes } from 'ox'
import { expect, test } from 'vitest'

test('default', () => {
  expect(Bytes.slice(new Uint8Array([]))).toMatchInlineSnapshot('Uint8Array []')
  expect(
    Bytes.slice(new Uint8Array([0, 1, 2, 3, 4, 5, 6, 7, 8, 9])),
  ).toMatchInlineSnapshot(`
    Uint8Array [
      0,
      1,
      2,
      3,
      4,
      5,
      6,
      7,
      8,
      9,
    ]
  `)

  expect(Bytes.slice(new Uint8Array([]), 0)).toMatchInlineSnapshot(
    'Uint8Array []',
  )
  expect(
    Bytes.slice(new Uint8Array([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]), 0, 4),
  ).toMatchInlineSnapshot(`
    Uint8Array [
      0,
      1,
      2,
      3,
    ]
  `)
  expect(
    Bytes.slice(new Uint8Array([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]), 2, 8),
  ).toMatchInlineSnapshot(`
      Uint8Array [
        2,
        3,
        4,
        5,
        6,
        7,
      ]
    `)
  expect(
    Bytes.slice(new Uint8Array([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]), 5, 9),
  ).toMatchInlineSnapshot(`
      Uint8Array [
        5,
        6,
        7,
        8,
      ]
    `)
  expect(
    Bytes.slice(new Uint8Array([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]), 2),
  ).toMatchInlineSnapshot(`
    Uint8Array [
      2,
      3,
      4,
      5,
      6,
      7,
      8,
      9,
    ]
  `)
  expect(
    Bytes.slice(new Uint8Array([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]), 2),
  ).toMatchInlineSnapshot(`
    Uint8Array [
      2,
      3,
      4,
      5,
      6,
      7,
      8,
      9,
    ]
  `)

  expect(
    Bytes.slice(new Uint8Array([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]), -1),
  ).toMatchInlineSnapshot(`
    Uint8Array [
      9,
    ]
  `)
  expect(
    Bytes.slice(new Uint8Array([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]), -3, -1),
  ).toMatchInlineSnapshot(`
    Uint8Array [
      7,
      8,
    ]
  `)
  expect(
    Bytes.slice(new Uint8Array([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]), -8),
  ).toMatchInlineSnapshot(`
      Uint8Array [
        2,
        3,
        4,
        5,
        6,
        7,
        8,
        9,
      ]
    `)
  expect(
    Bytes.slice(new Uint8Array([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]), -8),
  ).toMatchInlineSnapshot(`
      Uint8Array [
        2,
        3,
        4,
        5,
        6,
        7,
        8,
        9,
      ]
    `)

  expect(
    Bytes.slice(new Uint8Array([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]), 0, 10),
  ).toMatchInlineSnapshot(`
    Uint8Array [
      0,
      1,
      2,
      3,
      4,
      5,
      6,
      7,
      8,
      9,
    ]
  `)
  expect(
    Bytes.slice(new Uint8Array([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]), -10),
  ).toMatchInlineSnapshot(`
    Uint8Array [
      0,
      1,
      2,
      3,
      4,
      5,
      6,
      7,
      8,
      9,
    ]
  `)

  expect(() =>
    Bytes.slice(new Uint8Array([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]), 10),
  ).toThrowErrorMatchingInlineSnapshot(
    '[Bytes.SliceOffsetOutOfBoundsError: Slice starting at offset `10` is out-of-bounds (size: `10`).]',
  )

  expect(() =>
    Bytes.slice(new Uint8Array([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]), 0, 11, {
      strict: true,
    }),
  ).toThrowErrorMatchingInlineSnapshot(
    '[Bytes.SliceOffsetOutOfBoundsError: Slice ending at offset `11` is out-of-bounds (size: `10`).]',
  )
  expect(() =>
    Bytes.slice(new Uint8Array([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]), 5, 15, {
      strict: true,
    }),
  ).toThrowErrorMatchingInlineSnapshot(
    '[Bytes.SliceOffsetOutOfBoundsError: Slice ending at offset `15` is out-of-bounds (size: `5`).]',
  )
})
