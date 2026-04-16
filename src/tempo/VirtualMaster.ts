import * as Address from '../core/Address.js'
import * as Bytes from '../core/Bytes.js'
import type * as Errors from '../core/Errors.js'
import * as Hash from '../core/Hash.js'
import * as Hex from '../core/Hex.js'
import * as TempoAddress from './TempoAddress.js'

/** A valid salt input for TIP-1022 master registration. */
export type Salt = Hex.Hex | Bytes.Bytes | number | bigint

/**
 * Streaming Keccak-256 interface used by {@link mineSalt}.
 *
 * This is intentionally narrow so callers can inject accelerated implementations
 * without pulling them into `ox` itself. For example, `await createKeccak(256)`
 * from `hash-wasm` fits this shape directly.
 */
export type Keccak256 = {
  init(): unknown
  update(value: Bytes.Bytes): unknown
  digest(): Bytes.Bytes | string
}

/**
 * Computes the TIP-1022 registration hash for a master address and salt.
 *
 * The registration hash is `keccak256(masterAddress || salt)` where `salt`
 * is encoded as a 32-byte value.
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
 * This returns bytes `[4:8]` of the registration hash, regardless of whether the
 * salt satisfies the proof-of-work requirement.
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
 * This is intentionally a small, deterministic primitive. It does not coordinate
 * workers or async execution. Callers that need large searches can shard ranges
 * externally and optionally inject a faster Keccak backend.
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
 * @example
 * ### Inject a Faster Keccak Backend
 *
 * ```ts twoslash
 * // @noErrors
 * import { createKeccak } from 'hash-wasm'
 * import { VirtualMaster } from 'ox/tempo'
 *
 * const keccak256 = await createKeccak(256)
 *
 * const result = VirtualMaster.mineSalt(
 *   {
 *     address: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
 *     start: 0xabf52ba0n,
 *     count: 16,
 *   },
 *   { keccak256 },
 * )
 * ```
 *
 * @param value - Search range parameters.
 * @param options - Search options.
 * @returns The first matching salt in the range, if any.
 */
export function mineSalt(
  value: mineSalt.Value,
  options: mineSalt.Options = {},
): mineSalt.ReturnType | undefined {
  if (value.count <= 0) return undefined

  const address = resolveAddress(value.address)
  const addressBytes = Bytes.fromHex(address)
  const saltBytes = toFixedBytes(value.start ?? 0n, 32)
  const input = new Uint8Array(addressBytes.length + saltBytes.length)
  input.set(addressBytes)

  for (let i = 0; i < value.count; i++) {
    input.set(saltBytes, addressBytes.length)

    const registrationHash = options.keccak256
      ? hashWithKeccak256(addressBytes, saltBytes, options.keccak256)
      : Hash.keccak256(input, { as: 'Bytes' })

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

  type Options = {
    /** Optional streaming Keccak-256 backend for repeated hashing. */
    keccak256?: Keccak256 | undefined
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
    | Hash.keccak256.ErrorType
    | Hex.assert.ErrorType
    | Hex.fromBytes.ErrorType
    | Hex.fromNumber.ErrorType
    | Hex.padLeft.ErrorType
    | TempoAddress.parse.ErrorType
    | Errors.GlobalErrorType
}

function digestToBytes(digest: Bytes.Bytes | string): Bytes.Bytes {
  if (digest instanceof Uint8Array) return Uint8Array.from(digest)
  return Bytes.fromHex(
    (digest.startsWith('0x') ? digest : `0x${digest}`) as Hex.Hex,
  )
}

function hashWithKeccak256(
  address: Bytes.Bytes,
  salt: Bytes.Bytes,
  keccak256: Keccak256,
): Bytes.Bytes {
  keccak256.init()
  keccak256.update(address)
  keccak256.update(salt)
  return digestToBytes(keccak256.digest())
}

function hasProofOfWork(hash: Bytes.Bytes): boolean {
  return hash[0] === 0 && hash[1] === 0 && hash[2] === 0 && hash[3] === 0
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
  return resolved
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
