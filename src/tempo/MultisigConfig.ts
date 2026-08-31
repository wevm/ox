import * as Address from '../core/Address.js'
import type * as Bytes from '../core/Bytes.js'
import * as ContractAddress from '../core/ContractAddress.js'
import * as Errors from '../core/Errors.js'
import * as Hash from '../core/Hash.js'
import * as Hex from '../core/Hex.js'
import type { Compute } from '../core/internal/types.js'

/**
 * Maximum number of native multisig signatures in one nested authorization
 * path, including the top-level transaction signature.
 */
export const maxNestingDepth = 2

/** Maximum encoded byte length for one primitive owner approval. */
export const maxOwnerSignatureBytes = 2049

/** Maximum number of owners allowed in a native multisig config. */
export const maxOwners = 48

/** Maximum number of owner approvals in a native multisig signature. */
export const maxSignatures = 8

/** Maximum threshold accepted by a native multisig config. */
export const maxThreshold = 0xff

/** Maximum version accepted by a native multisig config. */
export const maxVersion = 2n ** 64n - 1n

/** Tempo signature type byte for native multisig signatures. */
export const signatureTypeByte = '0x05' as const

/** Zero 32-byte salt (the default when no salt is provided). */
export const zeroSalt = `0x${'00'.repeat(32)}` as const

/** Domain prefix for the native multisig account address derivation. */
const accountDomain = 'tempo:multisig:account'

/** Domain prefix for native multisig configuration commitments. */
const configDomain = 'tempo:multisig:config'

/** Canonical CREATE2 factory for multisig recovery wallets. */
const recoveryFactory = '0x8a196A227C48Ae8A3E36EebD4E106675CC0f6E64'

/** Keccak-256 of the canonical recovery wallet creation code. */
const recoveryWalletInitCodeHash =
  '0x4b5ff53c5328a10a6ec5224adf16de5e204a47057c98af037ee30b7de660a8a6'

/** Domain prefix for native multisig owner approvals. */
const signatureDomain = 'tempo:multisig:signature'

/**
 * Complete native multisig configuration witness.
 */
export type Config<bigintType = bigint, numberType = number> = Compute<{
  /** Weighted owner list, strictly ascending by owner address. */
  owners: readonly Owner<numberType>[]
  /** Caller-chosen 32-byte salt. */
  salt: Hex.Hex
  /** Minimum total owner weight required for authorization. */
  threshold: numberType
  /** Configuration version. Zero identifies the initial configuration. */
  version: bigintType
}>

/** Input accepted when constructing a native multisig configuration. */
export type Input<
  versionType extends bigint | number = bigint | number,
  numberType = number,
> = Compute<{
  /** Weighted owner list (strictly ascending by `owner` address). */
  owners: readonly Owner<numberType>[]
  /**
   * Caller-chosen 32-byte salt mixed into the derived account address.
   * Defaults to the zero salt (`MultisigConfig.zeroSalt`) when omitted.
   */
  salt?: Hex.Hex | undefined
  /** Minimum total owner weight required to authorize a transaction. */
  threshold: numberType
  /** Configuration version as a safe integer or bigint. Defaults to `0n`. */
  version?: versionType | undefined
}>

/** Native multisig owner entry. */
export type Owner<numberType = number> = {
  /** Owner address (recovered from the owner's approval). */
  owner: Address.Address
  /** Nonzero owner weight. */
  weight: numberType
}

/** JSON-RPC representation of a native multisig configuration. */
export type Rpc = Config<Hex.Hex, number>

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
 * Mirrors the Tempo configuration rules: owners non-empty and
 * `<= maxOwners`, strictly ascending unique nonzero owner addresses, nonzero
 * integer owner weights, integer `threshold` between `1` and `maxThreshold`,
 * total weight `<= 255` (u8 max), and a threshold reachable by at most
 * `maxSignatures` owners.
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
export function assert<
  versionType extends bigint | number = bigint | number,
  numberType = number,
>(config: Input<versionType, numberType>): void {
  const { owners, salt, threshold, version = 0n } = config

  if (typeof salt !== 'undefined' && Hex.size(salt) !== 32)
    throw new InvalidConfigError({ reason: 'salt must be 32 bytes' })
  assertVersion(version)
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
  const weights: number[] = []
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

    const weight = Number(owner.weight)
    totalWeight += weight
    weights.push(weight)
  }

  if (totalWeight > 0xff)
    throw new InvalidConfigError({
      reason: 'total owner weight exceeds u8 max',
    })
  if (Number(threshold) > totalWeight)
    throw new InvalidConfigError({
      reason: 'threshold exceeds total owner weight',
    })

  const reachableWeight = weights
    .sort((a, b) => b - a)
    .slice(0, maxSignatures)
    .reduce((sum, weight) => sum + weight, 0)
  if (Number(threshold) > reachableWeight)
    throw new InvalidConfigError({
      reason: `threshold exceeds weight reachable by ${maxSignatures} owner signatures`,
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
 *   owners: [
 *     { owner: '0x2222222222222222222222222222222222222222', weight: 1 },
 *     { owner: '0x1111111111111111111111111111111111111111', weight: 1 },
 *   ],
 *   threshold: 2,
 * })
 * // owners are now sorted ascending by address
 * ```
 *
 * @param config - The multisig config.
 * @returns The normalized multisig config.
 */
export function from<numberType = number>(
  config: Input<0 | 0n, numberType> & { version?: 0 | 0n | undefined },
): Config<0n, numberType>
export function from<bigintType extends bigint, numberType = number>(
  config: Input<bigintType, numberType> & { version: bigintType },
): Config<bigintType, numberType>
export function from<numberType = number>(
  config: Input<number, numberType> & { version: number },
): Config<bigint, numberType>
export function from<numberType = number>(
  config: Input<bigint | number, numberType>,
): Config<bigint, numberType>
// eslint-disable-next-line jsdoc/require-jsdoc
export function from<numberType = number>(
  config: Input<bigint | number, numberType>,
): Config<bigint, numberType> {
  const version = config.version ?? 0n
  assertVersion(version)
  const owners = [...config.owners].sort((a, b) =>
    Hex.toBigInt(a.owner) < Hex.toBigInt(b.owner) ? -1 : 1,
  )
  const normalized = {
    owners,
    salt: config.salt ? Hex.padLeft(config.salt, 32) : zeroSalt,
    threshold: config.threshold,
    version: BigInt(version),
  } as Config<bigint, numberType>
  assert(normalized)
  return normalized
}

/**
 * Converts a JSON-RPC multisig configuration to its domain representation.
 *
 * @example
 * ```ts twoslash
 * import { MultisigConfig } from 'ox/tempo'
 *
 * const config = MultisigConfig.fromRpc({
 *   owners: [
 *     { owner: '0x1111111111111111111111111111111111111111', weight: 1 },
 *   ],
 *   salt: `0x${'00'.repeat(32)}`,
 *   threshold: 1,
 *   version: '0x0',
 * })
 * ```
 *
 * @param config - The JSON-RPC multisig configuration.
 * @returns The normalized multisig configuration.
 */
export function fromRpc(config: Rpc): Config {
  return from({
    ...config,
    version: Hex.toBigInt(config.version),
  })
}

export declare namespace fromRpc {
  type ErrorType =
    | assert.ErrorType
    | Hex.toBigInt.ErrorType
    | Errors.GlobalErrorType
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
 *   [['0x1111111111111111111111111111111111111111', '0x01']],
 * ])
 * ```
 *
 * @param tuple - The RLP tuple.
 * @returns The multisig config.
 */
export function fromTuple(tuple: Tuple): Config {
  const [salt, version, threshold, owners] = tuple
  return {
    owners: owners.map((owner) => {
      const [ownerAddress, weight] = owner as readonly Hex.Hex[]
      return {
        owner: ownerAddress as Address.Address,
        weight: !weight || weight === '0x' ? 0 : Hex.toNumber(weight),
      }
    }),
    salt: salt && salt !== '0x' ? Hex.padLeft(salt, 32) : zeroSalt,
    threshold: threshold === '0x' ? 0 : Hex.toNumber(threshold),
    version: version === '0x' ? 0n : Hex.toBigInt(version),
  }
}

/**
 * Derives the stable native multisig account address.
 *
 * The initial config is hashed into a CREATE2 salt using fixed-width
 * big-endian fields, not RLP. The account uses the canonical recovery factory
 * and wallet init-code hash.
 *
 * The address is derived once from the initial version-0 config. Config
 * updates do not change it.
 *
 * @example
 * ```ts twoslash
 * import { MultisigConfig } from 'ox/tempo'
 *
 * const initialConfig = MultisigConfig.from({
 *   owners: [
 *     { owner: '0x1111111111111111111111111111111111111111', weight: 1 },
 *   ],
 *   threshold: 1,
 * })
 *
 * const address = MultisigConfig.getAddress(initialConfig)
 * ```
 *
 * @param config - The initial multisig config.
 * @returns The multisig account address.
 */
export function getAddress(config: Input): Address.Address {
  assert(config)
  if (BigInt(config.version ?? 0) !== 0n)
    throw new InvalidConfigError({
      reason: 'account address requires version zero',
    })
  const accountSalt = Hash.keccak256(
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
  const account = ContractAddress.fromCreate2({
    bytecodeHash: recoveryWalletInitCodeHash,
    from: recoveryFactory,
    salt: accountSalt,
  })
  if (Hex.toBigInt(account) === 0n)
    throw new InvalidConfigError({ reason: 'derived account cannot be zero' })
  if (config.owners.some((owner) => Address.isEqual(owner.owner, account)))
    throw new InvalidConfigError({
      reason: 'derived account cannot be an owner',
    })
  return account
}

export declare namespace getAddress {
  type ErrorType =
    | assert.ErrorType
    | ContractAddress.fromCreate2.ErrorType
    | Hash.keccak256.ErrorType
    | Hex.concat.ErrorType
    | Hex.fromNumber.ErrorType
    | Hex.fromString.ErrorType
    | Errors.GlobalErrorType
}

/**
 * Computes the commitment for a native multisig configuration.
 *
 * The commitment uses raw fixed-width fields, not RLP or ABI encoding:
 * `keccak256("tempo:multisig:config" || salt || uint64be(version) || uint8(threshold) || uint8(owners.length) || owners)`.
 *
 * @example
 * ```ts twoslash
 * import { MultisigConfig } from 'ox/tempo'
 *
 * const commitment = MultisigConfig.getCommitment({
 *   owners: [
 *     { owner: '0x1111111111111111111111111111111111111111', weight: 1 },
 *   ],
 *   threshold: 1,
 *   version: 1n,
 * })
 * ```
 *
 * @param config - The complete multisig configuration.
 * @returns The configuration commitment.
 */
export function getCommitment(config: Input): Hex.Hex {
  assert(config)
  return Hash.keccak256(
    Hex.concat(
      Hex.fromString(configDomain),
      Hex.padLeft(config.salt ?? zeroSalt, 32),
      Hex.fromNumber(config.version ?? 0n, { size: 8 }),
      Hex.fromNumber(config.threshold, { size: 1 }),
      Hex.fromNumber(config.owners.length, { size: 1 }),
      ...config.owners.flatMap((owner) => [
        owner.owner,
        Hex.fromNumber(owner.weight, { size: 1 }),
      ]),
    ),
  )
}

export declare namespace getCommitment {
  type ErrorType =
    | assert.ErrorType
    | Hash.keccak256.ErrorType
    | Hex.concat.ErrorType
    | Hex.fromNumber.ErrorType
    | Hex.fromString.ErrorType
    | Errors.GlobalErrorType
}

/**
 * Computes the digest a native multisig owner approves (signs).
 *
 * `keccak256("tempo:multisig:signature" || inner_digest || account || uint64be(version))`,
 * where `inner_digest` is the transaction sign payload
 * ({@link ox#TxEnvelopeTempo.(getSignPayload:function)}).
 *
 * The digest is keyed on the permanent `account` and the supplied config
 * version. Initial approvals use version `0n`; each config update increments
 * it.
 *
 * For a nested multisig owner approval, the parent digest becomes the nested
 * approval's `payload`, with the nested multisig `account`.
 *
 * @example
 * ```ts twoslash
 * import { MultisigConfig, TxEnvelopeTempo } from 'ox/tempo'
 *
 * const config = MultisigConfig.from({
 *   owners: [
 *     { owner: '0x1111111111111111111111111111111111111111', weight: 1 },
 *   ],
 *   threshold: 1,
 * })
 *
 * const envelope = TxEnvelopeTempo.from({
 *   chainId: 1,
 *   calls: [],
 * })
 *
 * const digest = MultisigConfig.getSignPayload({
 *   account: MultisigConfig.getAddress(config),
 *   config,
 *   payload: TxEnvelopeTempo.getSignPayload(envelope),
 * })
 * ```
 *
 * @param value - The digest derivation parameters.
 * @returns The owner approval digest.
 */
export function getSignPayload(value: getSignPayload.Value): Hex.Hex {
  const { account, config, payload } = value
  assertVersion(config.version)
  return Hash.keccak256(
    Hex.concat(
      Hex.fromString(signatureDomain),
      Hex.from(payload),
      account,
      Hex.fromNumber(config.version ?? 0n, { size: 8 }),
    ),
  )
}

export declare namespace getSignPayload {
  type Value = {
    /** The native multisig account address. */
    account: Address.Address
    /** Configuration whose version applies to the approval. */
    config: Pick<Config<bigint | number>, 'version'>
    /** The inner transaction sign payload (`tx.signature_hash()`). */
    payload: Hex.Hex | Bytes.Bytes
  }

  type ErrorType =
    | assert.ErrorType
    | Hash.keccak256.ErrorType
    | Hex.concat.ErrorType
    | Hex.from.ErrorType
    | Hex.fromNumber.ErrorType
    | Errors.GlobalErrorType
}

/**
 * Converts a multisig configuration to its JSON-RPC representation.
 *
 * @example
 * ```ts twoslash
 * import { MultisigConfig } from 'ox/tempo'
 *
 * const config = MultisigConfig.toRpc({
 *   owners: [
 *     { owner: '0x1111111111111111111111111111111111111111', weight: 1 },
 *   ],
 *   threshold: 1,
 * })
 * ```
 *
 * @param config - The multisig configuration.
 * @returns The JSON-RPC multisig configuration.
 */
export function toRpc(config: Input): Rpc {
  const value = from(config)
  return {
    owners: value.owners.map((owner) => ({
      owner: owner.owner,
      weight: Number(owner.weight),
    })),
    salt: value.salt,
    threshold: Number(value.threshold),
    version: Hex.fromNumber(value.version),
  }
}

export declare namespace toRpc {
  type ErrorType =
    | assert.ErrorType
    | Hex.fromNumber.ErrorType
    | Errors.GlobalErrorType
}

/**
 * Converts a {@link ox#MultisigConfig.Config} to its RLP tuple form.
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
 *   owners: [
 *     { owner: '0x1111111111111111111111111111111111111111', weight: 1 },
 *   ],
 *   threshold: 1,
 * })
 * ```
 *
 * @param config - The multisig config.
 * @returns The RLP tuple.
 */
export function toTuple(config: Input): Tuple {
  assert(config)
  const owners = config.owners.map(
    (owner) => [owner.owner, Hex.fromNumber(owner.weight)] as Hex.Hex[],
  )
  // `salt` is a fixed 32-byte value: it RLP-encodes as a full 32-byte string
  // (including the zero salt), never trimmed like an integer.
  const salt = config.salt ? Hex.padLeft(config.salt, 32) : zeroSalt
  const version = BigInt(config.version ?? 0)
  return [
    salt,
    version === 0n ? '0x' : Hex.fromNumber(version),
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
 *   owners: [
 *     { owner: '0x1111111111111111111111111111111111111111', weight: 1 },
 *   ],
 *   threshold: 1,
 * })
 * // @log: true
 * ```
 *
 * @param config - The multisig config.
 * @returns Whether the config is valid.
 */
export function validate(config: Input): boolean {
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

/** @internal */
function assertVersion(version: unknown): asserts version is bigint | number {
  if (
    (typeof version !== 'bigint' && typeof version !== 'number') ||
    (typeof version === 'number' && !Number.isSafeInteger(version)) ||
    BigInt(version) < 0n ||
    BigInt(version) > maxVersion
  )
    throw new InvalidConfigError({
      reason: 'version must be an unsigned 64-bit integer',
    })
}
