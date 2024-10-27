import { Bytes } from 'ox'
import { expect, test } from 'vitest'

test('default', () => {
  Bytes.assert(new Uint8Array([1, 69, 420]))
  expect(() =>
    Bytes.assert(new Uint16Array([1])),
  ).toThrowErrorMatchingInlineSnapshot(`
    [Bytes.InvalidBytesTypeError: Value \`{"0":1}\` of type \`object\` is an invalid Bytes value.

    Bytes values must be of type \`Bytes\`.]
  `)
  expect(() => Bytes.assert('0x1')).toThrowErrorMatchingInlineSnapshot(`
    [Bytes.InvalidBytesTypeError: Value \`0x1\` of type \`string\` is an invalid Bytes value.

    Bytes values must be of type \`Bytes\`.]
  `)
  expect(() => Bytes.assert({})).toThrowErrorMatchingInlineSnapshot(`
    [Bytes.InvalidBytesTypeError: Value \`{}\` of type \`object\` is an invalid Bytes value.

    Bytes values must be of type \`Bytes\`.]
  `)
  expect(() => Bytes.assert(undefined)).toThrowErrorMatchingInlineSnapshot(`
    [Bytes.InvalidBytesTypeError: Value \`undefined\` of type \`undefined\` is an invalid Bytes value.

    Bytes values must be of type \`Bytes\`.]
  `)
})
