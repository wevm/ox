import type { Abi } from '../Abi/types.js'
import type { AbiParameters_Parameter } from '../AbiParameters/types.js'
import { Address_isAddress } from '../Address/isAddress.js'
import type { Address } from '../Address/types.js'
import type { GlobalErrorType } from '../Errors/error.js'
import { Hex_isHex } from '../Hex/isHex.js'
import { Hex_slice } from '../Hex/slice.js'
import type { Hex } from '../Hex/types.js'
import type { UnionCompute } from '../types.js'
import { AbiItemAmbiguityError, AbiItemNotFoundError } from './errors.js'
import { AbiItem_getSelector } from './getSelector.js'
import { AbiItem_getSignatureHash } from './getSignatureHash.js'
import type {
  AbiItem,
  AbiItem_ExtractArgs,
  AbiItem_ExtractForArgs,
  AbiItem_Name,
  Widen,
} from './types.js'

/**
 * Extracts an {@link Abi#Item} from an {@link Abi#Abi} given a name and optional arguments.
 *
 * @example
 * ```ts twoslash
 * import { AbiItem } from 'ox'
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
 * const item = AbiItem.extract(abi, { name: 'y' }) // [!code focus]
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
 * @param options - Extraction options.
 * @returns The ABI item.
 */
export function AbiItem_extract<
  const abi extends Abi | readonly unknown[],
  name extends AbiItem_Name<abi>,
  const args extends AbiItem_ExtractArgs<abi, name> | undefined = undefined,
>(
  abi: abi | Abi | readonly unknown[],
  options: AbiItem_extract.Options<abi, name, args>,
): AbiItem_extract.ReturnType<abi, name, args> {
  const {
    args = [],
    data,
    prepare = true,
  } = options as unknown as AbiItem_extract.Options

  const name = (data ?? options.name)!

  const isSelector = Hex_isHex(name, { strict: false })
  const abiItems = (abi as Abi).filter((abiItem) => {
    if (isSelector) {
      if (abiItem.type === 'function' || abiItem.type === 'error')
        return AbiItem_getSelector(abiItem) === Hex_slice(name, 0, 4)
      if (abiItem.type === 'event')
        return AbiItem_getSignatureHash(abiItem) === name
      return false
    }
    return 'name' in abiItem && abiItem.name === name
  })

  if (abiItems.length === 0) throw new AbiItemNotFoundError(name)
  if (abiItems.length === 1)
    return {
      ...abiItems[0],
      ...(prepare ? { hash: AbiItem_getSignatureHash(abiItems[0]!) } : {}),
    } as never

  let matchedAbiItem: AbiItem | undefined = undefined
  for (const abiItem of abiItems) {
    if (!('inputs' in abiItem)) continue
    if (!args || args.length === 0) {
      if (!abiItem.inputs || abiItem.inputs.length === 0)
        return {
          ...abiItem,
          ...(prepare ? { hash: AbiItem_getSignatureHash(abiItem) } : {}),
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

  const abiItem = (() => {
    if (matchedAbiItem) return matchedAbiItem
    return abiItems[0]
  })() as AbiItem_extract.ReturnType<abi, name, args>

  if (!abiItem) throw new AbiItemNotFoundError(name)
  return {
    ...abiItem,
    ...(prepare ? { hash: AbiItem_getSignatureHash(abiItem) } : {}),
  }
}

export declare namespace AbiItem_extract {
  type Options<
    abi extends Abi | readonly unknown[] = Abi,
    name extends AbiItem_Name<abi> = AbiItem_Name<abi>,
    args extends
      | AbiItem_ExtractArgs<abi, name>
      | undefined = AbiItem_ExtractArgs<abi, name>,
    ///
    allArgs = AbiItem_ExtractArgs<abi, name>,
    allNames = AbiItem_Name<abi>,
  > =
    | {
        args?: undefined
        name?: undefined
        /** Selector or hash of the ABI Item to extract. */
        data: Hex
        prepare?: undefined
      }
    | ({
        data?: undefined
        /** Name of the ABI Item to extract. */
        name:
          | allNames // show all options
          | (name extends allNames ? name : never) // infer value
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
      >)

  type ReturnType<
    abi extends Abi | readonly unknown[] = Abi,
    name extends AbiItem_Name<abi> = AbiItem_Name<abi>,
    args extends
      | AbiItem_ExtractArgs<abi, name>
      | undefined = AbiItem_ExtractArgs<abi, name>,
  > = abi extends Abi
    ? Abi extends abi
      ? AbiItem
      : AbiItem_ExtractForArgs<
          abi,
          name,
          args extends AbiItem_ExtractArgs<abi, name>
            ? args
            : AbiItem_ExtractArgs<abi, name>
        >
    : AbiItem

  type ErrorType = GlobalErrorType
}

AbiItem_extract.parseError = (error: unknown) =>
  /* v8 ignore next */
  error as AbiItem_extract.ErrorType

/** @internal */
export function isArgOfType(
  arg: unknown,
  abiParameter: AbiParameters_Parameter,
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
  args: AbiItem_ExtractArgs,
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
