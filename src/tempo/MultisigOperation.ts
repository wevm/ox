import * as Address from '../core/Address.js'
import * as Errors from '../core/Errors.js'
import * as Hash from '../core/Hash.js'
import * as Hex from '../core/Hex.js'
import * as KeyAuthorization_ from './KeyAuthorization.js'
import * as MultisigConfig from './MultisigConfig.js'
import * as SignatureEnvelope from './SignatureEnvelope.js'
import * as TxEnvelopeTempo from './TxEnvelopeTempo.js'

/** Fields shared by every multisig operation. */
export type Base<quantity = bigint> = {
  /** Root multisig account. */
  account: Address.Address
  /** Every retained serialized owner approval. */
  approvals: readonly Hex.Hex[]
  /** Root configuration used to verify approvals. */
  config: MultisigConfig.Config<quantity>
  /** Unix creation time in milliseconds. */
  createdAt: number
  /** Deterministic multisig operation hash. */
  hash: Hex.Hex
  /** Number of approvals selected for quorum evaluation. */
  signatureCount: number
  /** Required root owner weight. */
  threshold: number
  /** Unix time of the last update in milliseconds. */
  updatedAt: number
  /** Root owner weight reached by the selected approvals. */
  weight: number
}

/** Multisig transaction approval operation. */
export type TransactionOperation<quantity = bigint> = Base<quantity> & {
  /** Time when another relay may reclaim the submission lease. */
  expiresAt?: number | undefined
  /** Current operation state. */
  status: 'pending' | 'submitting' | 'success'
  /** Fencing token owned by the current submitter. */
  submissionId?: Hex.Hex | undefined
  /** Canonical serialized Tempo envelope without its outer sender signature. */
  transaction: Hex.Hex
  /** Hash returned after the downstream submitter accepts the transaction. */
  transactionHash?: Hex.Hex | undefined
  /** Operation kind. */
  type: 'transaction'
}

/** Multisig key authorization approval operation. */
export type KeyAuthorizationOperation<quantity = bigint> = Base<quantity> & {
  /** Canonical serialized key authorization. */
  keyAuthorization: Hex.Hex
  /** Current operation state. */
  status: 'pending' | 'success'
  /** Operation kind. */
  type: 'keyAuthorization'
}

/** Transaction or key authorization multisig operation. */
export type Operation<quantity = bigint> =
  | TransactionOperation<quantity>
  | KeyAuthorizationOperation<quantity>

/** JSON-RPC multisig transaction operation. */
export type TransactionRpc = TransactionOperation<Hex.Hex>

/** JSON-RPC multisig key authorization operation. */
export type KeyAuthorizationRpc = KeyAuthorizationOperation<Hex.Hex>

/** JSON-RPC multisig operation. */
export type Rpc = Operation<Hex.Hex>

/**
 * Derives the deterministic hash for a multisig operation.
 *
 * @example
 * ```ts twoslash
 * // @noErrors
 * import { MultisigOperation } from 'ox/tempo'
 *
 * const hash = MultisigOperation.getHash({
 *   account,
 *   config,
 *   transaction,
 *   type: 'transaction',
 * })
 * ```
 *
 * @param options - Operation payload and multisig identity.
 * @returns The operation hash signed by each owner.
 */
export function getHash(options: getHash.Options): Hex.Hex {
  const { account, config } = options
  const payload =
    options.type === 'transaction'
      ? TxEnvelopeTempo.getSignPayload(
          TxEnvelopeTempo.deserialize(
            options.transaction as TxEnvelopeTempo.Serialized,
          ),
        )
      : KeyAuthorization_.getSignPayload(
          KeyAuthorization_.deserialize(options.keyAuthorization),
        )
  return MultisigConfig.getSignPayload({
    account,
    config,
    payload,
  })
}

export declare namespace getHash {
  /** Parameters for `getHash`. */
  export type Options = {
    /** Root multisig account. */
    account: Address.Address
    /** Complete root multisig configuration witness. */
    config: MultisigConfig.Config
  } & (
    | {
        /** Canonical serialized key authorization. */
        keyAuthorization: Hex.Hex
        /** Operation kind. */
        type: 'keyAuthorization'
      }
    | {
        /** Canonical serialized Tempo envelope without its outer sender signature. */
        transaction: Hex.Hex
        /** Operation kind. */
        type: 'transaction'
      }
  )

  /** Error type for `getHash`. */
  export type ErrorType =
    | KeyAuthorization_.deserialize.ErrorType
    | KeyAuthorization_.getSignPayload.ErrorType
    | MultisigConfig.getSignPayload.ErrorType
    | TxEnvelopeTempo.deserialize.ErrorType
    | TxEnvelopeTempo.getSignPayload.ErrorType
    | Errors.GlobalErrorType
}

/**
 * Validates, deduplicates, and selects owner approvals for an operation.
 *
 * The function retains one canonical approval per owner. It selects the
 * smallest deterministic quorum by owner weight, then orders the selected
 * approvals by owner address for serialization.
 *
 * @example
 * ```ts twoslash
 * // @noErrors
 * import { MultisigOperation } from 'ox/tempo'
 *
 * const selection = await MultisigOperation.selectApprovals({
 *   account,
 *   approvals,
 *   config,
 *   hash,
 * })
 * ```
 *
 * @param options - Approval selection parameters.
 * @returns The retained approvals and deterministic quorum selection.
 */
export async function selectApprovals(
  options: selectApprovals.Options,
): Promise<selectApprovals.ReturnValue> {
  const { account, approvals, hash } = options
  if (!Address.validate(account) || Hex.toBigInt(account) === 0n)
    throw new InvalidApprovalError({ reason: 'account is invalid' })
  if (!Hash.validate(hash))
    throw new InvalidApprovalError({ reason: 'hash is invalid' })
  const config = MultisigConfig.from(options.config)
  if (
    config.version === 0n &&
    !Address.isEqual(MultisigConfig.getAddress(config), account)
  )
    throw new InvalidApprovalError({
      reason: 'initial config does not derive the root multisig account',
    })
  return selectApprovals_internal(
    {
      account,
      approvals,
      config,
      hash,
    },
    [account.toLowerCase()],
  )
}

export declare namespace selectApprovals {
  /** Parameters for `selectApprovals`. */
  export type Options = {
    /** Root multisig account. */
    account: Address.Address
    /** Serialized primitive or nested owner approvals. */
    approvals: readonly SignatureEnvelope.Serialized[]
    /** Current root multisig configuration. */
    config: MultisigConfig.Config
    /** Deterministic operation hash approved by root owners. */
    hash: Hex.Hex
  }

  /** Result of validating and selecting approvals. */
  export type ReturnValue = {
    /** Every retained approval, ordered by owner address. */
    approvals: readonly SignatureEnvelope.Serialized[]
    /** Number of approvals selected for quorum evaluation. */
    signatureCount: number
    /** Approvals selected for serialization, ordered by owner address. */
    selectedApprovals: readonly SignatureEnvelope.Serialized[]
    /** Required owner weight. */
    threshold: number
    /** Owner weight reached by the selected approvals. */
    weight: number
  }

  /** Error type for `selectApprovals`. */
  export type ErrorType =
    | InvalidApprovalError
    | MultisigConfig.assert.ErrorType
    | MultisigConfig.getSignPayload.ErrorType
    | SignatureEnvelope.CoercionError
    | SignatureEnvelope.extractAddress.ErrorType
    | SignatureEnvelope.serialize.ErrorType
    | SignatureEnvelope.VerificationError
    | Errors.GlobalErrorType
}

/**
 * Serializes a key authorization with selected multisig owner approvals.
 *
 * @example
 * ```ts twoslash
 * // @noErrors
 * import { MultisigOperation } from 'ox/tempo'
 *
 * const authorization = MultisigOperation.serializeKeyAuthorization(
 *   keyAuthorization,
 *   {
 *     account,
 *     approvals: selection.selectedApprovals,
 *     config,
 *   },
 * )
 * ```
 *
 * @param keyAuthorization - Canonical serialized unsigned key authorization.
 * @param options - Multisig account, config, and selected approvals.
 * @returns The signed serialized key authorization.
 */
export function serializeKeyAuthorization(
  keyAuthorization: Hex.Hex,
  options: serializeKeyAuthorization.Options,
): Hex.Hex {
  const authorization = KeyAuthorization_.deserialize(keyAuthorization)
  if (authorization.signature)
    throw new InvalidOperationError({
      reason: 'keyAuthorization must not contain a signature',
    })
  if (
    KeyAuthorization_.serialize(authorization).toLowerCase() !==
    keyAuthorization.toLowerCase()
  )
    throw new InvalidOperationError({
      reason: 'keyAuthorization is not canonically serialized',
    })
  const config = MultisigConfig.from(options.config)
  const signatures = SignatureEnvelope.sortMultisigApprovals({
    account: options.account,
    config,
    payload: KeyAuthorization_.getSignPayload(authorization),
    signatures: options.approvals.map((approval) =>
      SignatureEnvelope.deserialize(approval),
    ),
  })
  return KeyAuthorization_.serialize(
    KeyAuthorization_.from(authorization, {
      signature: SignatureEnvelope.from({
        account: options.account,
        config,
        signatures,
      }),
    }),
  )
}

export declare namespace serializeKeyAuthorization {
  /** Options for `serializeKeyAuthorization`. */
  export type Options = {
    /** Root multisig account. */
    account: Address.Address
    /** Selected serialized owner approvals. */
    approvals: readonly SignatureEnvelope.Serialized[]
    /** Complete applicable root multisig config. */
    config: MultisigConfig.Config
  }

  /** Error type for `serializeKeyAuthorization`. */
  export type ErrorType =
    | InvalidOperationError
    | KeyAuthorization_.deserialize.ErrorType
    | KeyAuthorization_.from.ErrorType
    | KeyAuthorization_.getSignPayload.ErrorType
    | KeyAuthorization_.serialize.ErrorType
    | MultisigConfig.assert.ErrorType
    | SignatureEnvelope.assert.ErrorType
    | SignatureEnvelope.InvalidSerializedError
    | SignatureEnvelope.sortMultisigApprovals.ErrorType
    | Errors.GlobalErrorType
}

/**
 * Serializes a multisig transaction operation with selected owner approvals.
 *
 * @example
 * ```ts twoslash
 * // @noErrors
 * import { MultisigOperation } from 'ox/tempo'
 *
 * const transaction = MultisigOperation.serializeTransaction(operation, {
 *   approvals: selection.selectedApprovals,
 * })
 * ```
 *
 * @param operation - Multisig transaction operation.
 * @param options - Transaction serialization options.
 * @returns The signed serialized Tempo transaction.
 */
export function serializeTransaction(
  operation: TransactionOperation,
  options: serializeTransaction.Options,
): TxEnvelopeTempo.Serialized {
  const value = from(operation)
  const envelope = TxEnvelopeTempo.deserialize(
    value.transaction as TxEnvelopeTempo.Serialized,
  )
  const approvals = options.approvals.map((approval) =>
    SignatureEnvelope.from(approval),
  )
  assertRetainedApprovals(value, approvals)
  const signatures = SignatureEnvelope.sortMultisigApprovals({
    account: value.account,
    config: value.config,
    payload: TxEnvelopeTempo.getSignPayload(envelope),
    signatures: approvals,
  })
  const signature = SignatureEnvelope.from({
    account: value.account,
    config: value.config,
    signatures,
  })
  return TxEnvelopeTempo.serialize(
    envelope,
    value.transaction.startsWith(TxEnvelopeTempo.feePayerMagic)
      ? {
          format: 'feePayer',
          sender: envelope.from,
          signature,
        }
      : { signature },
  )
}

export declare namespace serializeTransaction {
  /** Options for `serializeTransaction`. */
  export type Options = {
    /** Selected retained approvals to attach to the transaction. */
    approvals: readonly SignatureEnvelope.Serialized[]
  }

  /** Error type for `serializeTransaction`. */
  export type ErrorType =
    | from.ErrorType
    | InvalidOperationError
    | SignatureEnvelope.sortMultisigApprovals.ErrorType
    | TxEnvelopeTempo.deserialize.ErrorType
    | TxEnvelopeTempo.getSignPayload.ErrorType
    | TxEnvelopeTempo.serialize.ErrorType
    | Errors.GlobalErrorType
}

/**
 * Validates and normalizes a multisig operation.
 *
 * @example
 * ```ts twoslash
 * // @noErrors
 * import { MultisigOperation } from 'ox/tempo'
 *
 * const operation = MultisigOperation.from(value)
 * ```
 *
 * @param operation - Multisig operation.
 * @returns The validated operation.
 */
export function from<const operation extends Operation>(
  operation: operation,
): from.ReturnValue<operation> {
  try {
    const config = MultisigConfig.from(operation.config)
    if (
      typeof config.threshold !== 'number' ||
      config.owners.some((owner) => typeof owner.weight !== 'number')
    )
      throw new InvalidOperationError({
        reason: 'config threshold and owner weights must be numbers',
      })
    const value = { ...operation, config } as Operation
    assertBase(value, config)
    if (value.type === 'transaction') assertTransaction(value)
    else if (value.type === 'keyAuthorization')
      assertKeyAuthorization(value, config)
    else throw new InvalidOperationError({ reason: 'unknown operation type' })
    return value as never
  } catch (cause) {
    if (cause instanceof InvalidOperationError) throw cause
    throw new InvalidOperationError({ cause })
  }
}

export declare namespace from {
  /** Return type for `from`. */
  export type ReturnValue<operation extends Operation> =
    operation extends TransactionOperation
      ? TransactionOperation
      : KeyAuthorizationOperation

  /** Error type for `from`. */
  export type ErrorType = InvalidOperationError | Errors.GlobalErrorType
}

/**
 * Converts a JSON-RPC multisig operation to its domain representation.
 *
 * @example
 * ```ts twoslash
 * // @noErrors
 * import { MultisigOperation } from 'ox/tempo'
 *
 * const operation = MultisigOperation.fromRpc(value)
 * ```
 *
 * @param operation - JSON-RPC multisig operation.
 * @returns The validated operation.
 */
export function fromRpc<const operation extends Rpc>(
  operation: operation,
): fromRpc.ReturnValue<operation> {
  try {
    const version = operation.config?.version
    if (typeof version !== 'string' || !Hex.validate(version))
      throw new InvalidOperationError({
        reason: 'config.version must be a hexadecimal quantity',
      })
    const version_ = Hex.toBigInt(version)
    if (Hex.fromNumber(version_) !== version)
      throw new InvalidOperationError({
        reason: 'config.version must use canonical quantity encoding',
      })
    return from({
      ...operation,
      config: MultisigConfig.fromRpc(operation.config),
    } as Operation) as never
  } catch (cause) {
    if (cause instanceof InvalidOperationError) throw cause
    throw new InvalidOperationError({ cause })
  }
}

export declare namespace fromRpc {
  /** Return type for `fromRpc`. */
  export type ReturnValue<operation extends Rpc> =
    operation extends TransactionRpc
      ? TransactionOperation
      : KeyAuthorizationOperation

  /** Error type for `fromRpc`. */
  export type ErrorType = InvalidOperationError | Errors.GlobalErrorType
}

/**
 * Converts a multisig operation to its JSON-RPC representation.
 *
 * @example
 * ```ts twoslash
 * // @noErrors
 * import { MultisigOperation } from 'ox/tempo'
 *
 * const operationRpc = MultisigOperation.toRpc(operation)
 * ```
 *
 * @param operation - Multisig operation.
 * @returns The JSON-RPC operation.
 */
export function toRpc<const operation extends Operation>(
  operation: operation,
): toRpc.ReturnValue<operation> {
  const value = from(operation)
  return {
    ...value,
    config: MultisigConfig.toRpc(value.config),
  } as never
}

export declare namespace toRpc {
  /** Return type for `toRpc`. */
  export type ReturnValue<operation extends Operation> =
    operation extends TransactionOperation
      ? TransactionRpc
      : KeyAuthorizationRpc

  /** Error type for `toRpc`. */
  export type ErrorType = from.ErrorType | MultisigConfig.toRpc.ErrorType
}

/**
 * Validates and selects approvals recursively.
 *
 * @internal
 */
async function selectApprovals_internal(
  options: selectApprovals.Options,
  path: readonly string[],
): Promise<selectApprovals.ReturnValue> {
  const owners = new Map(
    options.config.owners.map((owner) => [
      owner.owner.toLowerCase(),
      { address: owner.owner, weight: Number(owner.weight) },
    ]),
  )
  const groups = new Map<string, ApprovalGroup>()
  for (const serialized of options.approvals) {
    const signature = SignatureEnvelope.from(serialized)
    if (signature.type === 'keychain')
      throw new InvalidApprovalError({
        reason: 'keychain signatures cannot approve a multisig operation',
      })
    const address =
      signature.type === 'multisig'
        ? signature.account
        : SignatureEnvelope.extractAddress({
            payload: options.hash,
            signature,
          })
    const owner = owners.get(address.toLowerCase())
    if (!owner)
      throw new InvalidApprovalError({
        reason: `signature is from non-owner ${address}`,
      })
    const key = address.toLowerCase()
    const group = groups.get(key)
    if (group) group.signatures.push(signature)
    else
      groups.set(key, {
        address: owner.address,
        signatures: [signature],
        weight: owner.weight,
      })
  }

  const valid: SelectedApproval[] = []
  const retained: RetainedApproval[] = []
  for (const group of groups.values()) {
    const nested = group.signatures.filter(
      (signature) => signature.type === 'multisig',
    )
    if (nested.length > 0) {
      if (nested.length !== group.signatures.length)
        throw new InvalidApprovalError({
          reason: `owner ${group.address} has conflicting signature types`,
        })
      if (
        path.length >= MultisigConfig.maxNestingDepth ||
        path.includes(group.address.toLowerCase())
      )
        throw new InvalidApprovalError({
          reason: `nested multisig owner ${group.address} is invalid`,
        })
      const config = MultisigConfig.from(nested[0]!.config)
      if (nested.some((signature) => !sameConfig(signature.config, config)))
        throw new InvalidApprovalError({
          reason: `nested multisig owner ${group.address} has conflicting config witnesses`,
        })
      if (
        config.version === 0n &&
        !Address.isEqual(MultisigConfig.getAddress(config), group.address)
      )
        throw new InvalidApprovalError({
          reason: `initial config does not derive nested multisig owner ${group.address}`,
        })
      const selected = await selectApprovals_internal(
        {
          account: group.address,
          approvals: nested.flatMap((signature) =>
            signature.signatures.map((approval) =>
              SignatureEnvelope.serialize(approval),
            ),
          ),
          config,
          hash: MultisigConfig.getSignPayload({
            account: group.address,
            config,
            payload: options.hash,
          }),
        },
        [...path, group.address.toLowerCase()],
      )
      retained.push({
        address: group.address,
        signature: SignatureEnvelope.serialize(
          SignatureEnvelope.from({
            account: group.address,
            config,
            signatures: selected.approvals.map((approval) =>
              SignatureEnvelope.from(approval),
            ),
          }),
        ),
      })
      if (selected.weight >= selected.threshold)
        valid.push({
          address: group.address,
          signature: SignatureEnvelope.serialize(
            SignatureEnvelope.from({
              account: group.address,
              config,
              signatures: selected.selectedApprovals.map((approval) =>
                SignatureEnvelope.from(approval),
              ),
            }),
          ),
          weight: group.weight,
        })
      continue
    }

    const signatures = group.signatures.map((signature) => {
      if (
        !SignatureEnvelope.verify(signature, {
          address: group.address,
          payload: options.hash,
        })
      )
        throw new InvalidApprovalError({
          reason: `signature from owner ${group.address} is invalid`,
        })
      return SignatureEnvelope.serialize(signature)
    })
    const signature = signatures.sort(compareHex)[0]!
    valid.push({
      address: group.address,
      signature,
      weight: group.weight,
    })
    retained.push({ address: group.address, signature })
  }

  const ranked = valid.sort(
    (a, b) => b.weight - a.weight || compareApprovalAddress(a, b),
  )
  const selected: typeof ranked = []
  let weight = 0
  for (const approval of ranked.slice(0, MultisigConfig.maxSignatures)) {
    if (weight >= Number(options.config.threshold)) break
    selected.push(approval)
    weight += approval.weight
  }
  selected.sort(compareApprovalAddress)

  return {
    approvals: retained
      .sort(compareApprovalAddress)
      .map((approval) => approval.signature),
    selectedApprovals: selected.map((approval) => approval.signature),
    signatureCount: selected.length,
    threshold: Number(options.config.threshold),
    weight,
  }
}

/** Approval selected for quorum evaluation. @internal */
type SelectedApproval = {
  /** Configured owner address. */
  address: Address.Address
  /** Serialized owner signature. */
  signature: SignatureEnvelope.Serialized
  /** Configured owner weight. */
  weight: number
}

/** Approvals submitted for one configured owner. @internal */
type ApprovalGroup = {
  /** Configured owner address. */
  address: Address.Address
  /** Submitted signatures that resolve to the owner. */
  signatures: SignatureEnvelope.SignatureEnvelope[]
  /** Configured owner weight. */
  weight: number
}

/** Approval retained in operation storage. @internal */
type RetainedApproval = {
  /** Configured owner address. */
  address: Address.Address
  /** Serialized primitive or normalized nested approval. */
  signature: SignatureEnvelope.Serialized
}

/**
 * Orders approval records by owner address.
 *
 * @internal
 */
function compareApprovalAddress(
  a: SelectedApproval | RetainedApproval,
  b: SelectedApproval | RetainedApproval,
) {
  const addressA = Hex.toBigInt(a.address)
  const addressB = Hex.toBigInt(b.address)
  return addressA < addressB ? -1 : addressA > addressB ? 1 : 0
}

/**
 * Orders hexadecimal data bytewise.
 *
 * @internal
 */
function compareHex(a: Hex.Hex, b: Hex.Hex) {
  const hexA = a.toLowerCase()
  const hexB = b.toLowerCase()
  return hexA < hexB ? -1 : hexA > hexB ? 1 : 0
}

/**
 * Validates fields shared by every operation.
 *
 * @internal
 */
function assertBase(operation: Operation, config: MultisigConfig.Config): void {
  if (!Address.validate(operation.account))
    throw new InvalidOperationError({ reason: 'account is invalid' })
  if (Hex.toBigInt(operation.account) === 0n)
    throw new InvalidOperationError({ reason: 'account cannot be zero' })
  if (!Hash.validate(operation.hash))
    throw new InvalidOperationError({ reason: 'hash is invalid' })
  assertInteger(operation.createdAt, 'createdAt')
  assertInteger(operation.updatedAt, 'updatedAt')
  if (operation.updatedAt < operation.createdAt)
    throw new InvalidOperationError({
      reason: 'updatedAt cannot precede createdAt',
    })
  assertInteger(operation.signatureCount, 'signatureCount')
  assertInteger(operation.threshold, 'threshold')
  assertInteger(operation.weight, 'weight')
  if (operation.threshold !== Number(config.threshold))
    throw new InvalidOperationError({
      reason: 'threshold must equal config.threshold',
    })
  if (operation.weight > 0xff)
    throw new InvalidOperationError({ reason: 'weight exceeds u8 max' })
  if (operation.signatureCount > MultisigConfig.maxSignatures)
    throw new InvalidOperationError({ reason: 'too many selected signatures' })
  if (!Array.isArray(operation.approvals))
    throw new InvalidOperationError({ reason: 'approvals must be an array' })
  if (operation.approvals.length > config.owners.length)
    throw new InvalidOperationError({ reason: 'too many retained approvals' })
  if (operation.signatureCount > operation.approvals.length)
    throw new InvalidOperationError({
      reason: 'signatureCount exceeds retained approvals',
    })
  if ((operation.signatureCount === 0) !== (operation.weight === 0))
    throw new InvalidOperationError({
      reason: 'signatureCount and weight must both be zero or nonzero',
    })
  const owners = new Map(
    config.owners.map((owner) => [
      owner.owner.toLowerCase(),
      Number(owner.weight),
    ]),
  )
  const approvalWeights: number[] = []
  const seen = new Set<string>()
  for (const approval of operation.approvals) {
    if (
      typeof approval !== 'string' ||
      !Hex.validate(approval, { strict: true })
    )
      throw new InvalidOperationError({ reason: 'approval is invalid' })
    const signature = assertApproval(
      operation.account,
      approval as SignatureEnvelope.Serialized,
      config,
    )
    const address = SignatureEnvelope.extractAddress({
      payload: operation.hash,
      signature,
    })
    const key = address.toLowerCase()
    const weight = owners.get(key)
    if (weight === undefined)
      throw new InvalidOperationError({
        reason: 'approval is from a non-owner',
      })
    if (seen.has(key))
      throw new InvalidOperationError({
        reason:
          operation.type === 'keyAuthorization'
            ? 'key authorization contains duplicate owner approvals'
            : 'duplicate owner approval',
      })
    seen.add(key)
    approvalWeights.push(weight)
  }
  if (
    !isWeightReachable(
      approvalWeights,
      operation.signatureCount,
      operation.weight,
    )
  )
    throw new InvalidOperationError({
      reason:
        'weight is not reachable by signatureCount retained owner approvals',
    })
  if (
    config.version === 0n &&
    !Address.isEqual(MultisigConfig.getAddress(config), operation.account)
  )
    throw new InvalidOperationError({
      reason: 'initial config does not derive the operation account',
    })
}

/**
 * Validates a transaction operation and its state-specific fields.
 *
 * @internal
 */
function assertTransaction(operation: TransactionOperation): void {
  if (
    'keyAuthorization' in operation &&
    operation.keyAuthorization !== undefined
  )
    throw new InvalidOperationError({
      reason: 'transaction operations cannot contain keyAuthorization',
    })
  const expiresAt = operation.expiresAt
  const submissionId = operation.submissionId
  const transactionHash = operation.transactionHash
  if (operation.status === 'pending') {
    if (
      expiresAt !== undefined ||
      submissionId !== undefined ||
      transactionHash !== undefined
    )
      throw new InvalidOperationError({
        reason: 'pending transactions cannot contain submission fields',
      })
  } else if (operation.status === 'submitting') {
    assertInteger(expiresAt, 'expiresAt')
    if (!Hash.validate(submissionId ?? ''))
      throw new InvalidOperationError({ reason: 'submissionId is invalid' })
    if (submissionId!.toLowerCase() === operation.hash.toLowerCase())
      throw new InvalidOperationError({
        reason: 'submissionId must differ from the operation hash',
      })
    if (transactionHash !== undefined)
      throw new InvalidOperationError({
        reason: 'submitting transactions cannot contain transactionHash',
      })
  } else if (operation.status === 'success') {
    if (!Hash.validate(transactionHash ?? ''))
      throw new InvalidOperationError({ reason: 'transactionHash is invalid' })
    if (expiresAt !== undefined || submissionId !== undefined)
      throw new InvalidOperationError({
        reason: 'successful transactions cannot contain submission fields',
      })
  } else
    throw new InvalidOperationError({ reason: 'invalid transaction status' })
  if (
    operation.status !== 'pending' &&
    (operation.weight < operation.threshold || operation.signatureCount === 0)
  )
    throw new InvalidOperationError({
      reason: 'submitted transactions must have quorum',
    })

  if (typeof operation.transaction !== 'string')
    throw new InvalidOperationError({ reason: 'transaction is invalid' })
  const transaction = TxEnvelopeTempo.deserialize(
    operation.transaction as TxEnvelopeTempo.Serialized,
  )
  if (transaction.signature)
    throw new InvalidOperationError({
      reason: 'transaction must not contain an outer sender signature',
    })
  if (
    transaction.from &&
    transaction.from.toLowerCase() !== operation.account.toLowerCase()
  )
    throw new InvalidOperationError({
      reason: 'transaction sender does not match the operation account',
    })
  assertOperationHash(operation, TxEnvelopeTempo.getSignPayload(transaction))
  const feePayer = operation.transaction.startsWith(
    TxEnvelopeTempo.feePayerMagic,
  )
  const serialized = TxEnvelopeTempo.serialize(
    transaction,
    feePayer
      ? transaction.from
        ? { format: 'feePayer', sender: transaction.from }
        : { format: 'feePayer' }
      : {},
  )
  if (serialized.toLowerCase() !== operation.transaction.toLowerCase())
    throw new InvalidOperationError({
      reason: 'transaction is not canonically serialized',
    })
}

/**
 * Validates a key authorization operation and its serialized payload.
 *
 * @internal
 */
function assertKeyAuthorization(
  operation: KeyAuthorizationOperation,
  config: MultisigConfig.Config,
): void {
  const transactionFields = operation as KeyAuthorizationOperation & {
    expiresAt?: unknown
    submissionId?: unknown
    transaction?: unknown
    transactionHash?: unknown
  }
  if (
    transactionFields.expiresAt !== undefined ||
    transactionFields.submissionId !== undefined ||
    transactionFields.transaction !== undefined ||
    transactionFields.transactionHash !== undefined
  )
    throw new InvalidOperationError({
      reason: 'key authorization operations cannot contain transaction fields',
    })
  if (operation.status !== 'pending' && operation.status !== 'success')
    throw new InvalidOperationError({
      reason: 'invalid key authorization status',
    })
  if (
    operation.status === 'success' &&
    (operation.weight < operation.threshold || operation.signatureCount === 0)
  )
    throw new InvalidOperationError({
      reason: 'successful key authorizations must have quorum',
    })
  if (operation.status === 'pending' && operation.weight >= operation.threshold)
    throw new InvalidOperationError({
      reason: 'pending key authorizations cannot have quorum',
    })
  if (typeof operation.keyAuthorization !== 'string')
    throw new InvalidOperationError({ reason: 'keyAuthorization is invalid' })
  const authorization = KeyAuthorization_.deserialize(
    operation.keyAuthorization,
  )
  if (
    !authorization.account ||
    authorization.account.toLowerCase() !== operation.account.toLowerCase()
  )
    throw new InvalidOperationError({
      reason: 'key authorization account does not match the operation account',
    })
  const signature = authorization.signature
  if (operation.status === 'pending' && signature)
    throw new InvalidOperationError({
      reason: 'pending key authorizations must be unsigned',
    })
  if (operation.status === 'success') {
    if (signature?.type !== 'multisig')
      throw new InvalidOperationError({
        reason: 'successful key authorizations require a multisig signature',
      })
    if (signature.account.toLowerCase() !== operation.account.toLowerCase())
      throw new InvalidOperationError({
        reason: 'key authorization signature account does not match',
      })
    if (signature.signatures.length !== operation.signatureCount)
      throw new InvalidOperationError({
        reason: 'key authorization signatureCount does not match its signature',
      })
    assertSelectedApprovals(operation, signature.signatures, authorization)
    if (!sameConfig(signature.config, config))
      throw new InvalidOperationError({
        reason: 'key authorization config does not match',
      })
  }
  assertOperationHash(
    operation,
    KeyAuthorization_.getSignPayload(authorization),
  )
  if (
    KeyAuthorization_.serialize(authorization).toLowerCase() !==
    operation.keyAuthorization.toLowerCase()
  )
    throw new InvalidOperationError({
      reason: 'keyAuthorization is not canonically serialized',
    })
}

/**
 * Validates a retained signature in the root owner's approval context.
 *
 * @internal
 */
function assertApproval(
  account: Address.Address,
  serialized: SignatureEnvelope.Serialized,
  config: MultisigConfig.Config,
): SignatureEnvelope.SignatureEnvelope {
  const approval = SignatureEnvelope.deserialize(serialized)
  SignatureEnvelope.assert({
    account,
    config,
    signatures: [approval],
    type: 'multisig',
  })
  if (
    SignatureEnvelope.serialize(approval).toLowerCase() !==
    serialized.toLowerCase()
  )
    throw new InvalidOperationError({ reason: 'approval is not canonical' })
  return approval
}

/**
 * Checks that selected transaction approvals are retained by the operation.
 *
 * @internal
 */
function assertRetainedApprovals(
  operation: TransactionOperation,
  selected: readonly SignatureEnvelope.SignatureEnvelope[],
): void {
  const retained = operation.approvals.map((approval) =>
    SignatureEnvelope.deserialize(approval),
  )
  for (const approval of selected) {
    const index = retained.findIndex((candidate) =>
      includesApproval(candidate, approval),
    )
    if (index === -1)
      throw new InvalidOperationError({
        reason: 'transaction signature is not a retained approval',
      })
    retained.splice(index, 1)
  }
}

/**
 * Checks that a successful key authorization uses retained approvals in canonical order.
 *
 * @internal
 */
function assertSelectedApprovals(
  operation: KeyAuthorizationOperation,
  selected: readonly SignatureEnvelope.SignatureEnvelope[],
  authorization: KeyAuthorization_.KeyAuthorization,
): void {
  const retained = operation.approvals.map((approval) =>
    SignatureEnvelope.deserialize(approval),
  )
  for (const approval of selected) {
    const index = retained.findIndex((candidate) =>
      includesApproval(candidate, approval),
    )
    if (index === -1)
      throw new InvalidOperationError({
        reason: 'key authorization signature is not a retained approval',
      })
    retained.splice(index, 1)
  }

  const digest = MultisigConfig.getSignPayload({
    account: operation.account,
    config: operation.config,
    payload: KeyAuthorization_.getSignPayload(authorization),
  })
  const addresses = selected.map((signature) =>
    SignatureEnvelope.extractAddress({ payload: digest, signature }),
  )
  for (let index = 1; index < addresses.length; index++) {
    const previous = Hex.toBigInt(addresses[index - 1]!)
    const current = Hex.toBigInt(addresses[index]!)
    if (previous === current)
      throw new InvalidOperationError({
        reason: 'key authorization contains duplicate owner approvals',
      })
    if (previous > current)
      throw new InvalidOperationError({
        reason: 'key authorization approvals are not canonically ordered',
      })
  }
}

/**
 * Checks whether a selected approval is contained in a retained approval tree.
 *
 * @internal
 */
function includesApproval(
  retained: SignatureEnvelope.SignatureEnvelope,
  selected: SignatureEnvelope.SignatureEnvelope,
): boolean {
  if (retained.type !== 'multisig' || selected.type !== 'multisig')
    return (
      SignatureEnvelope.serialize(retained).toLowerCase() ===
      SignatureEnvelope.serialize(selected).toLowerCase()
    )
  if (retained.account.toLowerCase() !== selected.account.toLowerCase())
    return false
  if (!sameConfig(retained.config, selected.config)) return false
  let index = 0
  for (const approval of selected.signatures) {
    while (
      index < retained.signatures.length &&
      !includesApproval(retained.signatures[index]!, approval)
    )
      index++
    if (index === retained.signatures.length) return false
    index++
  }
  return true
}

/**
 * Checks whether exactly `signatureCount` retained owners can produce `weight`.
 *
 * @internal
 */
function isWeightReachable(
  weights: readonly number[],
  signatureCount: number,
  weight: number,
): boolean {
  const reachable = Array.from(
    { length: signatureCount + 1 },
    () => new Set<number>(),
  )
  reachable[0]!.add(0)
  for (const ownerWeight of weights)
    for (let count = signatureCount; count > 0; count--)
      for (const current of reachable[count - 1]!)
        reachable[count]!.add(current + ownerWeight)
  return reachable[signatureCount]!.has(weight)
}

/**
 * Validates the deterministic operation hash.
 *
 * @internal
 */
function assertOperationHash(operation: Operation, payload: Hex.Hex): void {
  const hash = MultisigConfig.getSignPayload({
    account: operation.account,
    config: operation.config,
    payload,
  })
  if (hash.toLowerCase() !== operation.hash.toLowerCase())
    throw new InvalidOperationError({
      reason: 'hash does not match the operation payload',
    })
}

/**
 * Validates a nonnegative safe integer field.
 *
 * @internal
 */
function assertInteger(value: unknown, field: string): asserts value is number {
  if (typeof value !== 'number' || !Number.isSafeInteger(value) || value < 0)
    throw new InvalidOperationError({
      reason: `${field} must be a nonnegative safe integer`,
    })
}

/**
 * Compares normalized multisig configurations.
 *
 * @internal
 */
function sameConfig(
  a: MultisigConfig.Config,
  b: MultisigConfig.Config,
): boolean {
  const configA = MultisigConfig.from(a)
  const configB = MultisigConfig.from(b)
  return (
    Hex.isEqual(
      configA.salt ?? MultisigConfig.zeroSalt,
      configB.salt ?? MultisigConfig.zeroSalt,
    ) &&
    configA.threshold === configB.threshold &&
    configA.version === configB.version &&
    configA.owners.length === configB.owners.length &&
    configA.owners.every((owner, index) => {
      const other = configB.owners[index]!
      return (
        Address.isEqual(owner.owner, other.owner) &&
        owner.weight === other.weight
      )
    })
  )
}

/** Thrown when a multisig owner approval is invalid. */
export class InvalidApprovalError extends Errors.BaseError<Error | undefined> {
  override readonly name = 'MultisigOperation.InvalidApprovalError'

  /**
   * Creates an invalid multisig approval error.
   *
   * @example
   * ```ts twoslash
   * import { MultisigOperation } from 'ox/tempo'
   *
   * throw new MultisigOperation.InvalidApprovalError({
   *   reason: 'signature is from a non-owner',
   * })
   * ```
   *
   * @param options - Error options.
   */
  constructor(options: InvalidApprovalError.Options = {}) {
    super(
      options.reason
        ? `Invalid multisig approval: ${options.reason}.`
        : 'Invalid multisig approval.',
      { cause: options.cause as Error | undefined },
    )
  }
}

export declare namespace InvalidApprovalError {
  /** Error construction options. */
  export type Options = {
    /** Underlying error. */
    cause?: unknown | undefined
    /** Validation failure. */
    reason?: string | undefined
  }
}

/** Thrown when a multisig operation is malformed or internally inconsistent. */
export class InvalidOperationError extends Errors.BaseError<Error | undefined> {
  override readonly name = 'MultisigOperation.InvalidOperationError'

  /**
   * Creates an invalid multisig operation error.
   *
   * @example
   * ```ts twoslash
   * import { MultisigOperation } from 'ox/tempo'
   *
   * throw new MultisigOperation.InvalidOperationError({
   *   reason: 'hash does not match the operation payload',
   * })
   * ```
   *
   * @param options - Error options.
   */
  constructor(options: InvalidOperationError.Options = {}) {
    super(
      options.reason
        ? `Invalid multisig operation: ${options.reason}.`
        : 'Invalid multisig operation.',
      { cause: options.cause as Error | undefined },
    )
  }
}

export declare namespace InvalidOperationError {
  /** Error construction options. */
  export type Options = {
    /** Underlying error. */
    cause?: unknown | undefined
    /** Validation failure. */
    reason?: string | undefined
  }
}
