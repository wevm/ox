import type { AbiParameter } from 'abitype'
import { Errors } from '../../Errors.js'
import type { Hex } from '../../Hex.js'
import { AbiParameters_format } from '../AbiParameters/format.js'
import { prettyPrint } from '../Errors/utils.js'
import { AbiEvent_format } from './format.js'
import type { AbiEvent } from './types.js'

/**
 * Thrown when the provided arguments do not match the expected arguments.
 *
 * @example
 * ```ts twoslash
 * import { AbiEvent } from 'ox'
 *
 * const abiEvent = AbiEvent.from(
 *   'event Transfer(address indexed from, address indexed to, uint256 value)',
 * )
 *
 * const args = AbiEvent.decode(abiEvent, {
 *   data: '0x0000000000000000000000000000000000000000000000000000000000000001',
 *   topics: [
 *     '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef',
 *     '0x000000000000000000000000a5cc3c03994db5b0d9a5eedd10cabab0813678ac',
 *     '0x000000000000000000000000a5cc3c03994db5b0d9a5eedd10cabab0813678ad',
 *   ],
 * })
 *
 * AbiEvent.assertArgs(abiEvent, args, {
 *   from: '0xa5cc3c03994db5b0d9a5eedd10cabab0813678ad',
 *   to: '0xa5cc3c03994db5b0d9a5eedd10cabab0813678ac',
 *   value: 1n,
 * })
 * // @error: AbiEvent.ArgsMismatchError: Given arguments do not match the expected arguments.
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
 * ### Solution
 *
 * The provided arguments need to match the expected arguments.
 *
 * ```ts twoslash
 * // @noErrors
 * import { AbiEvent } from 'ox'
 *
 * const abiEvent = AbiEvent.from(
 *   'event Transfer(address indexed from, address indexed to, uint256 value)',
 * )
 *
 * const args = AbiEvent.decode(abiEvent, {
 *   data: '0x0000000000000000000000000000000000000000000000000000000000000001',
 *   topics: [
 *     '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef',
 *     '0x000000000000000000000000a5cc3c03994db5b0d9a5eedd10cabab0813678ac',
 *     '0x000000000000000000000000a5cc3c03994db5b0d9a5eedd10cabab0813678ad',
 *   ],
 * })
 *
 * AbiEvent.assertArgs(abiEvent, args, {
 *   from: '0xa5cc3c03994db5b0d9a5eedd10cabab0813678ad', // [!code --]
 *   from: '0xa5cc3c03994db5b0d9a5eedd10cabab0813678ac', // [!code ++]
 *   to: '0xa5cc3c03994db5b0d9a5eedd10cabab0813678ac', // [!code --]
 *   to: '0xa5cc3c03994db5b0d9a5eedd10cabab0813678ad', // [!code ++]
 *   value: 1n,
 * })
 * ```
 */
export class AbiEvent_ArgsMismatchError extends Errors.BaseError {
  override readonly name = 'AbiEvent.ArgsMismatchError'

  constructor({
    abiEvent,
    expected,
    given,
  }: {
    abiEvent: AbiEvent
    expected: unknown
    given: unknown
  }) {
    super('Given arguments do not match the expected arguments.', {
      metaMessages: [
        `Event: ${AbiEvent_format(abiEvent)}`,
        `Expected Arguments: ${!expected ? 'None' : ''}`,
        expected ? prettyPrint(expected) : undefined,
        `Given Arguments: ${!given ? 'None' : ''}`,
        given ? prettyPrint(given) : undefined,
      ],
    })
  }
}

/**
 * Thrown when no argument was found on the event signature.
 *
 * @example
 * ```ts twoslash
 * // @noErrors
 * import { AbiEvent } from 'ox'
 *
 * const abiEvent = AbiEvent.from(
 *   'event Transfer(address indexed from, address indexed to, uint256 value)',
 * )
 *
 * const args = AbiEvent.decode(abiEvent, {
 *   data: '0x0000000000000000000000000000000000000000000000000000000000000001',
 *   topics: [
 *     '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef',
 *     '0x000000000000000000000000a5cc3c03994db5b0d9a5eedd10cabab0813678ac',
 *     '0x000000000000000000000000a5cc3c03994db5b0d9a5eedd10cabab0813678ad',
 *   ],
 * })
 *
 * AbiEvent.assertArgs(abiEvent, args, {
 *   a: 'b',
 *   from: '0xa5cc3c03994db5b0d9a5eedd10cabab0813678ac',
 *   to: '0xa5cc3c03994db5b0d9a5eedd10cabab0813678ad',
 *   value: 1n,
 * })
 * // @error: AbiEvent.InputNotFoundError: Parameter "a" not found on `event Transfer(address indexed from, address indexed to, uint256 value)`.
 * ```
 *
 * ### Solution
 *
 * Ensure the arguments match the event signature.
 *
 * ```ts twoslash
 * // @noErrors
 * import { AbiEvent } from 'ox'
 *
 * const abiEvent = AbiEvent.from(
 *   'event Transfer(address indexed from, address indexed to, uint256 value)',
 * )
 *
 * const args = AbiEvent.decode(abiEvent, {
 *   data: '0x0000000000000000000000000000000000000000000000000000000000000001',
 *   topics: [
 *     '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef',
 *     '0x000000000000000000000000a5cc3c03994db5b0d9a5eedd10cabab0813678ac',
 *     '0x000000000000000000000000a5cc3c03994db5b0d9a5eedd10cabab0813678ad',
 *   ],
 * })
 *
 * AbiEvent.assertArgs(abiEvent, args, {
 *   a: 'b', // [!code --]
 *   from: '0xa5cc3c03994db5b0d9a5eedd10cabab0813678ac',
 *   to: '0xa5cc3c03994db5b0d9a5eedd10cabab0813678ad',
 *   value: 1n,
 * })
 * ```
 */
export class AbiEvent_InputNotFoundError extends Errors.BaseError {
  override readonly name = 'AbiEvent.InputNotFoundError'

  constructor({
    abiEvent,
    name,
  }: {
    abiEvent: AbiEvent
    name: string
  }) {
    super(`Parameter "${name}" not found on \`${AbiEvent_format(abiEvent)}\`.`)
  }
}

/**
 * Thrown when the provided data size does not match the expected size from the non-indexed parameters.
 *
 * @example
 * ```ts twoslash
 * import { AbiEvent } from 'ox'
 *
 * const abiEvent = AbiEvent.from(
 *   'event Transfer(address indexed from, address to, uint256 value)',
 *   //                                    ↑ 32 bytes + ↑ 32 bytes = 64 bytes
 * )
 *
 * const args = AbiEvent.decode(abiEvent, {
 *   data: '0x0000000000000000000000000000000000000000000000000000000023c34600',
 *   //       ↑ 32 bytes ❌
 *   topics: [
 *     '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef',
 *     '0x000000000000000000000000f39fd6e51aad88f6f4ce6ab8827279cfffb92266',
 *   ],
 * })
 * // @error: AbiEvent.DataMismatchError: Data size of 32 bytes is too small for non-indexed event parameters.
 * // @error: Non-indexed Parameters: (address to, uint256 value)
 * // @error: Data:   0x0000000000000000000000000000000000000000000000000000000023c34600 (32 bytes)
 * ```
 *
 * ### Solution
 *
 * Ensure that the data size matches the expected size.
 *
 * ```ts twoslash
 * import { AbiEvent } from 'ox'
 *
 * const abiEvent = AbiEvent.from(
 *   'event Transfer(address indexed from, address to, uint256 value)',
 *   //                                    ↑ 32 bytes + ↑ 32 bytes = 64 bytes
 * )
 *
 * const args = AbiEvent.decode(abiEvent, {
 *   data: '0x0x000000000000000000000000f39fd6e51aad88f6f4ce6ab8827279cfffb922660000000000000000000000000000000000000000000000000000000023c34600',
 *   //       ↑ 64 bytes ✅
 *   topics: [
 *     '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef',
 *     '0x000000000000000000000000f39fd6e51aad88f6f4ce6ab8827279cfffb92266',
 *   ],
 * })
 * ```
 */
export class AbiEvent_DataMismatchError extends Errors.BaseError {
  override readonly name = 'AbiEvent.DataMismatchError'

  abiEvent: AbiEvent
  data: Hex
  parameters: readonly AbiParameter[]
  size: number

  constructor({
    abiEvent,
    data,
    parameters,
    size,
  }: {
    abiEvent: AbiEvent
    data: Hex
    parameters: readonly AbiParameter[]
    size: number
  }) {
    super(
      [
        `Data size of ${size} bytes is too small for non-indexed event parameters.`,
      ].join('\n'),
      {
        metaMessages: [
          `Non-indexed Parameters: (${AbiParameters_format(parameters as any)})`,
          `Data:   ${data} (${size} bytes)`,
        ],
      },
    )

    this.abiEvent = abiEvent
    this.data = data
    this.parameters = parameters
    this.size = size
  }
}

/**
 * Thrown when the provided topics do not match the expected number of topics.
 *
 * @example
 * ```ts twoslash
 * import { AbiEvent } from 'ox'
 *
 * const abiEvent = AbiEvent.from(
 *   'event Transfer(address indexed from, address indexed to, uint256 value)',
 * )
 *
 * const args = AbiEvent.decode(abiEvent, {
 *   data: '0x0000000000000000000000000000000000000000000000000000000000000001',
 *   topics: [
 *     '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef',
 *     '0x000000000000000000000000a5cc3c03994db5b0d9a5eedd10cabab0813678ac',
 *   ],
 * })
 * // @error: AbiEvent.TopicsMismatchError: Expected a topic for indexed event parameter "to" for "event Transfer(address indexed from, address indexed to, uint256 value)".
 * ```
 *
 * ### Solution
 *
 * Ensure that the topics match the expected number of topics.
 *
 * ```ts twoslash
 * import { AbiEvent } from 'ox'
 *
 * const abiEvent = AbiEvent.from(
 *   'event Transfer(address indexed from, address indexed to, uint256 value)',
 * )
 *
 * const args = AbiEvent.decode(abiEvent, {
 *   data: '0x0000000000000000000000000000000000000000000000000000000000000001',
 *   topics: [
 *     '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef',
 *     '0x000000000000000000000000a5cc3c03994db5b0d9a5eedd10cabab0813678ac',
 *     '0x000000000000000000000000f39fd6e51aad88f6f4ce6ab8827279cfffb92266', // [!code ++]
 *   ],
 * })
 * ```
 *
 */
export class AbiEvent_TopicsMismatchError extends Errors.BaseError {
  override readonly name = 'AbiEvent.TopicsMismatchError'

  abiEvent: AbiEvent

  constructor({
    abiEvent,
    param,
  }: {
    abiEvent: AbiEvent
    param: AbiParameter & { indexed: boolean }
  }) {
    super(
      [
        `Expected a topic for indexed event parameter${
          param.name ? ` "${param.name}"` : ''
        } for "${AbiEvent_format(abiEvent)}".`,
      ].join('\n'),
    )

    this.abiEvent = abiEvent
  }
}

/**
 * Thrown when the provided selector does not match the expected selector.
 *
 * @example
 * ```ts twoslash
 * import { AbiEvent } from 'ox'
 *
 * const transfer = AbiEvent.from(
 *   'event Transfer(address indexed from, address indexed to, bool sender)',
 * )
 *
 * AbiEvent.decode(transfer, {
 *   topics: [
 *     '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef',
 *     '0x000000000000000000000000d8da6bf26964af9d7eed9e03e53415d37aa96045',
 *     '0x000000000000000000000000f39fd6e51aad88f6f4ce6ab8827279cfffb92266',
 *   ],
 * })
 * // @error: AbiEvent.SelectorTopicMismatchError: topics[0]="0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef" does not match the expected topics[0]="0x3da3cd3cf420c78f8981e7afeefa0eab1f0de0eb56e78ad9ba918ed01c0b402f".
 * // @error: Event: event Transfer(address indexed from, address indexed to, bool sender)
 * // @error: Selector: 0x3da3cd3cf420c78f8981e7afeefa0eab1f0de0eb56e78ad9ba918ed01c0b402f
 * ```
 *
 * ### Solution
 *
 * Ensure that the provided selector matches the selector of the event signature.
 *
 * ```ts twoslash
 * import { AbiEvent } from 'ox'
 *
 * const transfer = AbiEvent.from(
 *   'event Transfer(address indexed from, address indexed to, bool sender)',
 * )
 *
 * AbiEvent.decode(transfer, {
 *   topics: [
 *     '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef', // [!code --]
 *     '0x3da3cd3cf420c78f8981e7afeefa0eab1f0de0eb56e78ad9ba918ed01c0b402f', // [!code ++]
 *     '0x000000000000000000000000d8da6bf26964af9d7eed9e03e53415d37aa96045',
 *     '0x000000000000000000000000f39fd6e51aad88f6f4ce6ab8827279cfffb92266',
 *   ],
 * })
 * ```
 */
export class AbiEvent_SelectorTopicMismatchError extends Errors.BaseError {
  override readonly name = 'AbiEvent.SelectorTopicMismatchError'

  constructor({
    abiEvent,
    actual,
    expected,
  }: {
    abiEvent: AbiEvent
    actual: Hex | undefined
    expected: Hex
  }) {
    super(
      `topics[0]="${actual}" does not match the expected topics[0]="${expected}".`,
      {
        metaMessages: [
          `Event: ${AbiEvent_format(abiEvent)}`,
          `Selector: ${expected}`,
        ],
      },
    )
  }
}

/**
 * Thrown when the provided filter type is not supported.
 *
 * @example
 * ```ts twoslash
 * import { AbiEvent } from 'ox'
 *
 * const transfer = AbiEvent.from('event Transfer((string) indexed a, string b)')
 *
 * AbiEvent.encode(transfer, {
 *   a: ['hello'],
 * })
 * // @error: AbiEvent.FilterTypeNotSupportedError: Filter type "tuple" is not supported.
 * ```
 *
 * ### Solution
 *
 * Provide a valid event input type.
 *
 * ```ts twoslash
 * // @noErrors
 * import { AbiEvent } from 'ox'
 *
 * const transfer = AbiEvent.from('event Transfer((string) indexed a, string b)') // [!code --]
 * const transfer = AbiEvent.from('event Transfer(string indexed a, string b)') // [!code ++]
 * ```
 *
 *
 */
export class AbiEvent_FilterTypeNotSupportedError extends Errors.BaseError {
  override readonly name = 'AbiEvent.FilterTypeNotSupportedError'
  constructor(type: string) {
    super(`Filter type "${type}" is not supported.`)
  }
}
