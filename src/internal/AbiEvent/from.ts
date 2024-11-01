import * as AbiItem from '../../AbiItem.js'
import type * as Errors from '../../Errors.js'
import type {
  AbiEvent,
  AbiEvent_Signature,
  AbiEvent_Signatures,
} from './types.js'

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
export function AbiEvent_from<
  const abiEvent extends AbiEvent | string | readonly string[],
>(
  abiEvent: (abiEvent | AbiEvent | string | readonly string[]) &
    (
      | (abiEvent extends string ? AbiEvent_Signature<abiEvent> : never)
      | (abiEvent extends readonly string[]
          ? AbiEvent_Signatures<abiEvent>
          : never)
      | AbiEvent
    ),
  options: AbiEvent_from.Options = {},
): AbiEvent_from.ReturnType<abiEvent> {
  return AbiItem.from(abiEvent as AbiEvent, options) as never
}

export declare namespace AbiEvent_from {
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
    AbiItem.from.ReturnType<abiEvent>

  type ErrorType = AbiItem.from.ErrorType | Errors.GlobalErrorType
}

AbiEvent_from.parseEvent = (Event: unknown) =>
  /* v8 ignore next */
  Event as AbiEvent_from.ErrorType
