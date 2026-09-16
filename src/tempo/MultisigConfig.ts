import * as Address from '../core/Address.js'
import type * as Bytes from '../core/Bytes.js'
import * as Errors from '../core/Errors.js'
import * as Hash from '../core/Hash.js'
import * as Hex from '../core/Hex.js'
import type { Compute } from '../core/internal/types.js'

/** Maximum number of owners allowed in a native multisig config. */
export const maxOwners = 48

/** Maximum threshold accepted by a native multisig config. */
export const maxThreshold = 8

/** Maximum number of owner approvals in a native multisig signature. */
export const maxSignatures = maxThreshold

/** Maximum encoded byte length for one owner approval. */
export const maxOwnerSignatureBytes = 2049

/** Tempo signature type byte for native multisig signatures. */
export const signatureTypeByte = '0x05' as const

/** Zero 32-byte salt (the default when no salt is provided). */
export const zeroSalt = `0x${'00'.repeat(32)}` as const

/** Domain prefix for the native multisig account address derivation. */
const accountDomain = 'tempo:multisig:account'

/** Domain prefix for native multisig owner approvals. */
const signatureDomain = 'tempo:multisig:signature'

/**
 * Native multisig configuration. Determines the stable multisig account
 * address.
 */
export type Config<numberType = number> = Compute<{
  /**
   * Caller-chosen 32-byte salt mixed into the derived account address.
   * Defaults to the zero salt (`MultisigConfig.zeroSalt`) when omitted.
   */
  salt?: Hex.Hex | undefined
  /** Configuration version. Defaults to zero for the initial configuration. */
  version?: bigint | undefined
  /** Minimum total owner weight required to authorize a transaction. */
  threshold: numberType
  /** Weighted owner list (strictly ascending by `owner` address). */
  owners: readonly Owner<numberType>[]
}>

/** Native multisig owner entry. */
export type Owner<numberType = number> = {
  /** Owner address (recovered from the owner's approval). */
  owner: Address.Address
  /** Nonzero owner weight. */
  weight: numberType
}

/** RLP tuple representation of a {@link ox#MultisigConfig.Config}. */
export type Tuple = readonly [
  salt: Hex.Hex,
  version: Hex.Hex,
  threshold: Hex.Hex,
  owners: readonly Hex.Hex[][],
]

/**
 * Asserts that a native multisig {@link ox#MultisigConfig.Config} is valid.
 *
 * Mirrors the Tempo `MultisigConfig::validate` rules: owners non-empty and
 * `<= maxOwners`, strictly ascending unique nonzero owner addresses, nonzero
 * integer owner weights, integer `threshold` between `1` and `maxThreshold`,
 * total weight `<= 255` (u8 max), and `threshold <= total weight`.
 *
 * @example
 * ```ts twoslash
 * import { MultisigConfig } from 'ox/tempo'
 *
 * MultisigConfig.assert({
 *   threshold: 1,
 *   owners: [
 *     {
 *       owner: '0x1111111111111111111111111111111111111111',
 *       weight: 1
 *     }
 *   ]
 * })
 * ```
 *
 * @param config - The multisig config.
 */
export function assert<numberType = number>(config: Config<numberType>): void {
  const { salt, version = 0n, threshold, owners } = config

  if (
    typeof version !== 'bigint' ||
    version < 0n ||
    version > 0xffffffffffffffffn
  )
    throw new InvalidConfigError({ reason: 'version must be a uint64' })

  if (typeof salt !== 'undefined' && Hex.size(salt) !== 32)
    throw new InvalidConfigError({ reason: 'salt must be 32 bytes' })
  if (owners.length === 0)
    throw new InvalidConfigError({ reason: 'owners cannot be empty' })
  if (owners.length > maxOwners)
    throw new InvalidConfigError({ reason: 'too many owners' })
  if (!Number.isInteger(Number(threshold)))
    throw new InvalidConfigError({ reason: 'threshold must be an integer' })
  if (Number(threshold) < 1)
    throw new InvalidConfigError({ reason: 'threshold cannot be zero' })
  if (Number(threshold) > maxThreshold)
    throw new InvalidConfigError({ reason: 'threshold exceeds max threshold' })

  let totalWeight = 0
  let previous: bigint | undefined
  for (const owner of owners) {
    if (!Address.validate(owner.owner) || Hex.toBigInt(owner.owner) === 0n)
      throw new InvalidConfigError({ reason: 'owner cannot be zero' })
    if (!Number.isInteger(Number(owner.weight)))
      throw new InvalidConfigError({
        reason: 'owner weight must be an integer',
      })
    if (Number(owner.weight) < 1)
      throw new InvalidConfigError({ reason: 'owner weight cannot be zero' })

    const current = Hex.toBigInt(owner.owner)
    if (typeof previous !== 'undefined' && previous >= current)
      throw new InvalidConfigError({
        reason: 'owners must be strictly ascending',
      })
    previous = current

    totalWeight += Number(owner.weight)
  }

  if (totalWeight > 0xff)
    throw new InvalidConfigError({
      reason: 'total owner weight exceeds u8 max',
    })
  if (Number(threshold) > totalWeight)
    throw new InvalidConfigError({
      reason: 'threshold exceeds total owner weight',
    })
}

export declare namespace assert {
  type ErrorType = InvalidConfigError | Errors.GlobalErrorType
}

/**
 * Normalizes a native multisig {@link ox#MultisigConfig.Config}.
 *
 * Sorts owners into strictly ascending `owner` address order (the canonical
 * form required for account derivation) and asserts the config is valid.
 *
 * @example
 * ```ts twoslash
 * import { MultisigConfig } from 'ox/tempo'
 *
 * const config = MultisigConfig.from({
 *   threshold: 2,
 *   owners: [
 *     {
 *       owner: '0x2222222222222222222222222222222222222222',
 *       weight: 1
 *     },
 *     {
 *       owner: '0x1111111111111111111111111111111111111111',
 *       weight: 1
 *     }
 *   ]
 * })
 * // owners are now sorted ascending by address
 * ```
 *
 * @param config - The multisig config.
 * @returns The normalized multisig config.
 */
export function from<numberType = number>(
  config: Config<numberType>,
): Config<numberType> {
  const owners = [...config.owners].sort((a, b) =>
    Hex.toBigInt(a.owner) < Hex.toBigInt(b.owner) ? -1 : 1,
  )
  const normalized = {
    salt: config.salt ? Hex.padLeft(config.salt, 32) : zeroSalt,
    version: config.version ?? 0n,
    threshold: config.threshold,
    owners,
  } as Config<numberType>
  assert(normalized)
  return normalized
}

/**
 * Converts an RLP {@link ox#MultisigConfig.Tuple} back to a
 * {@link ox#MultisigConfig.Config}.
 *
 * @example
 * ```ts twoslash
 * import { MultisigConfig } from 'ox/tempo'
 *
 * const config = MultisigConfig.fromTuple([
 *   `0x${'00'.repeat(32)}`,
 *   '0x',
 *   '0x01',
 *   [['0x1111111111111111111111111111111111111111', '0x01']]
 * ])
 * ```
 *
 * @param tuple - The RLP tuple.
 * @returns The multisig config.
 */
export function fromTuple(tuple: Tuple): Config {
  const [salt, version, threshold, owners] = tuple
  if (
    tuple.length !== 4 ||
    typeof salt !== 'string' ||
    Hex.size(salt) !== 32 ||
    typeof version !== 'string' ||
    Hex.size(version) > 8 ||
    version.startsWith('0x00') ||
    typeof threshold !== 'string' ||
    Hex.size(threshold) > 1 ||
    threshold.startsWith('0x00') ||
    !Array.isArray(owners) ||
    owners.some(
      (owner) =>
        !Array.isArray(owner) ||
        owner.length !== 2 ||
        typeof owner[0] !== 'string' ||
        !Address.validate(owner[0]) ||
        typeof owner[1] !== 'string' ||
        Hex.size(owner[1] as Hex.Hex) > 1 ||
        owner[1].startsWith('0x00'),
    )
  )
    throw new InvalidConfigError({ reason: 'invalid config RLP tuple' })
  const config = {
    salt: salt && salt !== '0x' ? Hex.padLeft(salt, 32) : zeroSalt,
    version: version === '0x' ? 0n : Hex.toBigInt(version),
    threshold: threshold === '0x' ? 0 : Hex.toNumber(threshold),
    owners: owners.map((owner) => {
      const [ownerAddress, weight] = owner as readonly Hex.Hex[]
      return {
        owner: ownerAddress as Address.Address,
        weight: !weight || weight === '0x' ? 0 : Hex.toNumber(weight),
      }
    }),
  }
  assert(config)
  return config
}

/**
 * Derives the stable native multisig account address.
 *
 * Uses CREATE2 with the chain's recovery factory and the protocol recovery
 * wallet init-code hash. The CREATE2 salt hashes the initial salt, threshold,
 * and ordered weighted owners under the `tempo:multisig:account` domain.
 * The chain must explicitly configure a recovery factory; there is no default.
 *
 * The address is derived once from the initial (bootstrap) config and never
 * changes. Keep the initial config for address derivation after rotation.
 *
 * @example
 * ```ts twoslash
 * import { MultisigConfig } from 'ox/tempo'
 *
 * const genesisConfig = MultisigConfig.from({
 *   threshold: 1,
 *   owners: [
 *     {
 *       owner: '0x1111111111111111111111111111111111111111',
 *       weight: 1
 *     }
 *   ]
 * })
 *
 * const address = MultisigConfig.getAddress(genesisConfig, {
 *   factory: '0x7171717171717171717171717171717171717171'
 * })
 * ```
 *
 * @param config - The initial (bootstrap) multisig config.
 * @param options - Recovery factory configured by the chain.
 * @returns The multisig account address.
 */
export function getAddress(
  config: Config,
  options: getAddress.Options,
): Address.Address {
  Address.assert(options.factory)
  assert(config)
  const hash = Hash.keccak256(
    Hex.concat(
      Hex.fromString(accountDomain),
      Hex.padLeft(config.salt ?? zeroSalt, 32),
      Hex.fromNumber(config.threshold, { size: 1 }),
      Hex.fromNumber(config.owners.length, { size: 1 }),
      ...config.owners.flatMap((owner) => [
        owner.owner,
        Hex.fromNumber(owner.weight, { size: 1 }),
      ]),
    ),
  )
  const account = Address.from(
    Hex.slice(
      Hash.keccak256(
        Hex.concat(
          '0xff',
          options.factory,
          hash,
          '0x583cc63a2e37f645b43eac911b1a6d6de08b83abdc308c61364edda8cfc3bd37',
        ),
      ),
      12,
      32,
    ),
  )
  if (Hex.toBigInt(account) === 0n)
    throw new InvalidConfigError({ reason: 'derived account cannot be zero' })
  if (config.owners.some((owner) => Address.isEqual(owner.owner, account)))
    throw new InvalidConfigError({
      reason: 'derived account cannot be an owner',
    })
  return account
}

export declare namespace getAddress {
  type Options = {
    /** Recovery factory configured by the chain. No production default exists. */
    factory: Address.Address
  }

  type ErrorType =
    | assert.ErrorType
    | Address.from.ErrorType
    | Hash.keccak256.ErrorType
    | Hex.concat.ErrorType
    | Hex.fromNumber.ErrorType
    | Hex.fromString.ErrorType
    | Hex.slice.ErrorType
    | Errors.GlobalErrorType
}

/**
 * Computes the version-bound digest approved by native multisig owners.
 *
 * Hashes `tempo:multisig:signature`, the 32-byte transaction sign payload,
 * the permanent account address, and the current uint64 config version
 * encoded as eight big-endian bytes. Rotation invalidates earlier approvals.
 *
 * @example
 * ```ts twoslash
 * import { MultisigConfig } from 'ox/tempo'
 *
 * const digest = MultisigConfig.getSignPayload({
 *   payload: `0x${'ab'.repeat(32)}`,
 *   account: '0x1111111111111111111111111111111111111111',
 *   version: 0n
 * })
 * ```
 *
 * @param value - Account, current version, and transaction sign payload.
 * @returns The owner approval digest.
 */
export function getSignPayload(value: getSignPayload.Value): Hex.Hex {
  const { account, payload, version } = value
  Address.assert(account)
  const digest = Hex.from(payload)
  if (Hex.size(digest) !== 32)
    throw new InvalidConfigError({ reason: 'payload must be 32 bytes' })
  return Hash.keccak256(
    Hex.concat(
      Hex.fromString(signatureDomain),
      digest,
      account,
      Hex.fromNumber(version, { size: 8 }),
    ),
  )
}

export declare namespace getSignPayload {
  type Value = {
    /** The 32-byte transaction sign payload. */
    payload: Hex.Hex | Bytes.Bytes
    /** Permanent native multisig account address. */
    account: Address.Address
    /** Current configuration version. */
    version: bigint
  }

  type ErrorType =
    | InvalidConfigError
    | Address.assert.ErrorType
    | Hash.keccak256.ErrorType
    | Hex.concat.ErrorType
    | Hex.from.ErrorType
    | Hex.fromNumber.ErrorType
    | Errors.GlobalErrorType
}

/**
 * Converts a {@link ox#MultisigConfig.Config} to its RLP tuple form (carried
 * by every multisig signature).
 *
 * Tuple shape: `[salt, version, threshold, [[owner, weight], ...]]`. The
 * 32-byte `salt` encodes as a full fixed-width string; other integers use
 * canonical RLP encoding (zero values encode as `0x`).
 *
 * @example
 * ```ts twoslash
 * import { MultisigConfig } from 'ox/tempo'
 *
 * const tuple = MultisigConfig.toTuple({
 *   threshold: 1,
 *   owners: [
 *     {
 *       owner: '0x1111111111111111111111111111111111111111',
 *       weight: 1
 *     }
 *   ]
 * })
 * ```
 *
 * @param config - The multisig config.
 * @returns The RLP tuple.
 */
export function toTuple(config: Config): Tuple {
  assert(config)
  const owners = config.owners.map(
    (owner) => [owner.owner, Hex.fromNumber(owner.weight)] as Hex.Hex[],
  )
  // `salt` is a fixed 32-byte value: it RLP-encodes as a full 32-byte string
  // (including the zero salt), never trimmed like an integer.
  const salt = config.salt ? Hex.padLeft(config.salt, 32) : zeroSalt
  return [
    salt,
    config.version ? Hex.fromNumber(config.version) : '0x',
    Hex.fromNumber(config.threshold),
    owners,
  ] as const
}

/**
 * Validates a native multisig {@link ox#MultisigConfig.Config}. Returns `true`
 * if valid, `false` otherwise.
 *
 * @example
 * ```ts twoslash
 * import { MultisigConfig } from 'ox/tempo'
 *
 * const valid = MultisigConfig.validate({
 *   threshold: 1,
 *   owners: [
 *     {
 *       owner: '0x1111111111111111111111111111111111111111',
 *       weight: 1
 *     }
 *   ]
 * })
 * // @log: true
 * ```
 *
 * @param config - The multisig config.
 * @returns Whether the config is valid.
 */
export function validate(config: Config): boolean {
  try {
    assert(config)
    return true
  } catch {
    return false
  }
}

/** Thrown when a native multisig config is invalid. */
export class InvalidConfigError extends Errors.BaseError {
  override readonly name = 'MultisigConfig.InvalidConfigError'
  constructor({ reason }: { reason: string }) {
    super(`Invalid native multisig config: ${reason}.`)
  }
}
