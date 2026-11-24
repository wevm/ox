import type * as Abi from '../core/Abi.js'
import * as AbiParameters from '../core/AbiParameters.js'
import type * as Address from '../core/Address.js'
import * as Errors from '../core/Errors.js'
import * as Hex from '../core/Hex.js'
import type * as Signature from '../core/Signature.js'

/** `address, bytes, bytes`, written out so calls do not parse human-readable ABI. */
const wrappedParameters = [
  { type: 'address' },
  { type: 'bytes' },
  { type: 'bytes' },
] as const

/** Unwrapped ERC-6492 signature. */
export type Unwrapped = {
  /** Calldata to pass to the target address for counterfactual verification. */
  data: Hex.Hex
  /** The original signature. */
  signature: Hex.Hex
  /** The target address to use for counterfactual verification. */
  to: Address.Address
}

/** Wrapped ERC-6492 signature. */
export type Wrapped = Hex.Hex

/**
 * Magic bytes used to identify ERC-6492 wrapped signatures.
 */
export const magicBytes =
  '0x6492649264926492649264926492649264926492649264926492649264926492' as const

/** `magicBytes` without its `0x` prefix. */
const magicDigits =
  '6492649264926492649264926492649264926492649264926492649264926492'

/**
 * Deployless ERC-6492 signature verification bytecode.
 */
export const universalSignatureValidatorBytecode =
  '0x608060405234801561001057600080fd5b506040516106ad3803806106ad83398101604081905261002f91610537565b600061003c848484610048565b9050806000526001601ff35b60007f649264926492649264926492649264926492649264926492649264926492649261007483610425565b036101e7576000606080848060200190518101906100929190610590565b60405192955090935091506000906001600160a01b038516906100b69085906105f6565b6000604051808303816000865af19150503d80600081146100f3576040519150601f19603f3d011682016040523d82523d6000602084013e6100f8565b606091505b50509050876001600160a01b03163b60000361016057806101605760405162461bcd60e51b815260206004820152601e60248201527f5369676e617475726556616c696461746f723a206465706c6f796d656e74000060448201526064015b60405180910390fd5b604051630b135d3f60e11b808252906001600160a01b038a1690631626ba7e90610190908b908790600401610612565b602060405180830381865afa1580156101ad573d6000803e3d6000fd5b505050506040513d601f19601f820116820180604052508101906101d1919061064c565b6001600160e01b0319161494505050505061041e565b6001600160a01b0384163b1561027a57604051630b135d3f60e11b808252906001600160a01b03861690631626ba7e906102279087908790600401610612565b602060405180830381865afa158015610244573d6000803e3d6000fd5b505050506040513d601f19601f82011682018060405250810190610268919061064c565b6001600160e01b03191614905061041e565b81516041146102df5760405162461bcd60e51b815260206004820152603a602482015260008051602061068d83398151915260448201527f3a20696e76616c6964207369676e6174757265206c656e6774680000000000006064820152608401610157565b6102e761043e565b5060208201516040808401518451859392600091859190811061030c5761030c610676565b016020015160f81c9050601b811480159061032b57508060ff16601c14155b1561038c5760405162461bcd60e51b815260206004820152603b602482015260008051602061068d83398151915260448201527f3a20696e76616c6964207369676e617475726520762076616c756500000000006064820152608401610157565b604080516000808252602082018084528a905260ff841692820192909252606081018590526080810184905260019060a0016020604051602081039080840390855afa1580156103e0573d6000803e3d6000fd5b5050604051601f1901519150506001600160a01b038116158015906104165750886001600160a01b0316816001600160a01b0316145b955050505050505b9392505050565b600060208251101561043657600080fd5b508051015190565b60405180606001604052806003906020820280368337509192915050565b6001600160a01b038116811461047157600080fd5b50565b634e487b7160e01b600052604160045260246000fd5b60005b838110156104a557818101518382015260200161048d565b50506000910152565b600082601f8301126104bf57600080fd5b81516001600160401b038111156104d8576104d8610474565b604051601f8201601f19908116603f011681016001600160401b038111828210171561050657610506610474565b60405281815283820160200185101561051e57600080fd5b61052f82602083016020870161048a565b949350505050565b60008060006060848603121561054c57600080fd5b83516105578161045c565b6020850151604086015191945092506001600160401b0381111561057a57600080fd5b610586868287016104ae565b9150509250925092565b6000806000606084860312156105a557600080fd5b83516105b08161045c565b60208501519093506001600160401b038111156105cc57600080fd5b6105d8868287016104ae565b604086015190935090506001600160401b0381111561057a57600080fd5b6000825161060881846020870161048a565b9190910192915050565b828152604060208201526000825180604084015261063781606085016020870161048a565b601f01601f1916919091016060019392505050565b60006020828403121561065e57600080fd5b81516001600160e01b03198116811461041e57600080fd5b634e487b7160e01b600052603260045260246000fdfe5369676e617475726556616c696461746f72237265636f7665725369676e6572'

/**
 * ABI for the ERC-6492 universal deployless signature validator contract.
 *
 * Constructor return value is `0x1` (valid) or `0x0` (invalid).
 */
export const universalSignatureValidatorAbi = [
  {
    inputs: [
      {
        name: '_signer',
        type: 'address',
      },
      {
        name: '_hash',
        type: 'bytes32',
      },
      {
        name: '_signature',
        type: 'bytes',
      },
    ],
    stateMutability: 'nonpayable',
    type: 'constructor',
  },
  {
    inputs: [
      {
        name: '_signer',
        type: 'address',
      },
      {
        name: '_hash',
        type: 'bytes32',
      },
      {
        name: '_signature',
        type: 'bytes',
      },
    ],
    outputs: [
      {
        type: 'bool',
      },
    ],
    stateMutability: 'nonpayable',
    type: 'function',
    name: 'isValidSig',
  },
] as const satisfies Abi.Abi

/**
 * Asserts that the wrapped signature is valid.
 *
 * @example
 * ```ts twoslash
 * import { SignatureErc6492 } from 'ox/erc6492'
 *
 * SignatureErc6492.assert('0xdeadbeef')
 * // @error: InvalidWrappedSignatureError: Value `0xdeadbeef` is an invalid ERC-6492 wrapped signature.
 * ```
 *
 * @param wrapped - The wrapped signature to assert.
 */
export function assert(wrapped: Wrapped) {
  if (Hex.slice(wrapped, -32) !== magicBytes)
    throw new InvalidWrappedSignatureError(wrapped)
}

export declare namespace assert {
  type ErrorType =
    | InvalidWrappedSignatureError
    | Hex.slice.ErrorType
    | Errors.GlobalErrorType
}

/**
 * Parses an [ERC-6492 wrapped signature](https://eips.ethereum.org/EIPS/eip-6492#specification) into its constituent parts.
 *
 * @example
 * ```ts twoslash
 * // @noErrors
 * import { Secp256k1 } from 'ox'
 * import { SignatureErc6492 } from 'ox/erc6492' // [!code focus]
 *
 * const signature = Secp256k1.sign({
 *   payload: '0x...',
 *   privateKey: '0x...',
 * })
 *
 * // Instantiate from serialized format. // [!code focus]
 * const wrapped = SignatureErc6492.from('0x...') // [!code focus]
 * // @log: { data: '0x...', signature: { ... }, to: '0x...', } // [!code focus]
 *
 * // Instantiate from constituent parts. // [!code focus]
 * const wrapped = SignatureErc6492.from({ // [!code focus]
 *   data: '0x...', // [!code focus]
 *   signature, // [!code focus]
 *   to: '0x...', // [!code focus]
 * })
 * // @log: { data: '0x...', signature: { ... }, to: '0x...', }
 * ```
 *
 * @param wrapped - Wrapped signature to parse.
 * @returns Wrapped signature.
 */
export function from(wrapped: Unwrapped | Wrapped): Unwrapped {
  if (typeof wrapped === 'string') return unwrap(wrapped)
  return wrapped
}

export declare namespace from {
  type ReturnType = Unwrapped

  type ErrorType =
    | AbiParameters.decode.ErrorType
    | Signature.fromHex.ErrorType
    | Errors.GlobalErrorType
}

/**
 * Parses an [ERC-6492 wrapped signature](https://eips.ethereum.org/EIPS/eip-6492#specification) into its constituent parts.
 *
 * @example
 * ```ts twoslash
 * import { SignatureErc6492 } from 'ox/erc6492'
 *
 * const { data, signature, to } = SignatureErc6492.unwrap('0x...')
 * ```
 *
 * @param wrapped - Wrapped signature to parse.
 * @returns Wrapped signature.
 */
export function unwrap(wrapped: Wrapped): Unwrapped {
  assert(wrapped)

  const [to, data, signature] = AbiParameters.decode(wrappedParameters, wrapped)

  return { data, signature, to }
}

export declare namespace unwrap {
  type ErrorType =
    | AbiParameters.decode.ErrorType
    | Signature.fromHex.ErrorType
    | Errors.GlobalErrorType
}

/**
 * Serializes an [ERC-6492 wrapped signature](https://eips.ethereum.org/EIPS/eip-6492#specification).
 *
 * @example
 * ```ts twoslash
 * import { Secp256k1, Signature } from 'ox'
 * import { SignatureErc6492 } from 'ox/erc6492' // [!code focus]
 *
 * const signature = Secp256k1.sign({
 *   payload: '0x...',
 *   privateKey: '0x...',
 * })
 *
 * const wrapped = SignatureErc6492.wrap({ // [!code focus]
 *   data: '0xdeadbeef', // [!code focus]
 *   signature: Signature.toHex(signature), // [!code focus]
 *   to: '0x00000000219ab540356cBB839Cbe05303d7705Fa', // [!code focus]
 * }) // [!code focus]
 * ```
 *
 * @param value - Wrapped signature to serialize.
 * @returns Serialized wrapped signature.
 */
export function wrap(value: Unwrapped): Wrapped {
  const { data, signature, to } = value

  return Hex.concat(
    AbiParameters.encode(wrappedParameters, [to, data, signature]),
    magicBytes,
  )
}

export declare namespace wrap {
  type ErrorType =
    | AbiParameters.encode.ErrorType
    | Hex.concat.ErrorType
    | Signature.toHex.ErrorType
    | Errors.GlobalErrorType
}

/**
 * Validates a wrapped signature. Returns `true` if the wrapped signature is valid, `false` otherwise.
 *
 * @example
 * ```ts twoslash
 * import { SignatureErc6492 } from 'ox/erc6492'
 *
 * const valid = SignatureErc6492.validate('0xdeadbeef')
 * // @log: false
 * ```
 *
 * @param wrapped - The wrapped signature to validate.
 * @returns `true` if the wrapped signature is valid, `false` otherwise.
 */
export function validate(wrapped: Wrapped): boolean {
  // `assert`'s check (`Hex.slice(wrapped, -32) === magicBytes`), without
  // loading `Hex.slice` and its errors.
  if (typeof wrapped !== 'string') return false
  const digits = wrapped.startsWith('0x')
    ? wrapped.slice(2)
    : (wrapped as string).replace('0x', '')
  return digits.slice(-64) === magicDigits
}

export declare namespace validate {
  type ErrorType = Errors.GlobalErrorType
}

/** Thrown when the ERC-6492 wrapped signature is invalid. */
export class InvalidWrappedSignatureError extends Errors.BaseError {
  override readonly name = 'SignatureErc6492.InvalidWrappedSignatureError'

  constructor(wrapped: Wrapped) {
    super(`Value \`${wrapped}\` is an invalid ERC-6492 wrapped signature.`)
  }
}
