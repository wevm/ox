import * as AbiParameters from '../core/AbiParameters.js'
import type * as Address from '../core/Address.js'
import * as Authorization from '../core/Authorization.js'
import type * as Errors from '../core/Errors.js'
import * as Hash from '../core/Hash.js'
import * as Hex from '../core/Hex.js'
import * as Quantity from '../core/internal/quantity.js'
import type { Assign, Compute, Omit, OneOf } from '../core/internal/types.js'
import * as Signature from '../core/Signature.js'
import * as TypedData from '../core/TypedData.js'
import type * as EntryPoint from './EntryPoint.js'

// ---- Module-scoped constants for hot paths ---------------------------------

/** keccak256 of empty bytes (`0x`). Reused for empty initCode/paymasterAndData. */
const EMPTY_KECCAK = /*#__PURE__*/ Hash.keccak256('0x')

/** Magic suffix for an independently encoded paymaster signature. */
const paymasterSignatureMagic = '0x22e325a297439656' as const

/** ABI parameters for v0.6 user operation packed encoding. */
const v06HashParameters = [
  { type: 'address' },
  { type: 'uint256' },
  { type: 'bytes32' },
  { type: 'bytes32' },
  { type: 'uint256' },
  { type: 'uint256' },
  { type: 'uint256' },
  { type: 'uint256' },
  { type: 'uint256' },
  { type: 'bytes32' },
] as const satisfies readonly AbiParameters.Parameter[]

/** ABI parameters for v0.7 user operation packed encoding. */
const v07HashParameters = [
  { type: 'address' },
  { type: 'uint256' },
  { type: 'bytes32' },
  { type: 'bytes32' },
  { type: 'bytes32' },
  { type: 'uint256' },
  { type: 'bytes32' },
  { type: 'bytes32' },
] as const satisfies readonly AbiParameters.Parameter[]

/** ABI parameters for the outer hash envelope `(packedUserOpHash, entryPoint, chainId)`. */
const hashEnvelopeParameters = [
  { type: 'bytes32' },
  { type: 'address' },
  { type: 'uint256' },
] as const satisfies readonly AbiParameters.Parameter[]

/**
 * Packs two `uint128` values into a single `bytes32` word, with `high` in the
 * upper 16 bytes and `low` in the lower 16 bytes. Used for `accountGasLimits`
 * and `gasFees` packing in v0.7+ user operations.
 *
 * @internal
 */
function packUint128Pair(high: bigint | number, low: bigint | number): Hex.Hex {
  return Hex.concat(
    Hex.padLeft(Hex.fromNumber(high), 16),
    Hex.padLeft(Hex.fromNumber(low), 16),
  )
}

/** User Operation. */
export type UserOperation<
  entryPointVersion extends EntryPoint.Version = EntryPoint.Version,
  signed extends boolean = boolean,
  bigintType = bigint,
  numberType = number,
> = OneOf<
  | (entryPointVersion extends '0.6' ? V06<signed, bigintType> : never)
  | (entryPointVersion extends '0.7' ? V07<signed, bigintType> : never)
  | (entryPointVersion extends '0.8'
      ? V08<signed, bigintType, numberType>
      : never)
  | (entryPointVersion extends '0.9'
      ? V09<signed, bigintType, numberType>
      : never)
>

/**
 * Packed User Operation.
 *
 * @see https://eips.ethereum.org/EIPS/eip-4337#entrypoint-definition
 */
export type Packed = {
  /** Concatenation of `verificationGasLimit` (16 bytes) and `callGasLimit` (16 bytes) */
  accountGasLimits: Hex.Hex
  /** The data to pass to the `sender` during the main execution call. */
  callData: Hex.Hex
  /** Concatenation of `factory` and `factoryData`. */
  initCode: Hex.Hex
  /** Concatenation of `maxPriorityFee` (16 bytes) and `maxFeePerGas` (16 bytes) */
  gasFees: Hex.Hex
  /** Anti-replay parameter. */
  nonce: bigint
  /** Concatenation of paymaster fields (or empty). */
  paymasterAndData: Hex.Hex
  /** Extra gas to pay the Bundler. */
  preVerificationGas: bigint
  /** The account making the operation. */
  sender: Address.Address
  /** Data passed into the account to verify authorization. */
  signature: Hex.Hex
}

/** RPC User Operation type. */
export type Rpc<
  entryPointVersion extends EntryPoint.Version = EntryPoint.Version,
  signed extends boolean = true,
> = OneOf<
  | (entryPointVersion extends '0.6' ? RpcV06<signed> : never)
  | (entryPointVersion extends '0.7' ? RpcV07<signed> : never)
  | (entryPointVersion extends '0.8' ? RpcV08<signed> : never)
  | (entryPointVersion extends '0.9' ? RpcV09<signed> : never)
>

/** Transaction Info. */
export type TransactionInfo<
  entryPointVersion extends EntryPoint.Version = EntryPoint.Version,
  bigintType = bigint,
> = {
  blockHash: Hex.Hex
  blockNumber: bigintType
  entryPoint: Address.Address
  transactionHash: Hex.Hex
  userOperation: UserOperation<entryPointVersion, true, bigintType>
}

/** RPC Transaction Info. */
export type RpcTransactionInfo<
  entryPointVersion extends EntryPoint.Version = EntryPoint.Version,
> = {
  /** Block hash containing the User Operation, or `null` while pending. */
  blockHash: Hex.Hex | null
  /** Block number containing the User Operation, or `null` while pending. */
  blockNumber: Hex.Hex | null
  /** EntryPoint that handled the User Operation. */
  entryPoint: Address.Address
  /** Transaction hash containing the User Operation, or `null` while pending. */
  transactionHash: Hex.Hex | null
  /** RPC User Operation included in the transaction. */
  userOperation: Rpc<entryPointVersion>
}

/** Type for User Operation on EntryPoint 0.6 */
export type V06<signed extends boolean = boolean, bigintType = bigint> = {
  /** The data to pass to the `sender` during the main execution call. */
  callData: Hex.Hex
  /** The amount of gas to allocate the main execution call */
  callGasLimit: bigintType
  /** Account init code. Only for new accounts. */
  initCode?: Hex.Hex | undefined
  /** Maximum fee per gas. */
  maxFeePerGas: bigintType
  /** Maximum priority fee per gas. */
  maxPriorityFeePerGas: bigintType
  /** Anti-replay parameter. */
  nonce: bigintType
  /** Paymaster address with calldata. */
  paymasterAndData?: Hex.Hex | undefined
  /** Extra gas to pay the Bundler. */
  preVerificationGas: bigintType
  /** The account making the operation. */
  sender: Address.Address
  /** Data passed into the account to verify authorization. */
  signature?: Hex.Hex | undefined
  /** The amount of gas to allocate for the verification step. */
  verificationGasLimit: bigintType
} & (signed extends true ? { signature: Hex.Hex } : {})

/** RPC User Operation on EntryPoint 0.6 */
export type RpcV06<signed extends boolean = true> = V06<signed, Hex.Hex>

/** Type for User Operation on EntryPoint 0.7 */
export type V07<signed extends boolean = boolean, bigintType = bigint> = {
  /** The data to pass to the `sender` during the main execution call. */
  callData: Hex.Hex
  /** The amount of gas to allocate the main execution call */
  callGasLimit: bigintType
  /** Account factory. Only for new accounts. */
  factory?: Address.Address | undefined
  /** Data for account factory. */
  factoryData?: Hex.Hex | undefined
  /** Maximum fee per gas. */
  maxFeePerGas: bigintType
  /** Maximum priority fee per gas. */
  maxPriorityFeePerGas: bigintType
  /** Anti-replay parameter. */
  nonce: bigintType
  /** Address of paymaster contract. */
  paymaster?: Address.Address | undefined
  /** Data for paymaster. */
  paymasterData?: Hex.Hex | undefined
  /** The amount of gas to allocate for the paymaster post-operation code. */
  paymasterPostOpGasLimit?: bigintType | undefined
  /** The amount of gas to allocate for the paymaster validation code. */
  paymasterVerificationGasLimit?: bigintType | undefined
  /** Extra gas to pay the Bundler. */
  preVerificationGas: bigintType
  /** The account making the operation. */
  sender: Address.Address
  /** Data passed into the account to verify authorization. */
  signature?: Hex.Hex | undefined
  /** The amount of gas to allocate for the verification step. */
  verificationGasLimit: bigintType
} & (signed extends true ? { signature: Hex.Hex } : {})

/** RPC User Operation on EntryPoint 0.7 */
export type RpcV07<signed extends boolean = true> = V07<signed, Hex.Hex>

/** Type for User Operation on EntryPoint 0.8 */
export type V08<
  signed extends boolean = boolean,
  bigintType = bigint,
  numberType = number,
> = {
  /** Authorization data. */
  authorization?: Authorization.Signed<bigintType, numberType> | undefined
  /** The data to pass to the `sender` during the main execution call. */
  callData: Hex.Hex
  /** The amount of gas to allocate the main execution call */
  callGasLimit: bigintType
  /** Account factory. Only for new accounts. */
  factory?: Address.Address | undefined
  /** Data for account factory. */
  factoryData?: Hex.Hex | undefined
  /** Maximum fee per gas. */
  maxFeePerGas: bigintType
  /** Maximum priority fee per gas. */
  maxPriorityFeePerGas: bigintType
  /** Anti-replay parameter. */
  nonce: bigintType
  /** Address of paymaster contract. */
  paymaster?: Address.Address | undefined
  /** Data for paymaster. */
  paymasterData?: Hex.Hex | undefined
  /** The amount of gas to allocate for the paymaster post-operation code. */
  paymasterPostOpGasLimit?: bigintType | undefined
  /** The amount of gas to allocate for the paymaster validation code. */
  paymasterVerificationGasLimit?: bigintType | undefined
  /** Extra gas to pay the Bundler. */
  preVerificationGas: bigintType
  /** The account making the operation. */
  sender: Address.Address
  /** Data passed into the account to verify authorization. */
  signature?: Hex.Hex | undefined
  /** The amount of gas to allocate for the verification step. */
  verificationGasLimit: bigintType
} & (signed extends true ? { signature: Hex.Hex } : {})

/** RPC User Operation on EntryPoint 0.8 */
export type RpcV08<signed extends boolean = true> = Omit<
  V08<signed, Hex.Hex, Hex.Hex>,
  'authorization'
> & {
  /** EIP-7702 authorization carried by Bundler RPC methods. */
  eip7702Auth?: Authorization.Rpc | undefined
}

/** Type for User Operation on EntryPoint 0.9 */
export type V09<
  signed extends boolean = boolean,
  bigintType = bigint,
  numberType = number,
> = V08<signed, bigintType, numberType> & {
  /** Paymaster signature provided independently from account signing. */
  paymasterSignature?: Hex.Hex | undefined
}

/** RPC User Operation on EntryPoint 0.9 */
export type RpcV09<signed extends boolean = true> = Omit<
  V09<signed, Hex.Hex, Hex.Hex>,
  'authorization'
> & {
  /** EIP-7702 authorization carried by Bundler RPC methods. */
  eip7702Auth?: Authorization.Rpc | undefined
}

/**
 * Instantiates a {@link ox#UserOperation.UserOperation} from a provided input.
 *
 * @example
 * ```ts twoslash
 * import { Value } from 'ox'
 * import { UserOperation } from 'ox/erc4337'
 *
 * const userOperation = UserOperation.from({
 *   callData: '0xdeadbeef',
 *   callGasLimit: 300_000n,
 *   maxFeePerGas: Value.fromGwei('20'),
 *   maxPriorityFeePerGas: Value.fromGwei('2'),
 *   nonce: 69n,
 *   preVerificationGas: 100_000n,
 *   sender: '0x9f1fdab6458c5fc642fa0f4c5af7473c46837357',
 *   verificationGasLimit: 100_000n
 * })
 * ```
 *
 * @example
 * ### From Packed User Operation
 *
 * ```ts twoslash
 * import { UserOperation } from 'ox/erc4337'
 *
 * const packed: UserOperation.Packed = {
 *   accountGasLimits: '0x...',
 *   callData: '0xdeadbeef',
 *   initCode: '0x',
 *   gasFees: '0x...',
 *   nonce: 69n,
 *   paymasterAndData: '0x',
 *   preVerificationGas: 100_000n,
 *   sender: '0x9f1fdab6458c5fc642fa0f4c5af7473c46837357',
 *   signature: '0x'
 * }
 *
 * const userOperation = UserOperation.from(packed)
 * ```
 *
 * @example
 * ### Attaching Signatures
 *
 * ```ts twoslash
 * import { Secp256k1, Value } from 'ox'
 * import { UserOperation } from 'ox/erc4337'
 *
 * const userOperation = UserOperation.from({
 *   callData: '0xdeadbeef',
 *   callGasLimit: 300_000n,
 *   maxFeePerGas: Value.fromGwei('20'),
 *   maxPriorityFeePerGas: Value.fromGwei('2'),
 *   nonce: 69n,
 *   preVerificationGas: 100_000n,
 *   sender: '0x9f1fdab6458c5fc642fa0f4c5af7473c46837357',
 *   verificationGasLimit: 100_000n
 * })
 *
 * const payload = UserOperation.getSignPayload(
 *   userOperation,
 *   {
 *     chainId: 1,
 *     entryPointAddress:
 *       '0x1234567890123456789012345678901234567890',
 *     entryPointVersion: '0.7'
 *   }
 * )
 *
 * const signature = Secp256k1.sign({
 *   payload,
 *   privateKey: '0x...'
 * })
 *
 * const userOperation_signed = UserOperation.from(
 *   userOperation,
 *   { signature }
 * ) // [!code focus]
 * ```
 *
 * @param userOperation - The user operation to instantiate (structured or packed format).
 * @returns User Operation.
 */
export function from<
  const userOperation extends UserOperation | Packed,
  const signature extends Hex.Hex | undefined = undefined,
>(
  userOperation: userOperation | UserOperation | Packed,
  options: from.Options<signature> = {},
): from.ReturnType<userOperation, signature> {
  const signature = (() => {
    if (typeof options.signature === 'string') return options.signature
    if (typeof options.signature === 'object')
      return Signature.toHex(options.signature)
    if (userOperation.signature) return userOperation.signature
    return undefined
  })()

  const packed =
    'accountGasLimits' in userOperation && 'gasFees' in userOperation

  const userOp = packed ? fromPacked(userOperation) : userOperation
  return { ...userOp, signature } as never
}

export declare namespace from {
  export type Options<
    signature extends Signature.Signature | Hex.Hex | undefined = undefined,
  > = {
    signature?: signature | Signature.Signature | Hex.Hex | undefined
  }

  export type ReturnType<
    userOperation extends UserOperation | Packed = UserOperation | Packed,
    signature extends Signature.Signature | Hex.Hex | undefined = undefined,
  > = Compute<
    Assign<
      userOperation,
      signature extends Signature.Signature | Hex.Hex
        ? Readonly<{ signature: Hex.Hex }>
        : {}
    >
  >

  export type ErrorType = Errors.GlobalErrorType
}

/**
 * Converts an {@link ox#UserOperation.Rpc} to an {@link ox#UserOperation.UserOperation}.
 *
 * @example
 * ```ts twoslash
 * import { UserOperation } from 'ox/erc4337'
 *
 * const userOperation = UserOperation.fromRpc({
 *   callData: '0xdeadbeef',
 *   callGasLimit: '0x69420',
 *   maxFeePerGas: '0x2ca6ae494',
 *   maxPriorityFeePerGas: '0x41cc3c0',
 *   nonce: '0x357',
 *   preVerificationGas: '0x69420',
 *   signature: '0x',
 *   sender: '0x1234567890123456789012345678901234567890',
 *   verificationGasLimit: '0x69420'
 * })
 * ```
 *
 * @param rpc - The RPC user operation to convert.
 * @returns An instantiated {@link ox#UserOperation.UserOperation}.
 */
export function fromRpc<
  entryPointVersion extends EntryPoint.Version = EntryPoint.Version,
>(rpc: Rpc<entryPointVersion>): UserOperation<entryPointVersion, true> {
  const rpc_ = rpc as Rpc
  const { eip7702Auth, ...userOperation } = rpc_ as Rpc & {
    eip7702Auth?: Authorization.Rpc | undefined
  }
  return {
    ...userOperation,
    callGasLimit: BigInt(rpc_.callGasLimit),
    maxFeePerGas: BigInt(rpc_.maxFeePerGas),
    maxPriorityFeePerGas: BigInt(rpc_.maxPriorityFeePerGas),
    nonce: BigInt(rpc_.nonce),
    preVerificationGas: BigInt(rpc_.preVerificationGas),
    verificationGasLimit: BigInt(rpc_.verificationGasLimit),
    ...(rpc_.paymasterPostOpGasLimit && {
      paymasterPostOpGasLimit: BigInt(rpc_.paymasterPostOpGasLimit),
    }),
    ...(rpc_.paymasterVerificationGasLimit && {
      paymasterVerificationGasLimit: BigInt(rpc_.paymasterVerificationGasLimit),
    }),
    ...(eip7702Auth && {
      authorization: Authorization.fromRpc(eip7702Auth),
    }),
  } as UserOperation<entryPointVersion, true>
}

export declare namespace fromRpc {
  type ErrorType = Errors.GlobalErrorType
}

/**
 * Obtains the signing payload for a {@link ox#UserOperation.UserOperation}.
 *
 * @example
 * ```ts twoslash
 * import { Secp256k1, Value } from 'ox'
 * import { UserOperation } from 'ox/erc4337'
 *
 * const userOperation = UserOperation.from({
 *   callData: '0xdeadbeef',
 *   callGasLimit: 300_000n,
 *   maxFeePerGas: Value.fromGwei('20'),
 *   maxPriorityFeePerGas: Value.fromGwei('2'),
 *   nonce: 69n,
 *   preVerificationGas: 100_000n,
 *   sender: '0x9f1fdab6458c5fc642fa0f4c5af7473c46837357',
 *   verificationGasLimit: 100_000n
 * })
 *
 * const payload = UserOperation.getSignPayload(
 *   userOperation,
 *   {
 *     // [!code focus]
 *     chainId: 1, // [!code focus]
 *     entryPointAddress:
 *       '0x1234567890123456789012345678901234567890', // [!code focus]
 *     entryPointVersion: '0.6' // [!code focus]
 *   }
 * ) // [!code focus]
 *
 * const signature = Secp256k1.sign({
 *   payload,
 *   privateKey: '0x...'
 * })
 * ```
 *
 * @param userOperation - The user operation to get the sign payload for.
 * @returns The signing payload for the user operation.
 */
export function getSignPayload<
  entrypointVersion extends EntryPoint.Version = EntryPoint.Version,
>(
  userOperation: UserOperation<entrypointVersion>,
  options: getSignPayload.Options<entrypointVersion>,
): Hex.Hex {
  return hash(userOperation, options)
}

export declare namespace getSignPayload {
  type Options<
    entrypointVersion extends EntryPoint.Version = EntryPoint.Version,
  > = hash.Options<entrypointVersion>

  type ErrorType = hash.ErrorType | Errors.GlobalErrorType
}

/**
 * Hashes a {@link ox#UserOperation.UserOperation}. This is the "user operation hash".
 *
 * @example
 * ```ts twoslash
 * import { Value } from 'ox'
 * import { UserOperation } from 'ox/erc4337'
 *
 * const userOperation = UserOperation.hash(
 *   {
 *     callData: '0xdeadbeef',
 *     callGasLimit: 300_000n,
 *     maxFeePerGas: Value.fromGwei('20'),
 *     maxPriorityFeePerGas: Value.fromGwei('2'),
 *     nonce: 69n,
 *     preVerificationGas: 100_000n,
 *     sender: '0x9f1fdab6458c5fc642fa0f4c5af7473c46837357',
 *     verificationGasLimit: 100_000n
 *   },
 *   {
 *     chainId: 1,
 *     entryPointAddress:
 *       '0x1234567890123456789012345678901234567890',
 *     entryPointVersion: '0.6'
 *   }
 * )
 * ```
 *
 * @param userOperation - The user operation to hash.
 * @returns The hash of the user operation.
 */
export function hash<
  entrypointVersion extends EntryPoint.Version = EntryPoint.Version,
>(
  userOperation: UserOperation<entrypointVersion>,
  options: hash.Options<entrypointVersion>,
): Hex.Hex {
  const { chainId, entryPointAddress, entryPointVersion } = options
  const {
    callData,
    callGasLimit,
    initCode,
    factory,
    factoryData,
    maxFeePerGas,
    maxPriorityFeePerGas,
    nonce,
    paymaster,
    paymasterAndData,
    paymasterData,
    paymasterPostOpGasLimit,
    paymasterVerificationGasLimit,
    preVerificationGas,
    sender,
    verificationGasLimit,
  } = userOperation as UserOperation

  if (entryPointVersion === '0.8' || entryPointVersion === '0.9') {
    const typedData = toTypedData(
      userOperation as UserOperation<'0.8' | '0.9', true>,
      { chainId, entryPointAddress },
    )
    return TypedData.getSignPayload(typedData)
  }

  const packedUserOp = (() => {
    if (entryPointVersion === '0.6') {
      const initCodeHash =
        !initCode || initCode === '0x' ? EMPTY_KECCAK : Hash.keccak256(initCode)
      const paymasterAndDataHash =
        !paymasterAndData || paymasterAndData === '0x'
          ? EMPTY_KECCAK
          : Hash.keccak256(paymasterAndData)

      return AbiParameters.encode(v06HashParameters, [
        sender,
        nonce,
        initCodeHash,
        Hash.keccak256(callData),
        callGasLimit,
        verificationGasLimit,
        preVerificationGas,
        maxFeePerGas,
        maxPriorityFeePerGas,
        paymasterAndDataHash,
      ])
    }

    if (entryPointVersion === '0.7') {
      const accountGasLimits = packUint128Pair(
        verificationGasLimit,
        callGasLimit,
      )
      const gasFees = packUint128Pair(maxPriorityFeePerGas, maxFeePerGas)
      const initCode_hashed =
        factory && factoryData
          ? Hash.keccak256(Hex.concat(factory, factoryData))
          : EMPTY_KECCAK
      const paymasterAndData_hashed = paymaster
        ? Hash.keccak256(
            Hex.concat(
              paymaster,
              Hex.padLeft(
                Hex.fromNumber(paymasterVerificationGasLimit || 0),
                16,
              ),
              Hex.padLeft(Hex.fromNumber(paymasterPostOpGasLimit || 0), 16),
              paymasterData || '0x',
            ),
          )
        : EMPTY_KECCAK

      return AbiParameters.encode(v07HashParameters, [
        sender,
        nonce,
        initCode_hashed,
        Hash.keccak256(callData),
        accountGasLimits,
        preVerificationGas,
        gasFees,
        paymasterAndData_hashed,
      ])
    }

    throw new Error(`entryPointVersion "${entryPointVersion}" not supported.`)
  })()

  return Hash.keccak256(
    AbiParameters.encode(hashEnvelopeParameters, [
      Hash.keccak256(packedUserOp),
      entryPointAddress,
      BigInt(chainId),
    ]),
  )
}

export declare namespace hash {
  type Options<
    entrypointVersion extends EntryPoint.Version = EntryPoint.Version,
  > = {
    chainId: number
    entryPointAddress: Address.Address
    entryPointVersion: entrypointVersion | EntryPoint.Version
  }

  type ErrorType =
    | AbiParameters.encode.ErrorType
    | Hash.keccak256.ErrorType
    | Hex.concat.ErrorType
    | Hex.fromNumber.ErrorType
    | Hex.padLeft.ErrorType
    | Errors.GlobalErrorType
}

/**
 * Converts a {@link ox#UserOperation.UserOperation} to `initCode`.
 *
 * @example
 * ```ts twoslash
 * import { Value } from 'ox'
 * import { UserOperation } from 'ox/erc4337'
 *
 * const initCode = UserOperation.toInitCode({
 *   authorization: {
 *     address: '0x9f1fdab6458c5fc642fa0f4c5af7473c46837357',
 *     chainId: 1,
 *     nonce: 69n,
 *     yParity: 0,
 *     r: '0x0000000000000000000000000000000000000000000000000000000000000001',
 *     s: '0x0000000000000000000000000000000000000000000000000000000000000002'
 *   },
 *   callData: '0xdeadbeef',
 *   callGasLimit: 300_000n,
 *   factory: '0x7702',
 *   factoryData: '0xdeadbeef',
 *   maxFeePerGas: Value.fromGwei('20'),
 *   maxPriorityFeePerGas: Value.fromGwei('2'),
 *   nonce: 69n,
 *   preVerificationGas: 100_000n,
 *   sender: '0x9f1fdab6458c5fc642fa0f4c5af7473c46837357'
 * })
 * ```
 *
 * @param userOperation - The user operation to convert.
 * @returns The init code.
 */
export function toInitCode(userOperation: Partial<UserOperation>): Hex.Hex {
  const { authorization, factory, factoryData } = userOperation
  if (
    factory === '0x7702' ||
    factory === '0x7702000000000000000000000000000000000000'
  ) {
    if (!authorization) return '0x7702000000000000000000000000000000000000'
    const delegation = authorization.address
    return Hex.concat(delegation, factoryData ?? '0x')
  }
  if (!factory) return '0x'
  return Hex.concat(factory, factoryData ?? '0x')
}

/**
 * Transforms a User Operation into "packed" format.
 *
 * @example
 * ```ts twoslash
 * import { Value } from 'ox'
 * import { UserOperation } from 'ox/erc4337'
 *
 * const packed = UserOperation.toPacked({
 *   callData: '0xdeadbeef',
 *   callGasLimit: 300_000n,
 *   maxFeePerGas: Value.fromGwei('20'),
 *   maxPriorityFeePerGas: Value.fromGwei('2'),
 *   nonce: 69n,
 *   preVerificationGas: 100_000n,
 *   sender: '0x9f1fdab6458c5fc642fa0f4c5af7473c46837357',
 *   signature: '0x...',
 *   verificationGasLimit: 100_000n
 * })
 * ```
 *
 * @param userOperation - The user operation to transform.
 * @returns The packed user operation.
 */
export function toPacked(
  userOperation: UserOperation<'0.7' | '0.8' | '0.9', true>,
  options: toPacked.Options = {},
): Packed {
  const {
    callGasLimit,
    callData,
    maxPriorityFeePerGas,
    maxFeePerGas,
    nonce,
    paymaster,
    paymasterData,
    paymasterPostOpGasLimit,
    paymasterVerificationGasLimit,
    sender,
    signature,
    verificationGasLimit,
  } = userOperation
  const { paymasterSignature } = userOperation as V09<true>

  const accountGasLimits = packUint128Pair(
    verificationGasLimit || 0n,
    callGasLimit || 0n,
  )
  const initCode = toInitCode(userOperation)
  const gasFees = packUint128Pair(
    maxPriorityFeePerGas || 0n,
    maxFeePerGas || 0n,
  )
  const paymasterAndData = paymaster
    ? Hex.concat(
        paymaster,
        Hex.padLeft(Hex.fromNumber(paymasterVerificationGasLimit || 0n), 16),
        Hex.padLeft(Hex.fromNumber(paymasterPostOpGasLimit || 0n), 16),
        paymasterData || '0x',
        ...(paymasterSignature
          ? options.forHash
            ? [paymasterSignatureMagic]
            : [
                paymasterSignature,
                Hex.padLeft(Hex.fromNumber(Hex.size(paymasterSignature)), 2),
                paymasterSignatureMagic,
              ]
          : []),
      )
    : '0x'
  const preVerificationGas = userOperation.preVerificationGas ?? 0n

  return {
    accountGasLimits,
    callData,
    initCode,
    gasFees,
    nonce,
    paymasterAndData,
    preVerificationGas,
    sender,
    signature,
  }
}

export declare namespace toPacked {
  /** Packing options. */
  export type Options = {
    /** Omits the paymaster signature while retaining its marker. */
    forHash?: boolean | undefined
  }

  export type ErrorType = Errors.GlobalErrorType
}

/**
 * Transforms a "packed" User Operation into a structured {@link ox#UserOperation.UserOperation}.
 *
 * @example
 * ```ts twoslash
 * import { UserOperation } from 'ox/erc4337'
 *
 * const packed: UserOperation.Packed = {
 *   accountGasLimits: '0x...',
 *   callData: '0xdeadbeef',
 *   initCode: '0x...',
 *   gasFees: '0x...',
 *   nonce: 69n,
 *   paymasterAndData: '0x',
 *   preVerificationGas: 100_000n,
 *   sender: '0x9f1fdab6458c5fc642fa0f4c5af7473c46837357',
 *   signature: '0x...'
 * }
 *
 * const userOperation = UserOperation.fromPacked(packed)
 * ```
 *
 * @param packed - The packed user operation to transform.
 * @returns The structured user operation.
 */
export function fromPacked(packed: Packed): UserOperation<'0.7', true> {
  const {
    accountGasLimits,
    callData,
    initCode,
    gasFees,
    nonce,
    paymasterAndData,
    preVerificationGas,
    sender,
    signature,
  } = packed

  const verificationGasLimit = BigInt(Hex.slice(accountGasLimits, 0, 16))
  const callGasLimit = BigInt(Hex.slice(accountGasLimits, 16, 32))

  const { factory, factoryData } = (() => {
    if (initCode === '0x') return { factory: undefined, factoryData: undefined }

    const factory = Hex.slice(initCode, 0, 20)
    const factoryData =
      Hex.size(initCode) > 20 ? Hex.slice(initCode, 20) : undefined

    return { factory, factoryData }
  })()

  const maxPriorityFeePerGas = BigInt(Hex.slice(gasFees, 0, 16))
  const maxFeePerGas = BigInt(Hex.slice(gasFees, 16, 32))

  const {
    paymaster,
    paymasterVerificationGasLimit,
    paymasterPostOpGasLimit,
    paymasterData,
  } = (() => {
    if (paymasterAndData === '0x')
      return {
        paymaster: undefined,
        paymasterVerificationGasLimit: undefined,
        paymasterPostOpGasLimit: undefined,
        paymasterData: undefined,
      }

    const paymaster = Hex.slice(paymasterAndData, 0, 20)
    const paymasterVerificationGasLimit = BigInt(
      Hex.slice(paymasterAndData, 20, 36),
    )
    const paymasterPostOpGasLimit = BigInt(Hex.slice(paymasterAndData, 36, 52))
    const paymasterData =
      Hex.size(paymasterAndData) > 52
        ? Hex.slice(paymasterAndData, 52)
        : undefined

    return {
      paymaster,
      paymasterVerificationGasLimit,
      paymasterPostOpGasLimit,
      paymasterData,
    }
  })()

  return {
    callData,
    callGasLimit,
    ...(factory && { factory }),
    ...(factoryData && { factoryData }),
    maxFeePerGas,
    maxPriorityFeePerGas,
    nonce,
    ...(paymaster && { paymaster }),
    ...(paymasterData && { paymasterData }),
    ...(typeof paymasterPostOpGasLimit === 'bigint' && {
      paymasterPostOpGasLimit,
    }),
    ...(typeof paymasterVerificationGasLimit === 'bigint' && {
      paymasterVerificationGasLimit,
    }),
    preVerificationGas,
    sender,
    signature,
    verificationGasLimit,
  }
}

export declare namespace fromPacked {
  export type ErrorType = Hex.slice.ErrorType | Errors.GlobalErrorType
}

/**
 * Converts a {@link ox#UserOperation.UserOperation} to a {@link ox#UserOperation.Rpc}.
 *
 * @example
 * ```ts twoslash
 * import { Value } from 'ox'
 * import { UserOperation } from 'ox/erc4337'
 *
 * const userOperation = UserOperation.toRpc({
 *   callData: '0xdeadbeef',
 *   callGasLimit: 300_000n,
 *   maxFeePerGas: Value.fromGwei('20'),
 *   maxPriorityFeePerGas: Value.fromGwei('2'),
 *   nonce: 69n,
 *   preVerificationGas: 100_000n,
 *   sender: '0x9f1fdab6458c5fc642fa0f4c5af7473c46837357',
 *   verificationGasLimit: 100_000n
 * })
 * ```
 *
 * @param userOperation - The user operation to convert.
 * @returns An RPC-formatted user operation.
 */
export function toRpc<
  entryPointVersion extends EntryPoint.Version = EntryPoint.Version,
>(userOperation: toRpc.Input<entryPointVersion>): Rpc<entryPointVersion> {
  const userOperation_ = userOperation as toRpc.Input
  const rpc = {} as Rpc

  rpc.callData = userOperation_.callData
  rpc.callGasLimit = Quantity.fromNumberish(userOperation_.callGasLimit)
  rpc.maxFeePerGas = Quantity.fromNumberish(userOperation_.maxFeePerGas)
  rpc.maxPriorityFeePerGas = Quantity.fromNumberish(
    userOperation_.maxPriorityFeePerGas,
  )
  rpc.nonce = Quantity.fromNumberish(userOperation_.nonce)
  rpc.preVerificationGas = Quantity.fromNumberish(
    userOperation_.preVerificationGas,
  )
  rpc.sender = userOperation_.sender
  rpc.verificationGasLimit = Quantity.fromNumberish(
    userOperation_.verificationGasLimit,
  )

  if (userOperation_.factory) rpc.factory = userOperation_.factory
  if (userOperation_.factoryData) rpc.factoryData = userOperation_.factoryData
  if (userOperation_.initCode) rpc.initCode = userOperation_.initCode
  if (userOperation_.paymaster) rpc.paymaster = userOperation_.paymaster
  if (userOperation_.paymasterAndData !== undefined)
    rpc.paymasterAndData = userOperation_.paymasterAndData
  if (userOperation_.paymasterData)
    rpc.paymasterData = userOperation_.paymasterData
  if (userOperation_.paymasterPostOpGasLimit !== undefined)
    rpc.paymasterPostOpGasLimit = Quantity.fromNumberish(
      userOperation_.paymasterPostOpGasLimit,
    )
  if (userOperation_.paymasterVerificationGasLimit !== undefined)
    rpc.paymasterVerificationGasLimit = Quantity.fromNumberish(
      userOperation_.paymasterVerificationGasLimit,
    )
  if (userOperation_.paymasterSignature)
    rpc.paymasterSignature = userOperation_.paymasterSignature
  if (userOperation_.signature) rpc.signature = userOperation_.signature

  const authorization = (userOperation_ as UserOperation<'0.8' | '0.9', true>)
    .authorization
  if (authorization)
    (rpc as Rpc<'0.8' | '0.9'>).eip7702Auth = Authorization.toRpc(
      authorization as Authorization.Signed,
    )

  return rpc as Rpc<entryPointVersion>
}

export declare namespace toRpc {
  /** Numberish input accepted by {@link ox#UserOperation.(toRpc:function)}. */
  export type Input<
    entryPointVersion extends EntryPoint.Version = EntryPoint.Version,
  > = UserOperation<
    entryPointVersion,
    boolean,
    Hex.Hex | bigint | number,
    Hex.Hex | number
  >

  export type ErrorType = Hex.fromNumber.ErrorType | Errors.GlobalErrorType
}

/**
 * Converts a signed {@link ox#UserOperation.UserOperation} to a {@link ox#TypedData.Definition}.
 *
 * @example
 * ```ts twoslash
 * import { Value } from 'ox'
 * import { UserOperation } from 'ox/erc4337'
 *
 * const typedData = UserOperation.toTypedData(
 *   {
 *     authorization: {
 *       chainId: 1,
 *       address: '0x9f1fdab6458c5fc642fa0f4c5af7473c46837357',
 *       nonce: 69n,
 *       yParity: 0,
 *       r: '0x0000000000000000000000000000000000000000000000000000000000000001',
 *       s: '0x0000000000000000000000000000000000000000000000000000000000000002'
 *     },
 *     callData: '0xdeadbeef',
 *     callGasLimit: 300_000n,
 *     maxFeePerGas: Value.fromGwei('20'),
 *     maxPriorityFeePerGas: Value.fromGwei('2'),
 *     nonce: 69n,
 *     preVerificationGas: 100_000n,
 *     sender: '0x9f1fdab6458c5fc642fa0f4c5af7473c46837357',
 *     signature: '0x...',
 *     verificationGasLimit: 100_000n
 *   },
 *   {
 *     chainId: 1,
 *     entryPointAddress:
 *       '0x1234567890123456789012345678901234567890'
 *   }
 * )
 * ```
 *
 * @param userOperation - The user operation to convert.
 * @returns A Typed Data definition.
 */
export function toTypedData(
  userOperation: UserOperation<'0.8' | '0.9', true>,
  options: toTypedData.Options,
): TypedData.Definition<typeof toTypedData.types, 'PackedUserOperation'> {
  const { chainId, entryPointAddress } = options

  const packedUserOp = toPacked(userOperation, { forHash: true })

  return {
    domain: {
      name: 'ERC4337',
      version: '1',
      chainId,
      verifyingContract: entryPointAddress,
    },
    message: packedUserOp,
    primaryType: 'PackedUserOperation',
    types: toTypedData.types,
  }
}

export namespace toTypedData {
  export type Options = {
    chainId: number
    entryPointAddress: Address.Address
  }

  export type ErrorType = Errors.GlobalErrorType

  export const types = {
    PackedUserOperation: [
      { type: 'address', name: 'sender' },
      { type: 'uint256', name: 'nonce' },
      { type: 'bytes', name: 'initCode' },
      { type: 'bytes', name: 'callData' },
      { type: 'bytes32', name: 'accountGasLimits' },
      { type: 'uint256', name: 'preVerificationGas' },
      { type: 'bytes32', name: 'gasFees' },
      { type: 'bytes', name: 'paymasterAndData' },
    ],
  } as const
}
