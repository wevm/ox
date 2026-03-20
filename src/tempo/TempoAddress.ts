import * as core_Address from '../core/Address.js'
import * as Errors from '../core/Errors.js'
import * as Hex from '../core/Hex.js'
import type { Compute } from '../core/internal/types.js'

/** An address that can be either an Ethereum hex address or a Tempo address. */
export type Address = core_Address.Address | Tempo

/** Root type for a Tempo Address. */
export type Tempo = Compute<`tempox${string}`>

/** Deeply converts all {@link ox#TempoAddress.Tempo} types to {@link ox#Address.Address}. */
export type ResolveAddresses<type> = type extends Tempo
  ? core_Address.Address
  : type extends readonly (infer item)[]
    ? readonly ResolveAddresses<item>[]
    : type extends object
      ? { [key in keyof type]: ResolveAddresses<type[key]> }
      : type

/**
 * Resolves an address input (either an Ethereum hex address or a Tempo address)
 * to an Ethereum hex address.
 *
 * @example
 * ```ts twoslash
 * import { TempoAddress } from 'ox/tempo'
 *
 * const address = TempoAddress.resolve('tempox0x742d35cc6634c0532925a3b844bc9e7595f2bd28')
 * // @log: '0x742d35CC6634c0532925a3B844bc9e7595F2Bd28'
 * ```
 *
 * @example
 * ### Hex Address Passthrough
 * ```ts twoslash
 * import { TempoAddress } from 'ox/tempo'
 *
 * const address = TempoAddress.resolve('0x742d35Cc6634C0532925a3b844Bc9e7595f2bD28')
 * // @log: '0x742d35CC6634c0532925a3B844bc9e7595F2Bd28'
 * ```
 *
 * @param address - An Ethereum hex address or Tempo address.
 * @returns The resolved Ethereum hex address.
 */
export function resolve(address: Address): core_Address.Address {
  if (address.startsWith('tempo')) return parse(address).address
  return address as core_Address.Address
}

/**
 * Formats a raw Ethereum address into a Tempo address string.
 *
 * @example
 * ```ts twoslash
 * import { TempoAddress } from 'ox/tempo'
 *
 * const address = TempoAddress.format('0x742d35Cc6634C0532925a3b844Bc9e7595f2bD28')
 * // @log: 'tempox0x742d35cc6634c0532925a3b844bc9e7595f2bd28'
 * ```
 *
 * @param address - The raw 20-byte Ethereum address.
 * @returns The encoded Tempo address string.
 */
export function format(address: Address): Tempo {
  const resolved = resolve(address)
  return `tempox${resolved.toLowerCase()}` as Tempo
}

export declare namespace format {
  type ErrorType = Errors.GlobalErrorType
}

/**
 * Parses a Tempo address string into a raw Ethereum address.
 *
 * @example
 * ```ts twoslash
 * import { TempoAddress } from 'ox/tempo'
 *
 * const result = TempoAddress.parse(
 *   'tempox0x742d35cc6634c0532925a3b844bc9e7595f2bd28',
 * )
 * // @log: { address: '0x742d35CC6634c0532925a3B844bc9e7595F2Bd28' }
 * ```
 *
 * @param tempoAddress - The Tempo address string to parse.
 * @returns The parsed raw address.
 */
export function parse(tempoAddress: string): parse.ReturnType {
  if (!tempoAddress.startsWith('tempox'))
    throw new InvalidPrefixError({ address: tempoAddress })

  const hex = tempoAddress.slice('tempox'.length)
  Hex.assert(hex, { strict: true })

  const address = core_Address.checksum(hex)

  return { address }
}

export declare namespace parse {
  type ReturnType = {
    /** The raw 20-byte Ethereum address. */
    address: core_Address.Address
  }

  type ErrorType = InvalidPrefixError | Errors.GlobalErrorType
}

/**
 * Validates a Tempo address string.
 *
 * @example
 * ```ts twoslash
 * import { TempoAddress } from 'ox/tempo'
 *
 * const valid = TempoAddress.validate(
 *   'tempox0x742d35cc6634c0532925a3b844bc9e7595f2bd28',
 * )
 * // @log: true
 * ```
 *
 * @param tempoAddress - The Tempo address string to validate.
 * @returns Whether the address is valid.
 */
export function validate(tempoAddress: string): boolean {
  try {
    parse(tempoAddress)
    return true
  } catch {
    return false
  }
}

/** Thrown when a Tempo address has an invalid prefix. */
export class InvalidPrefixError extends Errors.BaseError {
  override readonly name = 'TempoAddress.InvalidPrefixError'

  constructor({ address }: { address: string }) {
    super(
      `Tempo address "${address}" has an invalid prefix. Expected "tempox".`,
    )
  }
}
