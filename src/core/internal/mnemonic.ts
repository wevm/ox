import { HDKey } from '@scure/bip32'
import { mnemonicToSeedSync } from '@scure/bip39'
import type * as Bytes from '../Bytes.js'
import * as Hex from '../Hex.js'

/** @internal */
export function toPrivateKey<as extends 'Bytes' | 'Hex' = 'Bytes'>(
  mnemonic: string,
  options: {
    as?: as | undefined
    passphrase?: string | undefined
    path?: string | undefined
  } = {},
):
  | (as extends 'Bytes' ? Bytes.Bytes : never)
  | (as extends 'Hex' ? Hex.Hex : never) {
  const { path = "m/44'/60'/0'/0/0", passphrase } = options
  const privateKey = HDKey.fromMasterSeed(
    toSeed(mnemonic, { passphrase }),
  ).derive(path).privateKey!
  if (options.as === 'Bytes') return privateKey as never
  return Hex.fromBytes(privateKey) as never
}

/** @internal */
export function toSeed(
  mnemonic: string,
  options: { passphrase?: string | undefined } = {},
): Bytes.Bytes {
  return mnemonicToSeedSync(mnemonic, options.passphrase)
}
