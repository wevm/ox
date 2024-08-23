import type { GlobalErrorType } from '../errors/error.js'
import type { LegacySignature, Signature } from '../types/signature.js'
import type { Compute, ExactPartial, OneOf } from '../types/utils.js'
import { toSignature } from './toSignature.js'

/**
 * Extracts a {@link Signature} from an arbitrary object that may include signature properties.
 *
 * @example
 * // TODO
 */
export function extractSignature(
  value: OneOf<ExactPartial<Signature> | ExactPartial<LegacySignature>>,
): extractSignature.ReturnType {
  if (typeof value.r === 'undefined') return undefined
  if (typeof value.s === 'undefined') return undefined
  return toSignature(value as any)
}

export declare namespace extractSignature {
  type ReturnType = Compute<Signature> | undefined
  type ErrorType = GlobalErrorType
}

extractSignature.parseError = (error: unknown) =>
  error as extractSignature.ErrorType
