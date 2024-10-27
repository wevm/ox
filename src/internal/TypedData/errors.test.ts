import { TypedData } from 'ox'
import { expect, test } from 'vitest'

import * as typedData from '../../../test/constants/typedData.js'

test('BytesSizeMismatchError', () => {
  expect(
    new TypedData.BytesSizeMismatchError({
      expectedSize: 69,
      givenSize: 420,
    }),
  ).toMatchInlineSnapshot(
    '[TypedData.BytesSizeMismatchError: Expected bytes69, got bytes420.]',
  )
})

test('InvalidPrimaryTypeError', () => {
  expect(
    new TypedData.InvalidPrimaryTypeError({
      primaryType: 'Boo',
      types: typedData.complex.types,
    }),
  ).toMatchInlineSnapshot(`
    [TypedData.InvalidPrimaryTypeError: Invalid primary type \`Boo\` must be one of \`["Name","Person","Mail"]\`.

    Check that the primary type is a key in \`types\`.]
  `)
})
