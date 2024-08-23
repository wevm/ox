import { toAddress } from '../address/toAddress.js'
import type { GlobalErrorType } from '../errors/error.js'
import { SiweInvalidMessageFieldError } from '../errors/siwe.js'
import type { SiweMessage } from '../types/siwe.js'
import { isUri } from './isUri.js'

/**
 * Creates EIP-4361 formatted message.
 *
 * - Docs: https://oxlib.sh/api/siwe/createMessage
 * - Spec: https://eips.ethereum.org/EIPS/eip-4361
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
 * // "example.com wants you to sign in with your Ethereum account:
 * // 0xA0Cf798816D4b9b9866b5330EEa46a18382f251e
 * //
 * //
 * // URI: https://example.com/path
 * // Version: 1
 * // Chain ID: 1
 * // Nonce: foobarbaz
 * // Issued At: 2023-02-01T00:00:00.000Z"
 * ```
 */
export function createSiweMessage(
  value: createSiweMessage.Value,
): createSiweMessage.ReturnType {
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
      throw new SiweInvalidMessageFieldError({
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
        domainRegex.test(domain) ||
        ipRegex.test(domain) ||
        localhostRegex.test(domain)
      )
    )
      throw new SiweInvalidMessageFieldError({
        field: 'domain',
        metaMessages: [
          '- Domain must be an RFC 3986 authority.',
          '- See https://www.rfc-editor.org/rfc/rfc3986',
          '',
          `Provided value: ${domain}`,
        ],
      })
    if (!nonceRegex.test(nonce))
      throw new SiweInvalidMessageFieldError({
        field: 'nonce',
        metaMessages: [
          '- Nonce must be at least 8 characters.',
          '- Nonce must be alphanumeric.',
          '',
          `Provided value: ${nonce}`,
        ],
      })
    if (!isUri(uri))
      throw new SiweInvalidMessageFieldError({
        field: 'uri',
        metaMessages: [
          '- URI must be a RFC 3986 URI referring to the resource that is the subject of the signing.',
          '- See https://www.rfc-editor.org/rfc/rfc3986',
          '',
          `Provided value: ${uri}`,
        ],
      })
    if (version !== '1')
      throw new SiweInvalidMessageFieldError({
        field: 'version',
        metaMessages: [
          "- Version must be '1'.",
          '',
          `Provided value: ${version}`,
        ],
      })

    // Optional fields
    if (scheme && !schemeRegex.test(scheme))
      throw new SiweInvalidMessageFieldError({
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
      throw new SiweInvalidMessageFieldError({
        field: 'statement',
        metaMessages: [
          "- Statement must not include '\\n'.",
          '',
          `Provided value: ${statement}`,
        ],
      })
  }

  // Construct message
  const address = toAddress(value.address)
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
      if (!isUri(resource))
        throw new SiweInvalidMessageFieldError({
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

export declare namespace createSiweMessage {
  type Value = SiweMessage

  type ReturnType = string

  type ErrorType =
    | toAddress.ErrorType
    | SiweInvalidMessageFieldError
    | GlobalErrorType
}

createSiweMessage.parseError = (error: unknown) =>
  error as createSiweMessage.ErrorType

const domainRegex =
  /^([a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}(:[0-9]{1,5})?$/
const ipRegex =
  /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)(:[0-9]{1,5})?$/
const localhostRegex = /^localhost(:[0-9]{1,5})?$/
const nonceRegex = /^[a-zA-Z0-9]{8,}$/
const schemeRegex = /^([a-zA-Z][a-zA-Z0-9+-.]*)$/
