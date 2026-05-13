import { ens_normalize } from '@adraffy/ens-normalize'
import type * as Errors from './Errors.js'

/**
 * Normalizes ENS name according to [ENSIP-15](https://github.com/ensdomains/docs/blob/9edf9443de4333a0ea7ec658a870672d5d180d53/ens-improvement-proposals/ensip-15-normalization-standard.md).
 *
 * For more info see [ENS documentation](https://docs.ens.domains/contract-api-reference/name-processing#normalising-names) on name processing.
 *
 * Importing from `ox/EnsNormalize` keeps the `@adraffy/ens-normalize`
 * payload off the critical path for consumers that only need
 * `Ens.labelhash` / `Ens.namehash` / DNS packet encoding on already
 * normalized names. {@link ox#Ens.(normalize:function)} is preserved for
 * backwards compatibility and re-exports this same implementation.
 *
 * @example
 * ```ts twoslash
 * import * as EnsNormalize from 'ox/EnsNormalize'
 * EnsNormalize.normalize('wevm.eth')
 * // @log: 'wevm.eth'
 * ```
 *
 * @param name - ENS name.
 * @returns Normalized ENS name.
 */
export function normalize(name: string): string {
  return ens_normalize(name)
}

export declare namespace normalize {
  type ErrorType = Errors.GlobalErrorType
}
