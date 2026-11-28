/**
 * Shared pieces of the fuzz category: the contract of a project's properties module, a seeded
 * PRNG, the crash oracle's error classification, the marking of values rebuilt from the corpus,
 * the boundary mutator that turns a recorded argument set into new ones, the minimizer's type
 * checks, and the formatter that prints an input in a metric note.
 *
 * Every mutation says whether it keeps the argument's TypeScript type. A hex string stays a
 * `0x${string}` (empty, odd-length, uppercase, or not hex at all), a bigint stays a bigint (zero,
 * 2^n ± 1, negative, huge), an object gains a field or loses one that another recorded call left
 * out. Those inputs are ones a typed caller can pass, so a `TypeError`, `RangeError`, or
 * `SyntaxError` they cause is a bug. A wrong type, a missing required field, or a mangled literal
 * (`'latest'` → `'lat'`) breaks the type, so only a hang, runaway memory, or a stack overflow they
 * cause is one.
 *
 * @module
 */

import * as fs from 'node:fs'
import * as path from 'node:path'

import type fc from 'fast-check'

import * as library from './library.ts'

// Each property's check reads the shape its own arbitrary makes, which a shared type cannot name.
type Any = any

/**
 * What the worker passes the properties module's `library`: the library's entry modules,
 * fast-check, and the recorded arguments.
 */
export type Base = {
  /** The documented error base class that `fuzz.baseError` names, or `Error`. */
  BaseError: new (...args: never[]) => Error
  /** fast-check. */
  fc: typeof fc
  /** The library's entry modules by specifier, such as `lib` or `lib/Math`. */
  modules: Record<string, Record<string, unknown>>
  /** A boundary mutation of a recorded argument set, or `undefined` when it breaks the type. */
  mutate: (
    seed: unknown[],
    pool: unknown[][],
    random: number,
    count: number,
  ) => unknown[] | undefined
  /** A function's recorded argument sets from the corpus (only for functions in this job). */
  recorded: (name: string) => unknown[][]
  /** The project root. */
  root: string
}

/** A property's failure, with the functions at fault when the check can tell. */
export class Failure extends Error {
  blame?: string[] | undefined
  kind: string
  site?: string | undefined
  constructor(
    message: string,
    options: {
      blame?: string[] | undefined
      kind?: string
      site?: string | undefined
    } = {},
  ) {
    super(message)
    this.blame = options.blame
    this.kind = options.kind ?? 'mismatch'
    this.site = options.site
  }
}

/**
 * The module that `fuzz.properties` names. Every export is optional: without the module, each
 * function gets only boundary mutations of its recorded arguments.
 */
export type Properties = {
  /** Fewer mutated calls for functions whose names match, for costly calls. The first match applies. */
  budgets?: [RegExp, number][] | undefined
  /** Adds what the properties need, such as reference implementations, to what the worker passes. */
  library?: ((base: Base) => Promise<Base> | Base) | undefined
  /** Mutated calls per function with recorded or hand-written arguments. Defaults to 500. */
  mutations?: number | undefined
  /** The structured properties, such as round trips and differentials. */
  properties?: ((lib: Any) => Property[]) | undefined
  /** Hand-written argument sets by function name, which the worker mutates as it does recorded ones. */
  seeds?: ((lib: Any) => Record<string, unknown[][]>) | undefined
}

/** One structured property: an arbitrary, a check, and the public functions it exercises. */
export type Property = {
  arb: fc.Arbitrary<unknown>
  async?: boolean | undefined
  check: (input: Any) => void | Promise<void>
  covers: string[]
  id: string
  oracle: 'round trip' | 'differential' | 'consistency' | 'crash'
  runs: number
}

/** A seeded PRNG (mulberry32), so a function's inputs are the same on every run. */
export function prng(seed: number) {
  let state = seed >>> 0
  const next = () => {
    state = (state + 0x6d2b79f5) >>> 0
    let t = state
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
  return {
    next,
    int: (n: number) => Math.floor(next() * n),
    pick: <value>(values: readonly value[]): value =>
      values[Math.floor(next() * values.length)]!,
  }
}
export type Prng = ReturnType<typeof prng>

/** A 32-bit FNV-1a hash of a string, for per-function seeds. */
export function hash32(text: string) {
  let h = 0x811c9dc5
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i)
    h = Math.imul(h, 0x01000193)
  }
  return h >>> 0
}

/** Built-in errors that mean the code, not the input, went wrong. */
const programmerErrors = new Set<unknown>([
  TypeError,
  RangeError,
  SyntaxError,
  ReferenceError,
  EvalError,
  URIError,
])

export type Crash = { kind: string; message: string; site?: string | undefined }

/**
 * Whether a thrown value is a bug: anything not an `Error`, a stack overflow on a small input, or,
 * for an input that keeps the types, a built-in programmer error. The library's own error classes,
 * its dependencies' errors, and plain `Error`s are documented.
 */
export function classify(
  error: unknown,
  typed: boolean,
  args: unknown[],
): Crash | undefined {
  if (!(error instanceof Error))
    return { kind: 'threw a non-Error', message: short(String(error)) }
  const message = short(error.message)
  if (error instanceof RangeError && /Maximum call stack/.test(error.message))
    return sizeOf(args) < 10_000
      ? { kind: 'stack overflow', message, site: site(error) }
      : undefined
  const ctor = Object.getPrototypeOf(error)?.constructor
  if (!typed || !programmerErrors.has(ctor)) return undefined
  // A `throw new RangeError('"secretKey" expected Uint8Array of length 32')` is validation the
  // code (the library's or a dependency's) chose to do, with a message that names the problem.
  if (deliberate(error)) return undefined
  // `BigInt('0xzz')`'s SyntaxError names the string, which is `0x${string}` but not hex.
  if (
    error instanceof SyntaxError &&
    /Cannot convert .* to a BigInt/.test(error.message) &&
    numbersIn(args).invalidHex
  )
    return undefined
  // Empty hex as a number throws this SyntaxError from `BigInt('0x')`: quantity decoders convert
  // with `BigInt`, and `0x` is not a JSON-RPC quantity. Whether they read `0x` as 0 or throw a
  // typed error is a decision for the maintainers, and a structured property can report it once,
  // instead of once per decoder.
  if (
    error instanceof SyntaxError &&
    /^Cannot convert 0x to a BigInt$/.test(error.message)
  )
    return undefined
  // JSON text the caller passed that is not JSON fails as `JSON.parse` fails.
  if (
    error instanceof SyntaxError &&
    /JSON/.test(error.message) &&
    stringsIn(args).some((text) => !parses(text))
  )
    return undefined
  // RFC 8785 forbids non-finite numbers and bigints, and a canonical JSON encoder can throw this
  // TypeError for them on purpose.
  if (
    error instanceof TypeError &&
    /^Cannot canonicalize (non-finite number|bigint)$/.test(error.message)
  )
    return undefined
  // A RangeError that names the bad number is the right error for it: a fraction or a non-finite
  // number where the code needs an integer, a size so large that allocating it fails, or a negative
  // length.
  if (error instanceof RangeError) {
    const { fraction, huge, negative } = numbersIn(args)
    if (
      fraction &&
      /not an integer|Invalid (count|time) value|toString\(\) radix/.test(
        error.message,
      )
    )
      return undefined
    if (
      huge &&
      /Invalid (string|typed array|array) length|allocation failed|Invalid count value|Array buffer|out of memory|Invalid DataView|Maximum BigInt size/i.test(
        error.message,
      )
    )
      return undefined
    if (
      negative &&
      /Invalid (typed array|array) length: -\d|Exponent must be positive/.test(
        error.message,
      )
    )
      return undefined
    // A NaN size or offset lands in `Uint8Array.prototype.set` as an offset.
    if (huge && /offset is out of bounds/.test(error.message)) return undefined
  }
  return { kind: ctor.name, message, site: site(error) }
}

const sourceLines = new Map<string, string[]>()

/** Whether the error's first frame outside the harness is a `throw new …Error(` statement. */
export function deliberate(error: Error) {
  for (const line of String(error.stack ?? '')
    .split('\n')
    .slice(1)) {
    const match = line.match(/\(?(?:file:\/\/)?([^\s()]+):(\d+):\d+\)?$/)
    if (!match) continue
    const file = match[1]!
    if (/fuzz-|node:|fast-check/.test(file)) continue
    if (!sourceLines.has(file))
      sourceLines.set(
        file,
        (() => {
          try {
            return fs.readFileSync(file, 'utf8').split('\n')
          } catch {
            return []
          }
        })(),
      )
    const source = sourceLines.get(file)![Number(match[2]) - 1] ?? ''
    return /\bthrow\s+new\s+\w*Error\b/.test(source)
  }
  return false
}

/** Whether an input holds a non-integer number, or a number of 2^24 or more (or not finite). */
function numbersIn(args: unknown[]) {
  const facts = {
    fraction: false,
    huge: false,
    invalidHex: false,
    negative: false,
  }
  const visit = (value: unknown, depth: number) => {
    if (depth > 10) return
    if (typeof value === 'string') {
      if (/^0x/i.test(value) && !/^0x[0-9a-fA-F]*$/.test(value))
        facts.invalidHex = true
    } else if (typeof value === 'number') {
      if (!Number.isInteger(value)) facts.fraction = true
      if (value < 0) facts.negative = true
      if (!Number.isFinite(value) || Math.abs(value) >= 2 ** 24)
        facts.huge = true
    } else if (typeof value === 'bigint') {
      if (value >= 2n ** 24n || value <= -(2n ** 24n)) facts.huge = true
    } else if (
      value &&
      typeof value === 'object' &&
      !(value instanceof Uint8Array) &&
      !named.has(value)
    )
      for (const key of Object.keys(value))
        visit((value as Record<string, unknown>)[key], depth + 1)
  }
  visit(args, 0)
  return facts
}

function stringsIn(value: unknown, depth = 0): string[] {
  if (typeof value === 'string') return [value]
  if (
    depth > 8 ||
    !value ||
    typeof value !== 'object' ||
    value instanceof Uint8Array
  )
    return []
  return Object.values(value).flatMap((item) => stringsIn(item, depth + 1))
}

function parses(text: string) {
  try {
    JSON.parse(text)
    return true
  } catch {
    return false
  }
}

/**
 * The first stack frame in the library's build or a dependency, as `file:line`: a dependency's
 * file from its package name, such as `dep/utils.js`, and the library's from the checkout, such as
 * `dist/Math.js`.
 */
export function site(error: unknown): string | undefined {
  const stack = String((error as Error)?.stack ?? '')
  for (const line of stack.split('\n').slice(1)) {
    const match = line.match(/\(?(?:file:\/\/)?([^\s()]+):(\d+):\d+\)?$/)
    if (!match) continue
    const file = match[1]!
    if (/fuzz-|node:|fast-check/.test(file)) continue
    const relative = file.includes('/node_modules/')
      ? file.replace(
          /^.*\/node_modules\/(?:\.pnpm\/[^/]+\/node_modules\/)?/,
          '',
        )
      : file.startsWith(`${library.root}/`)
        ? path.relative(library.root, file)
        : file
    return `${relative}:${match[2]}`
  }
  return undefined
}

export function short(text: string, length = 160) {
  const line = text.split('\n')[0]!.replace(/\s+/g, ' ')
  return line.length > length ? `${line.slice(0, length - 1)}…` : line
}

/** Values the formatter prints by name, such as an ABI or a key pair rebuilt from a recorded call. */
export const named = new WeakMap<object, string>()

/** A compact, JavaScript-like rendering of a value, cut at about `budget` characters. */
export function format(value: unknown, budget = 400): string {
  const out: string[] = []
  let left = budget
  const push = (text: string) => {
    out.push(text)
    left -= text.length
  }
  const visit = (value: unknown, depth: number, seen: Set<object>) => {
    if (left <= 0) return push('…')
    switch (typeof value) {
      case 'bigint':
        return push(`${value}n`)
      case 'number':
        return push(Object.is(value, -0) ? '-0' : String(value))
      case 'string': {
        const text = JSON.stringify(value)
        return push(
          text.length > 120
            ? `${text.slice(0, 60)}…(${value.length} chars)…${text.slice(-30)}`
            : text,
        )
      }
      case 'undefined':
        return push('undefined')
      case 'boolean':
        return push(String(value))
      case 'symbol':
        return push(String(value))
      case 'function':
        return push(
          named.get(value) ?? `[function ${value.name || 'anonymous'}]`,
        )
    }
    if (value === null) return push('null')
    const object = value as object
    const name = named.get(object)
    if (name) return push(name)
    if (seen.has(object)) return push('[cycle]')
    if (object instanceof Uint8Array) {
      const hex = toHex(object)
      return push(
        `Uint8Array(0x${hex.length > 80 ? `${hex.slice(0, 40)}…(${object.length} bytes)` : hex})`,
      )
    }
    if (depth > 6) return push('…')
    seen.add(object)
    if (Array.isArray(object)) {
      push('[')
      object.forEach((item, i) => {
        if (i) push(', ')
        if (i > 12 && object.length > 16) {
          push(`…${object.length - i} more`)
          return
        }
        visit(item, depth + 1, seen)
      })
      push(']')
    } else {
      push('{')
      Object.keys(object).forEach((key, i) => {
        if (i) push(', ')
        push(
          /^[A-Za-z_$][\w$]*$/.test(key)
            ? `${key}: `
            : `${JSON.stringify(key)}: `,
        )
        visit((object as Record<string, unknown>)[key], depth + 1, seen)
      })
      push('}')
    }
    seen.delete(object)
  }
  visit(value, 0, new Set())
  return out.join('')
}

/** The length of a value's rendering without a budget, to judge whether an input is small. */
export function sizeOf(value: unknown): number {
  let total = 0
  const visit = (value: unknown, depth: number) => {
    if (total > 1e6 || depth > 200) return
    if (typeof value === 'string') total += value.length
    else if (value instanceof Uint8Array) total += value.length * 2
    else if (value && typeof value === 'object' && !named.has(value)) {
      for (const key of Object.keys(value)) {
        total += key.length + 1
        visit((value as Record<string, unknown>)[key], depth + 1)
      }
    } else total += 4
  }
  visit(value, 0)
  return total
}

export function toHex(bytes: Uint8Array): string {
  let out = ''
  for (const byte of bytes) out += byte.toString(16).padStart(2, '0')
  return out
}

/** Values rebuilt from an export or a call, which the mutator leaves alone. */
export const opaque = new WeakSet<object>()

/**
 * Marks the values speed-codec's `decode` rebuilt from an export, a call, or a source (its
 * `origins` map) as opaque, and names them for notes, such as `fromHttp(…)`.
 */
export function markRebuilt(origins: Map<object, unknown>) {
  for (const [value, node] of origins) {
    opaque.add(value)
    if (named.has(value)) continue
    const record = node as Record<string, unknown>
    const key = record.$ref ?? record.$call ?? record.$await ?? record.$new
    named.set(
      value,
      typeof key === 'string'
        ? `${key.split('#')[1]}${'$ref' in record ? '' : '(…)'}`
        : '[function]',
    )
  }
}

/** One mutated input: the arguments, whether they keep their types, and what changed. */
export type Mutant = { args: unknown[]; typed: boolean; changes: string[] }

type Slot = {
  path: (string | number)[]
  value: unknown
  get: () => unknown
  set: (value: unknown) => void
  remove?: (() => void) | undefined
}

const bigintEdges = (() => {
  const out: bigint[] = [0n, 1n, -1n, 2n ** 1024n, -(2n ** 1024n)]
  for (const n of [
    7, 8, 15, 16, 31, 32, 53, 63, 64, 127, 128, 159, 160, 255, 256, 257,
  ])
    out.push(
      2n ** BigInt(n) - 1n,
      2n ** BigInt(n),
      2n ** BigInt(n) + 1n,
      -(2n ** BigInt(n)),
    )
  return out
})()
const numberEdges = [
  0,
  -0,
  1,
  -1,
  2,
  0.5,
  -0.5,
  127,
  128,
  255,
  256,
  2 ** 15,
  2 ** 16 - 1,
  2 ** 16,
  2 ** 31 - 1,
  2 ** 31,
  2 ** 32 - 1,
  2 ** 32,
  2 ** 53 - 1,
  2 ** 53,
  2 ** 53 + 2,
  1e21,
  -(2 ** 31),
  Number.NaN,
  Number.POSITIVE_INFINITY,
  Number.NEGATIVE_INFINITY,
  Number.MIN_VALUE,
]
const stringEdges = [
  '',
  ' ',
  'a',
  '\u0000',
  '\n',
  '\r\n',
  'é',
  'e\u0301',
  '𝔘𝔫𝔦𝔠𝔬𝔡𝔢',
  '😀',
  '\uD800',
  '\uDFFF',
  'a\uD83Dz',
  '\u202Eabc',
  '\uFEFF',
  'İ',
  'ß',
  'x'.repeat(10_000),
  '0x',
  '-1',
  'NaN',
  '1e999',
  '{}',
  '%s%n',
  '..',
  'a.b',
  'A',
  '\t\u00A0\u2028',
]

/** Hex string variants: each stays `0x${string}`. */
function hexVariants(hex: string, random: Prng): string[] {
  const body = hex.slice(2)
  const filler = random.pick(['00', 'ff', '7f', '80', '01'])
  // Byte edits at a random position reach a decoder's inner length and type fields, which edits
  // at the ends do not.
  const at = 2 * random.int(Math.max(1, body.length >> 1))
  const byte = random.pick([
    '00',
    'ff',
    '7f',
    '80',
    '81',
    'b8',
    'c0',
    'f8',
    '01',
  ])
  return [
    `0x${body.slice(0, at)}`,
    `0x${body.slice(0, at)}${byte}${body.slice(at + 2)}`,
    `0x${body.slice(0, at)}${body.slice(at + 2)}`,
    `0x${body.slice(0, at)}${byte}${body.slice(at)}`,
    '0x',
    '0x0',
    '0x00',
    '0x1',
    `0x${body.slice(0, -1)}`,
    `0x${body}0`,
    `0x${body.toUpperCase()}`,
    `0x${body.slice(0, body.length >> 1)}`,
    `0x${body}${body}`,
    `0x${filler.repeat(32)}`,
    `0x${filler.repeat(20)}`,
    `0x${filler.repeat(65)}`,
    `0x${'00'.repeat(4)}${body}`,
    `0x${body}${filler}`,
    `0x${body.slice(2)}`,
    `0xzz${body.slice(2)}`,
    `0x${body.slice(0, -2)}g0`,
    `0x ${body}`,
    `0x${'ff'.repeat(4_096)}`,
    `0x${body
      .split('')
      .map((c, i) => (i % 2 ? c.toUpperCase() : c.toLowerCase()))
      .join('')}`,
  ]
}

/** Whether a string is free text, so any other string keeps its type, not a literal like `'latest'`. */
function freeText(text: string, key: string | number | undefined) {
  // ABI type strings (`uint256[]`, `tuple(address,bool)`) and fields such as `type` and
  // `stateMutability` are literal unions, not free text.
  if (
    typeof key === 'string' &&
    /^(type|internalType|stateMutability|primaryType|kind|blockTag|to|dir|unit|mode|version|flags)$/.test(
      key,
    )
  )
    return false
  // An identifier of any length, such as `approveExecutionAndPayment`, is a named value.
  if (/^[A-Za-z_$][\w$]*$/.test(text)) return false
  return text.length > 24 || /[^\w\-[\](),]/.test(text)
}

/** Whether an array's elements share one shape, so it is a list rather than a tuple. */
export function homogeneous(values: unknown[]) {
  // A single array in an array is as likely a one-element tuple (`[authorization]`, with an
  // optional signature after it) as a list of one tuple.
  if (values.length === 1 && Array.isArray(values[0])) return false
  const shape = (value: unknown) =>
    value && typeof value === 'object' && !(value instanceof Uint8Array)
      ? `${Array.isArray(value) ? 'array' : 'object'}:${Array.isArray(value) ? '' : Object.keys(value).sort().join(',')}`
      : typeof value === 'string' && value.startsWith('0x')
        ? `hex:${value.length}`
        : // Literal strings, such as ABI types, make a tuple: `['uint256', 'bool']`.
          typeof value === 'string' && !freeText(value, undefined)
          ? `literal:${value}`
          : typeof value
  return values.every((value) => shape(value) === shape(values[0]))
}

/**
 * Lists the mutable slots of an argument set: every value reachable through plain arrays and
 * objects, minus opaque ones (values rebuilt from the library's exports or calls).
 */
function slots(args: unknown[]): Slot[] {
  const out: Slot[] = []
  const visit = (
    value: unknown,
    path: (string | number)[],
    get: () => unknown,
    set: (value: unknown) => void,
    remove: (() => void) | undefined,
    depth: number,
  ) => {
    if (isSchema(path.at(-1), value)) return
    const slot: Slot = { path, value, get, set, remove }
    out.push(slot)
    if (depth > 8 || !value || typeof value !== 'object') return
    // A frozen value, such as a BIP-39 wordlist, is a constant: replace it whole or not at all.
    if (
      opaque.has(value) ||
      Object.isFrozen(value) ||
      value instanceof Uint8Array ||
      value instanceof Date
    )
      return
    if (Array.isArray(value)) {
      value.forEach((_, i) => {
        visit(
          value[i],
          [...path, i],
          () => value[i],
          (next) => {
            value[i] = next
          },
          () => {
            value.splice(i, 1)
          },
          depth + 1,
        )
      })
      return
    }
    const proto = Object.getPrototypeOf(value)
    if (proto !== Object.prototype && proto !== null) return
    const record = value as Record<string, unknown>
    for (const key of Object.keys(record))
      visit(
        record[key],
        [...path, key],
        () => record[key],
        (next) => {
          record[key] = next
        },
        () => {
          delete record[key]
        },
        depth + 1,
      )
  }
  args.forEach((arg, i) => {
    visit(
      arg,
      [i],
      () => args[i],
      (next) => {
        args[i] = next
      },
      undefined,
      0,
    )
  })
  return out
}

/**
 * A position's key, with array indices folded so the objects of one parameter share optional
 * fields, such as `0.signature`. A field under an object with a string `type` carries that variant
 * (`0.signature@secp256k1`), so a secp256k1 signature, which needs `yParity`, is not compared with
 * a P-256 one, which has none.
 */
export function shapeKey(path: (string | number)[], root: unknown) {
  let container = root
  return path
    .map((part) => {
      const variant =
        container &&
        typeof container === 'object' &&
        !Array.isArray(container) &&
        typeof (container as { type?: unknown }).type === 'string'
          ? `@${(container as { type: string }).type}`
          : ''
      container =
        container && typeof container === 'object'
          ? (container as Record<string | number, unknown>)[part]
          : undefined
      return typeof part === 'number' ? '#' : `${part}${variant}`
    })
    .join('.')
}

/** The field sets recorded objects carried at each position, such as `0.authorization`. */
export type Shapes = Map<string, Set<string>>

/** Fields whose string value picks a variant of a union type, such as a transaction's `type`. */
const discriminators = new Set([
  'type',
  'domain',
  'primaryType',
  'kind',
  'mode',
])

/**
 * An object's fields, sorted, with each discriminator's value and each other field's kind:
 * `chainId:number,nonce:bigint,type=eip1559`.
 */
function fieldsOf(value: Record<string, unknown>) {
  // Field kinds tell apart shapes with the same names, such as an authorization with a numeric
  // `chainId` and its RPC form with a hex one (which also needs a signature).
  return Object.keys(value)
    .filter((field) => value[field] !== undefined)
    .map((field) =>
      discriminators.has(field) && typeof value[field] === 'string'
        ? `${field}=${value[field]}`
        : `${field}:${value[field] === null ? 'null' : typeof value[field]}`,
    )
    .sort()
    .join(',')
}

/**
 * The fields each recorded object carried, by position. An object left with exactly the fields of
 * a recorded object there (and the same variant) keeps the type: that covers optional fields and
 * `OneOf` variants (`address` or `contractAddress`) without knowing the type. A looser rule (any
 * superset of a recorded object's fields) mixes up the variants of a union, such as a deposit
 * transaction's fields with an EIP-1559 one's.
 */
export function shapesOf(seeds: unknown[][]): Shapes {
  const out: Shapes = new Map()
  const visit = (value: unknown, path: (string | number)[], depth: number) => {
    if (depth > 8 || !value || typeof value !== 'object' || opaque.has(value))
      return
    if (value instanceof Uint8Array || value instanceof Date) return
    if (Array.isArray(value)) {
      value.forEach((item, i) => {
        visit(item, [...path, i], depth + 1)
      })
      return
    }
    const key = shapeKey(path, root)
    if (!out.has(key)) out.set(key, new Set())
    out.get(key)!.add(fieldsOf(value as Record<string, unknown>))
    for (const [field, item] of Object.entries(value))
      visit(item, [...path, field], depth + 1)
  }
  let root: unknown
  for (const seed of seeds) {
    root = seed
    seed.forEach((arg, i) => {
      visit(arg, [i], 0)
    })
  }
  return out
}

/**
 * Whether an object at `path` carries exactly the fields of some recorded object there. EIP-712
 * data (`message`, `domain`, or `data` beside `types`) must carry every field its own `types`
 * declare, which other recorded calls say nothing about, and its `message` is required.
 */
export function keepsType(
  shapes: Shapes,
  path: (string | number)[],
  record: Record<string, unknown>,
  args: unknown[],
) {
  const root = args[path[0] as number] as { types?: unknown } | undefined
  if (
    root?.types &&
    typeof root.types === 'object' &&
    (path.length === 1 ||
      path.some(
        (part) => part === 'message' || part === 'domain' || part === 'data',
      ))
  )
    return false
  return shapes.get(shapeKey(path, args))?.has(fieldsOf(record)) ?? false
}

const solidityType =
  /^(u?int\d*|bytes\d*|bool|address|string|function|tuple(\(.*\))?)(\[\d*\])*$/

/**
 * Whether a value describes a schema rather than data: an ABI, its parameters, or EIP-712 types.
 * Mutating a schema mostly breaks the type of everything that depends on it, so it is left alone.
 */
export function isSchema(key: string | number | undefined, value: unknown) {
  if (
    typeof key === 'string' &&
    /^(abi|types|components|inputs|outputs)$/.test(key)
  )
    return true
  if (Array.isArray(value))
    return (
      value.length > 0 &&
      value.every(
        (item) =>
          (typeof item === 'string' && solidityType.test(item)) ||
          (item &&
            typeof item === 'object' &&
            typeof (item as { type?: unknown }).type === 'string' &&
            (solidityType.test((item as { type: string }).type) ||
              /^(function|event|error|constructor|fallback|receive)$/.test(
                (item as { type: string }).type,
              ))),
      )
    )
  return false
}

/** Marks the class instances and functions inside hand-written arguments as opaque. */
export function markOpaque(value: unknown, depth = 0) {
  if (!value || depth > 20) return
  if (typeof value === 'function') {
    opaque.add(value)
    return
  }
  if (typeof value !== 'object' || value instanceof Uint8Array) return
  const proto = Object.getPrototypeOf(value)
  if (!Array.isArray(value) && proto !== Object.prototype && proto !== null) {
    opaque.add(value)
    return
  }
  for (const key of Object.keys(value))
    markOpaque((value as Record<string, unknown>)[key], depth + 1)
}

/** A deep copy that keeps opaque values (rebuilt exports, class instances) by reference. */
export function clone<value>(value: value, depth = 0): value {
  if (!value || typeof value !== 'object' || opaque.has(value) || depth > 50)
    return value
  if (value instanceof Uint8Array) return new Uint8Array(value) as value
  if (value instanceof Date) return new Date(value.getTime()) as value
  if (Array.isArray(value)) {
    const out: unknown[] = []
    for (let i = 0; i < value.length; i++)
      if (i in value) out[i] = clone(value[i], depth + 1)
      else out.length = i + 1
    return out as value
  }
  const proto = Object.getPrototypeOf(value)
  if (proto !== Object.prototype && proto !== null) return value
  const out: Record<string, unknown> = {}
  for (const key of Object.keys(value))
    out[key] = clone((value as never)[key], depth + 1)
  return out as value
}

const wrongTypes: unknown[] = [
  undefined,
  null,
  0,
  1n,
  '',
  'x',
  true,
  [],
  {},
  new Uint8Array(),
]

/** Applies one boundary mutation to a copy of `seed`. */
export function mutate(
  seed: unknown[],
  random: Prng,
  shapes: Shapes,
  count = 1,
  params: string[] = [],
): Mutant {
  const args = clone(seed)
  let typed = true
  const changes: string[] = []
  // A slot given a wrong type stays as it is: a later edge value there (a number of 2^31 where
  // bytes go) would allocate gigabytes for an input no caller can pass.
  const wrong = new Set<string>()
  for (let round = 0; round < count; round++) {
    const all = slots(args).filter((slot) => !wrong.has(slot.path.join('.')))
    if (!all.length) break
    const slot = random.pick(all)
    const label = `arg${slot.path[0]}${slot.path
      .slice(1)
      .map((part) => (typeof part === 'number' ? `[${part}]` : `.${part}`))
      .join('')}`
    const value = slot.get()
    const roll = random.next()
    // A wrong type breaks the declared type, so only hangs and stack overflows count.
    if (roll < 0.07) {
      const next = random.pick(
        wrongTypes.filter((item) => typeof item !== typeof value),
      )
      slot.set(clone(next))
      typed = false
      wrong.add(slot.path.join('.'))
      changes.push(`${label} = ${format(next, 40)} (wrong type)`)
      continue
    }
    if (typeof value === 'bigint') {
      const next =
        roll < 0.6
          ? random.pick(bigintEdges)
          : random.pick([
              value + 1n,
              value - 1n,
              -value,
              value * 2n ** 64n,
              value ^ 1n,
            ])
      slot.set(next)
      changes.push(`${label} = ${next}n`)
    } else if (typeof value === 'number') {
      let next =
        roll < 0.6
          ? random.pick(numberEdges)
          : random.pick([
              value + 1,
              value - 1,
              -value,
              value * 2 ** 32,
              value + 0.5,
            ])
      // A size or length is an allocation: 2^31 bytes is gigabytes of memory or a byte-by-byte
      // loop that runs for minutes, which is what was asked for, not a bug. Cap it at 2^20.
      const key =
        slot.path.length > 1 ? slot.path.at(-1) : params[slot.path[0] as number]
      if (
        typeof key === 'string' &&
        /size|length/i.test(key) &&
        Number.isFinite(next) &&
        Math.abs(next) > 2 ** 20
      )
        next = Math.sign(next) * 2 ** 20
      // Key derivation costs are work by design: PBKDF2's iterations (`c` in a keystore's
      // `kdfparams`) and scrypt's `n`, `r` and `p` multiply the time and memory a derivation
      // takes, whether in `kdfparams` or in options beside a `salt`. Cap each at 2^12, and scrypt's
      // product at 2^20, about a second.
      const parent = slot.path
        .slice(0, -1)
        .reduce<unknown>(
          (value, part) => (value as Record<string | number, unknown>)[part],
          args,
        ) as Record<string, unknown>
      if (
        typeof key === 'string' &&
        /^(c|n|r|p|dklen|iterations)$/.test(key) &&
        (slot.path.includes('kdfparams') || 'salt' in parent) &&
        Number.isFinite(next)
      ) {
        const others = /^[nrp]$/.test(key)
          ? ['n', 'r', 'p']
              .filter((other) => other !== key)
              .reduce((product, other) => {
                const cost = parent[other]
                return typeof cost === 'number' && cost > 1
                  ? product * cost
                  : product
              }, 1)
          : 1
        next =
          Math.sign(next) *
          Math.min(Math.abs(next), 2 ** 12, Math.floor(2 ** 20 / others))
      }
      slot.set(next)
      changes.push(`${label} = ${format(next)}`)
    } else if (typeof value === 'boolean') {
      slot.set(!value)
      changes.push(`${label} = ${!value}`)
    } else if (typeof value === 'string') {
      if (value.startsWith('0x')) {
        const next = random.pick(hexVariants(value, random))
        slot.set(next)
        changes.push(`${label} = ${format(next, 60)}`)
      } else {
        const next =
          roll < 0.5
            ? random.pick(stringEdges)
            : random.pick([
                value + random.pick(stringEdges),
                random.pick(stringEdges) + value,
                value.slice(0, value.length >> 1),
                value.toUpperCase(),
                value.repeat(3),
                ` ${value} `,
                value.replace(/\n/g, '\n\n'),
                value.normalize('NFD'),
              ])
        slot.set(next)
        if (!freeText(value, slot.path.at(-1)) || next === '') typed = false
        changes.push(
          `${label} = ${format(next, 60)}${typed ? '' : ' (not a listed literal)'}`,
        )
      }
    } else if (value instanceof Uint8Array) {
      const variants = [
        new Uint8Array(),
        new Uint8Array([0]),
        new Uint8Array([0x80]),
        value.slice(0, value.length >> 1),
        value.slice(1),
        new Uint8Array([...value, 0]),
        new Uint8Array([0, ...value]),
        new Uint8Array(32).fill(0xff),
        new Uint8Array(65),
        new Uint8Array(value.length).fill(0xff),
      ]
      const next = random.pick(variants)
      slot.set(next)
      changes.push(`${label} = ${format(next, 60)}`)
    } else if (Array.isArray(value)) {
      // Reordering, dropping, or repeating elements keeps a list's type, not a tuple's. An
      // argument or field named `tuple` is one, whatever its elements look like
      // (`[yParity, r, s]`).
      const key =
        slot.path.length > 1 ? slot.path.at(-1) : params[slot.path[0] as number]
      if (
        !homogeneous(value) ||
        (typeof key === 'string' && /tuple/i.test(key))
      )
        typed = false
      const choice = random.int(6)
      if (choice === 0) {
        slot.set([])
        changes.push(`${label} = []`)
      } else if (choice === 1 && value.length) {
        // A shallow copy: the list may be an opaque or frozen constant, such as a wordlist.
        const copy = [...value]
        copy.splice(random.int(copy.length), 1)
        slot.set(copy)
        changes.push(`${label}: dropped an element`)
      } else if (choice === 2 && value.length) {
        slot.set([...value, clone(value[random.int(value.length)])])
        changes.push(`${label}: duplicated an element`)
      } else if (choice === 3) {
        slot.set([...value].reverse())
        changes.push(`${label}: reversed`)
      } else if (choice === 4 && value.length) {
        const copy: unknown[] = []
        for (let i = 0; i < 200; i++) copy.push(clone(value[i % value.length]))
        slot.set(copy)
        changes.push(`${label}: 200 elements`)
      } else {
        let nested: unknown = value
        for (let i = 0; i < 64; i++) nested = [nested]
        slot.set(nested)
        typed = false
        changes.push(`${label}: nested 64 deep (wrong type)`)
      }
    } else if (
      value &&
      typeof value === 'object' &&
      !opaque.has(value) &&
      [Object.prototype, null].includes(Object.getPrototypeOf(value))
    ) {
      const record = value as Record<string, unknown>
      const keys = Object.keys(record)
      if (keys.length && random.next() < 0.5) {
        const key = random.pick(keys)
        delete record[key]
        if (keepsType(shapes, slot.path, record, args))
          changes.push(`${label}.${key} left out`)
        else {
          typed = false
          changes.push(`${label}.${key} left out (required)`)
        }
      } else {
        // A field the type may not list, or one it lists with another type: neither is known to
        // keep the declared type (a record such as EIP-712 `types` lists every key).
        const key = random.pick(['extra', 'type', 'value', 'data', 'to'])
        const next = random.pick([1n, '0x01', 'x', 0, true, null])
        record[key] = next
        typed = false
        changes.push(
          `${label}.${key} = ${format(next)} (unknown or mistyped field)`,
        )
      }
    } else continue
  }
  return { args, typed, changes }
}
