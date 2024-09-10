import { AbiEvent_format } from '../AbiEvent/format.js'
import type { AbiEvent } from '../AbiEvent/types.js'
import { BaseError } from '../Errors/base.js'
import { prettyPrint } from '../Errors/utils.js'

export class ParseLogArgsMismatchError extends BaseError {
  override readonly name = 'ParseLogArgsMismatchError'

  constructor({
    abiEvent,
    expected,
    given,
  }: {
    abiEvent: AbiEvent
    expected: unknown
    given: unknown
  }) {
    super(
      'Provided arguments to not match the arguments decoded from the log.',
      {
        metaMessages: [
          `Event: ${AbiEvent_format(abiEvent)}`,
          `Decoded Arguments: ${!expected ? 'None' : ''}`,
          expected ? prettyPrint(expected) : undefined,
          `Provided Arguments: ${!given ? 'None' : ''}`,
          given ? prettyPrint(given) : undefined,
        ],
      },
    )
  }
}
