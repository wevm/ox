import { Bytes } from 'ox'
import { expect, test } from 'vitest'

test('default', () => {
  expect(Bytes.concat(new Uint8Array([0]), new Uint8Array([1]))).toStrictEqual(
    new Uint8Array([0, 1]),
  )
  expect(
    Bytes.concat(
      new Uint8Array([1]),
      new Uint8Array([69]),
      new Uint8Array([420, 69]),
    ),
  ).toStrictEqual(new Uint8Array([1, 69, 420, 69]))
  expect(
    Bytes.concat(
      new Uint8Array([0, 0, 0, 1]),
      new Uint8Array([0, 0, 0, 69]),
      new Uint8Array([0, 0, 420, 69]),
    ),
  ).toStrictEqual(new Uint8Array([0, 0, 0, 1, 0, 0, 0, 69, 0, 0, 420, 69]))
})
