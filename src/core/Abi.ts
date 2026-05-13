import * as abitype from 'abitype'
import * as AbiItem from './AbiItem.js'
import type * as Errors from './Errors.js'
import * as internal from './internal/abi.js'
import type * as AbiItem_internal from './internal/abiItem.js'

/** Root type for an ABI. */
export type Abi = abitype.Abi

/** @internal */
export function format<const abi extends Abi>(abi: abi): format.ReturnType<abi>
/**
 * Formats an {@link ox#Abi.Abi} into a **Human Readable ABI**.
 *
 * @example
 * ```ts twoslash
 * import { Abi } from 'ox'
 *
 * const formatted = Abi.format([{
 *   type: 'function',
 *   name: 'approve',
 *   stateMutability: 'nonpayable',
 *   inputs: [
 *     {
 *       name: 'spender',
 *       type: 'address',
 *     },
 *     {
 *       name: 'amount',
 *       type: 'uint256',
 *     },
 *   ],
 *   outputs: [{ type: 'bool' }],
 * }])
 *
 * formatted
 * //    ^?
 *
 *
 *
 * ```
 *
 * @param abi - The ABI to format.
 * @returns The formatted ABI.
 */
export function format(abi: Abi | readonly unknown[]): readonly string[]
// eslint-disable-next-line jsdoc/require-jsdoc
export function format(abi: Abi | readonly unknown[]): format.ReturnType {
  return abitype.formatAbi(abi) as never
}

export declare namespace format {
  type ReturnType<abi extends Abi | readonly unknown[] = Abi> =
    abitype.FormatAbi<abi>

  type ErrorType = Errors.GlobalErrorType
}

/** @internal */
export function from<const abi extends Abi | readonly string[]>(
  abi: abi &
    (abi extends readonly string[]
      ? AbiItem_internal.Signatures<abi>
      : unknown),
  options?: from.Options | undefined,
): from.ReturnType<abi>
/**
 * Parses an arbitrary **JSON ABI** or **Human Readable ABI** into a typed {@link ox#Abi.Abi}.
 *
 * By default, each item is prepared (signature hash precomputed and cached on the item)
 * for faster subsequent encode/decode. Opt out with `{ prepare: false }`.
 *
 * @example
 * ### JSON ABIs
 *
 * ```ts twoslash
 * import { Abi } from 'ox'
 *
 * const abi = Abi.from([{
 *   type: 'function',
 *   name: 'approve',
 *   stateMutability: 'nonpayable',
 *   inputs: [
 *     {
 *       name: 'spender',
 *       type: 'address',
 *     },
 *     {
 *       name: 'amount',
 *       type: 'uint256',
 *     },
 *   ],
 *   outputs: [{ type: 'bool' }],
 * }])
 *
 * abi
 * //^?
 *
 *
 *
 * ```
 *
 * @example
 * ### Human Readable ABIs
 *
 * ```ts twoslash
 * import { Abi } from 'ox'
 *
 * const abi = Abi.from([
 *   'function approve(address spender, uint256 amount) returns (bool)'
 * ])
 *
 * abi
 * //^?
 *
 *
 *
 * ```
 *
 * @param abi - The ABI to parse.
 * @param options - Parsing options.
 * @returns The typed ABI.
 */
export function from(
  abi: Abi | readonly string[],
  options?: from.Options | undefined,
): Abi
// eslint-disable-next-line jsdoc/require-jsdoc
export function from(
  abi: Abi | readonly string[],
  options?: from.Options | undefined,
): from.ReturnType {
  const { prepare = true } = options ?? {}
  const parsed = (
    internal.isSignatures(abi) ? abitype.parseAbi(abi) : abi
  ) as Abi
  if (!prepare) return parsed as never
  return parsed.map((item) => ({
    ...item,
    hash: AbiItem.getSignatureHash(item as AbiItem.AbiItem),
  })) as never
}

export declare namespace from {
  type Options = {
    /**
     * Whether or not to prepare each ABI item (optimization for encoding performance).
     * When `true`, the `hash` property is precomputed and attached to every item.
     *
     * @default true
     */
    prepare?: boolean | undefined
  }

  type ReturnType<
    abi extends Abi | readonly string[] | readonly unknown[] = Abi,
  > = abi extends readonly string[] ? abitype.ParseAbi<abi> : abi

  type ErrorType = Errors.GlobalErrorType
}
