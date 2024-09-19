import { Bytes } from 'ox'
import { expect, test } from 'vitest'

test('default', () => {
  expect(Bytes.from([51, 12, 41, 55])).toMatchInlineSnapshot(
    `
    Uint8Array [
      51,
      12,
      41,
      55,
    ]
  `,
  )

  expect(Bytes.from(new Uint8Array([51, 12, 41, 55]))).toMatchInlineSnapshot(
    `
    Uint8Array [
      51,
      12,
      41,
      55,
    ]
  `,
  )

  expect(Bytes.from('0xdeadbeef')).toMatchInlineSnapshot(
    `
    Uint8Array [
      222,
      173,
      190,
      239,
    ]
  `,
  )
})
