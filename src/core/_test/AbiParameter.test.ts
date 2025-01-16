import { AbiParameter } from 'ox'
import { assertType, describe, expect, expectTypeOf, test } from 'vitest'

describe('format', () => {
  test('default', () => {
    const result = AbiParameter.format({ type: 'address', name: 'foo' })
    expect(result).toEqual('address foo')
    expectTypeOf(result).toEqualTypeOf<'address foo'>()
  })

  test('tuple', () => {
    const result = AbiParameter.format({
      type: 'tuple',
      components: [
        { type: 'string', name: 'bar' },
        { type: 'string', name: 'baz' },
      ],
      name: 'foo',
    })
    expect(result).toMatchInlineSnapshot('"(string bar, string baz) foo"')
    expectTypeOf(result).toEqualTypeOf<'(string bar, string baz) foo'>()
  })

  test('tuple[][]', () => {
    const result = AbiParameter.format({
      type: 'tuple[123][]',
      components: [
        { type: 'string', name: 'bar' },
        { type: 'string', name: 'baz' },
      ],
      name: 'foo',
    })
    expect(result).toMatchInlineSnapshot(
      '"(string bar, string baz)[123][] foo"',
    )
    expectTypeOf(result).toEqualTypeOf<'(string bar, string baz)[123][] foo'>()
  })

  test.each([
    {
      abiParameter: { type: 'string' },
      expected: 'string',
    },
    {
      abiParameter: { name: 'foo', type: 'string' },
      expected: 'string foo',
    },
    {
      abiParameter: { name: 'foo', type: 'string', indexed: true },
      expected: 'string indexed foo',
    },
    {
      abiParameter: { type: 'tuple', components: [{ type: 'string' }] },
      expected: '(string)',
    },
    {
      abiParameter: {
        type: 'tuple',
        components: [{ name: 'foo', type: 'string' }],
      },
      expected: '(string foo)',
    },
    {
      abiParameter: {
        type: 'tuple',
        name: 'foo',
        components: [{ name: 'bar', type: 'string' }],
      },
      expected: '(string bar) foo',
    },
    {
      abiParameter: {
        type: 'tuple',
        name: 'foo',
        components: [
          { name: 'bar', type: 'string' },
          { name: 'baz', type: 'string' },
        ],
      },
      expected: '(string bar, string baz) foo',
    },
    {
      abiParameter: { type: 'string', indexed: false },
      expected: 'string',
    },
    {
      abiParameter: { type: 'string', indexed: true },
      expected: 'string indexed',
    },
    {
      abiParameter: { type: 'string', indexed: true, name: 'foo' },
      expected: 'string indexed foo',
    },
  ])('AbiParameter.format($abiParameter)', ({ abiParameter, expected }) => {
    expect(AbiParameter.format(abiParameter)).toEqual(expected)
  })

  test('nested tuple', () => {
    const result = AbiParameter.format({
      components: [
        {
          components: [
            {
              components: [
                {
                  components: [
                    {
                      name: 'baz',
                      type: 'string',
                    },
                  ],
                  name: 'bar',
                  type: 'tuple',
                },
              ],
              name: 'foo',
              type: 'tuple[1]',
            },
          ],
          name: 'boo',
          type: 'tuple',
        },
      ],
      type: 'tuple',
    })
    expect(result).toMatchInlineSnapshot('"((((string baz) bar)[1] foo) boo)"')
    assertType<'((((string baz) bar)[1] foo) boo)'>(result)
  })
})

describe('from', () => {
  test('AbiParameter.from', () => {
    // @ts-expect-error invalid signature type
    expect(() => AbiParameter.from('')).toThrowErrorMatchingInlineSnapshot(
      '[AbiParameter.InvalidParameterError: Invalid ABI parameter.]',
    )
    // @ts-expect-error invalid signature type
    expect(() => AbiParameter.from([])).toThrowErrorMatchingInlineSnapshot(
      `
      [AbiParameter.InvalidAbiParameterError: Failed to parse ABI parameter.

      Details: parseAbiParameter([])]
    `,
    )
    expect(() =>
      AbiParameter.from(['struct Foo { string name; }']),
    ).toThrowErrorMatchingInlineSnapshot(
      `
      [AbiParameter.InvalidAbiParameterError: Failed to parse ABI parameter.

      Details: parseAbiParameter([
        "struct Foo { string name; }"
      ])]
    `,
    )

    expect(() =>
      AbiParameter.from([
        'struct Foo { string memory bar; }',
        'Foo indexed foo',
      ]),
    ).toThrowErrorMatchingInlineSnapshot(
      `
      [AbiParameter.InvalidModifierError: Invalid ABI parameter.

      Modifier "memory" not allowed in "struct" type.

      Details: string memory bar]
    `,
    )

    expect([AbiParameter.from('address from')]).toMatchInlineSnapshot(`
  [
    {
      "name": "from",
      "type": "address",
    },
  ]
`)
  })

  test.each([
    { signature: 'string', expected: { type: 'string' } },
    { signature: 'string foo', expected: { name: 'foo', type: 'string' } },
    {
      signature: 'string indexed foo',
      expected: { name: 'foo', type: 'string', indexed: true },
    },
    {
      signature: 'string calldata foo',
      expected: { name: 'foo', type: 'string' },
    },
    {
      signature: '(string)',
      expected: { type: 'tuple', components: [{ type: 'string' }] },
    },
    {
      signature: '(string foo)',
      expected: {
        type: 'tuple',
        components: [{ name: 'foo', type: 'string' }],
      },
    },
    {
      signature: '(string bar) foo',
      expected: {
        type: 'tuple',
        name: 'foo',
        components: [{ name: 'bar', type: 'string' }],
      },
    },
    {
      signature: '(string bar, string baz) foo',
      expected: {
        type: 'tuple',
        name: 'foo',
        components: [
          { name: 'bar', type: 'string' },
          { name: 'baz', type: 'string' },
        ],
      },
    },
    { signature: 'string[]', expected: { type: 'string[]' } },
  ])('AbiParameter.from($signature)', ({ signature, expected }) => {
    expect(AbiParameter.from(signature)).toEqual(expected)
  })

  test.each([
    {
      signatures: ['struct Foo { string bar; }', 'Foo'],
      expected: {
        type: 'tuple',
        components: [{ name: 'bar', type: 'string' }],
      },
    },
    {
      signatures: ['struct Foo { string bar; }', 'Foo foo'],
      expected: {
        type: 'tuple',
        name: 'foo',
        components: [{ name: 'bar', type: 'string' }],
      },
    },
    {
      signatures: ['struct Foo { string bar; }', 'Foo indexed foo'],
      expected: {
        type: 'tuple',
        name: 'foo',
        indexed: true,
        components: [{ name: 'bar', type: 'string' }],
      },
    },
  ])('AbiParameter.from($signatures)', ({ signatures, expected }) => {
    expect(AbiParameter.from(signatures)).toEqual(expected)
  })

  test('nested tuple', () => {
    const result = AbiParameter.from('((((string baz) bar)[1] foo) boo)')
    expect(result).toMatchInlineSnapshot(`
    {
      "components": [
        {
          "components": [
            {
              "components": [
                {
                  "components": [
                    {
                      "name": "baz",
                      "type": "string",
                    },
                  ],
                  "name": "bar",
                  "type": "tuple",
                },
              ],
              "name": "foo",
              "type": "tuple[1]",
            },
          ],
          "name": "boo",
          "type": "tuple",
        },
      ],
      "type": "tuple",
    }
  `)
    assertType<{
      type: 'tuple'
      components: readonly [
        {
          type: 'tuple'
          components: readonly [
            {
              type: 'tuple[1]'
              components: readonly [
                {
                  type: 'tuple'
                  components: readonly [
                    {
                      type: 'string'
                      name: 'baz'
                    },
                  ]
                  name: 'bar'
                },
              ]
              name: 'foo'
            },
          ]
          name: 'boo'
        },
      ]
    }>(result)
  })
})

test('exports', () => {
  expect(Object.keys(AbiParameter)).toMatchInlineSnapshot(`
    [
      "format",
      "from",
      "InvalidAbiParameterError",
    ]
  `)
})
