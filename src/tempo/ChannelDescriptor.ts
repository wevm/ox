import * as Address from '../core/Address.js'
import type * as Errors from '../core/Errors.js'
import type * as Hex from '../core/Hex.js'
import * as TokenId from './TokenId.js'

const zeroAddress =
  '0x0000000000000000000000000000000000000000' as const satisfies Address.Address

/**
 * TIP-20 channel reserve descriptor.
 *
 * Descriptors identify a channel without reading chain state. They are emitted
 * by `open` and reused by `settle`, `topUp`, `close`, `requestClose`, and
 * `withdraw`.
 */
export type ChannelDescriptor<
  addressType = Address.Address,
  tokenType = TokenId.TokenIdOrAddress<addressType>,
> = {
  /** Account that funded the channel and receives refunds. */
  payer: addressType
  /** Account that receives settled voucher payments. */
  payee: addressType
  /** Optional relayer allowed to submit `settle` for the payee. */
  operator: addressType
  /** TIP-20 token address held by the channel. */
  token: tokenType
  /** User-supplied salt to distinguish otherwise identical channels. */
  salt: Hex.Hex
  /** Optional signer for vouchers. Zero means `payer` signs. */
  authorizedSigner: addressType
  /** Transaction-derived hash assigned when the channel was opened. */
  expiringNonceHash: Hex.Hex
}

/** Hex-address-normalized {@link ox#ChannelDescriptor.ChannelDescriptor}. */
export type Resolved = ChannelDescriptor<Address.Address, Address.Address>

/**
 * Instantiates a TIP-20 channel reserve descriptor.
 *
 * Accepts a TIP-20 token ID or address, and defaults `operator` and
 * `authorizedSigner` to the zero address.
 *
 * @example
 * ```ts twoslash
 * import { ChannelDescriptor } from 'ox/tempo'
 *
 * const descriptor = ChannelDescriptor.from({
 *   expiringNonceHash: '0x0000000000000000000000000000000000000000000000000000000000000002',
 *   payee: '0x2222222222222222222222222222222222222222',
 *   payer: '0x1111111111111111111111111111111111111111',
 *   salt: '0x0000000000000000000000000000000000000000000000000000000000000001',
 *   token: 1n,
 * })
 * ```
 *
 * @param value - The descriptor input.
 * @returns The normalized channel descriptor.
 */
export function from(value: from.Value): from.ReturnType {
  const {
    authorizedSigner = zeroAddress,
    expiringNonceHash,
    operator = zeroAddress,
    payee,
    payer,
    salt,
    token,
  } = value

  return {
    authorizedSigner: resolveAddress(authorizedSigner),
    expiringNonceHash,
    operator: resolveAddress(operator),
    payee: resolveAddress(payee),
    payer: resolveAddress(payer),
    salt,
    token:
      typeof token === 'string'
        ? resolveAddress(token)
        : TokenId.toAddress(token),
  }
}

export declare namespace from {
  type Value = {
    /** Account that funded the channel and receives refunds. */
    payer: Address.Address
    /** Account that receives settled voucher payments. */
    payee: Address.Address
    /** Optional relayer allowed to submit `settle` for the payee. */
    operator?: Address.Address | undefined
    /** TIP-20 token address or ID held by the channel. */
    token: TokenId.TokenIdOrAddress<Address.Address>
    /** User-supplied salt to distinguish otherwise identical channels. */
    salt: Hex.Hex
    /** Optional signer for vouchers. Zero means `payer` signs. */
    authorizedSigner?: Address.Address | undefined
    /** Transaction-derived hash assigned when the channel was opened. */
    expiringNonceHash: Hex.Hex
  }

  type ReturnType = Resolved

  type ErrorType =
    | Address.from.ErrorType
    | Hex.concat.ErrorType
    | Hex.fromNumber.ErrorType
    | Errors.GlobalErrorType
}

function resolveAddress(address: Address.Address): Address.Address {
  return Address.from(address)
}
