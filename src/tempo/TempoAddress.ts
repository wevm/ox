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
 * // @log: 'tempo1qp6z6dwvvc6vq5efyk3ms39une6etu4a9qtj2kk0'
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
 * // @log: 'tempoz1qqqhgtf4e3nrfszn9yj68wzyhj08t90jh55q74d9uj'
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
  const version = new Uint8Array([0x00])
  const zone = zoneId != null ? CompactSize.toBytes(zoneId) : new Uint8Array()
  const data = Bytes.concat(version, zone, Bytes.fromHex(address))

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
 *   'tempo1qp6z6dwvvc6vq5efyk3ms39une6etu4a9qtj2kk0',
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
 *   'tempoz1qqqhgtf4e3nrfszn9yj68wzyhj08t90jh55q74d9uj',
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

  if (data.length < 1 || data[0] !== 0x00)
    throw new InvalidVersionError({
      address: tempoAddress,
      version: data.length > 0 ? data[0]! : undefined,
    })

  const payload = data.slice(1)

  let zoneId: number | bigint | undefined
  let rawAddress: Uint8Array
  if (hrp === 'tempoz') {
    const { value, size } = CompactSize.fromBytes(payload)
    zoneId = value
    rawAddress = payload.slice(size)
  } else {
    zoneId = undefined
    rawAddress = payload
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
    | InvalidVersionError
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
 *   'tempo1qp6z6dwvvc6vq5efyk3ms39une6etu4a9qtj2kk0',
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

/** Thrown when a Tempo address has an unsupported version byte. */
export class InvalidVersionError extends Errors.BaseError {
  override readonly name = 'TempoAddress.InvalidVersionError'

  constructor({
    address,
    version,
  }: { address: string; version: number | undefined }) {
    super(
      `Tempo address "${address}" has unsupported version ${version === undefined ? '(missing)' : `0x${version.toString(16).padStart(2, '0')}`}. Only version 0x00 is supported.`,
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
