import type { AbiEventParameter } from 'abitype'
import { Address_isEqual } from '../Address/isEqual.js'
import type { Address } from '../Address/types.js'
import { Bytes_fromString } from '../Bytes/fromString.js'
import type { GlobalErrorType } from '../Errors/error.js'
import { Hash_keccak256 } from '../Hash/keccak256.js'
import type { Hex } from '../Hex/types.js'
import type { IsNarrowable } from '../types.js'
import {
  AbiEvent_ArgsMismatchError,
  AbiEvent_InputNotFoundError,
} from './errors.js'
import type { AbiEvent, AbiEvent_ParametersToPrimitiveTypes } from './types.js'

/**
 * Asserts that the provided arguments match the decoded log arguments.
 *
 * @example
 * ```ts twoslash
 * import { AbiEvent } from 'ox'
 *
 * const abiEvent = AbiEvent.from('event Transfer(address indexed from, address indexed to, uint256 value)')
 *
 * const args = AbiEvent.decode(abiEvent, {
 *   data: '0x0000000000000000000000000000000000000000000000000000000000000001',
 *   topics: [
 *     '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef',
 *     '0x000000000000000000000000a5cc3c03994db5b0d9a5eedd10cabab0813678ac',
 *     '0x000000000000000000000000a5cc3c03994db5b0d9a5eedd10cabab0813678ac',
 *   ],
 * })
 *
 * AbiEvent.assertArgs(abiEvent, args, {
 *   from: '0xa5cc3c03994db5b0d9a5eedd10cabab0813678ad',
 *   to: '0xa5cc3c03994db5b0d9a5eedd10cabab0813678ac',
 *   value: 1n,
 * })
 *
 * // @error: AbiEvent.ArgsMismatchError: Given arguments to not match the arguments decoded from the log.
 * // @error: Event: event Transfer(address indexed from, address indexed to, uint256 value)
 * // @error: Expected Arguments:
 * // @error:   from:   0xa5cc3c03994db5b0d9a5eedd10cabab0813678ac
 * // @error:   to:     0xa5cc3c03994db5b0d9a5eedd10cabab0813678ad
 * // @error:   value:  1
 * // @error: Given Arguments:
 * // @error:   from:   0xa5cc3c03994db5b0d9a5eedd10cabab0813678ad
 * // @error:   to:     0xa5cc3c03994db5b0d9a5eedd10cabab0813678ac
 * // @error:   value:  1
 * ```
 *
 * @param abiEvent - ABI Event to check.
 * @param args - Decoded arguments.
 * @param matchArgs - The arguments to check.
 */
export function AbiEvent_assertArgs<const abiEvent extends AbiEvent>(
  abiEvent: abiEvent | AbiEvent,
  args: unknown,
  matchArgs: IsNarrowable<abiEvent, AbiEvent> extends true
    ? abiEvent['inputs'] extends readonly []
      ? never
      : AbiEvent_ParametersToPrimitiveTypes<
          abiEvent['inputs'],
          { EnableUnion: true; IndexedOnly: false; Required: false }
        >
    : unknown,
) {
  if (!args || !matchArgs)
    throw new AbiEvent_ArgsMismatchError({
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
        throw new AbiEvent_ArgsMismatchError({
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
        throw new AbiEvent_ArgsMismatchError({
          abiEvent,
          expected: args,
          given: matchArgs,
        })
    }
}

export declare namespace AbiEvent_assertArgs {
  type ErrorType =
    | Address_isEqual.ErrorType
    | Bytes_fromString.ErrorType
    | Hash_keccak256.ErrorType
    | AbiEvent_ArgsMismatchError
    | GlobalErrorType
}

AbiEvent_assertArgs.parseError = (error: unknown) =>
  /* v8 ignore next */
  error as AbiEvent_assertArgs.ErrorType
