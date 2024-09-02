import { Hex } from 'ox'
import { expect, test } from 'vitest'

test('default', () => {
  expect(Hex.slice('0x')).toMatchInlineSnapshot('"0x"')
  expect(Hex.slice('0x0123456789')).toMatchInlineSnapshot('"0x0123456789"')

  expect(Hex.slice('0x', 0)).toMatchInlineSnapshot('"0x"')
  expect(Hex.slice('0x0123456789', 0, 4)).toMatchInlineSnapshot('"0x01234567"')
  expect(Hex.slice('0x0123456789', 1, 4)).toMatchInlineSnapshot('"0x234567"')
  expect(Hex.slice('0x0123456789', 2, 5)).toMatchInlineSnapshot('"0x456789"')
  expect(Hex.slice('0x0123456789', 2)).toMatchInlineSnapshot('"0x456789"')
  expect(Hex.slice('0x0123456789', 2)).toMatchInlineSnapshot('"0x456789"')
  expect(
    Hex.slice(
      '0x0000000000000000000000000000000000000000000000000000000000010f2c000000000000000000000000000000000000000000000000000000000000a45500000000000000000000000000000000000000000000000000000000190f1b44',
      33,
      65,
    ),
  ).toBe('0x0000000000000000000000000000000000000000000000000000000000a45500')

  expect(Hex.slice('0x0123456789', -1)).toMatchInlineSnapshot('"0x89"')
  expect(Hex.slice('0x0123456789', -3, -1)).toMatchInlineSnapshot('"0x4567"')
  expect(Hex.slice('0x0123456789', -5)).toMatchInlineSnapshot('"0x0123456789"')
  expect(Hex.slice('0x0123456789', -5)).toMatchInlineSnapshot('"0x0123456789"')

  expect(Hex.slice('0x0123456789', 0, 10)).toMatchInlineSnapshot(
    '"0x0123456789"',
  )
  expect(Hex.slice('0x0123456789', -10)).toMatchInlineSnapshot('"0x0123456789"')

  expect(() => Hex.slice('0x0123456789', 5)).toThrowErrorMatchingInlineSnapshot(
    `
    [SliceOffsetOutOfBoundsError: Slice starting at offset \`5\` is out-of-bounds (size: \`5\`).

    See: https://oxlib.sh/errors#sliceoffsetoutofboundserror]
  `,
  )

  expect(() =>
    Hex.slice('0x0123456789', 0, 6, { strict: true }),
  ).toThrowErrorMatchingInlineSnapshot(
    `
    [SliceOffsetOutOfBoundsError: Slice ending at offset \`6\` is out-of-bounds (size: \`5\`).

    See: https://oxlib.sh/errors#sliceoffsetoutofboundserror]
  `,
  )
  expect(() =>
    Hex.slice('0x0123456789', 0, 10, { strict: true }),
  ).toThrowErrorMatchingInlineSnapshot(
    `
    [SliceOffsetOutOfBoundsError: Slice ending at offset \`10\` is out-of-bounds (size: \`5\`).

    See: https://oxlib.sh/errors#sliceoffsetoutofboundserror]
  `,
  )
})
