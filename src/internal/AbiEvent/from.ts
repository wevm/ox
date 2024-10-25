import { AbiItem_from } from '../AbiItem/from.js'
import type { GlobalErrorType } from '../Errors/error.js'
import type { AbiEvent, Signature, Signatures } from './types.js'

/**
 * Parses an arbitrary **JSON ABI Event** or **Human Readable ABI Event** into a typed {@link ox#AbiEvent.AbiEvent}.
 *
 * @example
 * ### JSON ABIs
 *
 * ```ts twoslash
 * import { AbiEvent } from 'ox'
 *
 * const transfer = AbiEvent.from({
 *   name: 'Transfer',
 *   type: 'event',
 *   inputs: [
 *     { name: 'from', type: 'address', indexed: true },
 *     { name: 'to', type: 'address', indexed: true },
 *     { name: 'value', type: 'uint256' },
 *   ],
 * })
 *
 * transfer
 * //^?
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
 * @example
 * ### Human Readable ABIs
 *
 * A Human Readable ABI can be parsed into a typed ABI object:
 *
 * ```ts twoslash
 * import { AbiEvent } from 'ox'
 *
 * const transfer = AbiEvent.from(
 *   'event Transfer(address indexed from, address indexed to, uint256 value)' // [!code hl]
 * )
 *
 * transfer
 * //^?
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
 * @param abiEvent - The ABI Event to parse.
 * @returns Typed ABI Event.
 */
export function from<
  const abiEvent extends AbiEvent | string | readonly string[],
>(
  abiEvent: (abiEvent | AbiEvent | string | readonly string[]) &
    (
      | (abiEvent extends string ? Signature<abiEvent> : never)
      | (abiEvent extends readonly string[] ? Signatures<abiEvent> : never)
      | AbiEvent
    ),
  options: from.Options = {},
): from.ReturnType<abiEvent> {
  return AbiItem_from(abiEvent as AbiEvent, options) as never
}

export declare namespace from {
  type Options = {
    /**
     * Whether or not to prepare the extracted event (optimization for encoding performance).
     * When `true`, the `hash` property is computed and included in the returned value.
     *
     * @default true
     */
    prepare?: boolean | undefined
  }

  type ReturnType<abiEvent extends AbiEvent | string | readonly string[]> =
    AbiItem_from.ReturnType<abiEvent>

  type ErrorType = AbiItem_from.ErrorType | GlobalErrorType
}

from.parseEvent = (Event: unknown) =>
  /* v8 ignore next */
  Event as from.ErrorType
