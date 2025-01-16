/** Combines members of an intersection into a readable type. */
// https://twitter.com/mattpocockuk/status/1622730173446557697?s=20&t=NdpAcmEFXY01xkqU3KO0Mg
export type Compute<type> = { [key in keyof type]: type[key] } & unknown

declare const symbol: unique symbol

/**
 * Creates a branded type of `T` with the brand `U`.
 *
 * @example
 * ```ts
 * type Result = Branded<string, 'foo'>
 * //   ^? type Result = string & { [symbol]: 'foo' }
 * ```
 */
export type Branded<T, U> = T & { [symbol]: U }

/**
 * Filters out all members of `T` that are not `P`
 *
 * @example
 * ```ts
 * type Result = Filter<['a', 'b', 'c'], 'b'>
 * //   ^? type Result = ['a', 'c']
 * ```
 *
 * @internal
 */
export type Filter<
  items extends readonly unknown[],
  item,
  acc extends readonly unknown[] = [],
> = items extends readonly [
  infer head,
  ...infer tail extends readonly unknown[],
]
  ? [head] extends [item]
    ? Filter<tail, item, [...acc, head]>
    : Filter<tail, item, acc>
  : readonly [...acc]

export type FilterReverse<
  items extends readonly unknown[],
  item,
  ///
  acc extends readonly unknown[] = [],
> = items extends readonly [
  infer head,
  ...infer tail extends readonly unknown[],
]
  ? [head] extends [item]
    ? Filter<tail, item, acc>
    : Filter<tail, item, [...acc, head]>
  : readonly [...acc]

/**
 * Checks if `T` can be narrowed further than `U`
 *
 * @example
 * ```ts
 * type Result = IsNarrowable<'foo', string>
 * //   ^? true
 * ```
 */
export type IsNarrowable<T, U> = IsNever<
  (T extends U ? true : false) & (U extends T ? false : true)
> extends true
  ? false
  : true
export type IsNarrowableIncludingNever<type, type2> =
  IsUnknown<type> extends true
    ? false
    : IsNever<
          (type extends type2 ? true : false) &
            (type2 extends type ? false : true)
        > extends true
      ? false
      : true

/**
 * Checks if `T` is `never`
 *
 * @example
 * ```ts
 * type Result = IsNever<never>
 * //   ^? type Result = true
 * ```
 */
export type IsNever<T> = [T] extends [never] ? true : false

/**
 * Joins array into string
 *
 * @param array - Array to join
 * @param separator - Separator
 * @returns string
 *
 * @example
 * type Result = Join<['a', 'b', 'c'], '-'>
 * //   ^? type Result = 'a-b-c'
 *
 * @internal
 */
export type Join<
  array extends readonly unknown[],
  separator extends string | number,
> = array extends readonly [infer head, ...infer tail]
  ? tail['length'] extends 0
    ? `${head & string}`
    : `${head & string}${separator}${Join<tail, separator>}`
  : never

/**
 * Merges two object types into new type
 *
 * @param object1 - Object to merge into
 * @param object2 - Object to merge and override keys from {@link object1}
 * @returns New object type with keys from {@link object1} and {@link object2}. If a key exists in both {@link object1} and {@link object2}, the key from {@link object2} will be used.
 *
 * @example
 * type Result = Merge<{ foo: string }, { foo: number; bar: string }>
 * //   ^? type Result = { foo: number; bar: string }
 *
 * @internal
 */
export type Merge<object1, object2> = Omit<object1, keyof object2> & object2

/**
 * Removes `readonly` from all properties of an object.
 *
 * @internal
 */
export type Mutable<type extends object> = {
  -readonly [key in keyof type]: type[key]
}

/**
 * Evaluates boolean "or" condition for `T` properties.
 *
 * * @example
 * ```ts
 * type Result = Or<[false, true, false]>
 * //   ^? type Result = true
 * ```
 *
 * @example
 * ```ts
 * type Result = Or<[false, false, false]>
 * //   ^? type Result = false
 * ```
 *
 * @internal
 */
export type Or<T extends readonly unknown[]> = T extends readonly [
  infer Head,
  ...infer Tail,
]
  ? Head extends true
    ? true
    : Or<Tail>
  : false

/**
 * Combines members of an intersection into a readable type.
 *
 * @link https://twitter.com/mattpocockuk/status/1622730173446557697?s=20&t=NdpAcmEFXY01xkqU3KO0Mg
 * @example
 * type Result = Evaluate<{ a: string } | { b: string } | { c: number, d: bigint }>
 * //   ^? type Result = { a: string; b: string; c: number; d: bigint }
 *
 * @internal
 */
export type Evaluate<type> = { [key in keyof type]: type[key] } & unknown

/**
 * Checks if `T` is `undefined`
 *
 * @example
 * ```ts
 * type Result = IsUndefined<undefined>
 * //   ^? type Result = true
 * ```
 *
 * @internal
 */
export type IsUndefined<T> = [undefined] extends [T] ? true : false

/**
 * Checks if type `T` is the `unknown` type.
 *
 * @internal
 */
export type IsUnknown<T> = unknown extends T
  ? [T] extends [null]
    ? false
    : true
  : false

/** @internal */
export type MaybePromise<T> = T | Promise<T>

/**
 * Makes attributes on the type T required if required is true.
 *
 * @example
 * ```ts
 * MaybeRequired<{ a: string, b?: number }, true>
 * // { a: string, b: number }
 *
 * MaybeRequired<{ a: string, b?: number }, false>
 * // { a: string, b?: number }
 * ```
 *
 * @internal
 */
export type MaybeRequired<T, required extends boolean> = required extends true
  ? ExactRequired<T>
  : T

/**
 * Assigns the properties of U onto T.
 *
 * @example
 * ```ts
 * Assign<{ a: string, b: number }, { a: undefined, c: boolean }>
 * // { a: undefined, b: number, c: boolean }
 * ```
 *
 * @internal
 */
export type Assign<T, U> = Assign_inner<T, U> & U

/** @internal */
export type Assign_inner<T, U> = {
  [K in keyof T as K extends keyof U
    ? U[K] extends void
      ? never
      : K
    : K]: K extends keyof U ? U[K] : T[K]
}

/**
 * Constructs a type by excluding `undefined` from `T`.
 *
 * @example
 * ```ts
 * NoUndefined<string | undefined>
 * // string
 * ```
 *
 * @internal
 */
export type NoUndefined<T> = T extends undefined ? never : T

/**
 * Strict version of built-in Omit type
 *
 * @internal
 */
export type StrictOmit<type, keys extends keyof type> = Pick<
  type,
  Exclude<keyof type, keys>
>

/**
 * Creates a type that is a partial of T, but with the required keys K.
 *
 * @example
 * ```ts
 * PartialBy<{ a: string, b: number }, 'a'>
 * // { a?: string, b: number }
 * ```
 *
 * @internal
 */
export type PartialBy<T, K extends keyof T> = StrictOmit<T, K> &
  ExactPartial<Pick<T, K>>

export type RecursiveArray<T> = T | readonly RecursiveArray<T>[]

/**
 * Creates a type that is T with the required keys K.
 *
 * @example
 * ```ts
 * RequiredBy<{ a?: string, b: number }, 'a'>
 * // { a: string, b: number }
 * ```
 *
 * @internal
 */
export type RequiredBy<T, K extends keyof T> = StrictOmit<T, K> &
  ExactRequired<Pick<T, K>>

/**
 * Returns truthy if `array` contains `value`.
 *
 * @example
 * ```ts
 * Some<[1, 2, 3], 2>
 * // true
 * ```
 *
 * @internal
 */
export type Some<
  array extends readonly unknown[],
  value,
> = array extends readonly [value, ...unknown[]]
  ? true
  : array extends readonly [unknown, ...infer rest]
    ? Some<rest, value>
    : false

/**
 * Trims empty space from type {@link t}.
 *
 * @param t - Type to trim
 * @param chars - Characters to trim
 * @returns Trimmed type
 *
 * @example
 * type Result = Trim<'      foo  '>
 * //   ^? type Result = "foo"
 */
export type Trim<type, chars extends string = ' '> = TrimLeft<
  TrimRight<type, chars>,
  chars
>
type TrimLeft<t, chars extends string = ' '> = t extends `${chars}${infer tail}`
  ? TrimLeft<tail>
  : t
type TrimRight<
  t,
  chars extends string = ' ',
> = t extends `${infer head}${chars}` ? TrimRight<head> : t

/**
 * Prints custom error message
 *
 * @param messages - Error message
 * @returns Custom error message
 *
 * @example
 * ```ts
 * type Result = TypeErrorMessage<'Custom error message'>
 * //   ^? type Result = ['Error: Custom error message']
 * ```
 */
export type TypeErrorMessage<messages extends string | string[]> =
  messages extends string
    ? [
        // Surrounding with array to prevent `messages` from being widened to `string`
        `Error: ${messages}`,
      ]
    : {
        [key in keyof messages]: messages[key] extends infer message extends
          string
          ? `Error: ${message}`
          : never
      }

/** @internal */
export type UnionToTuple<
  union,
  ///
  last = LastInUnion<union>,
> = [union] extends [never] ? [] : [...UnionToTuple<Exclude<union, last>>, last]

/** @internal */
export type LastInUnion<U> = UnionToIntersection<
  U extends unknown ? (x: U) => 0 : never
> extends (x: infer l) => 0
  ? l
  : never

/** @internal */
export type UnionToIntersection<union> = (
  union extends unknown
    ? (arg: union) => 0
    : never
) extends (arg: infer i) => 0
  ? i
  : never

/** @internal */
export type IsUnion<
  union,
  ///
  union2 = union,
> = union extends union2 ? ([union2] extends [union] ? false : true) : never

/** @internal */
export type MaybePartial<
  type,
  enabled extends boolean | undefined,
> = enabled extends true ? Compute<ExactPartial<type>> : type

export type ExactPartial<type> = {
  [key in keyof type]?: type[key] | undefined
}

/** @internal */
export type ExactRequired<type> = {
  [key in keyof type]-?: Exclude<type[key], undefined>
}

export type OneOf<
  union extends object,
  fallback extends object | undefined = undefined,
  ///
  keys extends KeyofUnion<union> = KeyofUnion<union>,
> = union extends infer item
  ? Compute<
      item & {
        [key in Exclude<keys, keyof item>]?: fallback extends object
          ? key extends keyof fallback
            ? fallback[key]
            : undefined
          : undefined
      }
    >
  : never

/** @internal */
export type KeyofUnion<type> = type extends type ? keyof type : never

/** @internal */
export type Undefined<type> = {
  [key in keyof type]?: undefined
}

///////////////////////////////////////////////////////////////////////////
// Loose types

/**
 * Loose version of {@link StrictOmit}
 * @internal
 */
export type LooseOmit<type, keys extends string> = Pick<
  type,
  Exclude<keyof type, keys>
>

///////////////////////////////////////////////////////////////////////////
// Union types

/** @internal */
export type UnionCompute<type> = type extends object ? Compute<type> : type

/** @internal */
export type UnionLooseOmit<type, keys extends string> = type extends any
  ? LooseOmit<type, keys>
  : never

/**
 * Construct a type with the properties of union type T except for those in type K.
 * @example
 * ```ts
 * type Result = UnionOmit<{ a: string, b: number } | { a: string, b: undefined, c: number }, 'a'>
 * // { b: number } | { b: undefined, c: number }
 * ```
 *
 * @internal
 */
export type UnionOmit<type, keys extends keyof type> = type extends any
  ? StrictOmit<type, keys>
  : never

/**
 * Construct a type with the properties of union type T except for those in type K.
 * @example
 * ```ts
 * type Result = UnionOmit<{ a: string, b: number } | { a: string, b: undefined, c: number }, 'a'>
 * // { b: number } | { b: undefined, c: number }
 * ```
 *
 * @internal
 */
export type UnionPick<type, keys extends keyof type> = type extends any
  ? Pick<type, keys>
  : never

/**
 * Creates a type that is a partial of T, but with the required keys K.
 *
 * @example
 * ```ts
 * PartialBy<{ a: string, b: number } | { a: string, b: undefined, c: number }, 'a'>
 * // { a?: string, b: number } | { a?: string, b: undefined, c: number }
 * ```
 *
 * @internal
 */
export type UnionPartialBy<T, K extends keyof T> = T extends any
  ? PartialBy<T, K>
  : never

/**
 * Creates a type that is T with the required keys K.
 *
 * @example
 * ```ts
 * RequiredBy<{ a?: string, b: number } | { a?: string, c?: number }, 'a'>
 * // { a: string, b: number } | { a: string, c?: number }
 * ```
 *
 * @internal
 */
export type UnionRequiredBy<T, K extends keyof T> = T extends any
  ? RequiredBy<T, K>
  : never
