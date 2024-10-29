import * as Errors from '../../Errors.js'

/**
 * Thrown when a field in a SIWE Message is invalid.
 *
 * @example
 * ```ts twoslash
 * import { Siwe } from 'ox'
 *
 * Siwe.createMessage({
 *   address: '0xA0Cf798816D4b9b9866b5330EEa46a18382f251e',
 *   chainId: 1.1,
 *   domain: 'example.com',
 *   nonce: 'foobarbaz',
 *   uri: 'https://example.com/path',
 *   version: '1',
 * })
 * // @error: Siwe.InvalidMessageFieldError: Invalid Sign-In with Ethereum message field "chainId".
 * // @error: - Chain ID must be a EIP-155 chain ID.
 * // @error: - See https://eips.ethereum.org/EIPS/eip-155
 * // @error: Provided value: 1.1
 * ```
 */
export class Siwe_InvalidMessageFieldError extends Errors.BaseError {
  override readonly name = 'Siwe.InvalidMessageFieldError'

  constructor(parameters: {
    field: string
    metaMessages?: string[] | undefined
  }) {
    const { field, metaMessages } = parameters
    super(`Invalid Sign-In with Ethereum message field "${field}".`, {
      metaMessages,
    })
  }
}
