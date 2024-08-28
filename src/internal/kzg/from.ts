import type { GlobalErrorType } from '../errors/error.js'
import type { Kzg } from './types.js'

/**
 * Defines a KZG interface.
 *
 * @example
 * ```ts twoslash
 * // @noErrors
 * import * as cKzg from 'c-kzg'
 * import { Kzg } from 'ox'
 * import { Path } from 'ox/node'
 *
 * cKzg.loadTrustedSetup(Path.mainnetTrustedSetup)
 *
 * const kzg = Kzg.from(cKzg)
 * ```
 */
export function Kzg_from(parameters: Kzg_from.Parameters): Kzg_from.ReturnType {
  const { blobToKzgCommitment, computeBlobKzgProof } = parameters
  return {
    blobToKzgCommitment,
    computeBlobKzgProof,
  }
}

export declare namespace Kzg_from {
  type Parameters = Kzg
  type ReturnType = Kzg
  type ErrorType = GlobalErrorType
}

/* v8 ignore next */
Kzg_from.parseError = (error: unknown) => error as Kzg_from.ErrorType
