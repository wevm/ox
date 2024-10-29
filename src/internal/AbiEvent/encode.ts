import type { AbiParameter } from 'abitype'
import type * as Errors from '../../Errors.js'
import * as Hex from '../../Hex.js'
import { AbiParameters_encode } from '../AbiParameters/encode.js'
import { Hash_keccak256 } from '../Hash/keccak256.js'
import type { Compute, IsNarrowable } from '../types.js'
import { AbiEvent_FilterTypeNotSupportedError } from './errors.js'
import { AbiEvent_getSelector } from './getSelector.js'
import type { AbiEvent, AbiEvent_ParametersToPrimitiveTypes } from './types.js'

/**
 * ABI-encodes the provided event input (`inputs`) into an array of [Event Topics](https://info.etherscan.com/what-is-event-logs/).
 *
 * :::tip
 *
 * This function is typically used to encode event arguments into [Event Topics](https://info.etherscan.com/what-is-event-logs/).
 *
 * See the [End-to-end Example](#end-to-end).
 *
 * :::
 *
 * @example
 * ```ts twoslash
 * import { AbiEvent } from 'ox'
 *
 * const transfer = AbiEvent.from(
 *   'event Transfer(address indexed from, address indexed to, uint256 value)'
 * )
 *
 * const { topics } = AbiEvent.encode(transfer)
 * // @log: ['0x406dade31f7ae4b5dbc276258c28dde5ae6d5c2773c5745802c493a2360e55e0']
 * ```
 *
 * @example
 * ### Passing Arguments
 *
 * You can pass `indexed` parameter values to `AbiEvent.encode`.
 *
 * TypeScript types will be inferred from the ABI Event, to guard you from inserting the wrong values.
 *
 * For example, the `Transfer` event below accepts an `address` type for the `from` and `to` attributes.
 *
 * ```ts twoslash
 * import { AbiEvent } from 'ox'
 *
 * const transfer = AbiEvent.from(
 *   'event Transfer(address indexed from, address indexed to, uint256 value)'
 * )
 *
 * const { topics } = AbiEvent.encode(transfer, {
 *   from: '0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266', // [!code hl]
 *   to: '0x70997970c51812dc3a010c7d01b50e0d17dc79c8' // [!code hl]
 * })
 * // @log: [
 * // @log:   '0x406dade31f7ae4b5dbc276258c28dde5ae6d5c2773c5745802c493a2360e55e0',
 * // @log:   '0x00000000000000000000000000000000f39fd6e51aad88f6f4ce6ab8827279cfffb92266',
 * // @log:   '0x0000000000000000000000000000000070997970c51812dc3a010c7d01b50e0d17dc79c8'
 * // @log: ]
 * ```
 *
 * @example
 * ### End-to-end
 *
 * Below is an end-to-end example of using `AbiEvent.encode` to encode the topics of a `Transfer` event and query for events matching the encoded topics on the [Wagmi Mint Example contract](https://etherscan.io/address/0xfba3912ca04dd458c843e2ee08967fc04f3579c2).
 *
 * ```ts twoslash
 * import 'ox/window'
 * import { AbiEvent, Hex } from 'ox'
 *
 * // 1. Instantiate the `Transfer` ABI Event.
 * const transfer = AbiEvent.from(
 *   'event Transfer(address indexed from, address indexed to, uint256 value)',
 * )
 *
 * // 2. Encode the ABI Event into Event Topics.
 * const { topics } = AbiEvent.encode(transfer)
 *
 * // 3. Query for events matching the encoded Topics.
 * const logs = await window.ethereum!.request({
 *   method: 'eth_getLogs',
 *   params: [
 *     {
 *       address: '0xfba3912ca04dd458c843e2ee08967fc04f3579c2',
 *       fromBlock: Hex.fromNumber(19760235n),
 *       toBlock: Hex.fromNumber(19760240n),
 *       topics,
 *     },
 *   ],
 * })
 * // @log: [
 * // @log:   "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef",
 * // @log:   "0x0000000000000000000000000000000000000000000000000000000000000000",
 * // @log:   "0x0000000000000000000000000c04d9e9278ec5e4d424476d3ebec70cb5d648d1",
 * // @log:   "0x000000000000000000000000000000000000000000000000000000000000025b",
 * // @log: ]
 * ```
 *
 * :::note
 *
 * For simplicity, the above example uses `window.ethereum.request`, but you can use any
 * type of JSON-RPC interface.
 *
 * :::
 *
 * @param abiEvent - The event to encode.
 * @param args - The arguments to encode.
 * @returns The encoded event topics.
 */
export function AbiEvent_encode<const abiEvent extends AbiEvent>(
  abiEvent: abiEvent | AbiEvent,
  ...[args]: AbiEvent_encode.Args<abiEvent>
): AbiEvent_encode.ReturnType {
  let topics: (Hex.Hex | Hex.Hex[] | null)[] = []
  if (args && abiEvent.inputs) {
    const indexedInputs = abiEvent.inputs.filter(
      (param) => 'indexed' in param && param.indexed,
    )
    const args_ = Array.isArray(args)
      ? args
      : Object.values(args).length > 0
        ? indexedInputs?.map(
            (x: any, i: number) => (args as any)[x.name ?? i],
          ) ?? []
        : []

    if (args_.length > 0) {
      const encode = (param: AbiParameter, value: unknown) => {
        if (param.type === 'string')
          return Hash_keccak256(Hex.fromString(value as string))
        if (param.type === 'bytes') return Hash_keccak256(value as Hex.Hex)
        if (param.type === 'tuple' || param.type.match(/^(.*)\[(\d+)?\]$/))
          throw new AbiEvent_FilterTypeNotSupportedError(param.type)
        return AbiParameters_encode([param], [value])
      }

      topics =
        indexedInputs?.map((param, i) => {
          if (Array.isArray(args_[i]))
            return args_[i].map((_: any, j: number) =>
              encode(param, args_[i][j]),
            )
          return args_[i] ? encode(param, args_[i]) : null
        }) ?? []
    }
  }

  const selector = (() => {
    if (abiEvent.hash) return abiEvent.hash
    return AbiEvent_getSelector(abiEvent)
  })()

  return { topics: [selector, ...topics] }
}

export declare namespace AbiEvent_encode {
  type Args<abiEvent extends AbiEvent> = IsNarrowable<
    abiEvent,
    AbiEvent
  > extends true
    ? abiEvent['inputs'] extends readonly []
      ? []
      : AbiEvent_ParametersToPrimitiveTypes<
            abiEvent['inputs']
          > extends infer result
        ? result extends readonly []
          ? []
          : [result] | []
        : []
    : [readonly unknown[] | Record<string, unknown>] | []

  type ReturnType = {
    topics: Compute<
      [selector: Hex.Hex, ...(Hex.Hex | readonly Hex.Hex[] | null)[]]
    >
  }

  type ErrorType =
    | AbiParameters_encode.ErrorType
    | AbiEvent_getSelector.ErrorType
    | Hex.fromString.ErrorType
    | Hash_keccak256.ErrorType
    | Errors.GlobalErrorType
}

AbiEvent_encode.parseError = (error: unknown) =>
  /* v8 ignore next */
  error as AbiEvent_encode.ErrorType
