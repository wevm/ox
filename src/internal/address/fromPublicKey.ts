import type { Address } from 'abitype'

import type { Bytes, Hex } from '../types/data.js'
import { keccak256 } from '../hash/keccak256.js'
import { toHex } from '../hex/toHex.js'
import type { GlobalErrorType } from '../errors/error.js'
import { toAddress } from './from.js'

/**
 * Converts an ECDSA public key to an Ethereum address.
 *
 * @example
 * import { Address } from 'ox'
 *
 * Address.fromPublicKey('0x048318535b54105d4a7aae60c08fc45f9687181b4fdfc625bd1a753fa7397fed753547f11ca8696646f2f3acb08e31016afac23e630c5d11f59f61fef57b0d2aa5')
 * // '0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266'
 */
export function publicKeyToAddress(
  publicKey: Hex | Bytes,
  options: publicKeyToAddress.Options = {},
): Address {
  const address = keccak256(`0x${toHex(publicKey).slice(4)}`).substring(26)
  return toAddress(`0x${address}`, options)
}

export declare namespace publicKeyToAddress {
  type Options = toAddress.Options

  type ReturnType = Address

  type ErrorType = keccak256.ErrorType | toHex.ErrorType | GlobalErrorType
}

publicKeyToAddress.parseError = (error: unknown) =>
  error as publicKeyToAddress.ErrorType
