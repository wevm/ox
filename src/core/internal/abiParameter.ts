import type * as abitype from 'abitype'

import type * as AbiParameter from '../AbiParameter.js'
import {
  InvalidFunctionModifierError,
  InvalidModifierError,
  InvalidParameterError,
  InvalidParenthesisError,
  SolidityProtectedKeywordError,
  UnknownSolidityTypeError,
} from './humanReadable/errors.js'
import {
  type FunctionModifier,
  type Modifier,
  type ValidateName,
  functionModifiers,
} from './humanReadable/signatures.js'
import type * as structs from './humanReadable/structs.js'
import type {
  _ParseTuple,
  _SplitNameOrModifier,
} from './humanReadable/types/utils.js'
import { bytesRegex, execTyped, integerRegex, isTupleRegex } from './regex.js'
import type {
  Evaluate,
  IsUnknown,
  Merge,
  Trim,
  TypeErrorMessage,
} from './types.js'

export function parseAbiParameter(
  param: string,
  options?:
    | {
        modifiers?: Set<Modifier>
        structs?: structs.StructLookup
        type?: abitype.AbiItemType | 'struct'
      }
    | undefined,
) {
  // optional namespace cache by `type`
  const parameterCacheKey = getParameterCacheKey(
    param,
    options?.type,
    options?.structs,
  )
  if (parameterCache.has(parameterCacheKey))
    return parameterCache.get(parameterCacheKey)!

  const isTuple = isTupleRegex.test(param)
  const match = execTyped<{
    array?: string
    modifier?: Modifier
    name?: string
    type: string
  }>(
    isTuple ? abiParameterWithTupleRegex : abiParameterWithoutTupleRegex,
    param,
  )
  if (!match) throw new InvalidParameterError({ param })

  if (match.name && isSolidityKeyword(match.name))
    throw new SolidityProtectedKeywordError({
      param,
      name: match.name,
    })

  const name = match.name ? { name: match.name } : {}
  const indexed = match.modifier === 'indexed' ? { indexed: true } : {}
  const structs = options?.structs ?? {}
  let type: string
  let components = {}
  if (isTuple) {
    type = 'tuple'
    const params = splitParameters(match.type)
    const components_ = []
    const length = params.length
    for (let i = 0; i < length; i++) {
      // remove `modifiers` from `options` to prevent from being added to tuple components
      components_.push(parseAbiParameter(params[i]!, { structs }))
    }
    components = { components: components_ }
  } else if (match.type in structs) {
    type = 'tuple'
    components = { components: structs[match.type] }
  } else if (dynamicIntegerRegex.test(match.type)) {
    type = `${match.type}256`
  } else {
    type = match.type
    if (!(options?.type === 'struct') && !isSolidityType(type))
      throw new UnknownSolidityTypeError({ type })
  }

  if (match.modifier) {
    // Check if modifier exists, but is not allowed (e.g. `indexed` in `functionModifiers`)
    if (!options?.modifiers?.has?.(match.modifier))
      throw new InvalidModifierError({
        param,
        type: options?.type,
        modifier: match.modifier,
      })

    // Check if resolved `type` is valid if there is a function modifier
    if (
      functionModifiers.has(match.modifier as FunctionModifier) &&
      !isValidDataLocation(type, !!match.array)
    )
      throw new InvalidFunctionModifierError({
        param,
        type: options?.type,
        modifier: match.modifier,
      })
  }

  const abiParameter = {
    type: `${type}${match.array ?? ''}`,
    ...name,
    ...indexed,
    ...components,
  }
  parameterCache.set(parameterCacheKey, abiParameter)
  return abiParameter
}

const abiParameterWithoutTupleRegex =
  /^(?<type>[a-zA-Z$_][a-zA-Z0-9$_]*)(?<array>(?:\[\d*?\])+?)?(?:\s(?<modifier>calldata|indexed|memory|storage{1}))?(?:\s(?<name>[a-zA-Z$_][a-zA-Z0-9$_]*))?$/
const abiParameterWithTupleRegex =
  /^\((?<type>.+?)\)(?<array>(?:\[\d*?\])+?)?(?:\s(?<modifier>calldata|indexed|memory|storage{1}))?(?:\s(?<name>[a-zA-Z$_][a-zA-Z0-9$_]*))?$/
const dynamicIntegerRegex = /^u?int$/

/** @internal */
export function isSolidityKeyword(name: string) {
  return (
    name === 'address' ||
    name === 'bool' ||
    name === 'function' ||
    name === 'string' ||
    name === 'tuple' ||
    bytesRegex.test(name) ||
    integerRegex.test(name) ||
    protectedKeywordsRegex.test(name)
  )
}
const protectedKeywordsRegex =
  /^(?:after|alias|anonymous|apply|auto|byte|calldata|case|catch|constant|copyof|default|defined|error|event|external|false|final|function|immutable|implements|in|indexed|inline|internal|let|mapping|match|memory|mutable|null|of|override|partial|private|promise|public|pure|reference|relocatable|return|returns|sizeof|static|storage|struct|super|supports|switch|this|true|try|typedef|typeof|var|view|virtual)$/

/** @internal */
export function isValidDataLocation(
  type: string,
  isArray: boolean,
): type is Exclude<
  abitype.AbiType,
  | abitype.SolidityString
  | Extract<abitype.SolidityBytes, 'bytes'>
  | abitype.SolidityArray
> {
  return isArray || type === 'bytes' || type === 'string' || type === 'tuple'
}

export function isSolidityType(
  type: string,
): type is Exclude<
  abitype.AbiType,
  abitype.SolidityTuple | abitype.SolidityArray
> {
  return (
    type === 'address' ||
    type === 'bool' ||
    type === 'function' ||
    type === 'string' ||
    bytesRegex.test(type) ||
    integerRegex.test(type)
  )
}

// s/o latika for this
export function splitParameters(
  params: string,
  result: string[] = [],
  current = '',
  depth = 0,
): readonly string[] {
  const length = params.trim().length
  // biome-ignore lint/correctness/noUnreachable: recursive
  for (let i = 0; i < length; i++) {
    const char = params[i]
    const tail = params.slice(i + 1)
    switch (char) {
      case ',':
        return depth === 0
          ? splitParameters(tail, [...result, current.trim()])
          : splitParameters(tail, result, `${current}${char}`, depth)
      case '(':
        return splitParameters(tail, result, `${current}${char}`, depth + 1)
      case ')':
        return splitParameters(tail, result, `${current}${char}`, depth - 1)
      default:
        return splitParameters(tail, result, `${current}${char}`, depth)
    }
  }

  if (current === '') return result
  if (depth !== 0) throw new InvalidParenthesisError({ current, depth })

  result.push(current.trim())
  return result
}

/**
 * Gets {@link parameterCache} cache key namespaced by {@link type}. This prevents parameters from being accessible to types that don't allow them (e.g. `string indexed foo` not allowed outside of `type: 'event'`).
 * @param param ABI parameter string
 * @param type ABI parameter type
 * @returns Cache key for {@link parameterCache}
 */
export function getParameterCacheKey(
  param: string,
  type?: abitype.AbiItemType | 'struct',
  structs?: structs.StructLookup,
) {
  let structKey = ''
  if (structs)
    for (const struct of Object.entries(structs)) {
      if (!struct) continue
      let propertyKey = ''
      for (const property of struct[1]) {
        propertyKey += `[${property.type}${property.name ? `:${property.name}` : ''}]`
      }
      structKey += `(${struct[0]}{${propertyKey}})`
    }
  if (type) return `${type}:${param}${structKey}`
  return param
}

/**
 * Basic cache seeded with common ABI parameter strings.
 *
 * **Note: When seeding more parameters, make sure you benchmark performance. The current number is the ideal balance between performance and having an already existing cache.**
 */
export const parameterCache = new Map<
  string,
  AbiParameter.AbiParameter & { indexed?: boolean }
>([
  // Unnamed
  ['address', { type: 'address' }],
  ['bool', { type: 'bool' }],
  ['bytes', { type: 'bytes' }],
  ['bytes32', { type: 'bytes32' }],
  ['int', { type: 'int256' }],
  ['int256', { type: 'int256' }],
  ['string', { type: 'string' }],
  ['uint', { type: 'uint256' }],
  ['uint8', { type: 'uint8' }],
  ['uint16', { type: 'uint16' }],
  ['uint24', { type: 'uint24' }],
  ['uint32', { type: 'uint32' }],
  ['uint64', { type: 'uint64' }],
  ['uint96', { type: 'uint96' }],
  ['uint112', { type: 'uint112' }],
  ['uint160', { type: 'uint160' }],
  ['uint192', { type: 'uint192' }],
  ['uint256', { type: 'uint256' }],

  // Named
  ['address owner', { type: 'address', name: 'owner' }],
  ['address to', { type: 'address', name: 'to' }],
  ['bool approved', { type: 'bool', name: 'approved' }],
  ['bytes _data', { type: 'bytes', name: '_data' }],
  ['bytes data', { type: 'bytes', name: 'data' }],
  ['bytes signature', { type: 'bytes', name: 'signature' }],
  ['bytes32 hash', { type: 'bytes32', name: 'hash' }],
  ['bytes32 r', { type: 'bytes32', name: 'r' }],
  ['bytes32 root', { type: 'bytes32', name: 'root' }],
  ['bytes32 s', { type: 'bytes32', name: 's' }],
  ['string name', { type: 'string', name: 'name' }],
  ['string symbol', { type: 'string', name: 'symbol' }],
  ['string tokenURI', { type: 'string', name: 'tokenURI' }],
  ['uint tokenId', { type: 'uint256', name: 'tokenId' }],
  ['uint8 v', { type: 'uint8', name: 'v' }],
  ['uint256 balance', { type: 'uint256', name: 'balance' }],
  ['uint256 tokenId', { type: 'uint256', name: 'tokenId' }],
  ['uint256 value', { type: 'uint256', name: 'value' }],

  // Indexed
  [
    'event:address indexed from',
    { type: 'address', name: 'from', indexed: true },
  ],
  ['event:address indexed to', { type: 'address', name: 'to', indexed: true }],
  [
    'event:uint indexed tokenId',
    { type: 'uint256', name: 'tokenId', indexed: true },
  ],
  [
    'event:uint256 indexed tokenId',
    { type: 'uint256', name: 'tokenId', indexed: true },
  ],
])

/// Types

export type ParseAbiParameter<
  signature extends string,
  options extends ParseOptions = DefaultParseOptions,
> = (
  signature extends `(${string})${string}`
    ? _ParseTuple<signature, options>
    : // Convert string to shallow AbiParameter (structs resolved yet)
      // Check for `${Type} ${nameOrModifier}` format (e.g. `uint256 foo`, `uint256 indexed`, `uint256 indexed foo`)
      signature extends `${infer type} ${infer tail}`
      ? Trim<tail> extends infer trimmed extends string
        ? // TODO: data location modifiers only allowed for struct/array types
          { readonly type: Trim<type> } & _SplitNameOrModifier<trimmed, options>
        : never
      : // Must be `${Type}` format (e.g. `uint256`)
        { readonly type: signature }
) extends infer shallowParameter extends AbiParameter.AbiParameter & {
  type: string
  indexed?: boolean
}
  ? // Resolve struct types
    // Starting with plain struct types (e.g. `Foo`)
    (
      shallowParameter['type'] extends keyof options['structs']
        ? {
            readonly type: 'tuple'
            readonly components: options['structs'][shallowParameter['type']]
          } & (IsUnknown<shallowParameter['name']> extends false
            ? { readonly name: shallowParameter['name'] }
            : object) &
            (shallowParameter['indexed'] extends true
              ? { readonly indexed: true }
              : object)
        : // Resolve tuple structs (e.g. `Foo[]`, `Foo[2]`, `Foo[][2]`, etc.)
          shallowParameter['type'] extends `${infer type extends string &
              keyof options['structs']}[${infer tail}]`
          ? {
              readonly type: `tuple[${tail}]`
              readonly components: options['structs'][type]
            } & (IsUnknown<shallowParameter['name']> extends false
              ? { readonly name: shallowParameter['name'] }
              : object) &
              (shallowParameter['indexed'] extends true
                ? { readonly indexed: true }
                : object)
          : // Not a struct, just return
            shallowParameter
    ) extends infer Parameter extends AbiParameter.AbiParameter & {
      type: string
      indexed?: boolean
    }
    ? Evaluate<_ValidateAbiParameter<Parameter>>
    : never
  : never

export type ParseOptions = {
  modifier?: Modifier
  structs?: structs.StructLookup | unknown
}
export type DefaultParseOptions = object

export type SplitParameters<
  signature extends string,
  result extends unknown[] = [],
  current extends string = '',
  depth extends readonly number[] = [],
> = signature extends ''
  ? current extends ''
    ? [...result] // empty string was passed in to `SplitParameters`
    : depth['length'] extends 0
      ? [...result, Trim<current>]
      : TypeErrorMessage<`Unbalanced parentheses. "${current}" has too many opening parentheses.`>
  : signature extends `${infer char}${infer tail}`
    ? char extends ','
      ? depth['length'] extends 0
        ? SplitParameters<tail, [...result, Trim<current>], ''>
        : SplitParameters<tail, result, `${current}${char}`, depth>
      : char extends '('
        ? SplitParameters<tail, result, `${current}${char}`, [...depth, 1]>
        : char extends ')'
          ? depth['length'] extends 0
            ? TypeErrorMessage<`Unbalanced parentheses. "${current}" has too many closing parentheses.`>
            : SplitParameters<tail, result, `${current}${char}`, Pop<depth>>
          : SplitParameters<tail, result, `${current}${char}`, depth>
    : []
type Pop<type extends readonly number[]> = type extends [...infer head, any]
  ? head
  : []

export type _ValidateAbiParameter<
  abiParameter extends AbiParameter.AbiParameter,
> =
  // Validate `name`
  (
    abiParameter extends { name: string }
      ? ValidateName<abiParameter['name']> extends infer name
        ? name extends abiParameter['name']
          ? abiParameter
          : // Add `Error` as `name`
            Merge<abiParameter, { readonly name: name }>
        : never
      : abiParameter
  ) extends infer parameter
    ? // Validate `type` against `AbiType`
      (
        abitype.ResolvedRegister['strictAbiType'] extends true
          ? parameter extends { type: abitype.AbiType }
            ? parameter
            : Merge<
                parameter,
                {
                  readonly type: TypeErrorMessage<`Type "${parameter extends {
                    type: string
                  }
                    ? parameter['type']
                    : string}" is not a valid ABI type.`>
                }
              >
          : parameter
      ) extends infer parameter2 extends { type: unknown }
      ? // Convert `(u)int` to `(u)int256`
        parameter2['type'] extends `${infer prefix extends
          | 'u'
          | ''}int${infer suffix extends `[${string}]` | ''}`
        ? Evaluate<
            Merge<parameter2, { readonly type: `${prefix}int256${suffix}` }>
          >
        : parameter2
      : never
    : never
