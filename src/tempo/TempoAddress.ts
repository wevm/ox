import * as Address from '../core/Address.js'
import * as Base32 from '../core/Base32.js'
import * as Bytes from '../core/Bytes.js'
import * as CompactSize from '../core/CompactSize.js'
import * as Errors from '../core/Errors.js'
import * as Hash from '../core/Hash.js'
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
 * // @log: 'tempo1wskntnrxxnq9x2f95wuyf0y7wk2l90fg8zd8djs'
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
 * // @log: 'tempoz1q96z6dwvvc6vq5efyk3ms39une6etu4a9zeqtx3q'
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

  const prefix = zoneId != null ? 'tempoz1' : 'tempo1'
  const zone = zoneId != null ? CompactSize.toBytes(zoneId) : new Uint8Array()
  const address_bytes = Bytes.fromHex(address)

  const input = Bytes.concat(Bytes.fromString(prefix), zone, address_bytes)
  const checksum = Hash.sha256(Hash.sha256(input, { as: 'Bytes' }), {
    as: 'Bytes',
  }).slice(0, 4)

  const payload = Bytes.concat(zone, address_bytes, checksum)
  return `${prefix}${Base32.fromBytes(payload)}` as TempoAddress
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
 *   'tempo1wst8d6qejxtdg4y5r3zarvary0c5xw7kvmgh8pm',
 * )
 * // { address: '0x742d35Cc6634C0532925a3b844Bc9e7595f2bD28', zoneId: undefined }
 * ```
 *
 * @example
 * ### Zone Address
 * ```ts twoslash
 * import { TempoAddress } from 'ox/tempo'
 *
 * const result = TempoAddress.parse(
 *   'tempoz1qwst8d6qejxtdg4y5r3zarvary0c5xw7kvmgh8pm',
 * )
 * // { address: '0x742d35Cc6634C0532925a3b844Bc9e7595f2bD28', zoneId: 1 }
 * ```
 *
 * @param tempoAddress - The Tempo address string to parse.
 * @returns The parsed raw address and optional zone ID.
 */
export function parse(tempoAddress: string): parse.ReturnType {
  const lower = tempoAddress.toLowerCase()

  let prefix: string
  let hasZone: boolean
  if (lower.startsWith('tempoz1')) {
    prefix = 'tempoz1'
    hasZone = true
  } else if (lower.startsWith('tempo1')) {
    prefix = 'tempo1'
    hasZone = false
  } else {
    throw new InvalidPrefixError({ address: tempoAddress })
  }

  const payload = Base32.toBytes(lower.slice(prefix.length))

  let zoneId: number | bigint | undefined
  let remaining: Uint8Array
  if (hasZone) {
    const { value, size } = CompactSize.fromBytes(payload)
    zoneId = value
    remaining = payload.slice(size)
  } else {
    zoneId = undefined
    remaining = payload
  }

  if (remaining.length !== 24)
    throw new InvalidLengthError({
      address: tempoAddress,
      expected: 24,
      actual: remaining.length,
    })

  const rawAddress = remaining.slice(0, 20)
  const checksum = remaining.slice(20, 24)

  const zoneBytes =
    zoneId != null ? CompactSize.toBytes(zoneId) : new Uint8Array()
  const checksumInput = Bytes.concat(
    Bytes.fromString(prefix),
    zoneBytes,
    rawAddress,
  )
  const expected = Hash.sha256(Hash.sha256(checksumInput, { as: 'Bytes' }), {
    as: 'Bytes',
  }).slice(0, 4)

  if (!Bytes.isEqual(checksum, expected))
    throw new InvalidChecksumError({ address: tempoAddress })

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
 *   'tempo1wst8d6qejxtdg4y5r3zarvary0c5xw7kvmgh8pm',
 * )
 * // true
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
