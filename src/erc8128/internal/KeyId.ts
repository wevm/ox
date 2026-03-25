import * as Address from '../../core/Address.js'

export type KeyId = {
  address: Address.Address
  chainId: number
}

/**
 * Serializes a keyid in `erc8128:<chainId>:<address>` format.
 *
 * @example
 * ```ts
 * import * as KeyId from './KeyId.js'
 * KeyId.serialize({ address: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045', chainId: 1 })
 * // 'erc8128:1:0xd8da6bf26964af9d7eed9e03e53415d37aa96045'
 * ```
 */
export function serialize(options: KeyId): string {
  return `erc8128:${options.chainId}:${options.address.toLowerCase()}`
}

/**
 * Parses a keyid from `erc8128:<chainId>:<address>` format.
 *
 * @example
 * ```ts
 * import * as KeyId from './KeyId.js'
 * KeyId.parse('erc8128:1:0xd8da6bf26964af9d7eed9e03e53415d37aa96045')
 * // { address: '0xd8da6bf26964af9d7eed9e03e53415d37aa96045', chainId: 1 }
 * ```
 */
export function parse(keyid: string): KeyId {
  const parts = keyid.split(':')
  if (parts.length !== 3 || parts[0] !== 'erc8128')
    throw new InvalidKeyIdError(keyid)
  const chainId = Number(parts[1])
  if (!Number.isFinite(chainId) || chainId < 0)
    throw new InvalidKeyIdError(keyid)
  const address = parts[2]!
  Address.assert(address)
  return { chainId, address }
}

export class InvalidKeyIdError extends Error {
  override readonly name = 'HttpSignature.InvalidKeyIdError'
  constructor(keyid: string) {
    super(
      `Invalid ERC-8128 keyid: "${keyid}". Expected format: "erc8128:<chainId>:<address>".`,
    )
  }
}
