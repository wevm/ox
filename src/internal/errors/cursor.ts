import { BaseError } from './base.js'

export class NegativeOffsetError extends BaseError {
  override readonly name = 'NegativeOffsetError'

  constructor({ offset }: { offset: number }) {
    super(`Offset \`${offset}\` cannot be negative.`)
  }
}

export class PositionOutOfBoundsError extends BaseError {
  override readonly name = 'PositionOutOfBoundsError'

  constructor({ length, position }: { length: number; position: number }) {
    super(
      `Position \`${position}\` is out of bounds (\`0 < position < ${length}\`).`,
    )
  }
}

export class RecursiveReadLimitExceededError extends BaseError {
  override readonly name = 'RecursiveReadLimitExceededError'

  constructor({ count, limit }: { count: number; limit: number }) {
    super(
      `Recursive read limit of \`${limit}\` exceeded (recursive read count: \`${count}\`).`,
    )
  }
}
