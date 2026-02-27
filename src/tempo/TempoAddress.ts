import * as Address from '../core/Address.js'
import * as Bech32m from '../core/Bech32m.js'
import * as Bytes from '../core/Bytes.js'
import * as CompactSize from '../core/CompactSize.js'
import * as Errors from '../core/Errors.js'
import * as Hex from '../core/Hex.js'

/** Root type for a Tempo Address. */
export type TempoAddress = `tempo1${string}` | `tempoz1${string}`

/**
 * Formats a raw Ethereum address (and optional zone ID) into a Tempo address string.
 *
 * @example
 * ```ts twoslash
 * import { TempoAddress } from 'ox/tempo'
 *
 * const address = TempoAddress.format('0x742d35Cc6634C0532925a3b844Bc9e7595f2bD28')
 * // @log: 'tempo1wskntnrxxnq9x2f95wuyf0y7wk2l90fg0hlz9j'
 * ```
 *
 * @example
 * ### Zone Address
 * ```ts twoslash
 * import { TempoAddress } from 'ox/tempo'
 *
 * const address = TempoAddress.format(
 *   '0x742d35Cc6634C0532925a3b844Bc9e7595f2bD28',
 *   { zoneId: 1 },
 * )
 * // @log: 'tempoz1q96z6dwvvc6vq5efyk3ms39une6etu4a9q2zvzv5'
 * ```
 *
 * @param address - The raw 20-byte Ethereum address.
 * @param options - Options.
 * @returns The encoded Tempo address string.
 */
export function format(
  address: Address.Address,
  options: format.Options = {},
): TempoAddress {
  const { zoneId } = options

  const hrp = zoneId != null ? 'tempoz' : 'tempo'
  const zone = zoneId != null ? CompactSize.toBytes(zoneId) : new Uint8Array()
  const data = Bytes.concat(zone, Bytes.fromHex(address))

  return Bech32m.encode(hrp, data) as TempoAddress
}

export declare namespace format {
  type Options = {
    /** Zone ID for zone addresses. */
    zoneId?: number | bigint | undefined
  }

  type ErrorType = Errors.GlobalErrorType
}

/**
 * Parses a Tempo address string into a raw Ethereum address and optional zone ID.
 *
 * @example
 * ### Mainnet Address
 * ```ts twoslash
 * import { TempoAddress } from 'ox/tempo'
 *
 * const result = TempoAddress.parse(
 *   'tempo1wskntnrxxnq9x2f95wuyf0y7wk2l90fg0hlz9j',
 * )
 * // @log: { address: '0x742d35CC6634c0532925a3B844bc9e7595F2Bd28', zoneId: undefined }
 * ```
 *
 * @example
 * ### Zone Address
 * ```ts twoslash
 * import { TempoAddress } from 'ox/tempo'
 *
 * const result = TempoAddress.parse(
 *   'tempoz1q96z6dwvvc6vq5efyk3ms39une6etu4a9q2zvzv5',
 * )
 * // @log: { address: '0x742d35CC6634c0532925a3B844bc9e7595F2Bd28', zoneId: 1 }
 * ```
 *
 * @param tempoAddress - The Tempo address string to parse.
 * @returns The parsed raw address and optional zone ID.
 */
export function parse(tempoAddress: string): parse.ReturnType {
  let hrp: string
  let data: Uint8Array
  try {
    const decoded = Bech32m.decode(tempoAddress)
    hrp = decoded.hrp
    data = decoded.data
  } catch {
    throw new InvalidChecksumError({ address: tempoAddress })
  }

  if (hrp !== 'tempo' && hrp !== 'tempoz')
    throw new InvalidPrefixError({ address: tempoAddress })

  let zoneId: number | bigint | undefined
  let rawAddress: Uint8Array
  if (hrp === 'tempoz') {
    const { value, size } = CompactSize.fromBytes(data)
    zoneId = value
    rawAddress = data.slice(size)
  } else {
    zoneId = undefined
    rawAddress = data
  }

  if (rawAddress.length !== 20)
    throw new InvalidLengthError({
      address: tempoAddress,
      expected: 20,
      actual: rawAddress.length,
    })

  const address = Address.checksum(Hex.fromBytes(rawAddress) as Address.Address)

  return { address, zoneId }
}

export declare namespace parse {
  type ReturnType = {
    /** The raw 20-byte Ethereum address. */
    address: Address.Address
    /** The zone ID, or `undefined` for mainnet addresses. */
    zoneId: number | bigint | undefined
  }

  type ErrorType =
    | InvalidPrefixError
    | InvalidLengthError
    | InvalidChecksumError
    | Errors.GlobalErrorType
}

/**
 * Validates a Tempo address string.
 *
 * @example
 * ```ts twoslash
 * import { TempoAddress } from 'ox/tempo'
 *
 * const valid = TempoAddress.validate(
 *   'tempo1wskntnrxxnq9x2f95wuyf0y7wk2l90fg0hlz9j',
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
      `Tempo address "${address}" has an invalid prefix. Expected "tempo1" or "tempoz1".`,
    )
  }
}

/** Thrown when a Tempo address has an invalid payload length. */
export class InvalidLengthError extends Errors.BaseError {
  override readonly name = 'TempoAddress.InvalidLengthError'

  constructor({
    address,
    expected,
    actual,
  }: { address: string; expected: number; actual: number }) {
    super(
      `Tempo address "${address}" has an invalid payload length. Expected ${expected} bytes, got ${actual}.`,
    )
  }
}

/** Thrown when a Tempo address has an invalid checksum. */
export class InvalidChecksumError extends Errors.BaseError {
  override readonly name = 'TempoAddress.InvalidChecksumError'

  constructor({ address }: { address: string }) {
    super(`Tempo address "${address}" has an invalid checksum.`)
  }
}
