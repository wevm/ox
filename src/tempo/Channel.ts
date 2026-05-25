import * as AbiParameters from '../core/AbiParameters.js'
import type * as Address from '../core/Address.js'
import * as Hash from '../core/Hash.js'
import * as Hex from '../core/Hex.js'
import * as ChannelDescriptor from './ChannelDescriptor.js'

const channelIdParameters = AbiParameters.from(
  'address, address, address, address, bytes32, address, bytes32, address, uint256',
)
const domainSeparatorParameters = AbiParameters.from(
  'bytes32, bytes32, bytes32, uint256, address',
)
const voucherHashParameters = AbiParameters.from('bytes32, bytes32, uint96')

const eip712DomainTypehash = Hash.keccak256(
  Hex.fromString(
    'EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)',
  ),
)
const nameHash = Hash.keccak256(Hex.fromString('TIP20 Channel Reserve'))
const versionHash = Hash.keccak256(Hex.fromString('1'))

/**
 * TIP-20 channel reserve precompile address.
 */
export const address =
  '0x4d50500000000000000000000000000000000000' as const satisfies Address.Address

/**
 * Delay between payer `requestClose` and `withdraw`, in seconds.
 */
export const closeGracePeriod = 900n

/**
 * EIP-712 type hash for `Voucher(bytes32 channelId,uint96 cumulativeAmount)`.
 */
export const voucherTypehash = Hash.keccak256(
  Hex.fromString('Voucher(bytes32 channelId,uint96 cumulativeAmount)'),
)

/**
 * TIP-20 channel descriptor.
 */
export type Descriptor = ChannelDescriptor.ChannelDescriptor

/**
 * Computes the canonical TIP-20 channel id for a descriptor.
 *
 * Mirrors `computeChannelId` on the TIP-20 channel reserve precompile without
 * performing an RPC call.
 *
 * @example
 * ```ts twoslash
 * import { Channel } from 'ox/tempo'
 *
 * const channelId = Channel.computeId({
 *   authorizedSigner: '0x0000000000000000000000000000000000000000',
 *   chainId: 4217,
 *   expiringNonceHash: '0x0000000000000000000000000000000000000000000000000000000000000000',
 *   operator: '0x0000000000000000000000000000000000000000',
 *   payee: '0x2222222222222222222222222222222222222222',
 *   payer: '0x1111111111111111111111111111111111111111',
 *   salt: '0x0000000000000000000000000000000000000000000000000000000000000001',
 *   token: 1n,
 * })
 * ```
 *
 * @param value - Channel descriptor and chain id.
 * @returns The channel id.
 */
export function computeId(value: computeId.Value): Hex.Hex {
  const descriptor = ChannelDescriptor.from(value)
  return Hash.keccak256(
    AbiParameters.encode(channelIdParameters, [
      descriptor.payer,
      descriptor.payee,
      descriptor.operator,
      descriptor.token,
      descriptor.salt,
      descriptor.authorizedSigner,
      descriptor.expiringNonceHash,
      address,
      BigInt(value.chainId),
    ]),
  )
}

export declare namespace computeId {
  type Value = ChannelDescriptor.from.Value & {
    /** Chain id used by the channel reserve precompile. */
    chainId: number | bigint
  }

  type ErrorType =
    | AbiParameters.encode.ErrorType
    | ChannelDescriptor.from.ErrorType
    | Hash.keccak256.ErrorType
}

/**
 * Computes the EIP-712 domain separator for the TIP-20 channel reserve.
 *
 * Mirrors `domainSeparator` on the TIP-20 channel reserve precompile without
 * performing an RPC call.
 *
 * @example
 * ```ts twoslash
 * import { Channel } from 'ox/tempo'
 *
 * const separator = Channel.domainSeparator({ chainId: 4217 })
 * ```
 *
 * @param value - Chain id.
 * @returns The EIP-712 domain separator.
 */
export function domainSeparator(value: domainSeparator.Value): Hex.Hex {
  return Hash.keccak256(
    AbiParameters.encode(domainSeparatorParameters, [
      eip712DomainTypehash,
      nameHash,
      versionHash,
      BigInt(value.chainId),
      address,
    ]),
  )
}

export declare namespace domainSeparator {
  type Value = {
    /** Chain id used by the channel reserve precompile. */
    chainId: number | bigint
  }

  type ErrorType = AbiParameters.encode.ErrorType | Hash.keccak256.ErrorType
}

/**
 * Computes the EIP-712 sign payload for a TIP-20 channel voucher.
 *
 * Mirrors `getVoucherDigest` on the TIP-20 channel reserve precompile without
 * performing an RPC call.
 *
 * @example
 * ```ts twoslash
 * import { Channel } from 'ox/tempo'
 *
 * const payload = Channel.getVoucherSignPayload({
 *   chainId: 4217,
 *   channelId: '0x0000000000000000000000000000000000000000000000000000000000000000',
 *   cumulativeAmount: 1n,
 * })
 * ```
 *
 * @param value - Voucher fields and chain id.
 * @returns The voucher sign payload.
 */
export function getVoucherSignPayload(
  value: getVoucherSignPayload.Value,
): Hex.Hex {
  const voucherHash = Hash.keccak256(
    AbiParameters.encode(voucherHashParameters, [
      voucherTypehash,
      value.channelId,
      value.cumulativeAmount,
    ]),
  )
  return Hash.keccak256(
    Hex.concat(
      '0x1901',
      domainSeparator({ chainId: value.chainId }),
      voucherHash,
    ),
  )
}

export declare namespace getVoucherSignPayload {
  type Value = {
    /** Chain id used by the channel reserve precompile. */
    chainId: number | bigint
    /** Channel id. */
    channelId: Hex.Hex
    /** Total voucher amount signed for the channel. */
    cumulativeAmount: bigint
  }

  type ErrorType =
    | AbiParameters.encode.ErrorType
    | domainSeparator.ErrorType
    | Hash.keccak256.ErrorType
}
