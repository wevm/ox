import { Signature } from 'ox'
import { expect, test } from 'vitest'

test('default', () => {
  expect(
    Signature.fromRpc({
      r: '0x1',
      s: '0x2',
      yParity: '0x0',
    }),
  ).toMatchInlineSnapshot(`
    {
      "r": 1n,
      "s": 2n,
      "yParity": 0,
    }
  `)

  expect(
    Signature.fromRpc({
      r: '0x1',
      s: '0x2',
      v: '0x0',
    }),
  ).toMatchInlineSnapshot(`
    {
      "r": 1n,
      "s": 2n,
      "yParity": 0,
    }
  `)

  expect(
    Signature.fromRpc({
      r: '0x1',
      s: '0x2',
      v: '0x1b',
    }),
  ).toMatchInlineSnapshot(`
    {
      "r": 1n,
      "s": 2n,
      "yParity": 0,
    }
  `)
})

test('error: missing yParity and v', () => {
  expect(() =>
    Signature.fromRpc({
      r: '0x1',
      s: '0x2',
    }),
  ).toThrowErrorMatchingInlineSnapshot(`
    [Signature.InvalidYParityError: Value \`undefined\` is an invalid y-parity value. Y-parity must be 0 or 1.

    See: https://oxlib.sh/errors#invalidsignatureyparityerror]
  `)
})
