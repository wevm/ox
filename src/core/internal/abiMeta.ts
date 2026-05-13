import type * as AbiParameters from '../AbiParameters.js'

/**
 * Per-parameter metadata cache attached to prepared ABI parameters.
 *
 * Encodes the parsed shape of a parameter type so encode/decode paths
 * can dispatch by `kind` instead of re-running regex/string parsers
 * on every call. Fields:
 * - `kind` -- normalized type tag.
 * - `dynamic` -- whether the parameter contributes to the dynamic tail.
 * - `signed` / `size` -- present for `int` / `uint` / `fixedBytes`.
 * - `arrayLength` -- `null` for dynamic arrays, a positive integer for
 *   fixed-length arrays.
 * - `inner` -- meta for the array element type.
 * - `components` -- meta for tuple components.
 * - `staticSize` -- bytes consumed in the static head (always 32 for
 *   dynamic types; sum of children for static tuples;
 *   `length * inner.staticSize` for static arrays).
 * - `fullyStatic` -- recursively static (no descendant touches the
 *   dynamic tail).
 *
 * @internal
 */
export type Meta = {
  kind:
    | 'address'
    | 'bool'
    | 'string'
    | 'bytes'
    | 'fixedBytes'
    | 'int'
    | 'uint'
    | 'tuple'
    | 'array'
    | 'unknown'
  dynamic: boolean
  signed?: boolean
  size?: number
  arrayLength?: number | null
  inner?: Meta
  components?: Meta[]
  staticSize: number
  fullyStatic: boolean
}

const integerTypeRegex = /^(u?)int(\d+)?$/
const fixedBytesRegex = /^bytes(\d+)$/
const arraySuffixRegex = /^(.*)\[(\d+)?\]$/

/**
 * Stored under a non-enumerable property so it survives `{ ...param }`
 * spreads at the immediate site of preparation, but stays invisible
 * to JSON serialization / pretty-format snapshots / `Object.keys()`.
 *
 * @internal
 */
export const META_KEY = '_meta' as const

/**
 * Computes the {@link Meta} record for a single parameter.
 *
 * @internal
 */
export function compute(parameter: AbiParameters.Parameter): Meta {
  const type = parameter.type
  const arrayMatch = arraySuffixRegex.exec(type)
  if (arrayMatch) {
    const inner = compute({
      ...parameter,
      type: arrayMatch[1]!,
    } as AbiParameters.Parameter)
    const arrayLength = arrayMatch[2] ? Number(arrayMatch[2]) : null
    const dynamic = arrayLength === null || inner.dynamic
    return {
      kind: 'array',
      dynamic,
      arrayLength,
      inner,
      staticSize: dynamic ? 32 : (arrayLength ?? 0) * inner.staticSize,
      fullyStatic: !dynamic && inner.fullyStatic,
    }
  }
  if (type === 'tuple') {
    const rawComponents =
      ((parameter as { components?: readonly AbiParameters.Parameter[] })
        .components as readonly AbiParameters.Parameter[] | undefined) ?? []
    const components = rawComponents.map(compute)
    const dynamic = components.some((c) => c.dynamic)
    return {
      kind: 'tuple',
      dynamic,
      components,
      staticSize: dynamic
        ? 32
        : components.reduce((s, c) => s + c.staticSize, 0),
      fullyStatic: !dynamic && components.every((c) => c.fullyStatic),
    }
  }
  if (type === 'address')
    return { kind: 'address', dynamic: false, staticSize: 32, fullyStatic: true }
  if (type === 'bool')
    return { kind: 'bool', dynamic: false, staticSize: 32, fullyStatic: true }
  if (type === 'string')
    return { kind: 'string', dynamic: true, staticSize: 32, fullyStatic: false }
  if (type === 'bytes')
    return { kind: 'bytes', dynamic: true, staticSize: 32, fullyStatic: false }
  const fixed = fixedBytesRegex.exec(type)
  if (fixed)
    return {
      kind: 'fixedBytes',
      dynamic: false,
      size: Number(fixed[1]),
      staticSize: 32,
      fullyStatic: true,
    }
  const intMatch = integerTypeRegex.exec(type)
  if (intMatch) {
    const signed = intMatch[1] !== 'u'
    const size = intMatch[2] ? Number(intMatch[2]) : 256
    return {
      kind: signed ? 'int' : 'uint',
      dynamic: false,
      signed,
      size,
      staticSize: 32,
      fullyStatic: true,
    }
  }
  // Defer error reporting to the existing decode/encode path so we don't
  // break parameter shapes the regex paths previously tolerated.
  return { kind: 'unknown', dynamic: false, staticSize: 32, fullyStatic: true }
}

/**
 * Attaches a {@link Meta} cache to `parameter` and (recursively) to any
 * tuple components. Returns a new parameter object so the caller's input
 * is not mutated. Idempotent.
 *
 * @internal
 */
export function attach<parameter extends AbiParameters.Parameter>(
  parameter: parameter,
): parameter {
  if ((parameter as { [META_KEY]?: Meta })[META_KEY]) return parameter
  let next: parameter = parameter
  if (
    'components' in parameter &&
    Array.isArray(
      (parameter as { components?: readonly AbiParameters.Parameter[] })
        .components,
    )
  ) {
    const components = (
      (parameter as unknown as { components: readonly AbiParameters.Parameter[] })
        .components
    ).map((c) => attach(c))
    next = { ...parameter, components } as parameter
  } else {
    next = { ...parameter } as parameter
  }
  Object.defineProperty(next, META_KEY, {
    value: compute(next),
    enumerable: false,
    writable: false,
    configurable: true,
  })
  return next
}

/**
 * Reads the cached {@link Meta} for a parameter, or `undefined` if it
 * was never prepared.
 *
 * @internal
 */
export function get(parameter: AbiParameters.Parameter): Meta | undefined {
  return (parameter as { [META_KEY]?: Meta })[META_KEY]
}

/**
 * Returns the minimum static head size (in bytes) required to decode
 * the given parameter list, when every top-level parameter has cached
 * meta. Returns `undefined` when any parameter is missing meta -- the
 * caller should fall back to its slow preflight (or skip).
 *
 * @internal
 */
export function minStaticHeadSize(
  parameters: readonly AbiParameters.Parameter[],
): number | undefined {
  let total = 0
  for (let i = 0; i < parameters.length; i++) {
    const meta = get(parameters[i]!)
    if (!meta) return undefined
    total += meta.staticSize
  }
  return total
}

/**
 * Returns `true` when every top-level parameter has cached meta and is
 * recursively static. Used to skip cursor recursive-read bookkeeping
 * for monotonic decodes.
 *
 * @internal
 */
export function isFullyStatic(
  parameters: readonly AbiParameters.Parameter[],
): boolean {
  if (parameters.length === 0) return true
  for (let i = 0; i < parameters.length; i++) {
    const meta = get(parameters[i]!)
    if (!meta || !meta.fullyStatic) return false
  }
  return true
}
