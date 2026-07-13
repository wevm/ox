import type { Address as abitype_Address } from 'abitype'
import * as Bytes from './Bytes.js'
import * as Caches from './Caches.js'
import * as Errors from './Errors.js'
import * as Hash from './Hash.js'
import * as internal from './internal/address.js'
import * as PublicKey from './PublicKey.js'

/** Root type for Address. */
export type Address = abitype_Address

/**
 * Asserts that the given value is a valid {@link ox#Address.Address}.
 *
 * @example
 * ```ts twoslash
 * import { Address } from 'ox'
 *
 * Address.assert('0xA0Cf798816D4b9b9866b5330EEa46a18382f251e')
 * ```
 *
 * @example
 * ```ts twoslash
 * import { Address } from 'ox'
 *
 * Address.assert('0xdeadbeef')
 * // @error: InvalidAddressError: Address "0xdeadbeef" is invalid.
 * ```
 *
 * @param value - Value to assert if it is a valid address.
 * @param options - Assertion options.
 */
export function assert(
  value: string,
  options: assert.Options = {},
): asserts value is Address {
  const { strict = true } = options

  const kind = internal.classify(value)
  if (kind === 0)
    throw new InvalidAddressError({
      address: value,
      cause: new InvalidInputError(),
    })

  // Lowercase inputs are exempt from checksum verification.
  if (strict && kind === 2 && checksum(value as Address) !== value)
    throw new InvalidAddressError({
      address: value,
      cause: new InvalidChecksumError(),
    })
}

export declare namespace assert {
  type Options = {
    /**
     * Enables strict mode. Whether or not to compare the address against its checksum.
     *
     * @default true
     */
    strict?: boolean | undefined
  }

  type ErrorType = InvalidAddressError | Errors.GlobalErrorType
}

/**
 * Computes the checksum address for the given {@link ox#Address.Address}.
 *
 * @example
 * ```ts twoslash
 * import { Address } from 'ox'
 *
 * Address.checksum(
 *   '0xa0cf798816d4b9b9866b5330eea46a18382f251e'
 * )
 * // @log: '0xA0Cf798816D4b9b9866b5330EEa46a18382f251e'
 * ```
 *
 * @param address - The address to compute the checksum for.
 * @returns The checksummed address.
 */
export function checksum(address: string): Address {
  // Direct cache lookup keeps the common hot path (callers passing the same
  // string repeatedly) at a single `Map.get`.
  const direct = Caches.checksum.get(address)
  if (direct !== undefined) return direct

  if (!internal.hasShape(address))
    throw new InvalidAddressError({
      address,
      cause: new InvalidInputError(),
    })

  // Secondary lookup keyed by the canonical lowercase form so that mixed-case
  // spellings of the same address share an entry instead of competing for two
  // slots in a bounded cache.
  const key = internal.lowercase(address)
  if (key !== address) {
    const cached = Caches.checksum.get(key)
    if (cached !== undefined) {
      Caches.checksum.set(address, cached)
      return cached
    }
  }

  const hash = Hash.keccak256(Bytes.fromString(key.slice(2)), { as: 'Bytes' })

  const out = new Uint16Array(42)
  out[0] = 48 // '0'
  out[1] = 120 // 'x'
  for (let i = 0; i < 40; i++) {
    const code = key.charCodeAt(i + 2)
    const nibble = (i & 1) === 0 ? hash[i >> 1]! >> 4 : hash[i >> 1]! & 0x0f
    // Uppercase a-f when the corresponding nibble is >= 8. ASCII 'a'..'f' are
    // 97..102; subtracting 32 yields 'A'..'F'.
    out[i + 2] = nibble >= 8 && code >= 97 ? code - 32 : code
  }

  const result = String.fromCharCode.apply(
    null,
    out as unknown as number[],
  ) as Address
  Caches.checksum.set(key, result)
  if (key !== address) Caches.checksum.set(address, result)
  return result
}

export declare namespace checksum {
  type ErrorType =
    | assert.ErrorType
    | Hash.keccak256.ErrorType
    | Bytes.fromString.ErrorType
    | Errors.GlobalErrorType
}

/**
 * Converts a stringified address to a typed (optionally checksummed) {@link ox#Address.Address}.
 *
 * @example
 * ```ts twoslash
 * import { Address } from 'ox'
 *
 * Address.from('0xa0cf798816d4b9b9866b5330eea46a18382f251e')
 * // @log: '0xa0cf798816d4b9b9866b5330eea46a18382f251e'
 * ```
 *
 * @example
 * ```ts twoslash
 * import { Address } from 'ox'
 *
 * Address.from('0xa0cf798816d4b9b9866b5330eea46a18382f251e', {
 *   checksum: true
 * })
 * // @log: '0xA0Cf798816D4b9b9866b5330EEa46a18382f251e'
 * ```
 *
 * @example
 * ```ts twoslash
 * import { Address } from 'ox'
 *
 * Address.from('hello')
 * // @error: InvalidAddressError: Address "0xa" is invalid.
 * ```
 *
 * @param address - An address string to convert to a typed Address.
 * @param options - Conversion options.
 * @returns The typed Address.
 */
export function from(address: string, options: from.Options = {}): Address {
  const { checksum: checksumVal = false } = options
  assert(address)
  if (checksumVal) return checksum(address)
  return address as Address
}

export declare namespace from {
  type Options = {
    /**
     * Whether to checksum the address.
     *
     * @default false
     */
    checksum?: boolean | undefined
  }

  type ErrorType =
    | assert.ErrorType
    | checksum.ErrorType
    | Errors.GlobalErrorType
}

/**
 * Converts an ECDSA public key to an {@link ox#Address.Address}.
 *
 * @example
 * ```ts twoslash
 * import { Address, PublicKey } from 'ox'
 *
 * const publicKey = PublicKey.from(
 *   '0x048318535b54105d4a7aae60c08fc45f9687181b4fdfc625bd1a753fa7397fed753547f11ca8696646f2f3acb08e31016afac23e630c5d11f59f61fef57b0d2aa5'
 * )
 * const address = Address.fromPublicKey(publicKey)
 * // @log: '0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266'
 * ```
 *
 * @param publicKey - The ECDSA public key to convert to an {@link ox#Address.Address}.
 * @param options - Conversion options.
 * @returns The {@link ox#Address.Address} corresponding to the public key.
 */
export function fromPublicKey(
  publicKey: PublicKey.PublicKey,
  options: fromPublicKey.Options = {},
): Address {
  const address = Hash.keccak256(
    `0x${PublicKey.toHex(publicKey).slice(4)}`,
  ).substring(26)
  return from(`0x${address}`, options)
}

export declare namespace fromPublicKey {
  type Options = {
    /**
     * Whether to checksum the address.
     *
     * @default false
     */
    checksum?: boolean | undefined
  }

  type ErrorType =
    | Hash.keccak256.ErrorType
    | PublicKey.toHex.ErrorType
    | Errors.GlobalErrorType
}

/**
 * Checks if two {@link ox#Address.Address} are equal.
 *
 * @example
 * ```ts twoslash
 * import { Address } from 'ox'
 *
 * Address.isEqual(
 *   '0xa0cf798816d4b9b9866b5330eea46a18382f251e',
 *   '0xA0Cf798816D4b9b9866b5330EEa46a18382f251e'
 * )
 * // @log: true
 * ```
 *
 * @example
 * ```ts twoslash
 * import { Address } from 'ox'
 *
 * Address.isEqual(
 *   '0xa0cf798816d4b9b9866b5330eea46a18382f251e',
 *   '0xA0Cf798816D4b9b9866b5330EEa46a18382f251f'
 * )
 * // @log: false
 * ```
 *
 * @param addressA - The first address to compare.
 * @param addressB - The second address to compare.
 * @returns Whether the addresses are equal.
 */
export function isEqual(addressA: Address, addressB: Address): boolean {
  if (!internal.hasShape(addressA))
    throw new InvalidAddressError({
      address: addressA,
      cause: new InvalidInputError(),
    })
  if (!internal.hasShape(addressB))
    throw new InvalidAddressError({
      address: addressB,
      cause: new InvalidInputError(),
    })
  if (addressA === addressB) return true
  return addressA.toLowerCase() === addressB.toLowerCase()
}

export declare namespace isEqual {
  type ErrorType = assert.ErrorType | Errors.GlobalErrorType
}

/**
 * Checks if the given address is a valid {@link ox#Address.Address}.
 *
 * @example
 * ```ts twoslash
 * import { Address } from 'ox'
 *
 * Address.validate(
 *   '0xA0Cf798816D4b9b9866b5330EEa46a18382f251e'
 * )
 * // @log: true
 * ```
 *
 * @example
 * ```ts twoslash
 * import { Address } from 'ox'
 *
 * Address.validate('0xdeadbeef')
 * // @log: false
 * ```
 *
 * @param address - Value to check if it is a valid address.
 * @param options - Check options.
 * @returns Whether the address is a valid address.
 */
export function validate(
  address: string,
  options: validate.Options = {},
): address is Address {
  const { strict = true } = options ?? {}
  const kind = internal.classify(address)
  if (kind === 0) return false
  if (!strict || kind === 1) return true
  return checksum(address as Address) === address
}

export declare namespace validate {
  type Options = {
    /**
     * Enables strict mode. Whether or not to compare the address against its checksum.
     *
     * @default true
     */
    strict?: boolean | undefined
  }
}

/**
 * Thrown when an address is invalid.
 *
 * @example
 * ```ts twoslash
 * import { Address } from 'ox'
 *
 * Address.from('0x123')
 * // @error: Address.InvalidAddressError: Address `0x123` is invalid.
 * ```
 */
export class InvalidAddressError<
  cause extends InvalidInputError | InvalidChecksumError =
    | InvalidInputError
    | InvalidChecksumError,
> extends Errors.BaseError<cause> {
  override readonly name = 'Address.InvalidAddressError'

  constructor({ address, cause }: { address: string; cause: cause }) {
    super(`Address "${address}" is invalid.`, {
      cause,
    })
  }
}

/** Thrown when an address is not a 20 byte (40 hexadecimal character) value. */
export class InvalidInputError extends Errors.BaseError {
  override readonly name = 'Address.InvalidInputError'

  constructor() {
    super('Address is not a 20 byte (40 hexadecimal character) value.')
  }
}

/** Thrown when an address does not match its checksum counterpart. */
export class InvalidChecksumError extends Errors.BaseError {
  override readonly name = 'Address.InvalidChecksumError'

  constructor() {
    super('Address does not match its checksum counterpart.')
  }
}
