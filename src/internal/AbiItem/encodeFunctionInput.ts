import type { AbiParametersToPrimitiveTypes } from 'abitype'
import { AbiParameters_encode } from '../AbiParameters/encode.js'
import type { GlobalErrorType } from '../Errors/error.js'
import { Hex_concat } from '../Hex/concat.js'
import { Hex_slice } from '../Hex/slice.js'
import type { Hex } from '../Hex/types.js'
import type { IsNarrowable } from '../types.js'
import { AbiItem_extract } from './extract.js'
import { AbiItem_getSelector } from './getSelector.js'
import type { AbiItem_Function } from './types.js'

export function AbiItem_encodeFunctionInput<
  const abiItem extends AbiItem_Function,
>(
  abiItem: abiItem | AbiItem_Function,
  ...args: AbiItem_encodeFunctionInput.Args<abiItem>
): Hex

/**
 * ABI-encodes the provided function input (`inputs`), prefixed with the 4 byte function selector.
 *
 * @example
 * ```ts twoslash
 * import { AbiItem } from 'ox'
 *
 * const approve = AbiItem.from('function approve(address, uint256)')
 *
 * const data = AbiItem.encodeFunctionInput( // [!code focus]
 *   approve, // [!code focus]
 *   ['0xd8da6bf26964af9d7eed9e03e53415d37aa96045', 69420n] // [!code focus]
 * ) // [!code focus]
 * // @log: '0x095ea7b3000000000000000000000000d8da6bf26964af9d7eed9e03e53415d37aa960450000000000000000000000000000000000000000000000000000000000010f2c'
 * ```
 *
 * @example
 * You can extract an ABI Function from a JSON ABI with `AbiItem.extract`:
 *
 * ```ts twoslash
 * // @noErrors
 * import { Abi, AbiItem } from 'ox'
 *
 * const erc20Abi = Abi.from([...]) // [!code hl]
 * const approve = AbiItem.extract(erc20Abi, { name: 'approve' }) // [!code hl]
 *
 * const data = AbiItem.encodeFunctionInput(
 *   approve,
 *   ['0xd8da6bf26964af9d7eed9e03e53415d37aa96045', 69420n]
 * )
 * // @log: '0x095ea7b3000000000000000000000000d8da6bf26964af9d7eed9e03e53415d37aa960450000000000000000000000000000000000000000000000000000000000010f2c'
 * ```
 *
 * @param abiItem - ABI Function to encode
 * @param args - Function arguments
 * @returns ABI-encoded function name and arguments
 */
export function AbiItem_encodeFunctionInput(
  abiItem: AbiItem_Function,
  ...args: readonly unknown[]
): Hex

// eslint-disable-next-line jsdoc/require-jsdoc
export function AbiItem_encodeFunctionInput(
  abiItem: AbiItem_Function,
  ...args: readonly unknown[]
): Hex {
  const { overloads } = abiItem

  const item = overloads
    ? (AbiItem_extract([abiItem as AbiItem_Function, ...overloads], {
        name: abiItem.name,
        args: (args as any)[0],
      }) as AbiItem_Function)
    : abiItem

  const selector = (() => {
    if (item.hash) return Hex_slice(item.hash, 0, 4)
    return AbiItem_getSelector(item)
  })()

  const data =
    args.length > 0
      ? AbiParameters_encode(item.inputs, (args as any)[0])
      : undefined

  return data ? Hex_concat(selector, data) : selector
}

export declare namespace AbiItem_encodeFunctionInput {
  type Args<abiItem extends AbiItem_Function> = IsNarrowable<
    abiItem,
    AbiItem_Function
  > extends true
    ?
        | (AbiParametersToPrimitiveTypes<abiItem['inputs']> extends readonly []
            ? []
            : [AbiParametersToPrimitiveTypes<abiItem['inputs']>])
        | (abiItem['overloads'] extends readonly AbiItem_Function[]
            ? [
                AbiParametersToPrimitiveTypes<
                  abiItem['overloads'][number]['inputs']
                >,
              ]
            : [])
    : readonly unknown[]

  type ErrorType = GlobalErrorType
}

AbiItem_encodeFunctionInput.parseError = (error: unknown) =>
  /* v8 ignore next */
  error as AbiItem_encodeFunctionInput.ErrorType
