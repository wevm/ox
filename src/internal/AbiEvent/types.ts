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

export type AbiEvent = abitype_AbiEvent & {
  hash?: Hex | undefined
  overloads?: readonly AbiEvent[] | undefined
}

export type AbiEvent_Extract<
  abi extends Abi,
  name extends AbiEvent_ExtractNames<abi>,
> = ExtractAbiEvent<abi, name>

export type AbiEvent_Name<abi extends Abi | readonly unknown[] = Abi> =
  abi extends Abi ? AbiEvent_ExtractNames<abi> : string

export type AbiEvent_ExtractNames<abi extends Abi> = ExtractAbiEventNames<abi>

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
export type AbiEvent_IsSignature<signature extends string> =
  | (IsEventSignature<signature> extends true ? true : never)
  | (IsStructSignature<signature> extends true
      ? true
      : never) extends infer condition
  ? [condition] extends [never]
    ? false
    : true
  : false

/** @internal */
export type AbiEvent_Signature<
  signature extends string,
  key extends string | unknown = unknown,
> = AbiEvent_IsSignature<signature> extends true
  ? signature
  : string extends signature // if exactly `string` (not narrowed), then pass through as valid
    ? signature
    : TypeErrorMessage<`Signature "${signature}" is invalid${key extends string
        ? ` at position ${key}`
        : ''}.`>

/** @internal */
export type AbiEvent_Signatures<signatures extends readonly string[]> = {
  [key in keyof signatures]: AbiEvent_Signature<signatures[key], key>
}

/** @internal */
export type AbiEvent_ParametersToPrimitiveTypes<
  abiParameters extends readonly AbiParameter[],
  //
  _options extends EventParameterOptions = DefaultEventParameterOptions,
  // Remove non-indexed parameters based on `Options['IndexedOnly']`
> = abiParameters extends readonly []
  ? readonly []
  : Filter<
        abiParameters,
        _options['IndexedOnly'] extends true ? { indexed: true } : object
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
                      | AbiEvent_ParameterToPrimitiveType<
                          Filtered[index],
                          _options
                        >
                      | undefined
                  }
                : {
                    [key in index]?:
                      | AbiEvent_ParameterToPrimitiveType<
                          Filtered[index],
                          _options
                        >
                      | undefined
                  }
            }[number]
          > extends infer Mapped
          ? Compute<
              MaybeRequired<
                Mapped,
                _options['Required'] extends boolean
                  ? _options['Required']
                  : false
              >
            >
          : never
        : // Has unnamed tuple parameters so return as array
            | readonly [
                ...{
                  [K in keyof Filtered]: AbiEvent_ParameterToPrimitiveType<
                    Filtered[K],
                    _options
                  >
                },
              ]
            // Distribute over tuple to represent optional parameters
            | (_options['Required'] extends true
                ? never
                : // Distribute over tuple to represent optional parameters
                  Filtered extends readonly [
                      ...infer Head extends readonly AbiParameter[],
                      infer _,
                    ]
                  ? AbiEvent_ParametersToPrimitiveTypes<
                      readonly [
                        ...{ [K in keyof Head]: Omit<Head[K], 'name'> },
                      ],
                      _options
                    >
                  : never)
    : never

/** @internal */
export type AbiEvent_ParameterToPrimitiveType<
  abiParameter extends AbiParameter,
  //
  _options extends EventParameterOptions = DefaultEventParameterOptions,
  _type = AbiParameterToPrimitiveType<abiParameter>,
> = _options['EnableUnion'] extends true ? TopicType<_type> : _type

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
