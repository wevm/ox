import type { GlobalErrorType } from '../errors/error.js'
import type { Kzg } from '../types/kzg.js'

/**
 * Defines a KZG interface.
 *
 * @example
 * ```ts
 * import * as cKzg from 'c-kzg'
 * import { Kzg } from 'ox'
 * import { Path } from 'ox/node'
 *
 * cKzg.loadTrustedSetup(Path.mainnetTrustedSetup)
 *
 * const kzg = Kzg.from(cKzg)
 * ```
 */
export function defineKzg({
  blobToKzgCommitment,
  computeBlobKzgProof,
}: defineKzg.Parameters): defineKzg.ReturnType {
  return {
    blobToKzgCommitment,
    computeBlobKzgProof,
  }
}

export declare namespace defineKzg {
  type Parameters = Kzg
  type ReturnType = Kzg
  type ErrorType = GlobalErrorType
}
