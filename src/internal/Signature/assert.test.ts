import { Constants, Signature } from 'ox'
import { expect, test } from 'vitest'

test('default', () => {
  expect(() =>
    Signature.assert({ r: undefined, s: 0n, yParity: 0 }),
  ).toThrowErrorMatchingInlineSnapshot(`
    [Signature.MissingPropertiesError: Signature \`{"s":"0","yParity":0}\` is missing either an \`r\`, \`s\`, or \`yParity\` property.

    See: https://oxlib.sh/errors#missingsignaturepropertieserror]
  `)

  expect(() =>
    Signature.assert({ r: 0n, s: undefined, yParity: 0 }),
  ).toThrowErrorMatchingInlineSnapshot(`
    [Signature.MissingPropertiesError: Signature \`{"r":"0","yParity":0}\` is missing either an \`r\`, \`s\`, or \`yParity\` property.

    See: https://oxlib.sh/errors#missingsignaturepropertieserror]
  `)

  expect(() =>
    Signature.assert({ r: 0n, s: 0n, yParity: 69 }),
  ).toThrowErrorMatchingInlineSnapshot(`
    [Signature.InvalidYParityError: Value \`69\` is an invalid y-parity value. Y-parity must be 0 or 1.

    See: https://oxlib.sh/errors#invalidsignatureyparityerror]
  `)

  expect(() =>
    Signature.assert({ r: 0n, s: 0n }, { recovered: true }),
  ).toThrowErrorMatchingInlineSnapshot(`
    [Signature.MissingPropertiesError: Signature \`{"r":"0","s":"0"}\` is missing either an \`r\`, \`s\`, or \`yParity\` property.

    See: https://oxlib.sh/errors#missingsignaturepropertieserror]
  `)

  expect(() =>
    Signature.assert({ r: -1n, s: 0n, yParity: 0 }),
  ).toThrowErrorMatchingInlineSnapshot(
    '[Signature.InvalidRError: Value `-1` is an invalid r value. r must be a positive integer less than 2^256.]',
  )

  expect(() =>
    Signature.assert({
      r: Constants.Solidity_maxUint256 + 1n,
      s: 0n,
      yParity: 0,
    }),
  ).toThrowErrorMatchingInlineSnapshot(
    '[Signature.InvalidRError: Value `115792089237316195423570985008687907853269984665640564039457584007913129639936` is an invalid r value. r must be a positive integer less than 2^256.]',
  )

  expect(() =>
    Signature.assert({ r: 0n, s: -1n, yParity: 0 }),
  ).toThrowErrorMatchingInlineSnapshot(
    '[Signature.InvalidSError: Value `-1` is an invalid s value. s must be a positive integer less than 2^256.]',
  )

  expect(() =>
    Signature.assert({
      r: 0n,
      s: Constants.Solidity_maxUint256 + 1n,
      yParity: 0,
    }),
  ).toThrowErrorMatchingInlineSnapshot(
    '[Signature.InvalidSError: Value `115792089237316195423570985008687907853269984665640564039457584007913129639936` is an invalid s value. s must be a positive integer less than 2^256.]',
  )
})
