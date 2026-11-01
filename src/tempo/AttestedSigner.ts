import * as AbiParameters from '../core/AbiParameters.js'
import * as Address from '../core/Address.js'
import type * as Bytes from '../core/Bytes.js'
import type * as Errors from '../core/Errors.js'
import * as Hash from '../core/Hash.js'
import * as Hex from '../core/Hex.js'
import type * as PublicKey from '../core/PublicKey.js'
import * as Rlp from '../core/Rlp.js'

const bindingDomain = Hex.fromString('tempo:attested-key')
const policyIdParameters = AbiParameters.from('address, bytes32')
const signatureDomain = Hex.fromString('tempo:attested-signature')

/**
 * Attested Key Registry ABI (TIP-1161), as the Tempo node's attested signers
 * proof of concept implements it: program keys register into one of
 * {@link ox#AttestedSigner.keySlots} slots of a policy, and each policy caps
 * registrations at its own `maxKeyLifetime`.
 *
 * @experimental
 */
export const abi = [
  {
    inputs: [
      {
        indexed: true,
        name: 'policyId',
        type: 'bytes32',
      },
      {
        indexed: true,
        name: 'creator',
        type: 'address',
      },
      {
        name: 'scheme',
        type: 'uint8',
      },
      {
        name: 'owner',
        type: 'address',
      },
      {
        name: 'guardian',
        type: 'address',
      },
      {
        name: 'delay',
        type: 'uint64',
      },
      {
        name: 'maxKeyLifetime',
        type: 'uint64',
      },
    ],
    name: 'PolicyCreated',
    type: 'event',
  },
  {
    inputs: [
      {
        indexed: true,
        name: 'policyId',
        type: 'bytes32',
      },
      {
        indexed: true,
        name: 'measurement',
        type: 'bytes32',
      },
      {
        name: 'activeAt',
        type: 'uint64',
      },
    ],
    name: 'MeasurementProposed',
    type: 'event',
  },
  {
    inputs: [
      {
        indexed: true,
        name: 'policyId',
        type: 'bytes32',
      },
      {
        indexed: true,
        name: 'measurement',
        type: 'bytes32',
      },
      {
        name: 'epoch',
        type: 'uint64',
      },
    ],
    name: 'MeasurementRemoved',
    type: 'event',
  },
  {
    inputs: [
      {
        indexed: true,
        name: 'policyId',
        type: 'bytes32',
      },
      {
        indexed: true,
        name: 'anchor',
        type: 'bytes32',
      },
      {
        name: 'activeAt',
        type: 'uint64',
      },
    ],
    name: 'AnchorProposed',
    type: 'event',
  },
  {
    inputs: [
      {
        indexed: true,
        name: 'policyId',
        type: 'bytes32',
      },
      {
        indexed: true,
        name: 'anchor',
        type: 'bytes32',
      },
    ],
    name: 'AnchorRemoved',
    type: 'event',
  },
  {
    inputs: [
      {
        indexed: true,
        name: 'policyId',
        type: 'bytes32',
      },
      {
        indexed: true,
        name: 'entry',
        type: 'bytes32',
      },
      {
        name: 'isAnchor',
        type: 'bool',
      },
    ],
    name: 'ProposalCancelled',
    type: 'event',
  },
  {
    inputs: [
      {
        indexed: true,
        name: 'policyId',
        type: 'bytes32',
      },
      {
        name: 'epoch',
        type: 'uint64',
      },
    ],
    name: 'KeysRevoked',
    type: 'event',
  },
  {
    inputs: [
      {
        indexed: true,
        name: 'policyId',
        type: 'bytes32',
      },
      {
        name: 'paused',
        type: 'bool',
      },
    ],
    name: 'PolicyPaused',
    type: 'event',
  },
  {
    inputs: [
      {
        indexed: true,
        name: 'policyId',
        type: 'bytes32',
      },
      {
        name: 'newDelay',
        type: 'uint64',
      },
      {
        name: 'effectiveAt',
        type: 'uint64',
      },
    ],
    name: 'DelayChanged',
    type: 'event',
  },
  {
    inputs: [
      {
        indexed: true,
        name: 'policyId',
        type: 'bytes32',
      },
      {
        name: 'newMaxKeyLifetime',
        type: 'uint64',
      },
      {
        name: 'effectiveAt',
        type: 'uint64',
      },
    ],
    name: 'MaxKeyLifetimeChanged',
    type: 'event',
  },
  {
    inputs: [
      {
        indexed: true,
        name: 'policyId',
        type: 'bytes32',
      },
      {
        indexed: true,
        name: 'previousGuardian',
        type: 'address',
      },
      {
        indexed: true,
        name: 'newGuardian',
        type: 'address',
      },
    ],
    name: 'GuardianChanged',
    type: 'event',
  },
  {
    inputs: [
      {
        indexed: true,
        name: 'policyId',
        type: 'bytes32',
      },
      {
        indexed: true,
        name: 'previousOwner',
        type: 'address',
      },
      {
        indexed: true,
        name: 'newOwner',
        type: 'address',
      },
    ],
    name: 'OwnershipTransferred',
    type: 'event',
  },
  {
    inputs: [
      {
        indexed: true,
        name: 'policyId',
        type: 'bytes32',
      },
      {
        indexed: true,
        name: 'keyId',
        type: 'bytes32',
      },
      {
        indexed: true,
        name: 'measurement',
        type: 'bytes32',
      },
      {
        name: 'slot',
        type: 'uint8',
      },
      {
        name: 'validUntil',
        type: 'uint64',
      },
    ],
    name: 'KeyRegistered',
    type: 'event',
  },
  {
    inputs: [],
    name: 'Unauthorized',
    type: 'error',
  },
  {
    inputs: [],
    name: 'PolicyExists',
    type: 'error',
  },
  {
    inputs: [],
    name: 'PolicyNotFound',
    type: 'error',
  },
  {
    inputs: [],
    name: 'PolicyIsPaused',
    type: 'error',
  },
  {
    inputs: [],
    name: 'UnknownScheme',
    type: 'error',
  },
  {
    inputs: [],
    name: 'ZeroAddress',
    type: 'error',
  },
  {
    inputs: [],
    name: 'DelayTooLong',
    type: 'error',
  },
  {
    inputs: [],
    name: 'TooManyEntries',
    type: 'error',
  },
  {
    inputs: [],
    name: 'InvalidAnchor',
    type: 'error',
  },
  {
    inputs: [],
    name: 'AlreadyListed',
    type: 'error',
  },
  {
    inputs: [],
    name: 'NotListed',
    type: 'error',
  },
  {
    inputs: [],
    name: 'NotPending',
    type: 'error',
  },
  {
    inputs: [],
    name: 'InvalidProgramKey',
    type: 'error',
  },
  {
    inputs: [],
    name: 'InvalidAttestation',
    type: 'error',
  },
  {
    inputs: [],
    name: 'AnchorNotActive',
    type: 'error',
  },
  {
    inputs: [],
    name: 'MeasurementNotActive',
    type: 'error',
  },
  {
    inputs: [],
    name: 'StaleAttestation',
    type: 'error',
  },
  {
    inputs: [],
    name: 'InvalidSlot',
    type: 'error',
  },
  {
    inputs: [],
    name: 'InvalidKeyLifetime',
    type: 'error',
  },
  {
    inputs: [
      {
        name: 'salt',
        type: 'bytes32',
      },
      {
        name: 'scheme',
        type: 'uint8',
      },
      {
        name: 'owner',
        type: 'address',
      },
      {
        name: 'guardian',
        type: 'address',
      },
      {
        name: 'delay',
        type: 'uint64',
      },
      {
        name: 'maxKeyLifetime',
        type: 'uint64',
      },
      {
        name: 'measurements',
        type: 'bytes32[]',
      },
      {
        name: 'anchors',
        type: 'bytes32[]',
      },
    ],
    name: 'createPolicy',
    outputs: [
      {
        name: 'policyId',
        type: 'bytes32',
      },
    ],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        name: 'creator',
        type: 'address',
      },
      {
        name: 'salt',
        type: 'bytes32',
      },
    ],
    name: 'computePolicyId',
    outputs: [
      {
        type: 'bytes32',
      },
    ],
    stateMutability: 'pure',
    type: 'function',
  },
  {
    inputs: [
      {
        name: 'policyId',
        type: 'bytes32',
      },
      {
        name: 'measurement',
        type: 'bytes32',
      },
    ],
    name: 'proposeMeasurement',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        name: 'policyId',
        type: 'bytes32',
      },
      {
        name: 'anchor',
        type: 'bytes32',
      },
    ],
    name: 'proposeAnchor',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        name: 'policyId',
        type: 'bytes32',
      },
      {
        name: 'entry',
        type: 'bytes32',
      },
      {
        name: 'isAnchor',
        type: 'bool',
      },
    ],
    name: 'cancelProposal',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        name: 'policyId',
        type: 'bytes32',
      },
      {
        name: 'measurement',
        type: 'bytes32',
      },
    ],
    name: 'removeMeasurement',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        name: 'policyId',
        type: 'bytes32',
      },
      {
        name: 'anchor',
        type: 'bytes32',
      },
    ],
    name: 'removeAnchor',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        name: 'policyId',
        type: 'bytes32',
      },
    ],
    name: 'revokeKeys',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        name: 'policyId',
        type: 'bytes32',
      },
    ],
    name: 'pause',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        name: 'policyId',
        type: 'bytes32',
      },
    ],
    name: 'unpause',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        name: 'policyId',
        type: 'bytes32',
      },
      {
        name: 'newDelay',
        type: 'uint64',
      },
    ],
    name: 'setDelay',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        name: 'policyId',
        type: 'bytes32',
      },
      {
        name: 'newMaxKeyLifetime',
        type: 'uint64',
      },
    ],
    name: 'setMaxKeyLifetime',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        name: 'policyId',
        type: 'bytes32',
      },
      {
        name: 'newGuardian',
        type: 'address',
      },
    ],
    name: 'setGuardian',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        name: 'policyId',
        type: 'bytes32',
      },
      {
        name: 'newOwner',
        type: 'address',
      },
    ],
    name: 'transferOwnership',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        name: 'policyId',
        type: 'bytes32',
      },
      {
        name: 'slot',
        type: 'uint8',
      },
      {
        name: 'document',
        type: 'bytes',
      },
      {
        name: 'programKeyX',
        type: 'bytes32',
      },
      {
        name: 'programKeyY',
        type: 'bytes32',
      },
      {
        name: 'lifetime',
        type: 'uint64',
      },
    ],
    name: 'registerKey',
    outputs: [
      {
        name: 'validUntil',
        type: 'uint64',
      },
    ],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        name: 'policyId',
        type: 'bytes32',
      },
    ],
    name: 'policy',
    outputs: [
      {
        name: 'owner',
        type: 'address',
      },
      {
        name: 'guardian',
        type: 'address',
      },
      {
        name: 'scheme',
        type: 'uint8',
      },
      {
        name: 'paused',
        type: 'bool',
      },
      {
        name: 'epoch',
        type: 'uint64',
      },
      {
        name: 'delay',
        type: 'uint64',
      },
      {
        name: 'pendingDelay',
        type: 'uint64',
      },
      {
        name: 'pendingDelayAt',
        type: 'uint64',
      },
      {
        name: 'maxKeyLifetime',
        type: 'uint64',
      },
      {
        name: 'pendingMaxKeyLifetime',
        type: 'uint64',
      },
      {
        name: 'pendingMaxKeyLifetimeAt',
        type: 'uint64',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      {
        name: 'policyId',
        type: 'bytes32',
      },
      {
        name: 'measurement',
        type: 'bytes32',
      },
    ],
    name: 'measurementActiveAt',
    outputs: [
      {
        type: 'uint64',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      {
        name: 'policyId',
        type: 'bytes32',
      },
      {
        name: 'anchor',
        type: 'bytes32',
      },
    ],
    name: 'anchorActiveAt',
    outputs: [
      {
        type: 'uint64',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      {
        name: 'policyId',
        type: 'bytes32',
      },
      {
        name: 'programKeyX',
        type: 'bytes32',
      },
      {
        name: 'programKeyY',
        type: 'bytes32',
      },
    ],
    name: 'keyValidUntil',
    outputs: [
      {
        type: 'uint64',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
] as const

/**
 * Attested Key Registry precompile address, as the Tempo node's attested
 * signers proof of concept deploys it.
 *
 * TIP-1161 names `0x1161000000000000000000000000000000000000`. The proof of
 * concept uses this address until the TIP is final.
 *
 * @experimental
 */
export const registryAddress =
  '0xA77E570000000000000000000000000000000000' as const satisfies Address.Address

/**
 * Program key slots of each policy. An attested signature names a slot below
 * this.
 *
 * @experimental
 */
export const keySlots = 8

/**
 * Longest `maxKeyLifetime` a policy can set, in seconds (7 days).
 *
 * @experimental
 */
export const maxKeyLifetime = 604_800

/**
 * Oldest attestation document the registry accepts, in seconds from its issue
 * time.
 *
 * @experimental
 */
export const maxAttestationAge = 300

/**
 * Allowance for attestation service clocks running ahead, in seconds.
 *
 * @experimental
 */
export const maxFutureSkew = 60

/**
 * Largest serialized attested signature, type byte included, in bytes.
 *
 * Reached with a 9-byte `validUntil`. A current timestamp (4 bytes) makes a
 * 207-byte signature.
 *
 * @experimental
 */
export const maxSignatureSize = 211

/**
 * Longest time before `validUntil` that the node accepts an attested
 * signature, in seconds. An attested signature is valid while
 * `timestamp <= validUntil <= timestamp + maxValidityWindow`.
 *
 * @experimental
 */
export const maxValidityWindow = 600

/**
 * Attestation scheme IDs of the Attested Key Registry.
 *
 * - `awsNitro` (`0x01`): AWS Nitro Enclaves ([TIP-1162](https://tips.sh/1162)).
 * - `gcpConfidentialSpace` (`0x02`): Google Cloud Confidential Space
 *   ([TIP-1163](https://tips.sh/1163)). Not implemented by the proof of concept node.
 * - `awsNitroDev` (`0xfe`): AWS Nitro documents under a public development root,
 *   accepted on chain `1337` only. Proof of concept only.
 *
 * @experimental
 */
export const schemes = {
  awsNitro: 0x01,
  awsNitroDev: 0xfe,
  gcpConfidentialSpace: 0x02,
} as const

/**
 * Serialized signature type of an attested signature.
 *
 * @experimental
 */
export const signatureType = '0x06'

/**
 * Computes the address an attested signature signs for:
 * `keccak256(0x06 ‖ policyId ‖ userTag)[12:]`.
 *
 * The address depends on neither the program key nor the chain.
 *
 * [TIP-1160](https://tips.sh/1160)
 *
 * @example
 * ```ts twoslash
 * import { AttestedSigner } from 'ox/tempo'
 *
 * const address = AttestedSigner.getAddress({
 *   policyId: `0x${'aa'.repeat(32)}`,
 *   userTag: `0x${'bb'.repeat(32)}`
 * })
 * ```
 *
 * @experimental
 * @param options - The policy ID and user tag.
 * @returns The attested address.
 */
export function getAddress(options: getAddress.Options): Address.Address {
  return Address.from(
    Hex.slice(
      Hash.keccak256(
        Hex.concat(signatureType, options.policyId, options.userTag),
      ),
      12,
    ),
  )
}

export declare namespace getAddress {
  type Options = {
    /** Attested Key Registry policy ID. */
    policyId: Hex.Hex
    /** Tag of the user whose address to derive. */
    userTag: Hex.Hex
  }

  type ErrorType =
    | Address.from.ErrorType
    | Hash.keccak256.ErrorType
    | Hex.concat.ErrorType
    | Hex.slice.ErrorType
    | Errors.GlobalErrorType
}

/**
 * Computes the binding an attestation document commits to, so that the
 * Attested Key Registry registers the program key only for this chain,
 * registry, policy, slot, and requested lifetime:
 * `keccak256("tempo:attested-key" ‖ uint256 chainId ‖ registry ‖ policyId ‖ uint8 slot ‖ x ‖ y ‖ uint64 lifetime)`.
 *
 * [TIP-1161](https://tips.sh/1161)
 *
 * @example
 * ```ts twoslash
 * import { P256 } from 'ox'
 * import { AttestedSigner } from 'ox/tempo'
 *
 * const { publicKey } = P256.createKeyPair()
 *
 * const binding = AttestedSigner.getBinding({
 *   chainId: 1337,
 *   lifetime: 3600,
 *   policyId: `0x${'aa'.repeat(32)}`,
 *   programKey: publicKey,
 *   slot: 0
 * })
 * ```
 *
 * @experimental
 * @param options - The binding fields.
 * @returns The binding.
 */
export function getBinding(options: getBinding.Options): Hex.Hex {
  const {
    chainId,
    lifetime,
    policyId,
    programKey,
    registry = registryAddress,
    slot,
  } = options
  return Hash.keccak256(
    Hex.concat(
      bindingDomain,
      Hex.fromNumber(chainId, { size: 32 }),
      registry,
      policyId,
      Hex.fromNumber(slot, { size: 1 }),
      Hex.fromNumber(programKey.x, { size: 32 }),
      Hex.fromNumber(programKey.y, { size: 32 }),
      Hex.fromNumber(lifetime, { size: 8 }),
    ),
  )
}

export declare namespace getBinding {
  type Options = {
    /** Chain ID the registration is for. */
    chainId: number | bigint
    /**
     * Lifetime in seconds that `registerKey` requests, capped by the policy's
     * `maxKeyLifetime`. `0` requests the cap.
     */
    lifetime: number | bigint
    /** Attested Key Registry policy ID. */
    policyId: Hex.Hex
    /** Uncompressed P256 program key to register. */
    programKey: PublicKey.PublicKey<false>
    /**
     * Registry address.
     * @default AttestedSigner.registryAddress
     */
    registry?: Address.Address | undefined
    /** Key slot to register into, below {@link ox#AttestedSigner.keySlots}. */
    slot: number
  }

  type ErrorType =
    | Hash.keccak256.ErrorType
    | Hex.concat.ErrorType
    | Hex.fromNumber.ErrorType
    | Errors.GlobalErrorType
}

/**
 * Computes a program key's ID, as the registry's `KeyRegistered` event
 * carries it: `keccak256(policyId ‖ x ‖ y)`.
 *
 * [TIP-1161](https://tips.sh/1161)
 *
 * @example
 * ```ts twoslash
 * import { P256 } from 'ox'
 * import { AttestedSigner } from 'ox/tempo'
 *
 * const { publicKey } = P256.createKeyPair()
 *
 * const keyId = AttestedSigner.getKeyId({
 *   policyId: `0x${'aa'.repeat(32)}`,
 *   programKey: publicKey
 * })
 * ```
 *
 * @experimental
 * @param options - The policy ID and program key.
 * @returns The key ID.
 */
export function getKeyId(options: getKeyId.Options): Hex.Hex {
  const { policyId, programKey } = options
  return Hash.keccak256(
    Hex.concat(
      policyId,
      Hex.fromNumber(programKey.x, { size: 32 }),
      Hex.fromNumber(programKey.y, { size: 32 }),
    ),
  )
}

export declare namespace getKeyId {
  type Options = {
    /** Attested Key Registry policy ID. */
    policyId: Hex.Hex
    /** Uncompressed P256 program key. */
    programKey: PublicKey.PublicKey<false>
  }

  type ErrorType =
    | Hash.keccak256.ErrorType
    | Hex.concat.ErrorType
    | Hex.fromNumber.ErrorType
    | Errors.GlobalErrorType
}

/**
 * Computes the ID of the policy that `creator` creates with `salt`:
 * `keccak256(abi.encode(creator, salt))`.
 *
 * Only `creator` can create a given ID, so it can create the same policy on
 * every chain.
 *
 * [TIP-1161](https://tips.sh/1161)
 *
 * @example
 * ```ts twoslash
 * import { AttestedSigner } from 'ox/tempo'
 *
 * const policyId = AttestedSigner.getPolicyId({
 *   creator: '0x0101010101010101010101010101010101010101',
 *   salt: `0x${'55'.repeat(32)}`
 * })
 * ```
 *
 * @experimental
 * @param options - The creator and salt.
 * @returns The policy ID.
 */
export function getPolicyId(options: getPolicyId.Options): Hex.Hex {
  return Hash.keccak256(
    AbiParameters.encode(policyIdParameters, [options.creator, options.salt]),
  )
}

export declare namespace getPolicyId {
  type Options = {
    /** Caller of `createPolicy`. */
    creator: Address.Address
    /** 32-byte salt the creator chooses. */
    salt: Hex.Hex
  }

  type ErrorType =
    | AbiParameters.encode.ErrorType
    | Hash.keccak256.ErrorType
    | Errors.GlobalErrorType
}

/**
 * Computes the digest a program key signs for an attested signature over the
 * context digest `payload`:
 * `keccak256("tempo:attested-signature" ‖ payload ‖ keccak256(rlp([policyId, userTag, slot, programKey, validUntil])))`.
 *
 * `payload` is the transaction sign payload, the key authorization sign
 * payload, the configurable account owner approval payload, or the hash a
 * contract verifies. The program key signs the result with ECDSA over P256, with
 * no further hashing and a low `s`.
 *
 * [TIP-1160](https://tips.sh/1160)
 *
 * @example
 * ```ts twoslash
 * import { P256 } from 'ox'
 * import { AttestedSigner, SignatureEnvelope } from 'ox/tempo'
 *
 * const { privateKey, publicKey } = P256.createKeyPair()
 *
 * const attested = {
 *   policyId: `0x${'aa'.repeat(32)}`,
 *   programKey: publicKey,
 *   slot: 0,
 *   userTag: `0x${'bb'.repeat(32)}`,
 *   validUntil: 1_800_000_600
 * } as const
 *
 * const payload = AttestedSigner.getSignPayload({
 *   ...attested,
 *   payload: '0xdeadbeef'
 * })
 *
 * const envelope = SignatureEnvelope.from({
 *   ...attested,
 *   signature: P256.sign({ payload, privateKey })
 * })
 * ```
 *
 * @experimental
 * @param options - The context digest and the signature's fields.
 * @returns The digest the program key signs.
 */
export function getSignPayload(options: getSignPayload.Options): Hex.Hex {
  const { payload, policyId, programKey, slot, userTag, validUntil } = options
  return Hash.keccak256(
    Hex.concat(
      signatureDomain,
      Hex.from(payload),
      Hash.keccak256(
        Rlp.fromHex([
          policyId,
          userTag,
          slot === 0 ? '0x' : Hex.fromNumber(slot),
          Hex.concat(
            Hex.fromNumber(programKey.x, { size: 32 }),
            Hex.fromNumber(programKey.y, { size: 32 }),
          ),
          BigInt(validUntil) === 0n ? '0x' : Hex.fromNumber(validUntil),
        ]),
      ),
    ),
  )
}

export declare namespace getSignPayload {
  type Options = {
    /** Context digest the attested signature authorizes. */
    payload: Hex.Hex | Bytes.Bytes
    /** Attested Key Registry policy ID. */
    policyId: Hex.Hex
    /** Uncompressed P256 program key that signs. */
    programKey: PublicKey.PublicKey<false>
    /** Key slot that holds the program key. */
    slot: number
    /** Tag of the user whose address the signature signs for. */
    userTag: Hex.Hex
    /** Last block timestamp, in seconds, at which the signature is valid. */
    validUntil: number | bigint
  }

  type ErrorType =
    | Hash.keccak256.ErrorType
    | Hex.concat.ErrorType
    | Hex.from.ErrorType
    | Hex.fromNumber.ErrorType
    | Rlp.fromHex.ErrorType
    | Errors.GlobalErrorType
}
