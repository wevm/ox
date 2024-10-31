import type * as Address from '../../Address.js'
import type { ExactPartial } from '../types.js'
import { Siwe_prefixRegex, Siwe_suffixRegex } from './constants.js'
import type { Siwe_Message } from './types.js'

/**
 * [EIP-4361](https://eips.ethereum.org/EIPS/eip-4361) formatted message into message fields object.
 *
 * @example
 * ```ts twoslash
 * import { Siwe } from 'ox'
 *
 * Siwe.parseMessage(`example.com wants you to sign in with your Ethereum account:
 * 0xA0Cf798816D4b9b9866b5330EEa46a18382f251e
 *
 * I accept the ExampleOrg Terms of Service: https://example.com/tos
 *
 * URI: https://example.com/path
 * Version: 1
 * Chain ID: 1
 * Nonce: foobarbaz
 * Issued At: 2023-02-01T00:00:00.000Z`)
 * // @log: {
 * // @log:   address: '0xA0Cf798816D4b9b9866b5330EEa46a18382f251e',
 * // @log:   chainId: 1,
 * // @log:   domain: 'example.com',
 * // @log:   issuedAt: '2023-02-01T00:00:00.000Z',
 * // @log:   nonce: 'foobarbaz',
 * // @log:   statement: 'I accept the ExampleOrg Terms of Service: https://example.com/tos',
 * // @log:   uri: 'https://example.com/path',
 * // @log:   version: '1',
 * // @log: }
 * ```
 *
 * @param message - [EIP-4361](https://eips.ethereum.org/EIPS/eip-4361) formatted message.
 * @returns Message fields object.
 */
export function Siwe_parseMessage(message: string): ExactPartial<Siwe_Message> {
  const { scheme, statement, ...prefix } = (message.match(Siwe_prefixRegex)
    ?.groups ?? {}) as {
      address: Address.Address
      domain: string
      scheme?: string
      statement?: string
    }
  const { chainId, expirationTime, issuedAt, notBefore, requestId, ...suffix } =
    (message.match(Siwe_suffixRegex)?.groups ?? {}) as {
      chainId: string
      expirationTime?: string
      issuedAt?: string
      nonce: string
      notBefore?: string
      requestId?: string
      uri: string
      version: '1'
    }
  const resources = message.split('Resources:')[1]?.split('\n- ').slice(1)
  return {
    ...prefix,
    ...suffix,
    ...(chainId ? { chainId: Number(chainId) } : {}),
    ...(expirationTime ? { expirationTime: new Date(expirationTime) } : {}),
    ...(issuedAt ? { issuedAt: new Date(issuedAt) } : {}),
    ...(notBefore ? { notBefore: new Date(notBefore) } : {}),
    ...(requestId ? { requestId } : {}),
    ...(resources ? { resources } : {}),
    ...(scheme ? { scheme } : {}),
    ...(statement ? { statement } : {}),
  }
}
