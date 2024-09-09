import type { AbiParameter } from 'abitype'
import { AbiParameters_decode } from '../AbiParameters/decode.js'
import { AbiDecodingDataSizeTooSmallError } from '../AbiParameters/errors.js'
import { PositionOutOfBoundsError } from '../Errors/cursor.js'
import type { GlobalErrorType } from '../Errors/error.js'
import { Hex_size } from '../Hex/size.js'
import type { Hex } from '../Hex/types.js'
import type { IsNarrowable } from '../types.js'
import {
  EventDataMismatchError,
  EventSelectorTopicMismatchError,
  EventTopicsMismatchError,
} from './errors.js'
import { AbiEvent_getSelector } from './getSelector.js'
import type { AbiEvent, AbiEvent_ParametersToPrimitiveTypes } from './types.js'

/**
 * ABI-Decodes the provided [Log Topics and Data](https://info.etherscan.com/what-is-event-logs/) according to the ABI Event's parameter types (`input`).
 *
 * :::tip
 *
 * This function is typically used to decode an [Event Log](https://info.etherscan.com/what-is-event-logs/) that may be returned from a Log Query (e.g. `eth_getLogs`) or Transaction Receipt.
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
 * const log = {
 *   // ...
 *   data: '0x0000000000000000000000000000000000000000000000000000000000000001',
 *   topics: [
 *     '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef',
 *     '0x000000000000000000000000a5cc3c03994db5b0d9a5eedd10cabab0813678ac',
 *     '0x000000000000000000000000a5cc3c03994db5b0d9a5eedd10cabab0813678ac',
 *   ],
 * } as const
 *
 * const decoded = AbiEvent.decode(transfer, log)
 * // @log: {
 * // @log:   from: '0xa5cc3c03994db5b0d9a5eedd10cabab0813678ac',
 * // @log:   to: '0xa5cc3c03994db5b0d9a5eedd10cabab0813678ac',
 * // @log:   value: 1n
 * // @log: }
 * ```
 *
 * @example
 * ### End-to-end
 *
 * Below is an end-to-end example of using `AbiEvent.decode` to decode the topics of a `Transfer` event on the [Wagmi Mint Example contract](https://etherscan.io/address/0xfba3912ca04dd458c843e2ee08967fc04f3579c2).
 *
 * ```ts twoslash
 * // @noErrors
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
 * const logs = await window.ethereum.request({
 *   method: 'eth_getLogs',
 *   params: [
 *     {
 *       address: '0xfba3912ca04dd458c843e2ee08967fc04f3579c2',
 *       fromBlock: Hex.from(19760235n),
 *       toBlock: Hex.from(19760240n),
 *       topics,
 *     },
 *   ],
 * })
 *
 * // 4. Decode the Log. // [!code focus]
 * const decoded = AbiEvent.decode(transfer, logs[0]!) // [!code focus]
 * // @log: {
 * // @log:   from: '0xa5cc3c03994db5b0d9a5eedd10cabab0813678ac',
 * // @log:   to: '0xa5cc3c03994db5b0d9a5eedd10cabab0813678ac',
 * // @log:   value: 603n
 * // @log: }
 * ```
 *
 * @param abiEvent - The ABI Event to decode.
 * @param log - `topics` & `data` to decode.
 * @returns The decoded event.
 */
export function AbiEvent_decode<const abiEvent extends AbiEvent>(
  abiEvent: abiEvent | AbiEvent,
  log: AbiEvent_decode.Log,
): AbiEvent_decode.ReturnType<abiEvent> {
  const { data, topics } = log

  const [selector_, ...argTopics] = topics

  const selector = AbiEvent_getSelector(abiEvent)
  if (selector_ !== selector)
    throw new EventSelectorTopicMismatchError({
      abiEvent,
      actual: selector_,
      expected: selector,
    })

  const { inputs } = abiEvent
  const isUnnamed = inputs?.every((x) => !('name' in x && x.name))

  let args: any = isUnnamed ? [] : {}

  // Decode topics (indexed args).
  const indexedInputs = inputs.filter((x) => 'indexed' in x && x.indexed)
  for (let i = 0; i < indexedInputs.length; i++) {
    const param = indexedInputs[i]!
    const topic = argTopics[i]
    if (!topic)
      throw new EventTopicsMismatchError({
        abiEvent,
        param: param as AbiParameter & { indexed: boolean },
      })
    args[isUnnamed ? i : param.name || i] = (() => {
      if (
        param.type === 'string' ||
        param.type === 'bytes' ||
        param.type === 'tuple' ||
        param.type.match(/^(.*)\[(\d+)?\]$/)
      )
        return topic
      const decoded = AbiParameters_decode([param], topic) || []
      return decoded[0]
    })()
  }

  // Decode data (non-indexed args).
  const nonIndexedInputs = inputs.filter((x) => !('indexed' in x && x.indexed))
  if (nonIndexedInputs.length > 0) {
    if (data && data !== '0x') {
      try {
        const decodedData = AbiParameters_decode(nonIndexedInputs, data)
        if (decodedData) {
          if (isUnnamed) args = [...args, ...decodedData]
          else {
            for (let i = 0; i < nonIndexedInputs.length; i++) {
              const index = inputs.indexOf(nonIndexedInputs[i]!)
              args[nonIndexedInputs[i]!.name! || index] = decodedData[i]
            }
          }
        }
      } catch (err) {
        if (
          err instanceof AbiDecodingDataSizeTooSmallError ||
          err instanceof PositionOutOfBoundsError
        )
          throw new EventDataMismatchError({
            abiEvent,
            data: data,
            parameters: nonIndexedInputs,
            size: Hex_size(data),
          })
        throw err
      }
    } else {
      throw new EventDataMismatchError({
        abiEvent,
        data: '0x',
        parameters: nonIndexedInputs,
        size: 0,
      })
    }
  }

  return Object.values(args).length > 0 ? args : undefined
}

export declare namespace AbiEvent_decode {
  type Log = {
    data?: Hex | undefined
    topics: readonly Hex[]
  }

  type ReturnType<abiEvent extends AbiEvent = AbiEvent> = IsNarrowable<
    abiEvent,
    AbiEvent
  > extends true
    ? abiEvent['inputs'] extends readonly []
      ? undefined
      : AbiEvent_ParametersToPrimitiveTypes<
          abiEvent['inputs'],
          { EnableUnion: false; IndexedOnly: false; Required: true }
        >
    : unknown

  type ErrorType =
    | AbiParameters_decode.ErrorType
    | AbiEvent_getSelector.ErrorType
    | EventDataMismatchError
    | EventSelectorTopicMismatchError
    | EventTopicsMismatchError
    | GlobalErrorType
}

AbiEvent_decode.parseError = (error: unknown) =>
  /** v8 ignore next */
  error as AbiEvent_decode.ErrorType
