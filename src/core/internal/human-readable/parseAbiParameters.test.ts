import { expect, test } from 'vp/test'

import { parseAbiParameters } from './parseAbiParameters.js'

test('parseAbiParameters', () => {
  // @ts-expect-error invalid signature type
  expect(() => parseAbiParameters('')).toThrowErrorMatchingInlineSnapshot(
    `
    [AbiParameters.InvalidAbiParametersError: Failed to parse ABI parameters.

    Details: parseAbiParameters("")
    See: https://oxlib.sh/api/AbiParameters/from]
  `,
  )
  // @ts-expect-error invalid signature type
  expect(() => parseAbiParameters([])).toThrowErrorMatchingInlineSnapshot(
    `
    [AbiParameters.InvalidAbiParametersError: Failed to parse ABI parameters.

    Details: parseAbiParameters([])
    See: https://oxlib.sh/api/AbiParameters/from]
  `,
  )
  expect(() =>
    parseAbiParameters(['struct Foo { string name; }']),
  ).toThrowErrorMatchingInlineSnapshot(
    `
    [AbiParameters.InvalidAbiParametersError: Failed to parse ABI parameters.

    Details: parseAbiParameters([
      "struct Foo { string name; }"
    ])
    See: https://oxlib.sh/api/AbiParameters/from]
  `,
  )

  expect(parseAbiParameters('address from')).toMatchInlineSnapshot(`
    [
      {
        "name": "from",
        "type": "address",
      },
    ]
  `)
})

test.each([
  {
    signatures: 'string, string',
    expected: [{ type: 'string' }, { type: 'string' }],
  },
  {
    signatures: 'string foo, string bar',
    expected: [
      { type: 'string', name: 'foo' },
      { type: 'string', name: 'bar' },
    ],
  },
])('parseAbiParameters($signatures)', ({ signatures, expected }) => {
  expect(parseAbiParameters(signatures)).toEqual(expected)
})

test.each([
  {
    signatures: ['struct Foo { string bar; }', 'Foo, string'],
    expected: [
      { type: 'tuple', components: [{ name: 'bar', type: 'string' }] },
      { type: 'string' },
    ],
  },
  {
    signatures: ['string foo, string bar'],
    expected: [
      { name: 'foo', type: 'string' },
      { name: 'bar', type: 'string' },
    ],
  },
])('parseAbiParameters($signatures)', ({ signatures, expected }) => {
  expect(parseAbiParameters(signatures)).toEqual(expected)
})
