import type {
  AbiParameter,
  AbiParameterToPrimitiveType,
  ExtractAbiEvent,
  ExtractAbiEventNames,
  AbiEvent as abitype_AbiEvent,
} from 'abitype'
import type { Abi } from '../Abi/types.js'
import type { IsEventSignature, IsStructSignature } from '../AbiItem/types.js'
import type { Filter_Topic } from '../Filter/types.js'
import type { Hex } from '../Hex/types.js'
import type {
  Compute,
  Filter,
  MaybeRequired,
  TypeErrorMessage,
  UnionToIntersection,
} from '../types.js'

/** Root type for an {@link ox#AbiItem.AbiItem} with an `event` type. */
export type AbiEvent = abitype_AbiEvent & {
  hash?: Hex | undefined
  overloads?: readonly AbiEvent[] | undefined
}

/**
 * Extracts an {@link ox#AbiEvent.AbiEvent} item from an {@link ox#Abi.Abi}, given a name.
 *
 * @example
 * ```ts twoslash
 * import { Abi, AbiEvent } from 'ox'
 *
 * const abi = Abi.from([
 *   'event Foo(string)',
 *   'event Bar(uint256)',
 * ])
 *
 * type Foo = AbiEvent.Extract<typeof abi, 'Foo'>
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
export type Extract<
  abi extends Abi,
  name extends ExtractNames<abi>,
> = ExtractAbiEvent<abi, name>

/**
 * Extracts the names of all {@link ox#AbiError.AbiError} items in an {@link ox#Abi.Abi}.
 *
 * @example
 * ```ts twoslash
 * import { Abi, AbiEvent } from 'ox'
 *
 * const abi = Abi.from([
 *   'event Foo(string)',
 *   'event Bar(uint256)',
 * ])
 *
 * type names = AbiEvent.Name<typeof abi>
 * //   ^?
 * ```
 */
export type Name<abi extends Abi | readonly unknown[] = Abi> = abi extends Abi
  ? ExtractNames<abi>
  : string

export type ExtractNames<abi extends Abi> = ExtractAbiEventNames<abi>

/////////////////////////////////////////////////////////////////////////////////
// Internal
/////////////////////////////////////////////////////////////////////////////////

/** @internal */
export type EventParameterOptions = {
  EnableUnion?: boolean
  IndexedOnly?: boolean
  Required?: boolean
}

/** @internal */
export type DefaultEventParameterOptions = {
  EnableUnion: true
  IndexedOnly: true
  Required: false
}

/** @internal */
export type IsSignature<signature extends string> =
  | (IsEventSignature<signature> extends true ? true : never)
  | (IsStructSignature<signature> extends true
      ? true
      : never) extends infer condition
  ? [condition] extends [never]
    ? false
    : true
  : false

/** @internal */
export type Signature<
  signature extends string,
  key extends string | unknown = unknown,
> = IsSignature<signature> extends true
  ? signature
  : string extends signature // if exactly `string` (not narrowed), then pass through as valid
    ? signature
    : TypeErrorMessage<`Signature "${signature}" is invalid${key extends string
        ? ` at position ${key}`
        : ''}.`>

/** @internal */
export type Signatures<signatures extends readonly string[]> = {
  [key in keyof signatures]: Signature<signatures[key], key>
}

/** @internal */
export type ParametersToPrimitiveTypes<
  abiParameters extends readonly AbiParameter[],
  options extends EventParameterOptions = DefaultEventParameterOptions,
  // Remove non-indexed parameters based on `Options['IndexedOnly']`
> = abiParameters extends readonly []
  ? readonly []
  : Filter<
        abiParameters,
        options['IndexedOnly'] extends true ? { indexed: true } : object
      > extends infer Filtered extends readonly AbiParameter[]
    ? Filtered extends readonly []
      ? readonly []
      : HasNamedAbiParameter<Filtered> extends true
        ? // All tuple parameters are named so return as object
          UnionToIntersection<
            {
              [index in keyof Filtered]: Filtered[index] extends {
                name: infer name extends string
              }
                ? {
                    [key in name]?:
                      | ParameterToPrimitiveType<Filtered[index], options>
                      | undefined
                  }
                : {
                    [key in index]?:
                      | ParameterToPrimitiveType<Filtered[index], options>
                      | undefined
                  }
            }[number]
          > extends infer Mapped
          ? Compute<
              MaybeRequired<
                Mapped,
                options['Required'] extends boolean
                  ? options['Required']
                  : false
              >
            >
          : never
        : // Has unnamed tuple parameters so return as array
            | readonly [
                ...{
                  [K in keyof Filtered]: ParameterToPrimitiveType<
                    Filtered[K],
                    options
                  >
                },
              ]
            // Distribute over tuple to represent optional parameters
            | (options['Required'] extends true
                ? never
                : // Distribute over tuple to represent optional parameters
                  Filtered extends readonly [
                      ...infer Head extends readonly AbiParameter[],
                      infer _,
                    ]
                  ? ParametersToPrimitiveTypes<
                      readonly [
                        ...{ [K in keyof Head]: Omit<Head[K], 'name'> },
                      ],
                      options
                    >
                  : never)
    : never

/** @internal */
export type ParameterToPrimitiveType<
  abiParameter extends AbiParameter,
  //
  options extends EventParameterOptions = DefaultEventParameterOptions,
  _type = AbiParameterToPrimitiveType<abiParameter>,
> = options['EnableUnion'] extends true ? TopicType<_type> : _type

/** @internal */
export type TopicType<
  primitiveType = Hex,
  topic extends Filter_Topic = Filter_Topic,
> = topic extends Hex
  ? primitiveType
  : topic extends readonly Hex[]
    ? primitiveType[]
    : topic extends null
      ? null
      : never

/** @internal */
export type HasNamedAbiParameter<
  abiParameters extends readonly AbiParameter[],
> = abiParameters extends readonly [
  infer Head extends AbiParameter,
  ...infer Tail extends readonly AbiParameter[],
]
  ? Head extends { name: string }
    ? Head['name'] extends ''
      ? HasNamedAbiParameter<Tail>
      : true
    : HasNamedAbiParameter<Tail>
  : false
