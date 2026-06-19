import { AbiParameter } from 'ox'
import { describe, expect, test } from 'vp/test'

describe('from', () => {
  test('json parameter', () => {
    expect(
      AbiParameter.from({ name: 'spender', type: 'address' }),
    ).toMatchInlineSnapshot(`
      {
        "name": "spender",
        "type": "address",
      }
    `)
  })

  test('human-readable parameter', () => {
    expect(AbiParameter.from('address spender')).toMatchInlineSnapshot(`
      {
        "name": "spender",
        "type": "address",
      }
    `)
  })

  test('human-readable parameter with structs', () => {
    expect(
      AbiParameter.from([
        'struct Foo { address spender; uint256 amount; }',
        'Foo foo',
      ]),
    ).toMatchInlineSnapshot(`
      {
        "components": [
          {
            "name": "spender",
            "type": "address",
          },
          {
            "name": "amount",
            "type": "uint256",
          },
        ],
        "name": "foo",
        "type": "tuple",
      }
    `)
  })
})

describe('format', () => {
  test('parameter', () => {
    expect(
      AbiParameter.format({ name: 'spender', type: 'address' }),
    ).toMatchInlineSnapshot(`"address spender"`)
  })

  test('tuple parameter', () => {
    expect(
      AbiParameter.format({
        components: [
          { name: 'spender', type: 'address' },
          { name: 'amount', type: 'uint256' },
        ],
        name: 'foo',
        type: 'tuple',
      }),
    ).toMatchInlineSnapshot(
      `"(address spender, uint256 amount) foo"`,
    )
  })
})

test('exports', () => {
  expect(Object.keys(AbiParameter)).toMatchInlineSnapshot(`
    [
      "InvalidAbiParameterError",
      "InvalidAbiTypeParameterError",
      "InvalidFunctionModifierError",
      "InvalidModifierError",
      "InvalidParameterError",
      "SolidityProtectedKeywordError",
      "InvalidParenthesisError",
      "format",
      "from",
    ]
  `)
})
