import * as Address from '../core/Address.js'
import * as Errors from '../core/Errors.js'
import * as Hex from '../core/Hex.js'
import type { Compute } from '../core/internal/types.js'
import * as Rlp from '../core/Rlp.js'
import * as MultisigConfig from './MultisigConfig.js'
import type * as SignatureEnvelope from './SignatureEnvelope.js'

/** Native multisig owner approval used for RPC simulation. */
export type Approval = NestedApproval | PrimitiveApproval

/** JSON-RPC native multisig owner approval used for RPC simulation. */
export type ApprovalRpc = NestedApprovalRpc | PrimitiveApproval

/** Nested native multisig owner approval used for RPC simulation. */
export type NestedApproval = {
  /** Depth-2 multisig simulation spec. */
  spec: NestedSpec
  /** Approval type. */
  type: 'multisig'
}

/** JSON-RPC nested native multisig owner approval used for RPC simulation. */
export type NestedApprovalRpc = {
  /** Depth-2 multisig simulation spec. */
  spec: NestedSpecRpc
  /** Approval type. */
  type: 'multisig'
}

/** Primitive approval in a depth-2 multisig simulation spec. */
export type NestedPrimitiveApproval = {
  /** Optional signature-specific gas-estimation data. */
  keyData?: Hex.Hex | undefined
  /** Signature type to model. Omission uses a maximum-size WebAuthn signature. */
  keyType?: SignatureEnvelope.Type | undefined
  /** Configured owner address. */
  owner: Address.Address
}

/** Depth-2 native multisig spec used for RPC simulation. */
export type NestedSpec = {
  /** Nested multisig account. */
  account: Address.Address
  /** Primitive owner approvals to model. */
  approvals: readonly NestedPrimitiveApproval[]
  /** Complete applicable configuration. */
  config: MultisigConfig.Config
}

/** JSON-RPC depth-2 native multisig spec used for RPC simulation. */
export type NestedSpecRpc = {
  /** Nested multisig account. */
  account: Address.Address
  /** Primitive owner approvals to model. */
  approvals: readonly NestedPrimitiveApproval[]
  /** Canonical RLP-encoded applicable configuration. */
  config: Hex.Hex
}

/** Primitive owner approval used for RPC simulation. */
export type PrimitiveApproval = {
  /** Optional signature-specific gas-estimation data. */
  keyData?: Hex.Hex | undefined
  /** Signature type to model. Omission uses a maximum-size WebAuthn signature. */
  keyType?: SignatureEnvelope.Type | undefined
  /** Configured owner address. */
  owner: Address.Address
  /** Approval type. */
  type: 'primitive'
}

/** JSON-RPC representation of a native multisig simulation spec. */
export type Rpc = Compute<{
  /** Account authorized by this spec. */
  account: Address.Address
  /** Owner approvals to model. */
  approvals: readonly ApprovalRpc[]
  /** Canonical RLP-encoded applicable configuration. */
  config: Hex.Hex
}>

/** Native multisig spec used to construct an RPC simulation signature. */
export type Spec = Compute<{
  /** Account authorized by this spec. */
  account: Address.Address
  /** Owner approvals to model. */
  approvals: readonly Approval[]
  /** Complete applicable configuration. */
  config: MultisigConfig.Config
}>

/**
 * Converts a JSON-RPC multisig simulation spec to its domain representation.
 *
 * @example
 * ```ts twoslash
 * // @noErrors
 * import { MultisigSimulation } from 'ox/tempo'
 *
 * const spec = MultisigSimulation.fromRpc(specRpc)
 * ```
 *
 * @param spec - JSON-RPC multisig simulation spec.
 * @returns The multisig simulation spec with decoded configurations.
 */
export function fromRpc(spec: Rpc): Spec {
  const { account, approvals, config } = spec
  assertApprovalCount(approvals)
  return {
    account,
    approvals: approvals.map((approval) => {
      if (approval.type === 'primitive') return approval
      assertApprovalCount(approval.spec.approvals)
      return {
        spec: {
          account: approval.spec.account,
          approvals: approval.spec.approvals,
          config: deserializeConfig(approval.spec.config),
        },
        type: 'multisig',
      }
    }),
    config: deserializeConfig(config),
  }
}

export declare namespace fromRpc {
  /** Error type for `fromRpc`. */
  export type ErrorType =
    | Hex.isEqual.ErrorType
    | InvalidSimulationError
    | MultisigConfig.assert.ErrorType
    | Rlp.fromHex.ErrorType
    | Rlp.toHex.ErrorType
    | Errors.GlobalErrorType
}

/**
 * Converts a multisig simulation spec to its JSON-RPC representation.
 *
 * @example
 * ```ts twoslash
 * // @noErrors
 * import { MultisigSimulation } from 'ox/tempo'
 *
 * const specRpc = MultisigSimulation.toRpc(spec)
 * ```
 *
 * @param spec - Multisig simulation spec.
 * @returns The JSON-RPC multisig simulation spec with encoded configurations.
 */
export function toRpc(spec: Spec): Rpc {
  const { account, approvals, config } = spec
  assertApprovalCount(approvals)
  return {
    account,
    approvals: approvals.map((approval) => {
      if (approval.type === 'primitive')
        return {
          ...approval,
          ...(typeof approval.keyData !== 'undefined'
            ? { keyData: shimKeyData(approval.keyData) }
            : {}),
        }
      assertApprovalCount(approval.spec.approvals)
      return {
        spec: {
          account: approval.spec.account,
          approvals: approval.spec.approvals.map((approval) => ({
            ...approval,
            ...(typeof approval.keyData !== 'undefined'
              ? { keyData: shimKeyData(approval.keyData) }
              : {}),
          })),
          config: serializeConfig(approval.spec.config),
        },
        type: 'multisig',
      }
    }),
    config: serializeConfig(config),
  }
}

export declare namespace toRpc {
  /** Error type for `toRpc`. */
  export type ErrorType =
    | Hex.fromNumber.ErrorType
    | InvalidSimulationError
    | MultisigConfig.assert.ErrorType
    | Rlp.fromHex.ErrorType
    | Errors.GlobalErrorType
}

/** @internal */
function assertApprovalCount(approvals: readonly unknown[]) {
  if (approvals.length > MultisigConfig.maxSignatures)
    throw new InvalidSimulationError({
      reason: `approval count exceeds ${MultisigConfig.maxSignatures}`,
    })
}

/** @internal */
function deserializeConfig(config: Hex.Hex): MultisigConfig.Config {
  const tuple = Rlp.toHex(config)
  if (!Array.isArray(tuple) || tuple.length !== 4)
    throw new InvalidSimulationError({ reason: 'invalid config encoding' })
  const [salt, version, threshold, owners] = tuple
  if (
    Array.isArray(salt) ||
    Hex.size(salt) !== 32 ||
    Array.isArray(version) ||
    Hex.size(version) > 8 ||
    (version !== '0x' && Hex.slice(version, 0, 1) === '0x00') ||
    Array.isArray(threshold) ||
    Hex.size(threshold) > 1 ||
    !Array.isArray(owners) ||
    owners.some(
      (owner) =>
        !Array.isArray(owner) ||
        owner.length !== 2 ||
        owner.some(Array.isArray) ||
        !Address.validate(owner[0]) ||
        Hex.size(owner[1] as Hex.Hex) > 1,
    )
  )
    throw new InvalidSimulationError({ reason: 'invalid config encoding' })
  const value = MultisigConfig.fromTuple(
    tuple as unknown as MultisigConfig.Tuple,
  )
  MultisigConfig.assert(value)
  if (!Hex.isEqual(config, serializeConfig(value)))
    throw new InvalidSimulationError({ reason: 'noncanonical config encoding' })
  return value
}

/** @internal */
function serializeConfig(config: MultisigConfig.Input): Hex.Hex {
  return Rlp.fromHex(MultisigConfig.toTuple(config))
}

/**
 * Shims long key data into the length hint accepted by Tempo's gas estimator.
 * @internal
 */
function shimKeyData(data: Hex.Hex): Hex.Hex {
  const size = Hex.size(data)
  if (size <= 4) return data
  return Hex.fromNumber(size, { size: 2 })
}

/** Thrown when a native multisig simulation spec is invalid. */
export class InvalidSimulationError extends Errors.BaseError {
  override readonly name = 'MultisigSimulation.InvalidSimulationError'
  constructor(options: InvalidSimulationError.Options) {
    super(`Invalid multisig simulation: ${options.reason}.`)
  }
}

export declare namespace InvalidSimulationError {
  /** Error construction options. */
  export type Options = {
    /** Validation failure. */
    reason: string
  }
}
