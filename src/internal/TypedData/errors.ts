import { BaseError } from '../Errors/base.js'
import type { TypedData } from './types.js'

export class TypedData_BytesSizeMismatchError extends BaseError {
  override readonly name = 'TypedData.BytesSizeMismatchError'

  constructor({
    expectedSize,
    givenSize,
  }: { expectedSize: number; givenSize: number }) {
    super(`Expected bytes${expectedSize}, got bytes${givenSize}.`, {
      docsPath: '/errors#typeddatabytessizemismatcherror',
    })
  }
}

export class TypedData_InvalidPrimaryTypeError extends BaseError {
  override readonly name = 'TypedData.InvalidPrimaryTypeError'

  constructor({
    primaryType,
    types,
  }: { primaryType: string; types: TypedData | Record<string, unknown> }) {
    super(
      `Invalid primary type \`${primaryType}\` must be one of \`${JSON.stringify(Object.keys(types))}\`.`,
      {
        docsPath: '/errors#typeddatainvalidprimarytypeerror',
        metaMessages: ['Check that the primary type is a key in `types`.'],
      },
    )
  }
}
