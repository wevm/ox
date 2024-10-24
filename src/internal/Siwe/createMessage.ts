import * as Address from '../../Address.js'
import type { GlobalErrorType } from '../Errors/error.js'
import {
  Siwe_domainRegex,
  Siwe_ipRegex,
  Siwe_localhostRegex,
  Siwe_nonceRegex,
  Siwe_schemeRegex,
} from './constants.js'
import { Siwe_InvalidMessageFieldError } from './errors.js'
import { Siwe_isUri } from './isUri.js'
import type { Siwe_Message } from './types.js'

/**
 * Creates [EIP-4361](https://eips.ethereum.org/EIPS/eip-4361) formatted message.
 *
 * @example
 * ```ts twoslash
 * import { Siwe } from 'ox'
 *
 * Siwe.createMessage({
 *   address: '0xA0Cf798816D4b9b9866b5330EEa46a18382f251e',
 *   chainId: 1,
 *   domain: 'example.com',
 *   nonce: 'foobarbaz',
 *   uri: 'https://example.com/path',
 *   version: '1',
 * })
 * // @log: "example.com wants you to sign in with your Ethereum account:
 * // @log: 0xA0Cf798816D4b9b9866b5330EEa46a18382f251e
 * // @log:
 * // @log:
 * // @log: URI: https://example.com/path
 * // @log: Version: 1
 * // @log: Chain ID: 1
 * // @log: Nonce: foobarbaz
 * // @log: Issued At: 2023-02-01T00:00:00.000Z"
 * ```
 *
 * @param value - Values to use when creating EIP-4361 formatted message.
 * @returns EIP-4361 formatted message.
 */
export function Siwe_createMessage(value: Siwe_Message): string {
  const {
    chainId,
    domain,
    expirationTime,
    issuedAt = new Date(),
    nonce,
    notBefore,
    requestId,
    resources,
    scheme,
    uri,
    version,
  } = value

  // Validate fields
  {
    // Required fields
    if (chainId !== Math.floor(chainId))
      throw new Siwe_InvalidMessageFieldError({
        field: 'chainId',
        metaMessages: [
          '- Chain ID must be a EIP-155 chain ID.',
          '- See https://eips.ethereum.org/EIPS/eip-155',
          '',
          `Provided value: ${chainId}`,
        ],
      })
    if (
      !(
        Siwe_domainRegex.test(domain) ||
        Siwe_ipRegex.test(domain) ||
        Siwe_localhostRegex.test(domain)
      )
    )
      throw new Siwe_InvalidMessageFieldError({
        field: 'domain',
        metaMessages: [
          '- Domain must be an RFC 3986 authority.',
          '- See https://www.rfc-editor.org/rfc/rfc3986',
          '',
          `Provided value: ${domain}`,
        ],
      })
    if (!Siwe_nonceRegex.test(nonce))
      throw new Siwe_InvalidMessageFieldError({
        field: 'nonce',
        metaMessages: [
          '- Nonce must be at least 8 characters.',
          '- Nonce must be alphanumeric.',
          '',
          `Provided value: ${nonce}`,
        ],
      })
    if (!Siwe_isUri(uri))
      throw new Siwe_InvalidMessageFieldError({
        field: 'uri',
        metaMessages: [
          '- URI must be a RFC 3986 URI referring to the resource that is the subject of the signing.',
          '- See https://www.rfc-editor.org/rfc/rfc3986',
          '',
          `Provided value: ${uri}`,
        ],
      })
    if (version !== '1')
      throw new Siwe_InvalidMessageFieldError({
        field: 'version',
        metaMessages: [
          "- Version must be '1'.",
          '',
          `Provided value: ${version}`,
        ],
      })

    // Optional fields
    if (scheme && !Siwe_schemeRegex.test(scheme))
      throw new Siwe_InvalidMessageFieldError({
        field: 'scheme',
        metaMessages: [
          '- Scheme must be an RFC 3986 URI scheme.',
          '- See https://www.rfc-editor.org/rfc/rfc3986#section-3.1',
          '',
          `Provided value: ${scheme}`,
        ],
      })
    const statement = value.statement
    if (statement?.includes('\n'))
      throw new Siwe_InvalidMessageFieldError({
        field: 'statement',
        metaMessages: [
          "- Statement must not include '\\n'.",
          '',
          `Provided value: ${statement}`,
        ],
      })
  }

  // Construct message
  const address = Address.from(value.address)
  const origin = (() => {
    if (scheme) return `${scheme}://${domain}`
    return domain
  })()
  const statement = (() => {
    if (!value.statement) return ''
    return `${value.statement}\n`
  })()
  const prefix = `${origin} wants you to sign in with your Ethereum account:\n${address}\n\n${statement}`

  let suffix = `URI: ${uri}\nVersion: ${version}\nChain ID: ${chainId}\nNonce: ${nonce}\nIssued At: ${issuedAt.toISOString()}`

  if (expirationTime)
    suffix += `\nExpiration Time: ${expirationTime.toISOString()}`
  if (notBefore) suffix += `\nNot Before: ${notBefore.toISOString()}`
  if (requestId) suffix += `\nRequest ID: ${requestId}`
  if (resources) {
    let content = '\nResources:'
    for (const resource of resources) {
      if (!Siwe_isUri(resource))
        throw new Siwe_InvalidMessageFieldError({
          field: 'resources',
          metaMessages: [
            '- Every resource must be a RFC 3986 URI.',
            '- See https://www.rfc-editor.org/rfc/rfc3986',
            '',
            `Provided value: ${resource}`,
          ],
        })
      content += `\n- ${resource}`
    }
    suffix += content
  }

  return `${prefix}\n${suffix}`
}

export declare namespace Siwe_createMessage {
  type ErrorType =
    | Address.from.ErrorType
    | Siwe_InvalidMessageFieldError
    | GlobalErrorType
}

Siwe_createMessage.parseError = (error: unknown) =>
  /* v8 ignore next */
  error as Siwe_createMessage.ErrorType
