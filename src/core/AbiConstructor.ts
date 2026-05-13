import * as abitype from 'abitype'
import type * as Abi from './Abi.js'
import * as AbiItem from './AbiItem.js'
import * as AbiParameters from './AbiParameters.js'
import * as Errors from './Errors.js'
import * as Hex from './Hex.js'
import type * as internal from './internal/abiConstructor.js'
import type { IsNarrowable } from './internal/types.js'

/** Root type for an {@link ox#AbiItem.AbiItem} with a `constructor` type. */
export type AbiConstructor = abitype.AbiConstructor

/**
 * ABI-decodes the provided constructor input (`inputs`).
 *
 * @example
 * ```ts twoslash
 * import { AbiConstructor } from 'ox'
 *
 * const constructor = AbiConstructor.fromHumanReadable('constructor(address, uint256)')
 *
 * const bytecode = '0x...'
 *
 * const data = AbiConstructor.encode(constructor, {
 *   bytecode,
 *   args: ['0xd8da6bf26964af9d7eed9e03e53415d37aa96045', 123n],
 * })
 *
 * const decoded = AbiConstructor.decode(constructor, { // [!code focus]
 *   bytecode, // [!code focus]
 *   data, // [!code focus]
 * }) // [!code focus]
 * ```
 *
 * @example
 * ### ABI-shorthand
 *
 * You can also specify an entire ABI object as a parameter to `AbiConstructor.decode`.
 *
 * ```ts twoslash
 * // @noErrors
 * import { Abi, AbiConstructor } from 'ox'
 *
 * const abi = Abi.from([...])
 *
 * const data = AbiConstructor.encode(abi, {
 *   bytecode: '0x...',
 *   args: ['0xd8da6bf26964af9d7eed9e03e53415d37aa96045', 123n],
 * })
 *
 * const decoded = AbiConstructor.decode(abi, { // [!code focus]
 *   bytecode: '0x...', // [!code focus]
 *   data, // [!code focus]
 * }) // [!code focus]
 * ```
 *
 * @param abiConstructor - The ABI Constructor to decode.
 * @param options - Decoding options.
 * @returns The decoded constructor inputs.
 */
export function decode<
  const abi extends Abi.Abi | readonly unknown[],
  abiConstructor extends
    AbiConstructor = fromAbi.ReturnType<abi> extends AbiConstructor
    ? fromAbi.ReturnType<abi>
    : never,
>(
  abi: abi | Abi.Abi | readonly unknown[],
  options: decode.Options,
): decode.ReturnType<abiConstructor>
export function decode<const abiConstructor extends AbiConstructor>(
  abiConstructor: abiConstructor | AbiConstructor,
  options: decode.Options,
): decode.ReturnType<abiConstructor>
// eslint-disable-next-line jsdoc/require-jsdoc
export function decode(
  ...parameters:
    | [abi: Abi.Abi | readonly unknown[], options: decode.Options]
    | [abiConstructor: AbiConstructor, options: decode.Options]
): decode.ReturnType {
  const [abiConstructor, options] = (() => {
    if (Array.isArray(parameters[0])) {
      const [abi, options] = parameters as [
        Abi.Abi | readonly unknown[],
        decode.Options,
      ]
      return [fromAbi(abi), options] as [AbiConstructor, decode.Options]
    }
    return parameters as [AbiConstructor, decode.Options]
  })()

  const { bytecode } = options
  if (abiConstructor.inputs?.length === 0) return undefined
  if (!options.data.startsWith(bytecode))
    throw new BytecodeMismatchError({
      bytecode,
      data: options.data,
    })
  const data = ('0x' + options.data.slice(bytecode.length)) as Hex.Hex
  return AbiParameters.decode(abiConstructor.inputs, data)
}

export declare namespace decode {
  interface Options {
    /** The bytecode of the contract. */
    bytecode: Hex.Hex
    /** The encoded constructor. */
    data: Hex.Hex
  }

  type ReturnType<abiConstructor extends AbiConstructor = AbiConstructor> =
    | (abiConstructor['inputs']['length'] extends 0
        ? undefined
        : abitype.AbiParametersToPrimitiveTypes<abiConstructor['inputs']>)
    | (IsNarrowable<abiConstructor, AbiConstructor> extends true
        ? never
        : undefined)

  type ErrorType = Errors.GlobalErrorType
}

/**
 * ABI-encodes the provided constructor input (`inputs`).
 *
 * @example
 * ```ts twoslash
 * import { AbiConstructor } from 'ox'
 *
 * const constructor = AbiConstructor.fromHumanReadable('constructor(address, uint256)')
 *
 * const data = AbiConstructor.encode(constructor, {
 *   bytecode: '0x...',
 *   args: ['0xd8da6bf26964af9d7eed9e03e53415d37aa96045', 123n],
 * })
 * ```
 *
 * @example
 * ### ABI-shorthand
 *
 * You can also specify an entire ABI object as a parameter to `AbiConstructor.encode`.
 *
 * ```ts twoslash
 * // @noErrors
 * import { Abi, AbiConstructor } from 'ox'
 *
 * const abi = Abi.from([...])
 *
 * const data = AbiConstructor.encode(abi, { // [!code focus]
 *   bytecode: '0x...', // [!code focus]
 *   args: ['0xd8da6bf26964af9d7eed9e03e53415d37aa96045', 123n], // [!code focus]
 * }) // [!code focus]
 * ```
 *
 * @example
 * ### End-to-end
 *
 * Below is an end-to-end example of using `AbiConstructor.encode` to encode the constructor of a contract and deploy it.
 *
 * ```ts twoslash
 * import 'ox/window'
 * import { AbiConstructor, Hex } from 'ox'
 *
 * // 1. Instantiate the ABI Constructor.
 * const constructor = AbiConstructor.fromHumanReadable(
 *   'constructor(address owner, uint256 amount)',
 * )
 *
 * // 2. Encode the ABI Constructor.
 * const data = AbiConstructor.encode(constructor, {
 *   bytecode: '0x...',
 *   args: ['0xd8da6bf26964af9d7eed9e03e53415d37aa96045', 123n],
 * })
 *
 * // 3. Deploy the contract.
 * const hash = await window.ethereum!.request({
 *   method: 'eth_sendTransaction',
 *   params: [{ data }],
 * })
 * ```
 *
 * :::note
 *
 * For simplicity, the above example uses `window.ethereum.request`, but you can use any
 * type of JSON-RPC interface.
 *
 * :::
 *
 * @param abiConstructor - The ABI Constructor to encode.
 * @param options - Encoding options.
 * @returns The encoded constructor.
 */
export function encode<
  const abi extends Abi.Abi | readonly unknown[],
  abiConstructor extends
    AbiConstructor = fromAbi.ReturnType<abi> extends AbiConstructor
    ? fromAbi.ReturnType<abi>
    : never,
>(
  abi: abi | Abi.Abi | readonly unknown[],
  options: encode.Options<abiConstructor>,
): encode.ReturnType
export function encode<const abiConstructor extends AbiConstructor>(
  abiConstructor: abiConstructor | AbiConstructor,
  options: encode.Options<abiConstructor>,
): encode.ReturnType
// eslint-disable-next-line jsdoc/require-jsdoc
export function encode(
  ...parameters:
    | [abi: Abi.Abi | readonly unknown[], options: encode.Options]
    | [abiConstructor: AbiConstructor, options: encode.Options]
): encode.ReturnType {
  const [abiConstructor, options] = (() => {
    if (Array.isArray(parameters[0])) {
      const [abi, options] = parameters as [
        Abi.Abi | readonly unknown[],
        encode.Options,
      ]
      return [fromAbi(abi), options] as [AbiConstructor, encode.Options]
    }

    return parameters as [AbiConstructor, encode.Options]
  })()

  const { bytecode, args } = options
  return Hex.concat(
    bytecode,
    abiConstructor.inputs?.length && args?.length
      ? AbiParameters.encode(abiConstructor.inputs, args as readonly unknown[])
      : '0x',
  )
}

export declare namespace encode {
  type Options<
    abiConstructor extends AbiConstructor = AbiConstructor,
    ///
    args extends abitype.AbiParametersToPrimitiveTypes<
      abiConstructor['inputs']
    > = abitype.AbiParametersToPrimitiveTypes<abiConstructor['inputs']>,
  > = {
    /** The bytecode of the contract. */
    bytecode: Hex.Hex
    /** The constructor arguments to encode. */
    args?: args | undefined
  } & (readonly [] extends args
    ? {}
    : {
        /** The constructor arguments to encode. */
        args: args
      })

  type ReturnType = Hex.Hex

  type ErrorType =
    | Hex.concat.ErrorType
    | AbiParameters.encode.ErrorType
    | Errors.GlobalErrorType
}

/** @internal */
export function format<const abiConstructor extends AbiConstructor>(
  abiConstructor: abiConstructor,
): format.ReturnType<abiConstructor>
/**
 * Formats an {@link ox#AbiConstructor.AbiConstructor} into a **Human Readable ABI Function**.
 *
 * @example
 * ```ts twoslash
 * import { AbiConstructor } from 'ox'
 *
 * const formatted = AbiConstructor.format({
 *   inputs: [
 *     { name: 'owner', type: 'address' },
 *   ],
 *   payable: false,
 *   stateMutability: 'nonpayable',
 *   type: 'constructor',
 * })
 *
 * formatted
 * //    ^?
 *
 *
 * ```
 *
 * @param abiConstructor - The ABI Constructor to format.
 * @returns The formatted ABI Constructor.
 */
export function format(abiConstructor: AbiConstructor): string
/** @internal */
export function format(abiConstructor: AbiConstructor): format.ReturnType {
  return abitype.formatAbiItem(abiConstructor)
}

export declare namespace format {
  type ReturnType<abiConstructor extends AbiConstructor = AbiConstructor> =
    abitype.FormatAbiItem<abiConstructor>

  type ErrorType = Errors.GlobalErrorType
}

/**
 * Parses a **Human Readable ABI Constructor** signature (or array of signatures with optional structs) into a typed {@link ox#AbiConstructor.AbiConstructor}.
 *
 * @example
 * ```ts twoslash
 * import { AbiConstructor } from 'ox'
 *
 * const constructor = AbiConstructor.fromHumanReadable(
 *   'constructor(address owner)'
 * )
 *
 * constructor
 * //^?
 *
 *
 *
 * ```
 *
 * @example
 * It is possible to specify `struct`s along with your definitions by passing an array:
 *
 * ```ts twoslash
 * import { AbiConstructor } from 'ox'
 *
 * const constructor = AbiConstructor.fromHumanReadable([
 *   'struct Foo { address owner; uint256 amount; }',
 *   'constructor(Foo foo)',
 * ])
 *
 * constructor
 * //^?
 *
 *
 *
 * ```
 *
 * @param signature - The human-readable signature (or array of signatures with optional structs) to parse.
 * @param options - Parsing options.
 * @returns Typed ABI Constructor.
 */
export function fromHumanReadable<
  const signature extends string | readonly string[],
>(
  signature: signature &
    (
      | (signature extends string ? internal.Signature<signature> : never)
      | (signature extends readonly string[]
          ? internal.Signatures<signature>
          : never)
    ),
  options?: AbiItem.fromHumanReadable.Options,
): fromHumanReadable.ReturnType<signature> {
  return AbiItem.fromHumanReadable(signature as never, options) as never
}

export declare namespace fromHumanReadable {
  type ReturnType<signature extends string | readonly string[]> =
    AbiItem.fromHumanReadable.ReturnType<signature>

  type ErrorType = AbiItem.fromHumanReadable.ErrorType | Errors.GlobalErrorType
}

/**
 * Parses a **JSON ABI Constructor** into a typed {@link ox#AbiConstructor.AbiConstructor}.
 *
 * @example
 * ```ts twoslash
 * import { AbiConstructor } from 'ox'
 *
 * const constructor = AbiConstructor.fromJson({
 *   inputs: [
 *     { name: 'owner', type: 'address' },
 *   ],
 *   payable: false,
 *   stateMutability: 'nonpayable',
 *   type: 'constructor',
 * })
 *
 * constructor
 * //^?
 *
 *
 *
 * ```
 *
 * @param abiConstructor - The JSON ABI Constructor to parse.
 * @param options - Parsing options.
 * @returns Typed ABI Constructor.
 */
export function fromJson<const abiConstructor extends AbiConstructor>(
  abiConstructor: abiConstructor | AbiConstructor,
  options?: AbiItem.fromJson.Options,
): fromJson.ReturnType<abiConstructor> {
  return AbiItem.fromJson(abiConstructor as never, options) as never
}

export declare namespace fromJson {
  type ReturnType<abiConstructor extends AbiConstructor> =
    AbiItem.fromJson.ReturnType<abiConstructor>

  type ErrorType = AbiItem.fromJson.ErrorType | Errors.GlobalErrorType
}

/**
 * Internal dispatcher used by `decode` / `encode` shorthand overloads.
 * Picks {@link AbiConstructor.fromHumanReadable} or {@link AbiConstructor.fromJson}
 * based on the input shape.
 *
 * @internal
 */
export function from<
  const abiConstructor extends AbiConstructor | string | readonly string[],
>(
  abiConstructor: (
    | abiConstructor
    | AbiConstructor
    | string
    | readonly string[]
  ) &
    (
      | (abiConstructor extends string
          ? internal.Signature<abiConstructor>
          : never)
      | (abiConstructor extends readonly string[]
          ? internal.Signatures<abiConstructor>
          : never)
      | AbiConstructor
    ),
  options?: AbiItem.from.Options,
): from.ReturnType<abiConstructor> {
  return AbiItem.from(abiConstructor as never, options) as never
}

export declare namespace from {
  /** @internal */
  type ReturnType<
    abiConstructor extends
      | AbiConstructor
      | string
      | readonly string[] = AbiConstructor,
  > = AbiItem.from.ReturnType<abiConstructor>

  /** @internal */
  type ErrorType = AbiItem.from.ErrorType | Errors.GlobalErrorType
}

/** @internal */
export function fromAbi<const abi extends Abi.Abi | readonly unknown[]>(
  abi: abi | Abi.Abi | readonly unknown[],
): fromAbi.ReturnType<abi>
/**
 * Extracts an {@link ox#AbiConstructor.AbiConstructor} from an {@link ox#Abi.Abi} given a name and optional arguments.
 *
 * @example
 * ### Extracting by Name
 *
 * ABI Events can be extracted by their name using the `name` option:
 *
 * ```ts twoslash
 * import { Abi, AbiConstructor } from 'ox'
 *
 * const abi = Abi.from([
 *   'constructor(address owner)',
 *   'function foo()',
 *   'event Transfer(address owner, address to, uint256 tokenId)',
 *   'function bar(string a) returns (uint256 x)',
 * ])
 *
 * const item = AbiConstructor.fromAbi(abi) // [!code focus]
 * //    ^?
 *
 *
 *
 *
 *
 *
 * ```
 *
 * @returns The ABI constructor.
 */
export function fromAbi(abi: Abi.Abi | readonly unknown[]): AbiConstructor
/** @internal */
export function fromAbi(abi: Abi.Abi | readonly unknown[]): fromAbi.ReturnType {
  const item = (abi as Abi.Abi).find((item) => item.type === 'constructor')
  if (!item) throw new AbiItem.NotFoundError({ name: 'constructor' })
  return item
}

export declare namespace fromAbi {
  type ReturnType<abi extends Abi.Abi | readonly unknown[] = Abi.Abi> = Extract<
    abi[number],
    { type: 'constructor' }
  >

  type ErrorType = AbiItem.NotFoundError | Errors.GlobalErrorType
}

/**
 * Throws when the provided `data` does not begin with the provided `bytecode`.
 *
 * @example
 * ```ts twoslash
 * import { AbiConstructor } from 'ox'
 *
 * AbiConstructor.decode(
 *   AbiConstructor.fromHumanReadable('constructor(address)'),
 *   { bytecode: '0x6080...', data: '0xdeadbeef' },
 * )
 * // @error: AbiConstructor.BytecodeMismatchError: Provided `data` does not start with the provided `bytecode`.
 * ```
 */
export class BytecodeMismatchError extends Errors.BaseError {
  override readonly name = 'AbiConstructor.BytecodeMismatchError'
  constructor({ bytecode, data }: { bytecode: Hex.Hex; data: Hex.Hex }) {
    super('Provided `data` does not start with the provided `bytecode`.', {
      metaMessages: [
        `Bytecode: ${bytecode.slice(0, 18)}${bytecode.length > 18 ? '...' : ''}`,
        `Data:     ${data.slice(0, 18)}${data.length > 18 ? '...' : ''}`,
      ],
    })
  }
}
