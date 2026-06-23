import { expect, test } from 'vp/test'
import {
  CircularReferenceError,
  InvalidAbiItemError,
  InvalidAbiParameterError,
  InvalidAbiParametersError,
  InvalidAbiTypeParameterError,
  InvalidFunctionModifierError,
  InvalidModifierError,
  InvalidParameterError,
  InvalidParenthesisError,
  InvalidSignatureError,
  InvalidStructSignatureError,
  SolidityProtectedKeywordError,
  UnknownSignatureError,
  UnknownSolidityTypeError,
  UnknownTypeError,
} from './errors.js'

test('InvalidAbiItemError', () => {
  expect(new InvalidAbiItemError({ signature: 'address' }))
    .toMatchInlineSnapshot(`
    [AbiItem.InvalidAbiItemError: Failed to parse ABI item.

    Details: parseAbiItem("address")
    See: https://oxlib.sh/api/AbiItem/from]
  `)
})

test('UnknownTypeError', () => {
  expect(new UnknownTypeError({ type: 'Foo' })).toMatchInlineSnapshot(`
    [HumanReadableAbi.UnknownTypeError: Unknown type.

    Type "Foo" is not a valid ABI type. Perhaps you forgot to include a struct signature?]
  `)
})

test('UnknownSolidityTypeError', () => {
  expect(new UnknownSolidityTypeError({ type: 'Foo' })).toMatchInlineSnapshot(`
    [HumanReadableAbi.UnknownSolidityTypeError: Unknown type.

    Type "Foo" is not a valid ABI type.]
  `)
})

test('InvalidAbiParamterError', () => {
  expect(new InvalidAbiParameterError({ param: 'address owner' }))
    .toMatchInlineSnapshot(`
    [AbiParameter.InvalidAbiParameterError: Failed to parse ABI parameter.

    Details: parseAbiParameter("address owner")
    See: https://oxlib.sh/api/AbiParameter/from]
  `)
})

test('InvalidAbiParamtersError', () => {
  expect(new InvalidAbiParametersError({ params: 'address owner' }))
    .toMatchInlineSnapshot(`
    [AbiParameters.InvalidAbiParametersError: Failed to parse ABI parameters.

    Details: parseAbiParameters("address owner")
    See: https://oxlib.sh/api/AbiParameters/from]
  `)
})

test('InvalidParameterError', () => {
  expect(
    new InvalidParameterError({
      param: 'address',
    }),
  ).toMatchInlineSnapshot(`
    [HumanReadableAbi.InvalidParameterError: Invalid ABI parameter.

    Details: address]
  `)
})

test('SolidityProtectedKeywordError', () => {
  expect(
    new SolidityProtectedKeywordError({
      param: 'address',
      name: 'address',
    }),
  ).toMatchInlineSnapshot(`
    [HumanReadableAbi.SolidityProtectedKeywordError: Invalid ABI parameter.

    "address" is a protected Solidity keyword. More info: https://docs.soliditylang.org/en/latest/cheatsheet.html

    Details: address]
  `)
})

test('InvalidModifierError', () => {
  expect(
    new InvalidModifierError({
      param: 'address',
      modifier: 'calldata',
      type: 'event',
    }),
  ).toMatchInlineSnapshot(`
    [HumanReadableAbi.InvalidModifierError: Invalid ABI parameter.

    Modifier "calldata" not allowed in "event" type.

    Details: address]
  `)

  expect(
    new InvalidModifierError({
      param: 'address',
      modifier: 'calldata',
    }),
  ).toMatchInlineSnapshot(`
    [HumanReadableAbi.InvalidModifierError: Invalid ABI parameter.

    Modifier "calldata" not allowed.

    Details: address]
  `)
})

test('InvalidFunctionModifierError', () => {
  expect(
    new InvalidFunctionModifierError({
      param: 'address',
      modifier: 'calldata',
      type: 'function',
    }),
  ).toMatchInlineSnapshot(`
    [HumanReadableAbi.InvalidFunctionModifierError: Invalid ABI parameter.

    Modifier "calldata" not allowed in "function" type.
    Data location can only be specified for array, struct, or mapping types, but "calldata" was given.

    Details: address]
  `)
})

test('InvalidAbiTypeParameterError', () => {
  expect(
    new InvalidAbiTypeParameterError({
      abiParameter: { type: 'address' },
    }),
  ).toMatchInlineSnapshot(`
    [HumanReadableAbi.InvalidAbiTypeParameterError: Invalid ABI parameter.

    ABI parameter type is invalid.

    Details: {
      "type": "address"
    }]
  `)
})

test('InvalidSignatureError', () => {
  expect(
    new InvalidSignatureError({
      signature: 'function name??()',
      type: 'function',
    }),
  ).toMatchInlineSnapshot(`
    [Abi.InvalidSignatureError: Invalid function signature.

    Details: function name??()]
  `)

  expect(
    new InvalidSignatureError({
      signature: 'function name??()',
      type: 'struct',
    }),
  ).toMatchInlineSnapshot(`
    [Abi.InvalidSignatureError: Invalid struct signature.

    Details: function name??()]
  `)

  expect(
    new InvalidSignatureError({
      signature: 'function name??()',
      type: 'error',
    }),
  ).toMatchInlineSnapshot(`
    [Abi.InvalidSignatureError: Invalid error signature.

    Details: function name??()]
  `)

  expect(
    new InvalidSignatureError({
      signature: 'function name??()',
      type: 'event',
    }),
  ).toMatchInlineSnapshot(`
    [Abi.InvalidSignatureError: Invalid event signature.

    Details: function name??()]
  `)

  expect(
    new InvalidSignatureError({
      signature: 'function name??()',
      type: 'constructor',
    }),
  ).toMatchInlineSnapshot(`
    [Abi.InvalidSignatureError: Invalid constructor signature.

    Details: function name??()]
  `)
})

test('UnknownSignatureError', () => {
  expect(new UnknownSignatureError({ signature: 'invalid' }))
    .toMatchInlineSnapshot(`
    [Abi.UnknownSignatureError: Unknown signature.

    Details: invalid]
  `)
})

test('InvalidStructSignatureError', () => {
  expect(new InvalidStructSignatureError({ signature: 'struct Foo{}' }))
    .toMatchInlineSnapshot(`
    [Abi.InvalidStructSignatureError: Invalid struct signature.

    No properties exist.

    Details: struct Foo{}]
  `)
})

test('InvalidParenthesisError', () => {
  expect(new InvalidParenthesisError({ current: '(Foo))', depth: -1 }))
    .toMatchInlineSnapshot(`
    [HumanReadableAbi.InvalidParenthesisError: Unbalanced parentheses.

    "(Foo))" has too many closing parentheses.

    Details: Depth "-1"]
  `)

  expect(new InvalidParenthesisError({ current: '((Foo)', depth: 1 }))
    .toMatchInlineSnapshot(`
    [HumanReadableAbi.InvalidParenthesisError: Unbalanced parentheses.

    "((Foo)" has too many opening parentheses.

    Details: Depth "1"]
  `)
})

test('CircularReferenceError', () => {
  expect(new CircularReferenceError({ type: 'Foo' })).toMatchInlineSnapshot(`
    [Abi.CircularReferenceError: Circular reference detected.

    Struct "Foo" is a circular reference.]
  `)
})
