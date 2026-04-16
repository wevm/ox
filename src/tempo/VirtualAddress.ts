import * as Address from '../core/Address.js'
import * as Bytes from '../core/Bytes.js'
import * as Errors from '../core/Errors.js'
import * as Hex from '../core/Hex.js'
import * as TempoAddress from './TempoAddress.js'

/** Fixed 10-byte marker used by TIP-1022 virtual addresses. */
export const magic = '0xfdfdfdfdfdfdfdfdfdfd' as const

/** A fixed-width virtual address component. */
export type Part = Hex.Hex | Bytes.Bytes | number | bigint

/**
 * Builds a TIP-1022 virtual address from a `masterId` and `userTag`.
 *
 * [TIP-1022](https://docs.tempo.xyz/protocol/tips/tip-1022)
 *
 * TIP-1022 encodes virtual addresses as:
 * `[4-byte masterId][10-byte VIRTUAL_MAGIC][6-byte userTag]`
 *
 * @example
 * ```ts twoslash
 * import { VirtualAddress } from 'ox/tempo'
 *
 * const address = VirtualAddress.from({
 *   masterId: '0x58e21090',
 *   userTag: '0x010203040506',
 * })
 *
 * address
 * // @log: '0x58e21090fdfdfdfdfdfdfdfdfdfd010203040506'
 * ```
 *
 * @param value - The virtual address parts.
 * @returns The virtual address.
 */
export function from(value: from.Value): Address.Address {
  return Address.from(
    Hex.concat(
      toFixedHex(value.masterId, 4),
      magic,
      toFixedHex(value.userTag, 6),
    ),
  )
}

export declare namespace from {
  type Value = {
    /** 4-byte master identifier. */
    masterId: Part
    /** 6-byte opaque user tag. */
    userTag: Part
  }

  type ErrorType =
    | Address.from.ErrorType
    | Bytes.padLeft.ErrorType
    | Hex.assert.ErrorType
    | Hex.fromBytes.ErrorType
    | Hex.fromNumber.ErrorType
    | Hex.padLeft.ErrorType
    | Errors.GlobalErrorType
}

/**
 * Checks whether an address matches the TIP-1022 virtual address format.
 *
 * [TIP-1022](https://docs.tempo.xyz/protocol/tips/tip-1022)
 *
 * This only checks the reserved byte layout, not whether the `masterId`
 * is registered onchain.
 *
 * @example
 * ```ts twoslash
 * import { VirtualAddress } from 'ox/tempo'
 *
 * const isVirtual = VirtualAddress.isVirtual(
 *   '0x58e21090fdfdfdfdfdfdfdfdfdfd010203040506',
 * )
 *
 * isVirtual
 * // @log: true
 * ```
 *
 * @param address - Address to check.
 * @returns `true` if the address matches the virtual-address layout.
 */
export function isVirtual(address: string): boolean {
  try {
    const resolved = resolveAddress(address)
    return Hex.slice(resolved, 4, 14).toLowerCase() === magic
  } catch {
    return false
  }
}

/**
 * Parses a TIP-1022 virtual address into its `masterId` and `userTag` parts.
 *
 * [TIP-1022](https://docs.tempo.xyz/protocol/tips/tip-1022)
 *
 * @example
 * ```ts twoslash
 * import { VirtualAddress } from 'ox/tempo'
 *
 * const parsed = VirtualAddress.parse(
 *   '0x58e21090fdfdfdfdfdfdfdfdfdfd010203040506',
 * )
 *
 * parsed
 * // @log: { masterId: '0x58e21090', userTag: '0x010203040506' }
 * ```
 *
 * @param address - The virtual address to parse.
 * @returns The decoded virtual address components.
 */
export function parse(address: string): parse.ReturnType {
  const resolved = resolveAddress(address)

  if (Hex.slice(resolved, 4, 14).toLowerCase() !== magic)
    throw new InvalidMagicError({ address: resolved })

  return {
    masterId: Hex.slice(resolved, 0, 4),
    userTag: Hex.slice(resolved, 14, 20),
  }
}

export declare namespace parse {
  type ReturnType = {
    /** 4-byte master identifier. */
    masterId: Hex.Hex
    /** 6-byte opaque user tag. */
    userTag: Hex.Hex
  }

  type ErrorType =
    | Address.assert.ErrorType
    | InvalidMagicError
    | TempoAddress.parse.ErrorType
    | Errors.GlobalErrorType
}

/**
 * Validates that an address matches the TIP-1022 virtual address format.
 *
 * [TIP-1022](https://docs.tempo.xyz/protocol/tips/tip-1022)
 *
 * This only validates the reserved byte layout, not whether the `masterId`
 * resolves to a registered master onchain.
 *
 * @example
 * ```ts twoslash
 * import { VirtualAddress } from 'ox/tempo'
 *
 * const valid = VirtualAddress.validate(
 *   '0x58e21090fdfdfdfdfdfdfdfdfdfd010203040506',
 * )
 *
 * valid
 * // @log: true
 * ```
 *
 * @param address - Address to validate.
 * @returns `true` if the address has a valid virtual-address layout.
 */
export function validate(address: string): boolean {
  try {
    parse(address)
    return true
  } catch {
    return false
  }
}

/** Thrown when an address does not contain the TIP-1022 virtual marker. */
export class InvalidMagicError extends Errors.BaseError {
  override readonly name = 'VirtualAddress.InvalidMagicError'

  constructor({ address }: { address: string }) {
    super(
      `Address "${address}" does not contain the TIP-1022 virtual address marker.`,
    )
  }
}

function resolveAddress(address: string): Address.Address {
  const resolved = TempoAddress.resolve(address as TempoAddress.Address)
  Address.assert(resolved, { strict: false })
  return resolved
}

function toFixedHex(value: Part, size: number): Hex.Hex {
  if (typeof value === 'number' || typeof value === 'bigint')
    return Hex.fromNumber(value, { size })
  if (typeof value === 'string') {
    Hex.assert(value, { strict: true })
    return Hex.padLeft(value, size)
  }
  return Hex.fromBytes(Bytes.padLeft(value, size))
}
