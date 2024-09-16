import { PublicKey } from 'ox'
import { expect, test } from 'vitest'

test('compressed', () => {
  PublicKey.assert({ prefix: 2, x: 1n })
  PublicKey.assert({ prefix: 3, x: 1n })

  expect(() => PublicKey.assert({ x: 1n })).toThrowErrorMatchingInlineSnapshot(
    `
    [PublicKey.InvalidPrefixError: Prefix "undefined" is invalid.

    Details: Prefix must be 2 or 3 for compressed public keys.]
  `,
  )
  expect(() =>
    PublicKey.assert({ prefix: 5, x: 1n }),
  ).toThrowErrorMatchingInlineSnapshot(`
    [PublicKey.InvalidPrefixError: Prefix "5" is invalid.

    Details: Prefix must be 2 or 3 for compressed public keys.]
  `)
})

test('uncompressed', () => {
  PublicKey.assert({ prefix: 4, x: 1n, y: 1n })

  expect(() =>
    PublicKey.assert({ x: 1n, y: 1n }),
  ).toThrowErrorMatchingInlineSnapshot(`
    [PublicKey.InvalidPrefixError: Prefix "undefined" is invalid.

    Details: Prefix must be 4 for uncompressed public keys.]
  `)
  expect(() =>
    PublicKey.assert({ prefix: 3, x: 1n, y: 1n }),
  ).toThrowErrorMatchingInlineSnapshot(`
    [PublicKey.InvalidPrefixError: Prefix "3" is invalid.

    Details: Prefix must be 4 for uncompressed public keys.]
  `)
  expect(() =>
    PublicKey.assert({ prefix: 5, x: 1n, y: 1n }),
  ).toThrowErrorMatchingInlineSnapshot(`
    [PublicKey.InvalidPrefixError: Prefix "5" is invalid.

    Details: Prefix must be 4 for uncompressed public keys.]
  `)
})

test('unknown', () => {
  expect(() => PublicKey.assert({ y: 1n })).toThrowErrorMatchingInlineSnapshot(
    `
    [PublicKey.InvalidError: Value \`{"y":"1"}\` is not a valid public key.

    Public key must contain:
    - an \`x\` and \`prefix\` value (compressed)
    - an \`x\`, \`y\`, and \`prefix\` value (uncompressed)]
  `,
  )
})
