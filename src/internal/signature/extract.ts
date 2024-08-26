import type { GlobalErrorType } from '../errors/error.js'
import type { Signature, Signature_Legacy } from '../types/signature.js'
import type { Compute, ExactPartial, OneOf } from '../types/utils.js'
import { Signature_from } from './from.js'

/**
 * Extracts a {@link Signature#Signature} from an arbitrary object that may include signature properties.
 *
 * @example
 * // TODO
 */
export function Signature_extract(
  value: OneOf<ExactPartial<Signature> | ExactPartial<Signature_Legacy>>,
): Signature_extract.ReturnType {
  if (typeof value.r === 'undefined') return undefined
  if (typeof value.s === 'undefined') return undefined
  return Signature_from(value as any)
}

export declare namespace Signature_extract {
  type ReturnType = Compute<Signature> | undefined
  type ErrorType = GlobalErrorType
}

Signature_extract.parseError = (error: unknown) =>
  /* v8 ignore next */
  error as Signature_extract.ErrorType
