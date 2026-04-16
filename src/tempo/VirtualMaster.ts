import * as Address from '../core/Address.js'
import * as Bytes from '../core/Bytes.js'
import * as Errors from '../core/Errors.js'
import * as Hash from '../core/Hash.js'
import * as Hex from '../core/Hex.js'
import * as TempoAddress from './TempoAddress.js'
import * as VirtualAddress from './VirtualAddress.js'

const tip20Prefix = '0x20c000000000000000000000'
const zeroAddress = '0x0000000000000000000000000000000000000000'

/** A valid salt input for TIP-1022 master registration. */
export type Salt = Hex.Hex | Bytes.Bytes | number | bigint

/**
 * Computes the TIP-1022 registration hash for a master address and salt.
 *
 * [TIP-1022](https://docs.tempo.xyz/protocol/tips/tip-1022)
 *
 * The registration hash is `keccak256(masterAddress || salt)` where `salt`
 * is encoded as a 32-byte value.
 *
 * Master addresses must satisfy TIP-1022 registration constraints: they cannot
 * be the zero address, another virtual address, or a TIP-20 token address.
 *
 * @example
 * ```ts twoslash
 * import { VirtualMaster } from 'ox/tempo'
 *
 * const hash = VirtualMaster.getRegistrationHash({
 *   address: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
 *   salt: '0x00000000000000000000000000000000000000000000000000000000abf52baf',
 * })
 *
 * hash
 * // @log: '0x0000000058e21090d8f4bee424b90cddc2378aefa1bbbfa1443631a929ae966d'
 * ```
 *
 * @param value - Master address and salt.
 * @returns The registration hash.
 */
export function getRegistrationHash(value: getRegistrationHash.Value): Hex.Hex {
  return Hash.keccak256(
    Hex.concat(resolveAddress(value.address), toFixedHex(value.salt, 32)),
  )
}

export declare namespace getRegistrationHash {
  type Value = {
    /** Master address. Accepts both hex and Tempo addresses. */
    address: TempoAddress.Address
    /** 32-byte salt used for registration. */
    salt: Salt
  }

  type ErrorType =
    | Address.assert.ErrorType
    | Bytes.padLeft.ErrorType
    | Errors.BaseError
    | Hash.keccak256.ErrorType
    | Hex.assert.ErrorType
    | Hex.fromBytes.ErrorType
    | Hex.fromNumber.ErrorType
    | Hex.padLeft.ErrorType
    | TempoAddress.parse.ErrorType
    | Errors.GlobalErrorType
}

/**
 * Derives the 4-byte TIP-1022 `masterId` from a master address and salt.
 *
 * [TIP-1022](https://docs.tempo.xyz/protocol/tips/tip-1022)
 *
 * This returns bytes `[4:8]` of the registration hash, regardless of whether the
 * salt satisfies the proof-of-work requirement.
 *
 * Master addresses must satisfy TIP-1022 registration constraints: they cannot
 * be the zero address, another virtual address, or a TIP-20 token address.
 *
 * @example
 * ```ts twoslash
 * import { VirtualMaster } from 'ox/tempo'
 *
 * const masterId = VirtualMaster.getMasterId({
 *   address: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
 *   salt: '0x00000000000000000000000000000000000000000000000000000000abf52baf',
 * })
 *
 * masterId
 * // @log: '0x58e21090'
 * ```
 *
 * @param value - Master address and salt.
 * @returns The derived master identifier.
 */
export function getMasterId(value: getMasterId.Value): Hex.Hex {
  return Hex.slice(getRegistrationHash(value), 4, 8)
}

export declare namespace getMasterId {
  type Value = getRegistrationHash.Value
  type ErrorType = getRegistrationHash.ErrorType | Errors.GlobalErrorType
}

/**
 * Validates that a salt satisfies the TIP-1022 32-bit proof-of-work requirement.
 *
 * [TIP-1022](https://docs.tempo.xyz/protocol/tips/tip-1022)
 *
 * Returns `false` for invalid master addresses, including the zero address,
 * virtual addresses, and TIP-20 token addresses.
 *
 * @example
 * ```ts twoslash
 * import { VirtualMaster } from 'ox/tempo'
 *
 * const valid = VirtualMaster.validateSalt({
 *   address: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
 *   salt: '0x00000000000000000000000000000000000000000000000000000000abf52baf',
 * })
 *
 * valid
 * // @log: true
 * ```
 *
 * @param value - Master address and salt.
 * @returns `true` if the first 4 bytes of the registration hash are zero.
 */
export function validateSalt(value: validateSalt.Value): boolean {
  try {
    return hasProofOfWork(
      Hash.keccak256(
        Hex.concat(resolveAddress(value.address), toFixedHex(value.salt, 32)),
        { as: 'Bytes' },
      ),
    )
  } catch {
    return false
  }
}

export declare namespace validateSalt {
  type Value = getRegistrationHash.Value
}

/**
 * Searches a bounded range of salts for the first value that satisfies TIP-1022 PoW.
 *
 * [TIP-1022](https://docs.tempo.xyz/protocol/tips/tip-1022)
 *
 * This is intentionally a small, deterministic primitive. It does not coordinate
 * workers or async execution. Callers that need large searches can shard ranges
 * externally.
 *
 * Master addresses must satisfy TIP-1022 registration constraints: they cannot
 * be the zero address, another virtual address, or a TIP-20 token address.
 *
 * @example
 * ```ts twoslash
 * import { VirtualMaster } from 'ox/tempo'
 *
 * const result = VirtualMaster.mineSalt({
 *   address: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
 *   start: 0xabf52ba0n,
 *   count: 16,
 * })
 *
 * result?.salt
 * // @log: '0x00000000000000000000000000000000000000000000000000000000abf52baf'
 * ```
 *
 * @param value - Search range parameters.
 * @returns The first matching salt in the range, if any.
 */
export function mineSalt(
  value: mineSalt.Value,
): mineSalt.ReturnType | undefined {
  assertCount(value.count)

  const address = resolveAddress(value.address)
  const addressBytes = Bytes.fromHex(address)
  const saltBytes = toFixedBytes(value.start ?? 0n, 32)
  const input = new Uint8Array(addressBytes.length + saltBytes.length)
  input.set(addressBytes)

  for (let i = 0; i < value.count; i++) {
    input.set(saltBytes, addressBytes.length)

    const registrationHash = Hash.keccak256(input, { as: 'Bytes' })

    if (hasProofOfWork(registrationHash)) {
      return {
        masterId: Hex.fromBytes(registrationHash.subarray(4, 8)),
        registrationHash: Hex.fromBytes(registrationHash),
        salt: Hex.fromBytes(saltBytes),
      }
    }

    if (i < value.count - 1 && !increment(saltBytes)) break
  }

  return undefined
}

export declare namespace mineSalt {
  type Value = {
    /** Master address. Accepts both hex and Tempo addresses. */
    address: TempoAddress.Address
    /** Number of consecutive salts to try. */
    count: number
    /** Starting salt value. @default 0n */
    start?: Salt | undefined
  }

  type ReturnType = {
    /** The 4-byte master identifier derived from the matching salt. */
    masterId: Hex.Hex
    /** The matching registration hash. */
    registrationHash: Hex.Hex
    /** The discovered 32-byte salt. */
    salt: Hex.Hex
  }

  type ErrorType =
    | Address.assert.ErrorType
    | Bytes.fromHex.ErrorType
    | Bytes.padLeft.ErrorType
    | Errors.BaseError
    | Hash.keccak256.ErrorType
    | Hex.assert.ErrorType
    | Hex.fromBytes.ErrorType
    | Hex.fromNumber.ErrorType
    | Hex.padLeft.ErrorType
    | TempoAddress.parse.ErrorType
    | Errors.GlobalErrorType
}

function hasProofOfWork(hash: Bytes.Bytes): boolean {
  return hash[0] === 0 && hash[1] === 0 && hash[2] === 0 && hash[3] === 0
}

function assertCount(count: number) {
  if (Number.isSafeInteger(count) && count > 0) return

  throw new Errors.BaseError(
    `Count "${count}" is invalid. Expected a positive safe integer.`,
  )
}

function increment(bytes: Bytes.Bytes): boolean {
  for (let i = bytes.length - 1; i >= 0; i--) {
    const value = bytes[i]!
    if (value === 0xff) {
      bytes[i] = 0
      continue
    }

    bytes[i] = value + 1
    return true
  }

  return false
}

function resolveAddress(address: string): Address.Address {
  const resolved = TempoAddress.resolve(address as TempoAddress.Address)
  Address.assert(resolved, { strict: false })
  assertValidMasterAddress(resolved)
  return resolved
}

function assertValidMasterAddress(address: Address.Address) {
  const normalized = address.toLowerCase()

  if (normalized === zeroAddress)
    throw new Errors.BaseError(
      'Virtual master address cannot be the zero address.',
    )

  if (VirtualAddress.isVirtual(address))
    throw new Errors.BaseError(
      'Virtual master address cannot itself be a virtual address.',
    )

  if (normalized.startsWith(tip20Prefix))
    throw new Errors.BaseError(
      'Virtual master address cannot be a TIP-20 token address.',
    )
}

function toFixedBytes(value: Salt, size: number): Bytes.Bytes {
  return Bytes.fromHex(toFixedHex(value, size))
}

function toFixedHex(value: Salt, size: number): Hex.Hex {
  if (typeof value === 'number' || typeof value === 'bigint')
    return Hex.fromNumber(value, { size })
  if (typeof value === 'string') {
    Hex.assert(value, { strict: true })
    return Hex.padLeft(value, size)
  }
  return Hex.fromBytes(Bytes.padLeft(value, size))
}
