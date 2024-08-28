import type { GlobalErrorType } from '../errors/error.js'
import { Kzg_from } from './from.js'

/**
 * Sets up and returns a KZG interface.
 *
 * @example
 * ```ts twoslash
 * // @noErrors
 * import * as cKzg from 'c-kzg'
 * import { Kzg } from 'ox'
 * import { Path } from 'ox/node'
 *
 * const kzg = Kzg.setup(cKzg, Path.mainnetTrustedSetup)
 * ```
 */
export function Kzg_setup(
  parameters: Kzg_setup.Parameters,
  path: string,
): Kzg_setup.ReturnType {
  try {
    parameters.loadTrustedSetup(path)
  } catch {}
  return Kzg_from(parameters)
}

export declare namespace Kzg_setup {
  type Parameters = Kzg_from.Parameters & {
    loadTrustedSetup(path: string): void
  }
  type ReturnType = Kzg_from.ReturnType
  type ErrorType = Kzg_from.ErrorType | GlobalErrorType
}

/* v8 ignore next */
Kzg_setup.parseError = (error: unknown) => error as Kzg_setup.ErrorType
