import type * as Abi from '../../Abi.js'
import * as AbiItem from '../../AbiItem.js'
import * as Address from '../../Address.js'
import type * as Errors from '../../Errors.js'
import * as Hex from '../../Hex.js'
import type { AbiParameters_Parameter } from '../AbiParameters/types.js'
import type { UnionCompute } from '../types.js'
import type { ExtractArgs, ExtractForArgs, Widen } from './types.js'

/**
 * Extracts an {@link ox#AbiItem.AbiItem} from an {@link ox#Abi.Abi} given a name and optional arguments.
 *
 * @example
 * ABI Items can be extracted by their name using the `name` option:
 *
 * ```ts twoslash
 * import { Abi, AbiItem } from 'ox'
 *
 * const abi = Abi.from([
 *   'function foo()',
 *   'event Transfer(address owner, address to, uint256 tokenId)',
 *   'function bar(string a) returns (uint256 x)',
 * ])
 *
 * const item = AbiItem.fromAbi(abi, 'Transfer') // [!code focus]
 * //    ^?
 *
 *
 *
 *
 *
 *
 * ```
 *
 * @example
 * ### Extracting by Selector
 *
 * ABI Items can be extract by their selector when {@link ox#Hex.Hex} is provided to `name`.
 *
 * ```ts twoslash
 * import { Abi, AbiItem } from 'ox'
 *
 * const abi = Abi.from([
 *   'function foo()',
 *   'event Transfer(address owner, address to, uint256 tokenId)',
 *   'function bar(string a) returns (uint256 x)',
 * ])
 * const item = AbiItem.fromAbi(abi, '0x095ea7b3') // [!code focus]
 * //    ^?
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 * ```
 *
 * :::note
 *
 * Extracting via a hex selector is useful when extracting an ABI Item from an `eth_call` RPC response,
 * a Transaction `input`, or from Event Log `topics`.
 *
 * :::
 *
 * @param abi - The ABI to extract from.
 * @param name - The name (or selector) of the ABI item to extract.
 * @param options - Extraction options.
 * @returns The ABI item.
 */
export function fromAbi<
  const abi extends Abi.Abi | readonly unknown[],
  name extends AbiItem.Name<abi>,
  const args extends ExtractArgs<abi, name> | undefined = undefined,
  //
  allNames = AbiItem.Name<abi>,
>(
  abi: abi | Abi.Abi | readonly unknown[],
  name: Hex.Hex | (name extends allNames ? name : never),
  options?: fromAbi.Options<abi, name, args>,
): fromAbi.ReturnType<abi, name, args> {
  const { args = [], prepare = true } = (options ??
    {}) as unknown as fromAbi.Options

  const isSelector = Hex.validate(name, { strict: false })
  const abiItems = (abi as Abi.Abi).filter((abiItem) => {
    if (isSelector) {
      if (abiItem.type === 'function' || abiItem.type === 'error')
        return AbiItem.getSelector(abiItem) === Hex.slice(name, 0, 4)
      if (abiItem.type === 'event')
        return AbiItem.getSignatureHash(abiItem) === name
      return false
    }
    return 'name' in abiItem && abiItem.name === name
  })

  if (abiItems.length === 0)
    throw new AbiItem.NotFoundError({ name: name as string })
  if (abiItems.length === 1)
    return {
      ...abiItems[0],
      ...(prepare ? { hash: AbiItem.getSignatureHash(abiItems[0]!) } : {}),
    } as never

  let matchedAbiItem: AbiItem.AbiItem | undefined = undefined
  for (const abiItem of abiItems) {
    if (!('inputs' in abiItem)) continue
    if (!args || args.length === 0) {
      if (!abiItem.inputs || abiItem.inputs.length === 0)
        return {
          ...abiItem,
          ...(prepare ? { hash: AbiItem.getSignatureHash(abiItem) } : {}),
        } as never
      continue
    }
    if (!abiItem.inputs) continue
    if (abiItem.inputs.length === 0) continue
    if (abiItem.inputs.length !== args.length) continue
    const matched = args.every((arg, index) => {
      const abiParameter = 'inputs' in abiItem && abiItem.inputs![index]
      if (!abiParameter) return false
      return isArgOfType(arg, abiParameter)
    })
    if (matched) {
      // Check for ambiguity against already matched parameters (e.g. `address` vs `bytes20`).
      if (
        matchedAbiItem &&
        'inputs' in matchedAbiItem &&
        matchedAbiItem.inputs
      ) {
        const ambiguousTypes = getAmbiguousTypes(
          abiItem.inputs,
          matchedAbiItem.inputs,
          args as readonly unknown[],
        )
        if (ambiguousTypes)
          throw new AbiItem.AmbiguityError(
            {
              abiItem,
              type: ambiguousTypes[0]!,
            },
            {
              abiItem: matchedAbiItem,
              type: ambiguousTypes[1]!,
            },
          )
      }

      matchedAbiItem = abiItem
    }
  }

  const abiItem = (() => {
    if (matchedAbiItem) return matchedAbiItem
    const [abiItem, ...overloads] = abiItems
    return { ...abiItem!, overloads }
  })()

  if (!abiItem) throw new AbiItem.NotFoundError({ name: name as string })
  return {
    ...abiItem,
    ...(prepare ? { hash: AbiItem.getSignatureHash(abiItem) } : {}),
  } as never
}

export declare namespace fromAbi {
  type Options<
    abi extends Abi.Abi | readonly unknown[] = Abi.Abi,
    name extends AbiItem.Name<abi> = AbiItem.Name<abi>,
    args extends ExtractArgs<abi, name> | undefined = ExtractArgs<abi, name>,
    ///
    allArgs = ExtractArgs<abi, name>,
  > = {
    /**
     * Whether or not to prepare the extracted item (optimization for encoding performance).
     * When `true`, the `hash` property is computed and included in the returned value.
     *
     * @default true
     */
    prepare?: boolean | undefined
  } & UnionCompute<
    readonly [] extends allArgs
      ? {
          args?:
            | allArgs // show all options
            // infer value, widen inferred value of `args` conditionally to match `allArgs`
            | (abi extends Abi.Abi
                ? args extends allArgs
                  ? Widen<args>
                  : never
                : never)
            | undefined
        }
      : {
          args?:
            | allArgs // show all options
            | (Widen<args> & (args extends allArgs ? unknown : never)) // infer value, widen inferred value of `args` match `allArgs` (e.g. avoid union `args: readonly [123n] | readonly [bigint]`)
            | undefined
        }
  >

  type ReturnType<
    abi extends Abi.Abi | readonly unknown[] = Abi.Abi,
    name extends AbiItem.Name<abi> = AbiItem.Name<abi>,
    args extends ExtractArgs<abi, name> | undefined = ExtractArgs<abi, name>,
    fallback = AbiItem.AbiItem,
  > = abi extends Abi.Abi
    ? Abi.Abi extends abi
      ? fallback
      : ExtractForArgs<
          abi,
          name,
          args extends ExtractArgs<abi, name> ? args : ExtractArgs<abi, name>
        >
    : fallback

  type ErrorType = Errors.GlobalErrorType
}

fromAbi.parseError = (error: unknown) =>
  /* v8 ignore next */
  error as fromAbi.ErrorType

/** @internal */
export function isArgOfType(
  arg: unknown,
  abiParameter: AbiParameters_Parameter,
): boolean {
  const argType = typeof arg
  const abiParameterType = abiParameter.type
  switch (abiParameterType) {
    case 'address':
      return Address.validate(arg as Address.Address, { strict: false })
    case 'bool':
      return argType === 'boolean'
    case 'function':
      return argType === 'string'
    case 'string':
      return argType === 'string'
    default: {
      if (abiParameterType === 'tuple' && 'components' in abiParameter)
        return Object.values(abiParameter.components).every(
          (component, index) => {
            return isArgOfType(
              Object.values(arg as unknown[] | Record<string, unknown>)[index],
              component as AbiParameters_Parameter,
            )
          },
        )

      // `(u)int<M>`: (un)signed integer type of `M` bits, `0 < M <= 256`, `M % 8 == 0`
      // https://regexr.com/6v8hp
      if (
        /^u?int(8|16|24|32|40|48|56|64|72|80|88|96|104|112|120|128|136|144|152|160|168|176|184|192|200|208|216|224|232|240|248|256)?$/.test(
          abiParameterType,
        )
      )
        return argType === 'number' || argType === 'bigint'

      // `bytes<M>`: binary type of `M` bytes, `0 < M <= 32`
      // https://regexr.com/6va55
      if (/^bytes([1-9]|1[0-9]|2[0-9]|3[0-2])?$/.test(abiParameterType))
        return argType === 'string' || arg instanceof Uint8Array

      // fixed-length (`<type>[M]`) and dynamic (`<type>[]`) arrays
      // https://regexr.com/6va6i
      if (/[a-z]+[1-9]{0,3}(\[[0-9]{0,}\])+$/.test(abiParameterType)) {
        return (
          Array.isArray(arg) &&
          arg.every((x: unknown) =>
            isArgOfType(x, {
              ...abiParameter,
              // Pop off `[]` or `[M]` from end of type
              type: abiParameterType.replace(/(\[[0-9]{0,}\])$/, ''),
            } as AbiParameters_Parameter),
          )
        )
      }

      return false
    }
  }
}

/** @internal */
export function getAmbiguousTypes(
  sourceParameters: readonly AbiParameters_Parameter[],
  targetParameters: readonly AbiParameters_Parameter[],
  args: ExtractArgs,
): AbiParameters_Parameter['type'][] | undefined {
  for (const parameterIndex in sourceParameters) {
    const sourceParameter = sourceParameters[parameterIndex]!
    const targetParameter = targetParameters[parameterIndex]!

    if (
      sourceParameter.type === 'tuple' &&
      targetParameter.type === 'tuple' &&
      'components' in sourceParameter &&
      'components' in targetParameter
    )
      return getAmbiguousTypes(
        sourceParameter.components,
        targetParameter.components,
        (args as any)[parameterIndex],
      )

    const types = [sourceParameter.type, targetParameter.type]

    const ambiguous = (() => {
      if (types.includes('address') && types.includes('bytes20')) return true
      if (types.includes('address') && types.includes('string'))
        return Address.validate(args[parameterIndex] as Address.Address, {
          strict: false,
        })
      if (types.includes('address') && types.includes('bytes'))
        return Address.validate(args[parameterIndex] as Address.Address, {
          strict: false,
        })
      return false
    })()

    if (ambiguous) return types
  }

  return
}
