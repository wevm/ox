import type { AbiParameter } from 'abitype'
import { BaseError } from '../Errors/base.js'
import type { Hex } from '../Hex/types.js'
import type { AbiEvent } from './types.js'
import { AbiEvent_format } from './format.js'
import { AbiParameters_format } from '../AbiParameters/format.js'

export class DecodeLogDataMismatchError extends BaseError {
  override readonly name = 'DecodeLogDataMismatchError'

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

export class DecodeLogTopicsMismatchError extends BaseError {
  override readonly name = 'DecodeLogTopicsMismatchError'

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

export class FilterTypeNotSupportedError extends BaseError {
  override readonly name = 'FilterTypeNotSupportedError'
  constructor(type: string) {
    super(`Filter type "${type}" is not supported.`)
  }
}
