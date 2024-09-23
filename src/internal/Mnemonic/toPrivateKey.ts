import { Bytes_from } from '../Bytes/from.js'
import type { Bytes } from '../Bytes/types.js'
import type { GlobalErrorType } from '../Errors/error.js'
import { HdKey_path } from '../HdKey/path.js'
import type { Hex } from '../Hex/types.js'
import { Mnemonic_toHdKey } from './toHdKey.js'

/**
 * Converts a mnemonic to a private key.
 *
 * @example
 * ```ts twoslash
 * import { Mnemonic } from 'ox'
 *
 * const mnemonic = Mnemonic.random(Mnemonic.english)
 * const privateKey = Mnemonic.toPrivateKey(mnemonic)
 * // @log: '0x...'
 * ```
 *
 * @example
 * ### Paths
 *
 * You can derive a private key at a specific path using the `path` option.
 *
 * ```ts twoslash
 * import { Mnemonic } from 'ox'
 *
 * const mnemonic = Mnemonic.random(Mnemonic.english)
 * const privateKey = Mnemonic.toPrivateKey(mnemonic, {
 *   path: Mnemonic.getPath({ index: 1 }) // 'm/44'/60'/0'/0/1' // [!code focus]
 * })
 * // @log: '0x...'
 * ```
 *
 * @param mnemonic - The mnemonic to convert.
 * @param options - Conversion options.
 * @returns The private key.
 */
export function Mnemonic_toPrivateKey<as extends 'Bytes' | 'Hex' = 'Bytes'>(
  mnemonic: string,
  options: Mnemonic_toPrivateKey.Options<as> = {},
): Mnemonic_toPrivateKey.ReturnType<as> {
  const { path = HdKey_path(), passphrase } = options
  const hdKey = Mnemonic_toHdKey(mnemonic, { passphrase }).derive(path)
  if (options.as === 'Bytes') return Bytes_from(hdKey.privateKey) as never
  return hdKey.privateKey as never
}

export declare namespace Mnemonic_toPrivateKey {
  type Options<as extends 'Bytes' | 'Hex' = 'Bytes'> = {
    /** The output format. @default 'Bytes' */
    as?: as | 'Bytes' | 'Hex' | undefined
    /** An optional path to derive the private key from. @default `m/44'/60'/0'/0/0` */
    path?: string | undefined
    /** An optional passphrase for additional protection to the seed. */
    passphrase?: string | undefined
  }

  type ReturnType<as extends 'Bytes' | 'Hex' = 'Bytes'> =
    | (as extends 'Bytes' ? Bytes : never)
    | (as extends 'Hex' ? Hex : never)

  type ErrorType = GlobalErrorType
}

Mnemonic_toPrivateKey.parseError = (error: unknown) =>
  /* v8 ignore next */
  error as Mnemonic_toPrivateKey.ErrorType
