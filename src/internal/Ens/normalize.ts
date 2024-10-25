import { ens_normalize } from '@adraffy/ens-normalize'
import type * as Errors from '../../Errors.js'

/**
 * Normalizes ENS name according to [ENSIP-15](https://github.com/ensdomains/docs/blob/9edf9443de4333a0ea7ec658a870672d5d180d53/ens-improvement-proposals/ensip-15-normalization-standard.md).
 *
 * For more info see [ENS documentation](https://docs.ens.domains/contract-api-reference/name-processing#normalising-names) on name processing.
 *
 * @example
 * ```ts twoslash
 * import { Ens } from 'ox'
 * Ens.normalize('wevm.eth')
 * // @log: 'wevm.eth'
 * ```
 *
 * @param name - ENS name.
 * @returns Normalized ENS name.
 */
export function Ens_normalize(name: string): string {
  return ens_normalize(name)
}

export declare namespace Ens_normalize {
  type ErrorType = Errors.GlobalErrorType
}

Ens_normalize.parseError = (error: unknown) =>
  /* v8 ignore next */
  error as Ens_normalize.ErrorType
