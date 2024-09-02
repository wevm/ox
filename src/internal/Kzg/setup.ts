import type { GlobalErrorType } from '../Errors/error.js'
import { Kzg_from } from './from.js'
import type { Kzg } from './types.js'

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
 *
 * @param value - The KZG object to convert.
 * @param path - The path to the trusted setup file.
 * @returns The KZG interface object.
 */
export function Kzg_setup(options: Kzg_setup.Options, path: string): Kzg {
  try {
    options.loadTrustedSetup(path)
  } catch {}
  return Kzg_from(options)
}

export declare namespace Kzg_setup {
  type Options = Kzg & {
    loadTrustedSetup(path: string): void
  }
  type ErrorType = Kzg_from.ErrorType | GlobalErrorType
}

/* v8 ignore next */
Kzg_setup.parseError = (error: unknown) => error as Kzg_setup.ErrorType
