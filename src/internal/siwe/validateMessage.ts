import { Address_isEqual } from '../address/isEqual.js'
import type { Address } from '../address/types.js'
import type { ExactPartial } from '../types.js'
import type { Siwe_Message } from './types.js'

/**
 * Validates [EIP-4361](https://eips.ethereum.org/EIPS/eip-4361) message.
 *
 * @example
 * ```ts twoslash
 * import { Siwe } from 'ox'
 *
 * Siwe.validateMessage({
 *   address: '0xA0Cf798816D4b9b9866b5330EEa46a18382f251e',
 *   domain: 'example.com',
 *   nonce: 'foobarbaz',
 *   uri: 'https://example.com/path',
 *   version: '1',
 * })
 * // @log: true
 * ```
 *
 * @param value - Values to use when validating EIP-4361 formatted message.
 * @returns Whether the message is valid.
 */
export function Siwe_validateMessage(
  value: Siwe_validateMessage.Value,
): boolean {
  const { address, domain, message, nonce, scheme, time = new Date() } = value

  if (domain && message.domain !== domain) return false
  if (nonce && message.nonce !== nonce) return false
  if (scheme && message.scheme !== scheme) return false

  if (message.expirationTime && time >= message.expirationTime) return false
  if (message.notBefore && time < message.notBefore) return false

  try {
    if (!message.address) return false
    if (address && !Address_isEqual(message.address, address)) return false
  } catch {
    return false
  }

  return true
}

export declare namespace Siwe_validateMessage {
  interface Value {
    /**
     * Ethereum address to check against.
     */
    address?: Address | undefined
    /**
     * [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) authority to check against.
     */
    domain?: string | undefined
    /**
     * EIP-4361 message fields.
     */
    message: ExactPartial<Siwe_Message>
    /**
     * Random string to check against.
     */
    nonce?: string | undefined
    /**
     * [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986#section-3.1) URI scheme to check against.
     */
    scheme?: string | undefined
    /**
     * Current time to check optional `expirationTime` and `notBefore` fields.
     *
     * @default new Date()
     */
    time?: Date | undefined
  }
}
