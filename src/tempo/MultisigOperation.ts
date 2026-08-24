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
  config: MultisigConfig.Config
  /** Root configuration version. */
  configVersion: quantity
  /** Unix creation time in milliseconds. */
  createdAt: number
  /** Deterministic multisig operation hash. */
  hash: Hex.Hex
  /** Whether the operation initializes the root multisig account. */
  init: boolean
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

/** Maximum supported multisig configuration version. */
const maxConfigVersion = 2n ** 64n - 1n

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
    assertBase(operation, config)
    if (operation.type === 'transaction') assertTransaction(operation)
    else if (operation.type === 'keyAuthorization')
      assertKeyAuthorization(operation, config)
    else throw new InvalidOperationError({ reason: 'unknown operation type' })
    return { ...operation, config } as never
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
    if (
      typeof operation.configVersion !== 'string' ||
      !Hex.validate(operation.configVersion)
    )
      throw new InvalidOperationError({
        reason: 'configVersion must be a hexadecimal quantity',
      })
    const configVersion = Hex.toBigInt(operation.configVersion)
    if (Hex.fromNumber(configVersion) !== operation.configVersion)
      throw new InvalidOperationError({
        reason: 'configVersion must use canonical quantity encoding',
      })
    return from({ ...operation, configVersion } as Operation) as never
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
    configVersion: Hex.fromNumber(value.configVersion),
  } as never
}

export declare namespace toRpc {
  /** Return type for `toRpc`. */
  export type ReturnValue<operation extends Operation> =
    operation extends TransactionOperation
      ? TransactionRpc
      : KeyAuthorizationRpc

  /** Error type for `toRpc`. */
  export type ErrorType = from.ErrorType | Hex.fromNumber.ErrorType
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
  if (typeof operation.init !== 'boolean')
    throw new InvalidOperationError({ reason: 'init must be a boolean' })
  if (
    typeof operation.configVersion !== 'bigint' ||
    operation.configVersion < 0n ||
    operation.configVersion > maxConfigVersion
  )
    throw new InvalidOperationError({
      reason: 'configVersion must be an unsigned 64-bit integer',
    })
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
  if (operation.init) {
    if (operation.configVersion !== 0n)
      throw new InvalidOperationError({
        reason: 'bootstrap operations must use config version zero',
      })
    if (
      MultisigConfig.getAddress(config).toLowerCase() !==
      operation.account.toLowerCase()
    )
      throw new InvalidOperationError({
        reason: 'bootstrap config does not derive the operation account',
      })
  }
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
  const feePayer = operation.transaction.startsWith(
    TxEnvelopeTempo.feePayerMagic,
  )
  const serialized = feePayer
    ? Hex.concat(
        TxEnvelopeTempo.serializedType,
        Hex.slice(operation.transaction, 1),
      )
    : operation.transaction
  const transaction = TxEnvelopeTempo.deserialize(
    serialized as TxEnvelopeTempo.Serialized,
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
  const normalized = TxEnvelopeTempo.serialize(
    transaction,
    feePayer
      ? transaction.from
        ? { format: 'feePayer', sender: transaction.from }
        : { format: 'feePayer' }
      : {},
  )
  if (normalized.toLowerCase() !== operation.transaction.toLowerCase())
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
    if (!!signature.init !== operation.init)
      throw new InvalidOperationError({
        reason: 'key authorization bootstrap state does not match',
      })
    if (signature.init && !sameConfig(signature.init, config))
      throw new InvalidOperationError({
        reason: 'key authorization bootstrap config does not match',
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
): SignatureEnvelope.SignatureEnvelope {
  const approval = SignatureEnvelope.deserialize(serialized)
  SignatureEnvelope.assert({
    account,
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
    payload: KeyAuthorization_.getSignPayload(authorization),
    version: operation.configVersion,
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
  // Nested versions are not serialized, so selected child approvals must preserve the validated retained order.
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
    payload,
    version: operation.configVersion,
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
   *   reason: 'hash does not match the operation payload'
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
