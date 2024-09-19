// TODO: maybe nuke this and add `AbiEvent.assertArgs`.

import type { AbiEventParameter } from 'abitype'
import { AbiEvent_decode } from '../AbiEvent/decode.js'
import { AbiEvent_InputNotFoundError } from '../AbiEvent/errors.js'
import type {
  AbiEvent,
  AbiEvent_ParametersToPrimitiveTypes,
} from '../AbiEvent/types.js'
import { Address_isEqual } from '../Address/isEqual.js'
import type { Address } from '../Address/types.js'
import { Bytes_fromString } from '../Bytes/from.js'
import type { GlobalErrorType } from '../Errors/error.js'
import { Hash_keccak256 } from '../Hash/keccak256.js'
import type { Hex } from '../Hex/types.js'
import type { Compute } from '../types.js'
import { Log_ArgsMismatchError } from './errors.js'

/**
 * Decodes the provided log `topics` + `data` into arguments, and asserts that any provided arguments (`matchArgs`) match the decoded arguments.
 *
 * @example
 * ```ts twoslash
 * import { AbiEvent, Log } from 'ox'
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
 * const args = Log.toArgs(log, { abiEvent: transfer })
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
 * The following example demonstrates how we can parse a set of RPC logs from the network into
 * decoded event arguments (`args`), event name (`event`), and a {@link ox#Log.Log}.
 *
 * ```ts twoslash
 * import 'ox/window'
 * import { Abi, AbiEvent, Hex, Log } from 'ox'
 *
 * const abi = Abi.from([
 *   'event Transfer(address indexed from, address indexed to, uint256 value)',
 *   'event Approval(address indexed owner, address indexed spender, uint256 value)',
 * ])
 *
 * const rpcLogs = await window.ethereum!.request({
 *   method: 'eth_getLogs',
 *   params: [
 *     {
 *       fromBlock: Hex.fromNumber(6942069n),
 *       toBlock: Hex.fromNumber(6943069n),
 *     },
 *   ],
 * })
 *
 * const logs = rpcLogs.map(rpcLog => {
 *   try {
 *     const log = Log.fromRpc(rpcLog)
 *     const abiEvent = AbiEvent.fromAbi(abi, { name: log.topics[0] })
 *     return {
 *       ...log,
 *       args: Log.toArgs(log, { abiEvent }),
 *       event: abiEvent.name,
 *     }
 *   } catch {
 *     return null
 *   }
 * }).filter(Boolean)
 * // @log: [
 * // @log:   {
 * // @log:     args: {
 * // @log:       from: '0xa5cc3c03994db5b0d9a5eedd10cabab0813678ac',
 * // @log:       to: '0xa5cc3c03994db5b0d9a5eedd10cabab0813678ac',
 * // @log:       value: 1n
 * // @log:     },
 * // @log:     event: 'Transfer',
 * // @log:     data: '0x0000000000000000000000000000000000000000000000000000000000000001',
 * // @log:     topics: [
 * // @log:       '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef',
 * // @log:       '0x000000000000000000000000a5cc3c03994db5b0d9a5eedd10cabab0813678ac',
 * // @log:       '0x000000000000000000000000a5cc3c03994db5b0d9a5eedd10cabab0813678ac',
 * // @log:     ],
 * // @log:     address: '0xfba3912ca04dd458c843e2ee08967fc04f3579c2',
 * // @log:     blockHash: '0xabe69134e80a12f6a93d0aa18215b5b86c2fb338bae911790ca374a8716e01a4',
 * // @log:     blockNumber: 19760236n,
 * // @log:     logIndex: 271,
 * // @log:     removed: false,
 * // @log:     transactionIndex: 145,
 * // @log:   },
 * // @log:   // ...
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
 * @param log - The log to decode.
 * @param options - Decoding options.
 * @returns The decoded arguments.
 */
export function Log_toArgs<const abiEvent extends AbiEvent>(
  log: Log_toArgs.Log,
  options: Log_toArgs.Options<abiEvent>,
) {
  const { abiEvent, matchArgs } = options

  const args = AbiEvent_decode(abiEvent, log)

  // Check that the decoded arguments match the provided arguments (if given).
  if (matchArgs)
    assertArgs({
      abiEvent,
      args,
      matchArgs,
    })

  return args
}

export declare namespace Log_toArgs {
  type Log = Compute<{
    data?: Hex | undefined
    topics: readonly Hex[]
  }>

  type Options<abiEvent extends AbiEvent = AbiEvent> = {
    /** ABI Event to use for decoding. If the topics do not match the ABI Event signature, an error is thrown. */
    abiEvent: abiEvent | AbiEvent
    /** Arguments to match against the decoded arguments. If no match is found, an error is thrown. */
    matchArgs?:
      | AbiEvent_ParametersToPrimitiveTypes<
          abiEvent['inputs'],
          {
            EnableUnion: true
            IndexedOnly: false
            Required: false
          }
        >
      | undefined
  }

  type ErrorType = AbiEvent_decode.ErrorType | GlobalErrorType
}

/** @internal */
function assertArgs(parameters: {
  abiEvent: AbiEvent
  args: unknown
  matchArgs: NonNullable<unknown>
}) {
  const { abiEvent, args, matchArgs } = parameters

  if (!args)
    throw new Log_ArgsMismatchError({
      abiEvent,
      expected: args,
      given: matchArgs,
    })

  function isEqual(input: AbiEventParameter, value: unknown, arg: unknown) {
    if (input.type === 'address')
      return Address_isEqual(value as Address, arg as Address)
    if (input.type === 'string')
      return Hash_keccak256(Bytes_fromString(value as string)) === arg
    if (input.type === 'bytes') return Hash_keccak256(value as Hex) === arg
    return value === arg
  }

  if (Array.isArray(args) && Array.isArray(matchArgs)) {
    for (const [index, value] of matchArgs.entries()) {
      if (value === null) continue
      const input = abiEvent.inputs[index]
      if (!input)
        throw new AbiEvent_InputNotFoundError({
          abiEvent,
          name: `${index}`,
        })
      const value_ = Array.isArray(value) ? value : [value]
      let equal = false
      for (const value of value_) {
        if (isEqual(input, value, args[index])) equal = true
      }
      if (!equal)
        throw new Log_ArgsMismatchError({
          abiEvent,
          expected: args,
          given: matchArgs,
        })
    }
  }

  if (
    typeof args === 'object' &&
    !Array.isArray(args) &&
    typeof matchArgs === 'object' &&
    !Array.isArray(matchArgs)
  )
    for (const [key, value] of Object.entries(matchArgs)) {
      if (value === null) continue
      const input = abiEvent.inputs.find((input) => input.name === key)
      if (!input) throw new AbiEvent_InputNotFoundError({ abiEvent, name: key })
      const value_ = Array.isArray(value) ? value : [value]
      let equal = false
      for (const value of value_) {
        if (isEqual(input, value, (args as Record<string, unknown>)[key]))
          equal = true
      }
      if (!equal)
        throw new Log_ArgsMismatchError({
          abiEvent,
          expected: args,
          given: matchArgs,
        })
    }
}
