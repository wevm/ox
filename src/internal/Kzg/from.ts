import type { GlobalErrorType } from '../Errors/error.js'
import type { Kzg } from './types.js'

/**
 * Defines a KZG interface.
 *
 * @example
 * ```ts twoslash
 * // @noErrors
 * import * as cKzg from 'c-kzg'
 * import { Kzg } from 'ox'
 * import { Paths } from 'ox/trusted-setups'
 *
 * cKzg.loadTrustedSetup(Paths.mainnet)
 *
 * const kzg = Kzg.from(cKzg)
 * ```
 *
 * @param value - The KZG object to convert.
 * @returns The KZG interface object.
 */
export function Kzg_from(value: Kzg): Kzg {
  const { blobToKzgCommitment, computeBlobKzgProof } = value
  return {
    blobToKzgCommitment,
    computeBlobKzgProof,
  }
}

export declare namespace Kzg_from {
  type ErrorType = GlobalErrorType
}

/* v8 ignore next */
Kzg_from.parseError = (error: unknown) => error as Kzg_from.ErrorType
