import type * as Address from '../core/Address.js'
import type * as Errors from '../core/Errors.js'
import * as Hex from '../core/Hex.js'
import type { Compute } from '../core/internal/types.js'
import * as MultisigConfig from './MultisigConfig.js'
import type * as SignatureEnvelope from './SignatureEnvelope.js'

/** Native multisig owner approval used for RPC simulation. */
export type Approval<versionType = bigint> =
  | NestedApproval<versionType>
  | PrimitiveApproval

/** Native multisig witness used to construct an RPC simulation signature. */
export type MultisigWitness<versionType = bigint> = Compute<{
  /** Account authorized by this witness. */
  account: Address.Address
  /** Owner approvals to model. */
  approvals: readonly Approval<versionType>[]
  /** Complete applicable configuration. */
  config: MultisigConfig.Config<versionType>
}>

/** Nested native multisig owner approval used for RPC simulation. */
export type NestedApproval<versionType = bigint> = {
  /** Approval type. */
  type: 'multisig'
  /** Depth-2 multisig witness. */
  witness: NestedWitness<versionType>
}

/** Primitive approval in a depth-2 multisig simulation witness. */
export type NestedPrimitiveApproval = {
  /** Optional signature-specific gas-estimation data. */
  keyData?: Hex.Hex | undefined
  /** Signature type to model. Omission uses a maximum-size WebAuthn signature. */
  keyType?: SignatureEnvelope.Type | undefined
  /** Configured owner address. */
  owner: Address.Address
}

/** Depth-2 native multisig witness used for RPC simulation. */
export type NestedWitness<versionType = bigint> = {
  /** Nested multisig account. */
  account: Address.Address
  /** Primitive owner approvals to model. */
  approvals: readonly NestedPrimitiveApproval[]
  /** Complete applicable configuration. */
  config: MultisigConfig.Config<versionType>
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

/** JSON-RPC representation of a native multisig simulation witness. */
export type Rpc = MultisigWitness<number>

/**
 * Converts a JSON-RPC multisig witness to its domain representation.
 *
 * @example
 * ```ts twoslash
 * // @noErrors
 * import { MultisigWitness } from 'ox/tempo'
 *
 * const witness = MultisigWitness.fromRpc(witnessRpc)
 * ```
 *
 * @param witness - JSON-RPC multisig witness.
 * @returns The multisig witness with bigint configuration versions.
 */
export function fromRpc(witness: Rpc): MultisigWitness {
  const { account, approvals, config } = witness
  return {
    account,
    approvals: approvals.map((approval) => {
      if (approval.type === 'primitive') return approval
      return {
        type: 'multisig',
        witness: {
          account: approval.witness.account,
          approvals: approval.witness.approvals,
          config: MultisigConfig.from(approval.witness.config),
        },
      }
    }),
    config: MultisigConfig.from(config),
  }
}

export declare namespace fromRpc {
  /** Error type for `fromRpc`. */
  export type ErrorType =
    | MultisigConfig.assert.ErrorType
    | Errors.GlobalErrorType
}

/**
 * Converts a multisig witness to its JSON-RPC representation.
 *
 * @example
 * ```ts twoslash
 * // @noErrors
 * import { MultisigWitness } from 'ox/tempo'
 *
 * const witnessRpc = MultisigWitness.toRpc(witness)
 * ```
 *
 * @param witness - Multisig witness.
 * @returns The JSON-RPC multisig witness with numeric configuration versions.
 */
export function toRpc(witness: MultisigWitness): Rpc {
  const { account, approvals, config } = witness
  return {
    account,
    approvals: approvals.map((approval) => {
      if (approval.type === 'primitive') return approval
      return {
        type: 'multisig',
        witness: {
          account: approval.witness.account,
          approvals: approval.witness.approvals,
          config: configToRpc(approval.witness.config),
        },
      }
    }),
    config: configToRpc(config),
  }
}

export declare namespace toRpc {
  /** Error type for `toRpc`. */
  export type ErrorType =
    | Hex.fromNumber.ErrorType
    | Hex.toNumber.ErrorType
    | MultisigConfig.assert.ErrorType
    | Errors.GlobalErrorType
}

/** @internal */
function configToRpc(
  config: MultisigConfig.Config,
): MultisigConfig.Config<number> {
  const value = MultisigConfig.from(config)
  return {
    ...value,
    version: Hex.toNumber(Hex.fromNumber(value.version)),
  }
}
