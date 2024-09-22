import type { AbiParameter } from 'abitype'
import { AbiParameters_format } from '../AbiParameters/format.js'
import { BaseError } from '../Errors/base.js'
import type { Hex } from '../Hex/types.js'
import { AbiEvent_format } from './format.js'
import type { AbiEvent } from './types.js'
import { prettyPrint } from '../Errors/utils.js'

export class AbiEvent_ArgsMismatchError extends BaseError {
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

export class AbiEvent_InputNotFoundError extends BaseError {
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

export class AbiEvent_DataMismatchError extends BaseError {
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

export class AbiEvent_TopicsMismatchError extends BaseError {
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

export class AbiEvent_SelectorTopicMismatchError extends BaseError {
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

export class AbiEvent_FilterTypeNotSupportedError extends BaseError {
  override readonly name = 'AbiEvent.FilterTypeNotSupportedError'
  constructor(type: string) {
    super(`Filter type "${type}" is not supported.`)
  }
}
