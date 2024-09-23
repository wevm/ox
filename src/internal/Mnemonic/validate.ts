import { validateMnemonic } from '@scure/bip39'
import type { GlobalErrorType } from '../Errors/error.js'

/**
 * Checks if a mnemonic is valid, given a wordlist.
 *
 * @example
 * ```ts twoslash
 * import { Mnemonic } from 'ox'
 *
 * const mnemonic = Mnemonic.validate(
 *   'buyer zoo end danger ice capable shrug naive twist relief mass bonus',
 *   Mnemonic.english
 * )
 * // @log: true
 * ```
 *
 * @param mnemonic - The mnemonic to validate.
 * @param wordlist - The wordlist to use.
 * @returns Whether the mnemonic is valid.
 */
export function Mnemonic_validate(
  mnemonic: string,
  wordlist: string[],
): boolean {
  return validateMnemonic(mnemonic, wordlist)
}

export declare namespace Mnemonic_validate {
  type ErrorType = GlobalErrorType
}

Mnemonic_validate.parseError = (error: unknown) =>
  /* v8 ignore next */
  error as Mnemonic_validate.ErrorType
