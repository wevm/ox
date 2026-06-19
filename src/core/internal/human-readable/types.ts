/** @internal */
export type Error<messages extends string | string[]> = messages extends string
  ? [`Error: ${messages}`]
  : {
      [key in keyof messages]: messages[key] extends infer message extends string
        ? `Error: ${message}`
        : never
    }

/** @internal */
export type Filter<
  items extends readonly unknown[],
  item,
  acc extends readonly unknown[] = [],
> = items extends readonly [infer head, ...infer tail extends readonly unknown[]]
  ? [head] extends [item]
    ? Filter<tail, item, acc>
    : Filter<tail, item, [...acc, head]>
  : readonly [...acc]

/** @internal */
export type IsNarrowable<type, type2> = IsUnknown<type> extends true
  ? false
  : IsNever<
        (type extends type2 ? true : false) &
          (type2 extends type ? false : true)
      > extends true
    ? false
    : true

/** @internal */
export type IsNever<type> = [type] extends [never] ? true : false

/** @internal */
export type IsUnknown<type> = unknown extends type ? true : false

/** @internal */
export type Join<
  array extends readonly unknown[],
  separator extends string | number,
> = array extends readonly [infer head, ...infer tail]
  ? tail['length'] extends 0
    ? `${head & string}`
    : `${head & string}${separator}${Join<tail, separator>}`
  : never

/** @internal */
export type Merge<object1, object2> = Omit<object1, keyof object2> & object2

/** @internal */
export type Pretty<type> = { [key in keyof type]: type[key] } & unknown

/** @internal */
export type Trim<type, chars extends string = ' '> = TrimLeft<
  TrimRight<type, chars>,
  chars
>
type TrimLeft<t, chars extends string = ' '> = t extends `${chars}${infer tail}`
  ? TrimLeft<tail>
  : t
type TrimRight<t, chars extends string = ' '> = t extends `${infer head}${chars}`
  ? TrimRight<head>
  : t
