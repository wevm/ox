import { BaseError } from '../Errors/base.js'
import type { TypedData } from './types.js'

/** Thrown when the bytes size of a typed data value does not match the expected size. */
export class TypedData_BytesSizeMismatchError extends BaseError {
  override readonly name = 'TypedData.BytesSizeMismatchError'

  constructor({
    expectedSize,
    givenSize,
  }: { expectedSize: number; givenSize: number }) {
    super(`Expected bytes${expectedSize}, got bytes${givenSize}.`, {
      docsPath: '/api/glossary/Errors#typeddatabytessizemismatcherror',
    })
  }
}

/** Thrown when the primary type of a typed data value is invalid. */
export class TypedData_InvalidPrimaryTypeError extends BaseError {
  override readonly name = 'TypedData.InvalidPrimaryTypeError'

  constructor({
    primaryType,
    types,
  }: { primaryType: string; types: TypedData | Record<string, unknown> }) {
    super(
      `Invalid primary type \`${primaryType}\` must be one of \`${JSON.stringify(Object.keys(types))}\`.`,
      {
        docsPath: '/api/glossary/Errors#typeddatainvalidprimarytypeerror',
        metaMessages: ['Check that the primary type is a key in `types`.'],
      },
    )
  }
}

/** Thrown when the struct type is not a valid type. */
export class TypedData_InvalidStructTypeError extends BaseError {
  override readonly name = 'TypedData.InvalidStructTypeError'

  constructor({ type }: { type: string }) {
    super(`Struct type "${type}" is invalid.`, {
      metaMessages: ['Struct type must not be a Solidity type.'],
    })
  }
}
