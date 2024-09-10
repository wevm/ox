import { expect, test } from 'vitest'

import * as typedData from '../../../test/constants/typedData.js'
import { TypedData_InvalidPrimaryTypeError } from './errors.js'

test('InvalidPrimaryTypeError', () => {
  expect(
    new TypedData_InvalidPrimaryTypeError({
      primaryType: 'Boo',
      types: typedData.complex.types,
    }),
  ).toMatchInlineSnapshot(`
    [TypedData.InvalidPrimaryTypeError: Invalid primary type \`Boo\` must be one of \`["Name","Person","Mail"]\`.

    Check that the primary type is a key in \`types\`.

    See: https://oxlib.sh/errors#typeddatainvalidprimarytypeerror]
  `)
})
