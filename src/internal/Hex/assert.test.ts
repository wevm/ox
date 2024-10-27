import { Hex } from 'ox'
import { expect, test } from 'vitest'

test('default', () => {
  expect(() =>
    Hex.assert('0x0123456789abcdefg'),
  ).toThrowErrorMatchingInlineSnapshot(`
    [Hex.InvalidHexValueError: Value \`0x0123456789abcdefg\` is an invalid hex value.

    Hex values must start with \`"0x"\` and contain only hexadecimal characters (0-9, a-f, A-F).]
  `)
  expect(() => Hex.assert({ foo: 'bar' })).toThrowErrorMatchingInlineSnapshot(`
    [Hex.InvalidHexTypeError: Value \`{"foo":"bar"}\` of type \`object\` is an invalid hex type.

    Hex types must be represented as \`"0x\${string}"\`.]
  `)
  expect(() => Hex.assert(1)).toThrowErrorMatchingInlineSnapshot(`
    [Hex.InvalidHexTypeError: Value \`1\` of type \`number\` is an invalid hex type.

    Hex types must be represented as \`"0x\${string}"\`.]
  `)
  expect(() => Hex.assert(undefined)).toThrowErrorMatchingInlineSnapshot(`
    [Hex.InvalidHexTypeError: Value \`undefined\` of type \`undefined\` is an invalid hex type.

    Hex types must be represented as \`"0x\${string}"\`.]
  `)
})
