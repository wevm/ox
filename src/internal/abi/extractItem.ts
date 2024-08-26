import type { Abi, AbiParameter, Address } from 'abitype'

import { Address_isAddress } from '../address/isAddress.js'
import { AbiItemAmbiguityError } from '../errors/abi.js'
import type { GlobalErrorType } from '../errors/error.js'
import { Hex_isHex } from '../hex/isHex.js'
import type {
  AbiItem,
  AbiItemArgs,
  AbiItemName,
  ExtractAbiItemForArgs,
  Widen,
} from '../types/abi.js'
import type { Hex } from '../types/data.js'
import type { UnionCompute } from '../types/utils.js'
import { Abi_getSelector } from './getSelector.js'
import { Abi_getSignatureHash } from './getSignatureHash.js'

/**
 * Extracts an ABI Item from an ABI given a name and optional arguments.
 *
 * @example
 * ```ts
 * import { Abi } from 'ox'
 *
 * const abiItem = Abi.extractItem(abi, { name: 'y' })
 *
 * // {
 * //   name: 'y',
 * //   type: 'event',
 * //   inputs: [{ type: 'address' }],
 * //   outputs: [{ type: 'uint256' }],
 * //   stateMutability: 'view'
 * // }
 * ```
 */
export function Abi_extractItem<
  const abi extends Abi | readonly unknown[],
  name extends AbiItemName<abi>,
  const args extends AbiItemArgs<abi, name> | undefined = undefined,
>(
  abi: abi,
  options: Abi_extractItem.Options<abi, name, args>,
): Abi_extractItem.ReturnType<abi, name, args> {
  const { args = [], name } = options as unknown as Abi_extractItem.Options

  const isSelector = Hex_isHex(name, { strict: false })
  const abiItems = (abi as Abi).filter((abiItem) => {
    if (isSelector) {
      if (abiItem.type === 'function') return Abi_getSelector(abiItem) === name
      if (abiItem.type === 'event')
        return Abi_getSignatureHash(abiItem) === name
      return false
    }
    return 'name' in abiItem && abiItem.name === name
  })

  if (abiItems.length === 0)
    return undefined as Abi_extractItem.ReturnType<abi, name, args>
  if (abiItems.length === 1)
    return abiItems[0] as Abi_extractItem.ReturnType<abi, name, args>

  let matchedAbiItem: AbiItem | undefined = undefined
  for (const abiItem of abiItems) {
    if (!('inputs' in abiItem)) continue
    if (!args || args.length === 0) {
      if (!abiItem.inputs || abiItem.inputs.length === 0)
        return abiItem as Abi_extractItem.ReturnType<abi, name, args>
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
          throw new AbiItemAmbiguityError(
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

  if (matchedAbiItem)
    return matchedAbiItem as Abi_extractItem.ReturnType<abi, name, args>
  return abiItems[0] as Abi_extractItem.ReturnType<abi, name, args>
}

export declare namespace Abi_extractItem {
  type Options<
    abi extends Abi | readonly unknown[] = Abi,
    name extends AbiItemName<abi> = AbiItemName<abi>,
    args extends AbiItemArgs<abi, name> | undefined = AbiItemArgs<abi, name>,
    ///
    allArgs = AbiItemArgs<abi, name>,
    allNames = AbiItemName<abi>,
  > = {
    name:
      | allNames // show all options
      | (name extends allNames ? name : never) // infer value
      | Hex // function selector
  } & UnionCompute<
    readonly [] extends allArgs
      ? {
          args?:
            | allArgs // show all options
            // infer value, widen inferred value of `args` conditionally to match `allArgs`
            | (abi extends Abi
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
    abi extends Abi | readonly unknown[] = Abi,
    name extends AbiItemName<abi> = AbiItemName<abi>,
    args extends AbiItemArgs<abi, name> | undefined = AbiItemArgs<abi, name>,
  > = abi extends Abi
    ? Abi extends abi
      ? AbiItem | undefined
      : ExtractAbiItemForArgs<
          abi,
          name,
          args extends AbiItemArgs<abi, name> ? args : AbiItemArgs<abi, name>
        >
    : AbiItem | undefined

  type ErrorType = GlobalErrorType
}

Abi_extractItem.parseError = (error: unknown) =>
  /* v8 ignore next */
  error as Abi_extractItem.ErrorType

/** @internal */
export function isArgOfType(arg: unknown, abiParameter: AbiParameter): boolean {
  const argType = typeof arg
  const abiParameterType = abiParameter.type
  switch (abiParameterType) {
    case 'address':
      return Address_isAddress(arg as Address, { strict: false })
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
              component as AbiParameter,
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
            } as AbiParameter),
          )
        )
      }

      return false
    }
  }
}

/** @internal */
export function getAmbiguousTypes(
  sourceParameters: readonly AbiParameter[],
  targetParameters: readonly AbiParameter[],
  args: AbiItemArgs,
): AbiParameter['type'][] | undefined {
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
        return Address_isAddress(args[parameterIndex] as Address, {
          strict: false,
        })
      if (types.includes('address') && types.includes('bytes'))
        return Address_isAddress(args[parameterIndex] as Address, {
          strict: false,
        })
      return false
    })()

    if (ambiguous) return types
  }

  return
}
