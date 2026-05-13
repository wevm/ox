import * as abitype from 'abitype'
import type * as Abi from './Abi.js'
import * as Errors from './Errors.js'
import * as Hash from './Hash.js'
import * as Hex from './Hex.js'
import * as internal from './internal/abiItem.js'
import type { UnionCompute } from './internal/types.js'

/** Root type for an item on an {@link ox#Abi.Abi}. */
export type AbiItem = Abi.Abi[number]

/**
 * Extracts an {@link ox#AbiItem.AbiItem} item from an {@link ox#Abi.Abi}, given a name.
 *
 * @example
 * ```ts twoslash
 * import { Abi, AbiItem } from 'ox'
 *
 * const abi = Abi.from([
 *   'error Foo(string)',
 *   'function foo(string)',
 *   'event Bar(uint256)',
 * ])
 *
 * type Foo = AbiItem.FromAbi<typeof abi, 'Foo'>
 * //   ^?
 *
 *
 *
 *
 *
 *
 *
 *
 * ```
 */
export type FromAbi<
  abi extends Abi.Abi,
  name extends ExtractNames<abi>,
> = Extract<abi[number], { name: name }>

/**
 * Extracts the names of all {@link ox#AbiItem.AbiItem} items in an {@link ox#Abi.Abi}.
 *
 * @example
 * ```ts twoslash
 * import { Abi, AbiItem } from 'ox'
 *
 * const abi = Abi.from([
 *   'error Foo(string)',
 *   'function foo(string)',
 *   'event Bar(uint256)',
 * ])
 *
 * type names = AbiItem.Name<typeof abi>
 * //   ^?
 *
 * ```
 */
export type Name<abi extends Abi.Abi | readonly unknown[] = Abi.Abi> =
  abi extends Abi.Abi ? ExtractNames<abi> : string

export type ExtractNames<abi extends Abi.Abi> = Extract<
  abi[number],
  { name: string }
>['name']

/**
 * Formats an {@link ox#AbiItem.AbiItem} into a **Human Readable ABI Item**.
 *
 * @example
 * ```ts twoslash
 * import { AbiItem } from 'ox'
 *
 * const formatted = AbiItem.format({
 *   type: 'function',
 *   name: 'approve',
 *   stateMutability: 'nonpayable',
 *   inputs: [
 *     {
 *       name: 'spender',
 *       type: 'address',
 *     },
 *     {
 *       name: 'amount',
 *       type: 'uint256',
 *     },
 *   ],
 *   outputs: [{ type: 'bool' }],
 * })
 *
 * formatted
 * //    ^?
 *
 *
 * ```
 *
 * @param abiItem - The ABI Item to format.
 * @returns The formatted ABI Item  .
 */
export function format<const abiItem extends AbiItem>(
  abiItem: abiItem | AbiItem,
): abitype.FormatAbiItem<abiItem> {
  return abitype.formatAbiItem(abiItem) as never
}

export declare namespace format {
  type ErrorType = Errors.GlobalErrorType
}

/**
 * Parses a **Human Readable ABI Item** signature (or array of signatures with optional structs) into a typed {@link ox#AbiItem.AbiItem}.
 *
 * @example
 * ```ts twoslash
 * import { AbiItem } from 'ox'
 *
 * const abiItem = AbiItem.fromHumanReadable(
 *   'function approve(address spender, uint256 amount) returns (bool)'
 * )
 *
 * abiItem
 * //^?
 *
 *
 *
 * ```
 *
 * @example
 * It is possible to specify `struct`s along with your definitions by passing an array of signatures:
 *
 * ```ts twoslash
 * import { AbiItem } from 'ox'
 *
 * const abiItem = AbiItem.fromHumanReadable([
 *   'struct Foo { address spender; uint256 amount; }',
 *   'function approve(Foo foo) returns (bool)',
 * ])
 *
 * abiItem
 * //^?
 *
 *
 *
 * ```
 *
 * @param signature - The human-readable signature (or array of signatures with optional structs) to parse.
 * @param options - Parsing options.
 * @returns The typed ABI Item.
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
  options?: fromHumanReadable.Options,
): fromHumanReadable.ReturnType<signature> {
  const { prepare = true } = options ?? {}
  const item = abitype.parseAbiItem(signature as never) as AbiItem
  return {
    ...item,
    ...(prepare ? { hash: getSignatureHash(item) } : {}),
  } as never
}

/**
 * Internal dispatcher used by shorthand entry points that accept either a
 * human-readable signature, an array of signatures, or a JSON ABI item.
 * Picks `fromHumanReadable` or `fromJson` based on the input shape.
 *
 * @internal
 */
export function from<
  const abiItem extends AbiItem | string | readonly string[],
>(
  abiItem: (abiItem | AbiItem | string | readonly string[]) &
    (
      | (abiItem extends string ? internal.Signature<abiItem> : never)
      | (abiItem extends readonly string[]
          ? internal.Signatures<abiItem>
          : never)
      | AbiItem
    ),
  options?: fromHumanReadable.Options,
): from.ReturnType<abiItem> {
  if (Array.isArray(abiItem))
    return fromHumanReadable(abiItem as never, options) as never
  if (typeof abiItem === 'string')
    return fromHumanReadable(abiItem as never, options) as never
  return fromJson(abiItem as never, options) as never
}

export declare namespace from {
  /** @internal */
  type Options = fromHumanReadable.Options

  /** @internal */
  type ReturnType<abiItem extends AbiItem | string | readonly string[]> =
    abiItem extends string
      ? abitype.ParseAbiItem<abiItem>
      : abiItem extends readonly string[]
        ? abitype.ParseAbiItem<abiItem>
        : abiItem

  /** @internal */
  type ErrorType = Errors.GlobalErrorType
}

export declare namespace fromHumanReadable {
  type Options = {
    /**
     * Whether or not to prepare the extracted item (optimization for encoding performance).
     * When `true`, the `hash` property is computed and included in the returned value.
     *
     * @default true
     */
    prepare?: boolean | undefined
  }

  type ReturnType<signature extends string | readonly string[]> =
    signature extends string
      ? abitype.ParseAbiItem<signature>
      : signature extends readonly string[]
        ? abitype.ParseAbiItem<signature>
        : never

  type ErrorType = Errors.GlobalErrorType
}

/**
 * Parses a **JSON ABI Item** into a typed {@link ox#AbiItem.AbiItem}.
 *
 * @example
 * ```ts twoslash
 * import { AbiItem } from 'ox'
 *
 * const abiItem = AbiItem.fromJson({
 *   type: 'function',
 *   name: 'approve',
 *   stateMutability: 'nonpayable',
 *   inputs: [
 *     {
 *       name: 'spender',
 *       type: 'address',
 *     },
 *     {
 *       name: 'amount',
 *       type: 'uint256',
 *     },
 *   ],
 *   outputs: [{ type: 'bool' }],
 * })
 *
 * abiItem
 * //^?
 *
 *
 *
 * ```
 *
 * @param abiItem - The JSON ABI Item to parse.
 * @param options - Parsing options.
 * @returns The typed ABI Item.
 */
export function fromJson<const abiItem extends AbiItem>(
  abiItem: abiItem | AbiItem,
  options?: fromJson.Options,
): fromJson.ReturnType<abiItem> {
  const { prepare = true } = options ?? {}
  return {
    ...(abiItem as AbiItem),
    ...(prepare ? { hash: getSignatureHash(abiItem as AbiItem) } : {}),
  } as never
}

export declare namespace fromJson {
  type Options = {
    /**
     * Whether or not to prepare the extracted item (optimization for encoding performance).
     * When `true`, the `hash` property is computed and included in the returned value.
     *
     * @default true
     */
    prepare?: boolean | undefined
  }

  type ReturnType<abiItem extends AbiItem> = abiItem

  type ErrorType = Errors.GlobalErrorType
}

/**
 * Internal dispatcher used by shorthand `decode`/`encode` overloads on `AbiFunction`,
 * `AbiEvent`, and `AbiError` that accept `(abi, name | selector)`. Picks `fromAbiName`
 * or `fromAbiSelector` based on whether `name` parses as a hex selector.
 *
 * @internal
 */
export function fromAbi<
  const abi extends Abi.Abi | readonly unknown[],
  name extends Name<abi>,
  const args extends internal.ExtractArgs<abi, name> | undefined = undefined,
  //
  allNames = Name<abi>,
>(
  abi: abi | Abi.Abi | readonly unknown[],
  name: Hex.Hex | (name extends allNames ? name : never),
  options?: fromAbi.Options<abi, name, args>,
): fromAbi.ReturnType<abi, name, args> {
  if (Hex.validate(name as string, { strict: false }))
    return fromAbiSelector(abi, name as Hex.Hex, options as never) as never
  return fromAbiName(abi, name as never, options as never) as never
}

export declare namespace fromAbi {
  /** @internal */
  type Options<
    abi extends Abi.Abi | readonly unknown[] = Abi.Abi,
    name extends Name<abi> = Name<abi>,
    args extends
      | internal.ExtractArgs<abi, name>
      | undefined = internal.ExtractArgs<abi, name>,
    ///
    allArgs = internal.ExtractArgs<abi, name>,
  > = fromAbiName.Options<abi, name, args, allArgs>

  /** @internal */
  type ReturnType<
    abi extends Abi.Abi | readonly unknown[] = Abi.Abi,
    name extends Name<abi> = Name<abi>,
    args extends
      | internal.ExtractArgs<abi, name>
      | undefined = internal.ExtractArgs<abi, name>,
    fallback = AbiItem,
  > = fromAbiName.ReturnType<abi, name, args, fallback>

  /** @internal */
  type ErrorType = Errors.GlobalErrorType
}

/**
 * Extracts an {@link ox#AbiItem.AbiItem} from an {@link ox#Abi.Abi} given a name and optional arguments.
 *
 * @example
 * ```ts twoslash
 * import { Abi, AbiItem } from 'ox'
 *
 * const abi = Abi.from([
 *   'function foo()',
 *   'event Transfer(address owner, address to, uint256 tokenId)',
 *   'function bar(string a) returns (uint256 x)',
 * ])
 *
 * const item = AbiItem.fromAbiName(abi, 'Transfer')
 * //    ^?
 *
 *
 *
 *
 *
 *
 * ```
 *
 * @param abi - The ABI to extract from.
 * @param name - The name of the ABI item to extract.
 * @param options - Extraction options.
 * @returns The ABI item.
 */
export function fromAbiName<
  const abi extends Abi.Abi | readonly unknown[],
  name extends Name<abi>,
  const args extends internal.ExtractArgs<abi, name> | undefined = undefined,
  //
  allNames = Name<abi>,
>(
  abi: abi | Abi.Abi | readonly unknown[],
  name: name extends allNames ? name : never,
  options?: fromAbiName.Options<abi, name, args>,
): fromAbiName.ReturnType<abi, name, args> {
  const { args = [], prepare = true } = (options ??
    {}) as unknown as fromAbiName.Options

  const abiItems = (abi as Abi.Abi).filter(
    (abiItem) => 'name' in abiItem && abiItem.name === name,
  )

  if (abiItems.length === 0) throw new NotFoundError({ name: name as string })
  if (abiItems.length === 1)
    return {
      ...abiItems[0],
      ...(prepare ? { hash: getSignatureHash(abiItems[0]!) } : {}),
    } as never

  let matchedAbiItem: AbiItem | undefined
  for (const abiItem of abiItems) {
    if (!('inputs' in abiItem)) continue
    if (!args || args.length === 0) {
      if (!abiItem.inputs || abiItem.inputs.length === 0)
        return {
          ...abiItem,
          ...(prepare ? { hash: getSignatureHash(abiItem) } : {}),
        } as never
      continue
    }
    if (!abiItem.inputs) continue
    if (abiItem.inputs.length === 0) continue
    if (abiItem.inputs.length !== args.length) continue
    const matched = args.every((arg, index) => {
      const abiParameter = 'inputs' in abiItem && abiItem.inputs![index]
      if (!abiParameter) return false
      return internal.isArgOfType(arg, abiParameter)
    })
    if (matched) {
      if (
        matchedAbiItem &&
        'inputs' in matchedAbiItem &&
        matchedAbiItem.inputs
      ) {
        const ambiguousTypes = internal.getAmbiguousTypes(
          abiItem.inputs,
          matchedAbiItem.inputs,
          args as readonly unknown[],
        )
        if (ambiguousTypes)
          throw new AmbiguityError(
            {
              abiItem,
              type: ambiguousTypes[0]!,
            },
            {
              abiItem: matchedAbiItem,
              type: ambiguousTypes[1]!,
            },
          )
      }

      matchedAbiItem = abiItem
    }
  }

  const abiItem = (() => {
    if (matchedAbiItem) return matchedAbiItem
    const [abiItem, ...overloads] = abiItems
    return { ...abiItem!, overloads }
  })()

  if (!abiItem) throw new NotFoundError({ name: name as string })
  return {
    ...abiItem,
    ...(prepare ? { hash: getSignatureHash(abiItem) } : {}),
  } as never
}

export declare namespace fromAbiName {
  type Options<
    abi extends Abi.Abi | readonly unknown[] = Abi.Abi,
    name extends Name<abi> = Name<abi>,
    args extends
      | internal.ExtractArgs<abi, name>
      | undefined = internal.ExtractArgs<abi, name>,
    ///
    allArgs = internal.ExtractArgs<abi, name>,
  > = {
    /**
     * Whether or not to prepare the extracted item (optimization for encoding performance).
     * When `true`, the `hash` property is computed and included in the returned value.
     *
     * @default true
     */
    prepare?: boolean | undefined
  } & UnionCompute<
    readonly [] extends allArgs
      ? {
          args?:
            | allArgs
            | (abi extends Abi.Abi
                ? args extends allArgs
                  ? internal.Widen<args>
                  : never
                : never)
            | undefined
        }
      : {
          args?:
            | allArgs
            | (internal.Widen<args> & (args extends allArgs ? unknown : never))
            | undefined
        }
  >

  type ReturnType<
    abi extends Abi.Abi | readonly unknown[] = Abi.Abi,
    name extends Name<abi> = Name<abi>,
    args extends
      | internal.ExtractArgs<abi, name>
      | undefined = internal.ExtractArgs<abi, name>,
    fallback = AbiItem,
  > = abi extends Abi.Abi
    ? Abi.Abi extends abi
      ? fallback
      : internal.ExtractForArgs<
          abi,
          name,
          args extends internal.ExtractArgs<abi, name>
            ? args
            : internal.ExtractArgs<abi, name>
        >
    : fallback

  type ErrorType = Errors.GlobalErrorType
}

/**
 * Extracts an {@link ox#AbiItem.AbiItem} from an {@link ox#Abi.Abi} by 4-byte selector (or event topic hash).
 *
 * @example
 * ```ts twoslash
 * import { Abi, AbiItem } from 'ox'
 *
 * const abi = Abi.from([
 *   'function foo()',
 *   'event Transfer(address owner, address to, uint256 tokenId)',
 *   'function bar(string a) returns (uint256 x)',
 * ])
 * const item = AbiItem.fromAbiSelector(abi, '0x095ea7b3')
 * //    ^?
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 * ```
 *
 * @remarks Selectors for functions/errors are the first 4 bytes; event topic hashes are 32 bytes.
 * Either may be passed directly (or as full calldata for functions/errors — the first 4 bytes are sliced).
 *
 * @param abi - The ABI to extract from.
 * @param selector - The 4-byte selector (or event topic hash, or full calldata) to look up.
 * @param options - Extraction options.
 * @returns The ABI item.
 */
export function fromAbiSelector<const abi extends Abi.Abi | readonly unknown[]>(
  abi: abi | Abi.Abi | readonly unknown[],
  selector: Hex.Hex,
  options?: fromAbiSelector.Options,
): fromAbiSelector.ReturnType<abi> {
  const { prepare = true } = options ?? {}
  const selector_ = Hex.slice(selector, 0, 4)
  const abiItem = (abi as Abi.Abi).find((abiItem) => {
    if (abiItem.type === 'function' || abiItem.type === 'error')
      return getSelector(abiItem) === selector_
    if (abiItem.type === 'event') return getSignatureHash(abiItem) === selector
    return false
  })
  if (!abiItem) throw new NotFoundError({ name: selector })
  return {
    ...abiItem,
    ...(prepare ? { hash: getSignatureHash(abiItem) } : {}),
  } as never
}

export declare namespace fromAbiSelector {
  type Options = {
    /**
     * Whether or not to prepare the extracted item (optimization for encoding performance).
     * When `true`, the `hash` property is computed and included in the returned value.
     *
     * @default true
     */
    prepare?: boolean | undefined
  }

  type ReturnType<abi extends Abi.Abi | readonly unknown[] = Abi.Abi> =
    abi extends Abi.Abi
      ? Abi.Abi extends abi
        ? AbiItem
        : abi[number]
      : AbiItem

  type ErrorType = Errors.GlobalErrorType
}

/**
 * Computes the [4-byte selector](https://solidity-by-example.org/function-selector/) for an {@link ox#AbiItem.AbiItem}.
 *
 * Useful for computing function selectors for calldata.
 *
 * @example
 * ```ts twoslash
 * import { AbiItem } from 'ox'
 *
 * const selector = AbiItem.getSelector('function ownerOf(uint256 tokenId)')
 * // @log: '0x6352211e'
 * ```
 *
 * @example
 * ```ts twoslash
 * // @noErrors
 * import { Abi, AbiItem } from 'ox'
 *
 * const erc20Abi = Abi.from([...])
 *
 * const selector = AbiItem.getSelector(erc20Abi, 'ownerOf')
 * // @log: '0x6352211e'
 * ```
 *
 * @example
 * ```ts twoslash
 * import { AbiItem } from 'ox'
 *
 * const selector = AbiItem.getSelector({
 *   inputs: [{ type: 'uint256' }],
 *   name: 'ownerOf',
 *   outputs: [],
 *   stateMutability: 'view',
 *   type: 'function'
 * })
 * // @log: '0x6352211e'
 * ```
 *
 * @param abiItem - The ABI item to compute the selector for. Can be a signature or an ABI item for an error, event, function, etc.
 * @returns The first 4 bytes of the {@link ox#Hash.(keccak256:function)} hash of the function signature.
 */
export function getSelector<
  abi extends Abi.Abi | readonly unknown[],
  name extends Name<abi>,
>(abi: abi | Abi.Abi | readonly unknown[], name: name): Hex.Hex
export function getSelector(abiItem: string | AbiItem): Hex.Hex
// eslint-disable-next-line jsdoc/require-jsdoc
export function getSelector(
  ...parameters:
    | [abi: Abi.Abi | readonly unknown[], name: string]
    | [string | AbiItem]
): Hex.Hex {
  const abiItem = (() => {
    if (Array.isArray(parameters[0])) {
      const [abi, name] = parameters as [Abi.Abi | readonly unknown[], string]
      return fromAbiName(abi, name as never)
    }
    return parameters[0] as string | AbiItem
  })()
  return Hex.slice(getSignatureHash(abiItem), 0, 4)
}

export declare namespace getSelector {
  type ErrorType =
    | getSignatureHash.ErrorType
    | Hex.slice.ErrorType
    | Errors.GlobalErrorType
}

/**
 * Computes the stringified signature for a given {@link ox#AbiItem.AbiItem}.
 *
 * @example
 * ```ts twoslash
 * import { AbiItem } from 'ox'
 *
 * const signature = AbiItem.getSignature('function ownerOf(uint256 tokenId)')
 * // @log: 'ownerOf(uint256)'
 * ```
 *
 * @example
 * ```ts twoslash
 * // @noErrors
 * import { Abi, AbiItem } from 'ox'
 *
 * const erc20Abi = Abi.from([...])
 *
 * const signature = AbiItem.getSignature(erc20Abi, 'ownerOf')
 * // @log: 'ownerOf(uint256)'
 * ```
 *
 * @example
 * ```ts twoslash
 * import { AbiItem } from 'ox'
 *
 * const signature = AbiItem.getSignature({
 *   name: 'ownerOf',
 *   type: 'function',
 *   inputs: [{ name: 'tokenId', type: 'uint256' }],
 *   outputs: [],
 *   stateMutability: 'view',
 * })
 * // @log: 'ownerOf(uint256)'
 * ```
 *
 * @param abiItem - The ABI Item to compute the signature for.
 * @returns The stringified signature of the ABI Item.
 */
export function getSignature<
  abi extends Abi.Abi | readonly unknown[],
  name extends Name<abi>,
>(abi: abi | Abi.Abi | readonly unknown[], name: name): string
export function getSignature(abiItem: string | AbiItem): string
// eslint-disable-next-line jsdoc/require-jsdoc
export function getSignature(
  ...parameters:
    | [abi: Abi.Abi | readonly unknown[], name: string]
    | [string | AbiItem]
): string {
  const abiItem = (() => {
    if (Array.isArray(parameters[0])) {
      const [abi, name] = parameters as [Abi.Abi | readonly unknown[], string]
      return fromAbiName(abi, name as never)
    }
    return parameters[0] as string | AbiItem
  })()
  const signature = (() => {
    if (typeof abiItem === 'string') return abiItem
    return abitype.formatAbiItem(abiItem)
  })()
  return internal.normalizeSignature(signature)
}

export declare namespace getSignature {
  type ErrorType =
    | internal.normalizeSignature.ErrorType
    | Errors.GlobalErrorType
}

/**
 * Computes the signature hash for an {@link ox#AbiItem.AbiItem}.
 *
 * Useful for computing Event Topic values.
 *
 * @example
 * ```ts twoslash
 * import { AbiItem } from 'ox'
 *
 * const hash = AbiItem.getSignatureHash('event Transfer(address indexed from, address indexed to, uint256 amount)')
 * // @log: '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef'
 * ```
 *
 * @example
 * ```ts twoslash
 * // @noErrors
 * import { Abi, AbiItem } from 'ox'
 *
 * const erc20Abi = Abi.from([...])
 *
 * const hash = AbiItem.getSignatureHash(erc20Abi, 'Transfer')
 * // @log: '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef'
 * ```
 *
 * @example
 * ```ts twoslash
 * import { AbiItem } from 'ox'
 *
 * const hash = AbiItem.getSignatureHash({
 *   name: 'Transfer',
 *   type: 'event',
 *   inputs: [
 *     { name: 'from', type: 'address', indexed: true },
 *     { name: 'to', type: 'address', indexed: true },
 *     { name: 'amount', type: 'uint256', indexed: false },
 *   ],
 * })
 * // @log: '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef'
 * ```
 *
 * @param abiItem - The ABI Item to compute the signature hash for.
 * @returns The {@link ox#Hash.(keccak256:function)} hash of the ABI item's signature.
 */
export function getSignatureHash<
  abi extends Abi.Abi | readonly unknown[],
  name extends Name<abi>,
>(abi: abi | Abi.Abi | readonly unknown[], name: name): Hex.Hex
export function getSignatureHash(abiItem: string | AbiItem): Hex.Hex
// eslint-disable-next-line jsdoc/require-jsdoc
export function getSignatureHash(
  ...parameters:
    | [abi: Abi.Abi | readonly unknown[], name: string]
    | [string | AbiItem]
): Hex.Hex {
  const abiItem = (() => {
    if (Array.isArray(parameters[0])) {
      const [abi, name] = parameters as [Abi.Abi | readonly unknown[], string]
      return fromAbiName(abi, name as never)
    }
    return parameters[0] as string | AbiItem
  })()
  if (typeof abiItem !== 'string' && 'hash' in abiItem && abiItem.hash)
    return abiItem.hash as Hex.Hex
  return Hash.keccak256(Hex.fromString(getSignature(abiItem)))
}

export declare namespace getSignatureHash {
  type ErrorType =
    | getSignature.ErrorType
    | Hash.keccak256.ErrorType
    | Hex.fromString.ErrorType
    | Errors.GlobalErrorType
}

/**
 * Throws when ambiguous types are found on overloaded ABI items.
 *
 * @example
 * ```ts twoslash
 * import { Abi, AbiFunction } from 'ox'
 *
 * const foo = Abi.from(['function foo(address)', 'function foo(bytes20)'])
 * AbiFunction.fromAbiName(foo, 'foo', {
 *   args: ['0xA0Cf798816D4b9b9866b5330EEa46a18382f251e'],
 * })
 * // @error: AbiItem.AmbiguityError: Found ambiguous types in overloaded ABI Items.
 * // @error: `bytes20` in `foo(bytes20)`, and
 * // @error: `address` in `foo(address)`
 * // @error: These types encode differently and cannot be distinguished at runtime.
 * // @error: Remove one of the ambiguous items in the ABI.
 * ```
 *
 * ### Solution
 *
 * Remove one of the ambiguous types from the ABI.
 *
 * ```ts twoslash
 * import { Abi, AbiFunction } from 'ox'
 *
 * const foo = Abi.from([
 *   'function foo(address)',
 *   'function foo(bytes20)' // [!code --]
 * ])
 * AbiFunction.fromAbiName(foo, 'foo', {
 *   args: ['0xA0Cf798816D4b9b9866b5330EEa46a18382f251e'],
 * })
 * // @error: AbiItem.AmbiguityError: Found ambiguous types in overloaded ABI Items.
 * // @error: `bytes20` in `foo(bytes20)`, and
 * // @error: `address` in `foo(address)`
 * // @error: These types encode differently and cannot be distinguished at runtime.
 * // @error: Remove one of the ambiguous items in the ABI.
 * ```
 */
export class AmbiguityError extends Errors.BaseError {
  override readonly name = 'AbiItem.AmbiguityError'
  constructor(
    x: { abiItem: Abi.Abi[number]; type: string },
    y: { abiItem: Abi.Abi[number]; type: string },
  ) {
    super('Found ambiguous types in overloaded ABI Items.', {
      metaMessages: [
        // TODO: abitype to add support for signature-formatted ABI items.
        `\`${x.type}\` in \`${internal.normalizeSignature(abitype.formatAbiItem(x.abiItem))}\`, and`,
        `\`${y.type}\` in \`${internal.normalizeSignature(abitype.formatAbiItem(y.abiItem))}\``,
        '',
        'These types encode differently and cannot be distinguished at runtime.',
        'Remove one of the ambiguous items in the ABI.',
      ],
    })
  }
}

/**
 * Throws when an ABI item is not found in the ABI.
 *
 * @example
 * ```ts twoslash
 * // @noErrors
 * import { Abi, AbiFunction } from 'ox'
 *
 * const foo = Abi.from([
 *   'function foo(address)',
 *   'function bar(uint)'
 * ])
 * AbiFunction.fromAbiName(foo, 'baz')
 * // @error: AbiItem.NotFoundError: ABI function with name "baz" not found.
 * ```
 *
 * ### Solution
 *
 * Ensure the ABI item exists on the ABI.
 *
 * ```ts twoslash
 * // @noErrors
 * import { Abi, AbiFunction } from 'ox'
 *
 * const foo = Abi.from([
 *   'function foo(address)',
 *   'function bar(uint)',
 *   'function baz(bool)' // [!code ++]
 * ])
 * AbiFunction.fromAbiName(foo, 'baz')
 * ```
 */
export class NotFoundError extends Errors.BaseError {
  override readonly name = 'AbiItem.NotFoundError'
  constructor({
    name,
    data,
    type = 'item',
  }: {
    name?: string | undefined
    data?: Hex.Hex | undefined
    type?: string | undefined
  }) {
    const selector = (() => {
      if (name) return ` with name "${name}"`
      if (data) return ` with data "${data}"`
      return ''
    })()
    super(`ABI ${type}${selector} not found.`)
  }
}

/**
 * Throws when the selector size is invalid.
 *
 * @example
 * ```ts twoslash
 * import { Abi, AbiFunction } from 'ox'
 *
 * const foo = Abi.from([
 *   'function foo(address)',
 *   'function bar(uint)'
 * ])
 * AbiFunction.fromAbiSelector(foo, '0xaaa')
 * // @error: AbiItem.InvalidSelectorSizeError: Selector size is invalid. Expected 4 bytes. Received 2 bytes ("0xaaa").
 * ```
 *
 * ### Solution
 *
 * Ensure the selector size is 4 bytes.
 *
 * ```ts twoslash
 * // @noErrors
 * import { Abi, AbiFunction } from 'ox'
 *
 * const foo = Abi.from([
 *   'function foo(address)',
 *   'function bar(uint)'
 * ])
 * AbiFunction.fromAbiSelector(foo, '0x7af82b1a')
 * ```
 */
export class InvalidSelectorSizeError extends Errors.BaseError {
  override readonly name = 'AbiItem.InvalidSelectorSizeError'
  constructor({ data }: { data: Hex.Hex }) {
    super(
      `Selector size is invalid. Expected 4 bytes. Received ${Hex.size(data)} bytes ("${data}").`,
    )
  }
}
