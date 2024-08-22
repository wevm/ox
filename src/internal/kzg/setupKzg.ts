import type { GlobalErrorType } from '../errors/error.js'
import { defineKzg } from './defineKzg.js'

/**
 * Sets up and returns a KZG interface.
 *
 * @example
 * ```ts
 * import * as cKzg from 'c-kzg'
 * import { Kzg } from 'ox'
 * import { Path } from 'ox/node'
 *
 * const kzg = Kzg.setup(cKzg, Path.mainnetTrustedSetup)
 * ```
 */
export function setupKzg(
  parameters: setupKzg.Parameters,
  path: string,
): setupKzg.ReturnType {
  try {
    parameters.loadTrustedSetup(path)
  } catch {}
  return defineKzg(parameters)
}

export declare namespace setupKzg {
  type Parameters = defineKzg.Parameters & {
    loadTrustedSetup(path: string): void
  }
  type ReturnType = defineKzg.ReturnType
  type ErrorType = defineKzg.ErrorType | GlobalErrorType
}

setupKzg.parseError = (error: unknown) => error as setupKzg.ErrorType
