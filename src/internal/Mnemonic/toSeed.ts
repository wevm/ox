import { mnemonicToSeedSync } from '@scure/bip39'
import type * as Errors from '../../Errors.js'
import { Bytes_toHex } from '../Bytes/toHex.js'
import type { Bytes } from '../Bytes/types.js'
import type { Hex } from '../Hex/types.js'

/**
 * Converts a mnemonic to a master seed.
 *
 * @example
 * ```ts twoslash
 * import { Mnemonic } from 'ox'
 *
 * const mnemonic = Mnemonic.random(Mnemonic.english)
 * const seed = Mnemonic.toSeed(mnemonic)
 * // @log: Uint8Array [...64 bytes]
 * ```
 *
 * @param mnemonic - The mnemonic to convert.
 * @param options - Conversion options.
 * @returns The master seed.
 */
export function Mnemonic_toSeed<as extends 'Bytes' | 'Hex' = 'Bytes'>(
  mnemonic: string,
  options: Mnemonic_toSeed.Options<as> = {},
): Mnemonic_toSeed.ReturnType<as> {
  const { passphrase } = options
  const seed = mnemonicToSeedSync(mnemonic, passphrase)
  if (options.as === 'Hex') return Bytes_toHex(seed) as never
  return seed as never
}

export declare namespace Mnemonic_toSeed {
  type Options<as extends 'Bytes' | 'Hex' = 'Bytes'> = {
    /** The output format. @default 'Bytes' */
    as?: as | 'Bytes' | 'Hex' | undefined
    /** An optional passphrase for additional protection to the seed. */
    passphrase?: string | undefined
  }

  type ReturnType<as extends 'Bytes' | 'Hex' = 'Bytes'> =
    | (as extends 'Bytes' ? Bytes : never)
    | (as extends 'Hex' ? Hex : never)

  type ErrorType = Errors.GlobalErrorType
}

Mnemonic_toSeed.parseError = (error: unknown) =>
  /* v8 ignore next */
  error as Mnemonic_toSeed.ErrorType
