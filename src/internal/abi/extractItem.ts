import { Address_isAddress } from '../address/isAddress.js'
import type { Address } from '../address/types.js'
import type { GlobalErrorType } from '../errors/error.js'
import { Hex_isHex } from '../hex/isHex.js'
import type { Hex } from '../hex/types.js'
import type { UnionCompute } from '../types.js'
import { AbiItemAmbiguityError } from './errors.js'
import { Abi_getSelector } from './getSelector.js'
import { Abi_getSignatureHash } from './getSignatureHash.js'
import type {
  Abi,
  Abi_ExtractItemForArgs,
  Abi_Item,
  Abi_ItemArgs,
  Abi_ItemName,
  Abi_Parameter,
  Widen,
} from './types.js'

export function Abi_extractItem<
  const abi extends Abi | readonly unknown[],
  name extends Abi_ItemName<abi>,
  const args extends Abi_ItemArgs<abi, name> | undefined = undefined,
>(
  abi: abi,
  options: Abi_extractItem.Options<abi, name, args>,
): Abi_extractItem.ReturnType<abi, name, args>

/**
 * Extracts an {@link Abi#Item} from an {@link Abi#Abi} given a name and optional arguments.
 *
 * @example
 * ```ts twoslash
 * import { Abi } from 'ox'
 *
 * const abi = [
 *   {
 *     name: 'x',
 *     type: 'function',
 *     inputs: [{ type: 'uint256' }],
 *     outputs: [],
 *     stateMutability: 'payable',
 *   },
 *   {
 *     name: 'y',
 *     type: 'event',
 *     inputs: [{ type: 'address' }],
 *     outputs: [{ type: 'uint256' }],
 *     stateMutability: 'view',
 *   },
 *   {
 *     name: 'z',
 *     type: 'function',
 *     inputs: [{ type: 'string' }],
 *     outputs: [{ type: 'uint256' }],
 *     stateMutability: 'view',
 *   }
 * ] as const
 *
 * const item = Abi.extractItem(abi, { name: 'y' }) // [!code focus]
 * //    ^?
 *
 *
 *
 *
 *
 *
 *
 * ```
 *
 * @param abi - The contract's ABI.
 * @param options - The extraction options.
 * @returns The ABI item.
 */
export function Abi_extractItem(
  abi: Abi | readonly unknown[],
  options: {
    /** Name (or 4byte selector) of the ABI item to extract. */
    name: string | Hex
    /** Optional arguments to disambiguate function overrides. */
    args?: readonly unknown[] | undefined
  },
): Abi_Item | undefined

export function Abi_extractItem(
  abi: Abi | readonly unknown[],
  options: Abi_extractItem.Options,
): Abi_Item | undefined {
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

  if (abiItems.length === 0) return undefined
  if (abiItems.length === 1) return abiItems[0]

  let matchedAbiItem: Abi_Item | undefined = undefined
  for (const abiItem of abiItems) {
    if (!('inputs' in abiItem)) continue
    if (!args || args.length === 0) {
      if (!abiItem.inputs || abiItem.inputs.length === 0) return abiItem
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

  if (matchedAbiItem) return matchedAbiItem
  return abiItems[0]
}

export declare namespace Abi_extractItem {
  type Options<
    abi extends Abi | readonly unknown[] = Abi,
    name extends Abi_ItemName<abi> = Abi_ItemName<abi>,
    args extends Abi_ItemArgs<abi, name> | undefined = Abi_ItemArgs<abi, name>,
    ///
    allArgs = Abi_ItemArgs<abi, name>,
    allNames = Abi_ItemName<abi>,
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
    name extends Abi_ItemName<abi> = Abi_ItemName<abi>,
    args extends Abi_ItemArgs<abi, name> | undefined = Abi_ItemArgs<abi, name>,
  > = abi extends Abi
    ? Abi extends abi
      ? Abi_Item | undefined
      : Abi_ExtractItemForArgs<
          abi,
          name,
          args extends Abi_ItemArgs<abi, name> ? args : Abi_ItemArgs<abi, name>
        >
    : Abi_Item | undefined

  type ErrorType = GlobalErrorType
}

Abi_extractItem.parseError = (error: unknown) =>
  /* v8 ignore next */
  error as Abi_extractItem.ErrorType

/** @internal */
export function isArgOfType(
  arg: unknown,
  abiParameter: Abi_Parameter,
): boolean {
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
              component as Abi_Parameter,
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
            } as Abi_Parameter),
          )
        )
      }

      return false
    }
  }
}

/** @internal */
export function getAmbiguousTypes(
  sourceParameters: readonly Abi_Parameter[],
  targetParameters: readonly Abi_Parameter[],
  args: Abi_ItemArgs,
): Abi_Parameter['type'][] | undefined {
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
