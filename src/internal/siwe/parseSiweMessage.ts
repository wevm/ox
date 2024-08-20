import type { Address } from 'abitype'
import type { SiweMessage } from '../types/siwe.js'
import type { Compute, ExactPartial } from '../types/utils.js'

/**
 * EIP-4361 formatted message into message fields object.
 *
 * - Docs: https://oxlib.sh/api/siwe/parseMessage
 * - Spec: https://eips.ethereum.org/EIPS/eip-4361
 *
 * @example
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
 * // {
 * //   address: '0xA0Cf798816D4b9b9866b5330EEa46a18382f251e',
 * //   chainId: 1,
 * //   domain: 'example.com',
 * //   issuedAt: '2023-02-01T00:00:00.000Z',
 * //   nonce: 'foobarbaz',
 * //   statement: 'I accept the ExampleOrg Terms of Service: https://example.com/tos',
 * //   uri: 'https://example.com/path',
 * //   version: '1',
 * // }
 */
export function parseSiweMessage(message: string): parseSiweMessage.ReturnType {
  const { scheme, statement, ...prefix } = (message.match(prefixRegex)
    ?.groups ?? {}) as {
    address: Address
    domain: string
    scheme?: string
    statement?: string
  }
  const { chainId, expirationTime, issuedAt, notBefore, requestId, ...suffix } =
    (message.match(suffixRegex)?.groups ?? {}) as {
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

export declare namespace parseSiweMessage {
  type ReturnType = Compute<ExactPartial<SiweMessage>>
}

// https://regexr.com/80gdj
const prefixRegex =
  /^(?:(?<scheme>[a-zA-Z][a-zA-Z0-9+-.]*):\/\/)?(?<domain>[a-zA-Z0-9+-.]*(?::[0-9]{1,5})?) (?:wants you to sign in with your Ethereum account:\n)(?<address>0x[a-fA-F0-9]{40})\n\n(?:(?<statement>.*)\n\n)?/

// https://regexr.com/80gf9
const suffixRegex =
  /(?:URI: (?<uri>.+))\n(?:Version: (?<version>.+))\n(?:Chain ID: (?<chainId>\d+))\n(?:Nonce: (?<nonce>[a-zA-Z0-9]+))\n(?:Issued At: (?<issuedAt>.+))(?:\nExpiration Time: (?<expirationTime>.+))?(?:\nNot Before: (?<notBefore>.+))?(?:\nRequest ID: (?<requestId>.+))?/
