import { fc } from '@fast-check/vitest'
import type { AbiParameters } from 'ox'
import {
  arbitraryAddressHex,
  arbitraryBigIntInBits,
  arbitraryHex,
  arbitraryHexOfByteLength,
} from './bytes.js'

/**
 * Width set for `uint<M>` / `int<M>` arbitraries. Restricted to a
 * representative subset; the encoder accepts any multiple of 8 from 8
 * to 256, but exhaustive coverage isn't useful for fuzz purposes.
 */
const intBits = [8, 16, 32, 64, 128, 256] as const

/**
 * Width set for fixed-length `bytes<M>` arbitraries.
 */
const fixedBytesSizes = [1, 4, 20, 32] as const

/** Caps for the recursive ABI parameter arbitrary. */
export type AbiArbitraryOptions = {
  /**
   * Max nesting depth (tuples + arrays). Default `3`.
   */
  maxDepth?: number
  /**
   * Max number of components in a tuple. Default `4`.
   */
  maxTupleArity?: number
  /**
   * Max length of a dynamic array, and exclusive upper bound for
   * fixed-length array sizes. Default `4`.
   */
  maxArrayLength?: number
  /**
   * Max byte length for dynamic `string` and `bytes` values. Default
   * `128`.
   */
  maxBytesLength?: number
}

const defaults: Required<AbiArbitraryOptions> = {
  maxDepth: 3,
  maxTupleArity: 4,
  maxArrayLength: 4,
  maxBytesLength: 128,
}

/**
 * Generates a single ABI parameter schema, possibly nested as a tuple
 * or array, capped by `options`.
 */
export function arbitraryAbiParameter(
  options: AbiArbitraryOptions = {},
): fc.Arbitrary<AbiParameters.Parameter> {
  const opts = { ...defaults, ...options }
  return parameterAtDepth(opts, 0)
}

/**
 * Generates a non-empty array of ABI parameters.
 */
export function arbitraryAbiParameters(
  options: AbiArbitraryOptions = {},
): fc.Arbitrary<readonly AbiParameters.Parameter[]> {
  const opts = { ...defaults, ...options }
  return fc.array(parameterAtDepth(opts, 0), {
    minLength: 1,
    maxLength: opts.maxTupleArity,
  })
}

/**
 * Generates a `(parameters, values)` pair where `values` is shape-
 * compatible with `parameters`. Use this for round-trip fuzz.
 */
export function arbitraryAbiCase(
  options: AbiArbitraryOptions = {},
): fc.Arbitrary<{
  parameters: readonly AbiParameters.Parameter[]
  values: readonly unknown[]
}> {
  return arbitraryAbiParameters(options).chain((parameters) =>
    fc
      .tuple(...parameters.map((p) => arbitraryAbiValueFor(p)))
      .map((values) => ({ parameters, values })),
  )
}

/**
 * Generates a value matching the given parameter schema.
 */
export function arbitraryAbiValueFor(
  parameter: AbiParameters.Parameter,
): fc.Arbitrary<unknown> {
  const arrayMatch = /^(.*)\[(\d*)\]$/.exec(parameter.type)
  if (arrayMatch) {
    const inner = {
      ...parameter,
      type: arrayMatch[1]!,
    } as AbiParameters.Parameter
    const fixedLength = arrayMatch[2] ? Number(arrayMatch[2]) : null
    const child = arbitraryAbiValueFor(inner)
    if (fixedLength === null)
      return fc.array(child, {
        minLength: 0,
        maxLength: defaults.maxArrayLength,
      })
    return fc.array(child, { minLength: fixedLength, maxLength: fixedLength })
  }

  if (parameter.type === 'tuple') {
    const components = (
      parameter as { components?: readonly AbiParameters.Parameter[] }
    ).components
    if (!components || components.length === 0) return fc.constant([])
    return fc.tuple(...components.map((c) => arbitraryAbiValueFor(c)))
  }

  if (parameter.type === 'bool') return fc.boolean()
  if (parameter.type === 'address') return arbitraryAddressHex()
  if (parameter.type === 'string')
    return fc.string({ maxLength: defaults.maxBytesLength })
  if (parameter.type === 'bytes') return arbitraryHex(defaults.maxBytesLength)

  if (parameter.type.startsWith('bytes')) {
    const size = Number(parameter.type.slice('bytes'.length))
    return arbitraryHexOfByteLength(size)
  }

  if (parameter.type.startsWith('uint') || parameter.type.startsWith('int')) {
    const signed = parameter.type.startsWith('int')
    const bits = Number(parameter.type.replace(/^u?int/, '')) || 256
    // ox decodes ints with `size > 48` as `bigint`; smaller sizes
    // come back as `number`. Match the decoder's output type so the
    // round-trip equality check doesn't have to coerce.
    if (bits > 48) return arbitraryBigIntInBits(bits, signed)
    if (signed) {
      const max = 2 ** (bits - 1) - 1
      return fc.integer({ min: -(2 ** (bits - 1)), max })
    }
    return fc.integer({ min: 0, max: 2 ** bits - 1 })
  }

  throw new Error(`unhandled abi type for fuzz value: \`${parameter.type}\``)
}

function parameterAtDepth(
  opts: Required<AbiArbitraryOptions>,
  depth: number,
): fc.Arbitrary<AbiParameters.Parameter> {
  return scalarType()
    .chain((type) => maybeArraySuffix(type, opts))
    .map((type) => ({ type }) as AbiParameters.Parameter)
    .chain((scalar) => {
      if (depth >= opts.maxDepth) return fc.constant(scalar)
      // 25% of slots become tuples; the rest stay scalar/array.
      return fc.oneof(
        { weight: 3, arbitrary: fc.constant(scalar) },
        { weight: 1, arbitrary: tupleParameter(opts, depth + 1) },
      )
    })
}

function tupleParameter(
  opts: Required<AbiArbitraryOptions>,
  depth: number,
): fc.Arbitrary<AbiParameters.Parameter> {
  return fc
    .array(parameterAtDepth(opts, depth), {
      minLength: 1,
      maxLength: opts.maxTupleArity,
    })
    .chain((components) =>
      maybeArraySuffix('tuple', opts).map((type) => ({ type, components })),
    )
    .map(
      (p) =>
        ({
          type: p.type,
          components: p.components,
        }) as unknown as AbiParameters.Parameter,
    )
}

function scalarType(): fc.Arbitrary<string> {
  return fc.oneof(
    fc.constant('bool'),
    fc.constant('address'),
    fc.constant('string'),
    fc.constant('bytes'),
    fc.constantFrom(...fixedBytesSizes).map((n) => `bytes${n}`),
    fc.constantFrom(...intBits).map((n) => `uint${n}`),
    fc.constantFrom(...intBits).map((n) => `int${n}`),
  )
}

function maybeArraySuffix(
  type: string,
  opts: Required<AbiArbitraryOptions>,
): fc.Arbitrary<string> {
  return fc.oneof(
    { weight: 4, arbitrary: fc.constant(type) },
    { weight: 1, arbitrary: fc.constant(`${type}[]`) },
    {
      weight: 1,
      arbitrary: fc
        .integer({ min: 1, max: opts.maxArrayLength })
        .map((n) => `${type}[${n}]`),
    },
  )
}
