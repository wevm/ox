import type { ErrorType } from '../errors/Error.js'
import type { Bytes } from '../types/data.js'

export type RandomBytesErrorType = ErrorType

export function randomBytes(length: number): Bytes {
  return crypto.getRandomValues(new Uint8Array(length))
}
