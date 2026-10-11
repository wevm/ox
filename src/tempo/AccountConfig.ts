import * as Address from '../core/Address.js'
import type * as Bytes from '../core/Bytes.js'
import * as ContractAddress from '../core/ContractAddress.js'
import * as Errors from '../core/Errors.js'
import * as Hash from '../core/Hash.js'
import * as Hex from '../core/Hex.js'
import type { Compute } from '../core/internal/types.js'

/** Maximum encoded byte length for one primitive owner approval. */
export const maxOwnerSignatureBytes = 2049

/** Maximum number of owners allowed in an account config. */
export const maxOwners = 48

/** Maximum number of owner approvals in a configurable account signature. */
export const maxSignatures = 8

/**
 * Maximum threshold accepted by an account config.
 *
 * The threshold must also be reachable by at most {@link ox#AccountConfig.maxSignatures}
 * owner approvals.
 */
export const maxThreshold = 0xff

/** Maximum version accepted by an account config. */
export const maxVersion = 2n ** 64n - 1n

/** Tempo signature type byte for configurable account signatures. */
export const signatureTypeByte = '0x05' as const

/** Zero 32-byte salt (the default when no salt is provided). */
export const zeroSalt = `0x${'00'.repeat(32)}` as const

/** Domain prefix for the configurable account address derivation. */
const accountDomain = 'tempo:multisig:account'

/** Domain prefix for account configuration commitments. */
const configDomain = 'tempo:multisig:config'

/** Keccak-256 of the canonical recovery wallet creation code. */
const recoveryWalletInitCodeHash =
  '0x583cc63a2e37f645b43eac911b1a6d6de08b83abdc308c61364edda8cfc3bd37'

/** Domain prefix for configurable account owner approvals. */
const signatureDomain = 'tempo:multisig:signature'

/**
 * Complete account configuration witness.
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

/** Input accepted when constructing an account configuration. */
export type Input<
  versionType extends bigint | number = bigint | number,
  numberType = number,
> = Compute<{
  /** Weighted owner list (strictly ascending by `owner` address). */
  owners: readonly Owner<numberType>[]
  /**
   * Caller-chosen 32-byte salt mixed into the derived account address.
   * Defaults to the zero salt (`AccountConfig.zeroSalt`) when omitted.
   */
  salt?: Hex.Hex | undefined
  /** Minimum total owner weight required to authorize a transaction. */
  threshold: numberType
  /** Configuration version as a safe integer or bigint. Defaults to `0n`. */
  version?: versionType | undefined
}>

/** Account config owner entry. */
export type Owner<numberType = number> = {
  /** Owner address (recovered from the owner's approval). */
  owner: Address.Address
  /** Nonzero owner weight. */
  weight: numberType
}

/** JSON-RPC representation of an account configuration. */
export type Rpc = Config<Hex.Hex, number>

/** RLP tuple representation of a {@link ox#AccountConfig.Config}. */
export type Tuple = readonly [
  salt: Hex.Hex,
  version: Hex.Hex,
  threshold: Hex.Hex,
  owners: readonly Hex.Hex[][],
]

/**
 * Asserts that an {@link ox#AccountConfig.Config} is valid.
 *
 * Mirrors the Tempo configuration rules: owners non-empty and
 * `<= maxOwners`, strictly ascending unique nonzero owner addresses, nonzero
 * integer owner weights, integer `threshold` between `1` and `maxThreshold`,
 * total weight `<= 255` (u8 max), and a threshold reachable by at most
 * `maxSignatures` owners.
 *
 * @example
 * ```ts twoslash
 * import { AccountConfig } from 'ox/tempo'
 *
 * AccountConfig.assert({
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
 * @param config - The account config.
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
 * Normalizes an {@link ox#AccountConfig.Config}.
 *
 * Sorts owners into strictly ascending `owner` address order (the canonical
 * form required for account derivation) and asserts the config is valid.
 *
 * @example
 * ```ts twoslash
 * import { AccountConfig } from 'ox/tempo'
 *
 * const config = AccountConfig.from({
 *   owners: [
 *     {
 *       owner: '0x2222222222222222222222222222222222222222',
 *       weight: 1
 *     },
 *     {
 *       owner: '0x1111111111111111111111111111111111111111',
 *       weight: 1
 *     }
 *   ],
 *   threshold: 2
 * })
 * // owners are now sorted ascending by address
 * ```
 *
 * @param config - The account config.
 * @returns The normalized account config.
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
// eslint-disable-next-line jsdoc-js/require-jsdoc
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
 * Converts a JSON-RPC account configuration to its domain representation.
 *
 * @example
 * ```ts twoslash
 * import { AccountConfig } from 'ox/tempo'
 *
 * const config = AccountConfig.fromRpc({
 *   owners: [
 *     {
 *       owner: '0x1111111111111111111111111111111111111111',
 *       weight: 1
 *     }
 *   ],
 *   salt: `0x${'00'.repeat(32)}`,
 *   threshold: 1,
 *   version: '0x0'
 * })
 * ```
 *
 * @param config - The JSON-RPC account configuration.
 * @returns The normalized account configuration.
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
 * Converts an RLP {@link ox#AccountConfig.Tuple} back to a
 * {@link ox#AccountConfig.Config}.
 *
 * @example
 * ```ts twoslash
 * import { AccountConfig } from 'ox/tempo'
 *
 * const config = AccountConfig.fromTuple([
 *   `0x${'00'.repeat(32)}`,
 *   '0x',
 *   '0x01',
 *   [['0x1111111111111111111111111111111111111111', '0x01']]
 * ])
 * ```
 *
 * @param tuple - The RLP tuple.
 * @returns The account config.
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
 * Derives the stable configurable account address.
 *
 * The initial config is hashed into a CREATE2 salt using fixed-width
 * big-endian fields, not RLP. The account uses the chain-configured recovery
 * factory and wallet init-code hash.
 *
 * The address is derived once from the initial version-0 config. Config
 * updates do not change it.
 *
 * @example
 * ```ts twoslash
 * import { AccountConfig } from 'ox/tempo'
 *
 * const initialConfig = AccountConfig.from({
 *   owners: [
 *     {
 *       owner: '0x1111111111111111111111111111111111111111',
 *       weight: 1
 *     }
 *   ],
 *   threshold: 1
 * })
 *
 * const address = AccountConfig.getAddress(initialConfig, {
 *   factory: '0x7171717171717171717171717171717171717171'
 * })
 * ```
 *
 * @param config - The initial account config.
 * @param options - The recovery factory configured by the chain.
 * @returns The configurable account address.
 */
export function getAddress(
  config: Input,
  options: getAddress.Options,
): Address.Address {
  Address.assert(options.factory)
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
    from: options.factory,
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
  type Options = {
    /** Recovery factory configured by the chain. */
    factory: Address.Address
  }

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
 * Computes the commitment for an account configuration.
 *
 * The commitment uses raw fixed-width fields, not RLP or ABI encoding:
 * `keccak256("tempo:multisig:config" || salt || uint64be(version) || uint8(threshold) || uint8(owners.length) || owners)`.
 *
 * @example
 * ```ts twoslash
 * import { AccountConfig } from 'ox/tempo'
 *
 * const commitment = AccountConfig.getCommitment({
 *   owners: [
 *     {
 *       owner: '0x1111111111111111111111111111111111111111',
 *       weight: 1
 *     }
 *   ],
 *   threshold: 1,
 *   version: 1n
 * })
 * ```
 *
 * @param config - The complete account configuration.
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
 * Computes the digest a configurable account owner approves (signs).
 *
 * `keccak256("tempo:multisig:signature" || inner_digest || account || uint64be(version))`,
 * where `inner_digest` is the transaction sign payload
 * ({@link ox#TxEnvelopeTempo.(getSignPayload:function)}).
 *
 * The digest is keyed on the permanent `account` and the supplied config
 * version. Initial approvals use version `0n`; each config update increments
 * it.
 *
 * @example
 * ```ts twoslash
 * import { AccountConfig, TxEnvelopeTempo } from 'ox/tempo'
 *
 * const config = AccountConfig.from({
 *   owners: [
 *     {
 *       owner: '0x1111111111111111111111111111111111111111',
 *       weight: 1
 *     }
 *   ],
 *   threshold: 1
 * })
 *
 * const envelope = TxEnvelopeTempo.from({
 *   chainId: 1,
 *   calls: []
 * })
 *
 * const digest = AccountConfig.getSignPayload({
 *   account: AccountConfig.getAddress(config, {
 *     factory: '0x7171717171717171717171717171717171717171'
 *   }),
 *   config,
 *   payload: TxEnvelopeTempo.getSignPayload(envelope)
 * })
 * ```
 *
 * @param value - The digest derivation parameters.
 * @returns The owner approval digest.
 */
export function getSignPayload(value: getSignPayload.Value): Hex.Hex {
  const { account, config, payload } = value
  assertVersion(config.version)
  Address.assert(account)
  if (Hex.size(Hex.from(payload)) !== 32)
    throw new InvalidConfigError({ reason: 'payload must be 32 bytes' })
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
    /** The configurable account address. */
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
 * Converts an account configuration to its JSON-RPC representation.
 *
 * @example
 * ```ts twoslash
 * import { AccountConfig } from 'ox/tempo'
 *
 * const config = AccountConfig.toRpc({
 *   owners: [
 *     {
 *       owner: '0x1111111111111111111111111111111111111111',
 *       weight: 1
 *     }
 *   ],
 *   threshold: 1
 * })
 * ```
 *
 * @param config - The account configuration.
 * @returns The JSON-RPC account configuration.
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
 * Converts a {@link ox#AccountConfig.Config} to its RLP tuple form.
 *
 * Tuple shape: `[salt, version, threshold, [[owner, weight], ...]]`. The
 * 32-byte `salt` encodes as a full fixed-width string; other integers use
 * canonical RLP encoding (zero values encode as `0x`).
 *
 * @example
 * ```ts twoslash
 * import { AccountConfig } from 'ox/tempo'
 *
 * const tuple = AccountConfig.toTuple({
 *   owners: [
 *     {
 *       owner: '0x1111111111111111111111111111111111111111',
 *       weight: 1
 *     }
 *   ],
 *   threshold: 1
 * })
 * ```
 *
 * @param config - The account config.
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
 * Derives the configuration that replaces the current one in an owner update.
 *
 * Mirrors the `updateConfig` precompile ([TIP-1109](https://tips.sh/1109)):
 * keeps the current salt, increments the version by one, and replaces the
 * owners and threshold. Owners are sorted into canonical order and the next
 * configuration is validated. The account address does not change.
 *
 * @example
 * ```ts twoslash
 * import { AccountConfig } from 'ox/tempo'
 *
 * const initialConfig = AccountConfig.from({
 *   owners: [
 *     {
 *       owner: '0x1111111111111111111111111111111111111111',
 *       weight: 1
 *     }
 *   ],
 *   threshold: 1
 * })
 *
 * const config = AccountConfig.update(initialConfig, {
 *   owners: [
 *     {
 *       owner: '0x2222222222222222222222222222222222222222',
 *       weight: 1
 *     }
 *   ],
 *   threshold: 1
 * })
 * // config.version === 1n, with the initial salt
 * ```
 *
 * @param config - The current account config.
 * @param options - The replacement owners and threshold.
 * @returns The next account config.
 */
export function update<numberType = number>(
  config: Input<bigint | number, numberType>,
  options: update.Options<numberType>,
): Config<bigint, numberType> {
  const current = from(config)
  if (current.version === maxVersion)
    throw new InvalidConfigError({ reason: 'version overflow' })
  return from({
    owners: options.owners,
    salt: current.salt,
    threshold: options.threshold,
    version: current.version + 1n,
  })
}

export declare namespace update {
  type Options<numberType = number> = {
    /** Replacement weighted owners. Sorted into canonical order. */
    owners: readonly Owner<numberType>[]
    /** Replacement minimum total owner weight required for authorization. */
    threshold: numberType
  }

  type ErrorType =
    | assert.ErrorType
    | InvalidConfigError
    | Errors.GlobalErrorType
}

/**
 * Validates an {@link ox#AccountConfig.Config}. Returns `true`
 * if valid, `false` otherwise.
 *
 * @example
 * ```ts twoslash
 * import { AccountConfig } from 'ox/tempo'
 *
 * const valid = AccountConfig.validate({
 *   owners: [
 *     {
 *       owner: '0x1111111111111111111111111111111111111111',
 *       weight: 1
 *     }
 *   ],
 *   threshold: 1
 * })
 * // @log: true
 * ```
 *
 * @param config - The account config.
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

/** Thrown when an account config is invalid. */
export class InvalidConfigError extends Errors.BaseError {
  override readonly name = 'AccountConfig.InvalidConfigError'
  constructor({ reason }: { reason: string }) {
    super(`Invalid account config: ${reason}.`)
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
