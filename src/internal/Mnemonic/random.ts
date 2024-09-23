import { generateMnemonic } from '@scure/bip39'
import type { GlobalErrorType } from '../Errors/error.js'

/**
 * Generates a random mnemonic.
 *
 * @example
 * ```ts twoslash
 * import { Mnemonic } from 'ox'
 *
 * const mnemonic = Mnemonic.random(Mnemonic.english)
 * // @log: 'buyer zoo end danger ice capable shrug naive twist relief mass bonus'
 * ```
 *
 * @param wordlist The wordlist to use.
 * @param options Generation options.
 * @returns The mnemonic.
 */
export function Mnemonic_random(
  wordlist: string[],
  options: Mnemonic_random.Options = {},
): string {
  const { strength = 128 } = options
  return generateMnemonic(wordlist, strength)
}

export declare namespace Mnemonic_random {
  type Options = {
    /** The strength of the mnemonic to generate, in bits. @default 128 */
    strength?: number | undefined
  }

  type ErrorType = GlobalErrorType
}

Mnemonic_random.parseError = (error: unknown) =>
  /* v8 ignore next */
  error as Mnemonic_random.ErrorType
