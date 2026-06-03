import * as Address from '../core/Address.js'
import type * as Bytes from '../core/Bytes.js'
import * as Errors from '../core/Errors.js'
import * as Hash from '../core/Hash.js'
import * as Hex from '../core/Hex.js'
import type { Compute, OneOf } from '../core/internal/types.js'

/** Maximum number of owners allowed in a native multisig config. */
export const maxOwners = 10

/** Maximum encoded byte length for one primitive owner approval. */
export const maxOwnerSignatureBytes = 2049

/** Tempo signature type byte for native multisig signatures. */
export const signatureTypeByte = '0x05' as const

/** Zero 32-byte salt (the default when no salt is provided). */
export const zeroSalt = `0x${'00'.repeat(32)}` as const

/** Domain prefix for the native multisig account address derivation. */
const accountDomain = 'tempo:multisig:account'

/** Domain prefix for the native multisig config ID derivation. */
const configDomain = 'tempo:multisig:config'

/** Domain prefix for native multisig owner approvals. */
const signatureDomain = 'tempo:multisig:signature'

/**
 * Native multisig configuration. Determines the permanent config ID and the
 * stable multisig account address.
 */
export type Config<numberType = number> = Compute<{
  /**
   * Caller-chosen 32-byte salt mixed into the permanent config ID. Defaults to
   * the zero salt (`MultisigConfig.zeroSalt`) when omitted.
   */
  salt?: Hex.Hex | undefined
  /** Minimum total owner weight required to authorize a transaction. */
  threshold: numberType
  /** Weighted owner list (strictly ascending by `owner` address). */
  owners: readonly Owner<numberType>[]
}>

/** Native multisig owner entry. */
export type Owner<numberType = number> = {
  /** Owner address (recovered from the owner's primitive signature). */
  owner: Address.Address
  /** Nonzero owner weight. */
  weight: numberType
}

/** RLP tuple representation of a {@link ox#MultisigConfig.Config}. */
export type Tuple = readonly [
  salt: Hex.Hex,
  threshold: Hex.Hex,
  owners: readonly Hex.Hex[][],
]

/**
 * Asserts that a native multisig {@link ox#MultisigConfig.Config} is valid.
 *
 * Mirrors the Tempo `validate_multisig_config` rules: owners non-empty and
 * `<= maxOwners`, strictly ascending unique nonzero owner addresses, nonzero
 * owner weights, `threshold >= 1`, total weight `<= u32::MAX`, and
 * `threshold <= total weight`.
 *
 * @example
 * ```ts twoslash
 * import { MultisigConfig } from 'ox/tempo'
 *
 * MultisigConfig.assert({
 *   threshold: 1,
 *   owners: [
 *     { owner: '0x1111111111111111111111111111111111111111', weight: 1 },
 *   ],
 * })
 * ```
 *
 * @param config - The multisig config.
 */
export function assert<numberType = number>(config: Config<numberType>): void {
  const { salt, threshold, owners } = config

  if (typeof salt !== 'undefined' && Hex.size(salt) !== 32)
    throw new InvalidConfigError({ reason: 'salt must be 32 bytes' })
  if (owners.length === 0)
    throw new InvalidConfigError({ reason: 'owners cannot be empty' })
  if (owners.length > maxOwners)
    throw new InvalidConfigError({ reason: 'too many owners' })
  if (Number(threshold) < 1)
    throw new InvalidConfigError({ reason: 'threshold cannot be zero' })

  let totalWeight = 0
  let previous: bigint | undefined
  for (const owner of owners) {
    if (!Address.validate(owner.owner) || Hex.toBigInt(owner.owner) === 0n)
      throw new InvalidConfigError({ reason: 'owner cannot be zero' })
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

  if (totalWeight > 0xffffffff)
    throw new InvalidConfigError({
      reason: 'total owner weight exceeds u32 max',
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
 * form required for config ID derivation) and asserts the config is valid.
 *
 * @example
 * ```ts twoslash
 * import { MultisigConfig } from 'ox/tempo'
 *
 * const config = MultisigConfig.from({
 *   threshold: 2,
 *   owners: [
 *     { owner: '0x2222222222222222222222222222222222222222', weight: 1 },
 *     { owner: '0x1111111111111111111111111111111111111111', weight: 1 },
 *   ],
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
 *   '0x01',
 *   [['0x1111111111111111111111111111111111111111', '0x01']],
 * ])
 * ```
 *
 * @param tuple - The RLP tuple.
 * @returns The multisig config.
 */
export function fromTuple(tuple: Tuple): Config {
  const [salt, threshold, owners] = tuple
  return {
    salt: salt && salt !== '0x' ? Hex.padLeft(salt, 32) : zeroSalt,
    threshold: threshold === '0x' ? 0 : Hex.toNumber(threshold),
    owners: owners.map((owner) => {
      const [ownerAddress, weight] = owner as readonly Hex.Hex[]
      return {
        owner: ownerAddress as Address.Address,
        weight: !weight || weight === '0x' ? 0 : Hex.toNumber(weight),
      }
    }),
  }
}

/**
 * Derives the stable native multisig account address.
 *
 * `keccak256("tempo:multisig:account" || config_id)[12:32]`.
 *
 * @example
 * ```ts twoslash
 * import { MultisigConfig } from 'ox/tempo'
 *
 * const genesisConfig = MultisigConfig.from({
 *   threshold: 1,
 *   owners: [
 *     { owner: '0x1111111111111111111111111111111111111111', weight: 1 },
 *   ],
 * })
 *
 * const address = MultisigConfig.getAddress(genesisConfig)
 * ```
 *
 * @example
 * ### From an genesis config ID
 *
 * If you already have the permanent `genesisConfigId`, pass it directly:
 *
 * ```ts twoslash
 * import { MultisigConfig } from 'ox/tempo'
 *
 * const genesisConfigId =
 *   `0x${'00'.repeat(32)}` as const
 *
 * const address = MultisigConfig.getAddress({ genesisConfigId })
 * ```
 *
 * @param value - The genesis config (positional) or `{ genesisConfigId }`.
 * @returns The multisig account address.
 */
export function getAddress(value: getAddress.Value): Address.Address {
  const id =
    typeof value === 'object' && 'genesisConfigId' in value
      ? value.genesisConfigId
      : toId(value)
  const hash = Hash.keccak256(Hex.concat(Hex.fromString(accountDomain), id))
  return Address.from(Hex.slice(hash, 12, 32))
}

export declare namespace getAddress {
  type Value =
    | Config
    | {
        /**
         * The permanent genesis config ID (`MultisigConfig.toId(genesisConfig)`).
         * Config updates never change this value, so it identifies the
         * account permanently.
         */
        genesisConfigId: Hex.Hex
      }

  type ErrorType =
    | toId.ErrorType
    | Address.from.ErrorType
    | Hash.keccak256.ErrorType
    | Hex.concat.ErrorType
    | Hex.slice.ErrorType
    | Errors.GlobalErrorType
}

/**
 * Computes the digest a native multisig owner approves (signs).
 *
 * `keccak256("tempo:multisig:signature" || inner_digest || account || config_id)`,
 * where `inner_digest` is the transaction sign payload
 * ({@link ox#TxEnvelopeTempo.(getSignPayload:function)}).
 *
 * The digest is always keyed on the permanent `account`/`genesisConfigId`
 * derived from the genesis (bootstrap) config — config updates never change
 * these values, so the genesis config is the correct input even for
 * post-update transactions.
 *
 * @example
 * ```ts twoslash
 * import { MultisigConfig, TxEnvelopeTempo } from 'ox/tempo'
 *
 * const genesisConfig = MultisigConfig.from({
 *   threshold: 1,
 *   owners: [
 *     { owner: '0x1111111111111111111111111111111111111111', weight: 1 },
 *   ],
 * })
 *
 * const envelope = TxEnvelopeTempo.from({
 *   chainId: 1,
 *   calls: [],
 * })
 *
 * const digest = MultisigConfig.getSignPayload({
 *   payload: TxEnvelopeTempo.getSignPayload(envelope),
 *   genesisConfig,
 * })
 * ```
 *
 * @example
 * ### From `account` + `genesisConfigId`
 *
 * If you already have the permanent `account` and `genesisConfigId` (for
 * example, recovered from a stored envelope), pass them directly:
 *
 * ```ts twoslash
 * import { MultisigConfig, TxEnvelopeTempo } from 'ox/tempo'
 *
 * const genesisConfig = MultisigConfig.from({
 *   threshold: 1,
 *   owners: [
 *     { owner: '0x1111111111111111111111111111111111111111', weight: 1 },
 *   ],
 * })
 * const genesisConfigId = MultisigConfig.toId(genesisConfig)
 * const account = MultisigConfig.getAddress(genesisConfig)
 *
 * const envelope = TxEnvelopeTempo.from({ chainId: 1, calls: [] })
 *
 * const digest = MultisigConfig.getSignPayload({
 *   payload: TxEnvelopeTempo.getSignPayload(envelope),
 *   account,
 *   genesisConfigId,
 * })
 * ```
 *
 * @param value - The digest derivation parameters.
 * @returns The owner approval digest.
 */
export function getSignPayload(value: getSignPayload.Value): Hex.Hex {
  const { payload } = value
  const account =
    'account' in value && value.account
      ? value.account
      : getAddress((value as { genesisConfig: Config }).genesisConfig)
  const genesisConfigId =
    'genesisConfigId' in value && value.genesisConfigId
      ? value.genesisConfigId
      : toId((value as { genesisConfig: Config }).genesisConfig)
  return Hash.keccak256(
    Hex.concat(
      Hex.fromString(signatureDomain),
      Hex.from(payload),
      account,
      genesisConfigId,
    ),
  )
}

export declare namespace getSignPayload {
  type Value = {
    /** The inner transaction sign payload (`tx.signature_hash()`). */
    payload: Hex.Hex | Bytes.Bytes
  } & OneOf<
    | {
        /** The native multisig account address. */
        account: Address.Address
        /** The permanent config ID. */
        genesisConfigId: Hex.Hex
      }
    | {
        /**
         * The initial multisig config (the bootstrap config that derived the
         * permanent `account` and `genesisConfigId`). Used to derive both values
         * automatically. Config updates never change `account`/`genesisConfigId`,
         * so the genesis config is also the correct input for post-update
         * transactions.
         */
        genesisConfig: Config
      }
  >

  type ErrorType =
    | getAddress.ErrorType
    | toId.ErrorType
    | Hash.keccak256.ErrorType
    | Hex.concat.ErrorType
    | Hex.from.ErrorType
    | Errors.GlobalErrorType
}

/**
 * Derives the permanent config ID for a native multisig
 * {@link ox#MultisigConfig.Config}.
 *
 * Preimage (fixed-width big-endian, **not** RLP):
 * `keccak256("tempo:multisig:config" || salt || be_u32(threshold) || be_u32(owners.length) || (owner || be_u32(weight)) for each owner)`.
 *
 * @example
 * ```ts twoslash
 * import { MultisigConfig } from 'ox/tempo'
 *
 * const config = MultisigConfig.from({
 *   threshold: 1,
 *   owners: [
 *     { owner: '0x1111111111111111111111111111111111111111', weight: 1 },
 *   ],
 * })
 *
 * const genesisConfigId = MultisigConfig.toId(config)
 * ```
 *
 * @param config - The multisig config.
 * @returns The 32-byte config ID.
 */
export function toId(config: Config): Hex.Hex {
  assert(config)
  const id = Hash.keccak256(
    Hex.concat(
      Hex.fromString(configDomain),
      Hex.padLeft(config.salt ?? zeroSalt, 32),
      Hex.fromNumber(config.threshold, { size: 4 }),
      Hex.fromNumber(config.owners.length, { size: 4 }),
      ...config.owners.flatMap((owner) => [
        owner.owner,
        Hex.fromNumber(owner.weight, { size: 4 }),
      ]),
    ),
  )
  if (Hex.toBigInt(id) === 0n)
    throw new InvalidConfigError({ reason: 'config ID cannot be zero' })
  return id
}

export declare namespace toId {
  type ErrorType =
    | assert.ErrorType
    | Hash.keccak256.ErrorType
    | Hex.concat.ErrorType
    | Hex.fromNumber.ErrorType
    | Hex.fromString.ErrorType
    | Errors.GlobalErrorType
}

/**
 * Converts a {@link ox#MultisigConfig.Config} to its RLP tuple form (carried
 * by the multisig signature `init`).
 *
 * Tuple shape: `[salt, threshold, [[owner, weight], ...]]`. The
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
 *     { owner: '0x1111111111111111111111111111111111111111', weight: 1 },
 *   ],
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
  return [salt, Hex.fromNumber(config.threshold), owners] as const
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
 *     { owner: '0x1111111111111111111111111111111111111111', weight: 1 },
 *   ],
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
