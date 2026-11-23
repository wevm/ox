/**
 * Encodes a call's arguments as JSON text that another process can rebuild, and rebuilds them.
 * Shared by the recorder, which runs inside vitest, and the bench and fuzz workers, which run under Node,
 * so both sides agree on what is replayable and on what an argument set looks like.
 *
 * Replayable values are primitives (including `undefined`, `-0`, `NaN`, and infinities), bigints,
 * `Uint8Array`s (a `Buffer` rebuilds as a plain `Uint8Array`), `ArrayBuffer`s, `Date`s, `Map`s,
 * plain objects, and arrays.
 * Beyond those, in the order they are tried:
 *
 * - A value an ox module exports, or reaches through an export's properties, such as a zod
 *   schema or a constant, encodes as that path, `{ $ref: key }`, and is rebuilt by importing it.
 * - A value a recorded call to an ox export returned from replayable arguments, such as a
 *   `BlsPoint` or a WebCrypto key pair, encodes as that call, `{ $call: key, $args }`, and is
 *   rebuilt by making the call again; a value an async export resolved to encodes as
 *   `{ $await: key, $args }`. An instance of an exported class, such as an ox error, encodes the
 *   same way as its construction, `{ $new: key, $args }`.
 * - A function whose source refers to nothing but its own parameters, locals, and standard
 *   globals, such as `(x) => x * 2n`, encodes as its source, `{ $fn }`. A function that closes
 *   over anything else, as test callbacks that push to an array do, is not replayable.
 *
 * Anything else makes the call unreplayable, and the error says why in words a reader of a
 * `benched` note understands, such as "passes a function".
 *
 * @module
 */

import * as acorn from 'acorn'

/** Largest encoded argument set kept, which fits a few 128kB blobs as hex. */
export const maxEncodedLength = 1_200_000

/** Why a call's arguments cannot be rebuilt in another process. */
export class Unreplayable extends Error {
  reason: string
  constructor(reason: string) {
    super(reason)
    this.reason = reason
  }
}

/** The recorded call that returned a value: the export's key, the raw arguments, and whether it was `new`. */
export type Origin = {
  key: string
  args: readonly unknown[]
  construct?: boolean | undefined
  /** The call returned a promise, and the value is what it resolved to. */
  async?: boolean | undefined
}

/** What the recorder knows about values the plain encoding cannot carry. */
export type Hooks = {
  /** The recorded calls that returned a value, the one to try first first. */
  origin?: ((value: object) => readonly Origin[] | undefined) | undefined
  /** The export path a value is reachable at, such as `src/chains/definitions/mainnet.ts#mainnet`. */
  ref?: ((value: object) => string | undefined) | undefined
  /** The encoded form of a value `decode` rebuilt, so encoding it again yields the same text. */
  known?: ((value: object) => unknown) | undefined
  /** Whether a function that uses nothing but standard globals encodes as its source. */
  sources?: boolean | undefined
}

/** How `decode` rebuilds the values that are not plain data. */
export type Rebuild = {
  /** Makes a recorded call again. */
  call: (key: string, args: unknown[]) => unknown
  /** Constructs a recorded class instance, such as an error, again. */
  construct: (key: string, args: unknown[]) => unknown
  /** The value at an export path. */
  ref: (key: string) => unknown
}

type Context = {
  seen: Set<object>
  depth: number
  hooks: Hooks
  /** Values whose recorded call's arguments are being encoded, so a call passing its own result fails. */
  pending: Set<object>
}

/**
 * Encodes `args` as JSON text, or throws `Unreplayable`. `hooks` say how to carry values the plain
 * encoding cannot.
 */
export function encode(args: readonly unknown[], hooks: Hooks = {}): string {
  const context = {
    seen: new Set<object>(),
    depth: 0,
    hooks,
    pending: new Set<object>(),
  }
  const text = JSON.stringify(args.map((arg) => encodeValue(arg, context)))
  if (text.length > maxEncodedLength)
    throw new Unreplayable('passes arguments over 1.2MB')
  return text
}

/** Encodes one plain value, such as JSON-RPC params or a result, as JSON text. */
export function encodePlain(value: unknown): string {
  return JSON.stringify(
    encodeValue(value, {
      seen: new Set(),
      depth: 0,
      hooks: {},
      pending: new Set(),
    }),
  )
}

/** The export keys `decode` needs to rebuild values, so their modules can load first. */
export function keys(text: string): string[] {
  return [
    ...new Set(
      [...text.matchAll(/"\$(?:await|call|new|ref)":"([^"]+)"/g)].map(
        (m) => m[1]!,
      ),
    ),
  ]
}

/**
 * Rebuilds the arguments `encode` wrote. It is async because a value an async export resolved to
 * is rebuilt by awaiting the call again. `origins` learns the encoded
 * form of each value rebuilt from a call, an export, or a source, so encoding the
 * arguments again with `known: (value) => origins.get(value)` yields the same text.
 */
export async function decode(
  text: string,
  rebuild?: Rebuild,
  origins?: Map<object, unknown>,
): Promise<unknown[]> {
  const need = () => {
    if (!rebuild) throw new Error('decode needs `rebuild` to rebuild values')
    return rebuild
  }
  const remember = (result: unknown, node: unknown) => {
    if (result && (typeof result === 'object' || typeof result === 'function'))
      origins?.set(result, node)
    return result
  }
  const decodeAll = async (values: unknown[]) => {
    const out: unknown[] = []
    for (const value of values) out.push(await decodeValue(value))
    return out
  }
  const decodeValue = async (value: unknown): Promise<unknown> => {
    if (value === null || typeof value !== 'object') return value
    if (Array.isArray(value)) {
      const out: unknown[] = []
      for (let i = 0; i < value.length; i++) {
        const item = value[i] as { hole?: number } | null
        if (item && typeof item === 'object' && item.hole === 1)
          out.length = i + 1
        else out[i] = await decodeValue(item)
      }
      return out
    }
    const record = value as Record<string, unknown>
    if ('$ref' in record)
      return remember(need().ref(record.$ref as string), record)
    if ('$call' in record) {
      const args = await decodeAll(record.$args as unknown[])
      return remember(need().call(record.$call as string, args), record)
    }
    if ('$await' in record) {
      const args = await decodeAll(record.$args as unknown[])
      return remember(await need().call(record.$await as string, args), record)
    }
    if ('$new' in record) {
      const args = await decodeAll(record.$args as unknown[])
      return remember(need().construct(record.$new as string, args), record)
    }
    if ('$fn' in record)
      return remember(
        new Function(`return (${record.$fn as string})`)(),
        record,
      )
    if ('$map' in record) {
      const entries: [unknown, unknown][] = []
      for (const [key, item] of record.$map as [unknown, unknown][])
        entries.push([await decodeValue(key), await decodeValue(item)])
      return new Map(entries)
    }
    if (
      '$u' in record ||
      '$b' in record ||
      '$n' in record ||
      '$u8' in record ||
      '$ab' in record ||
      '$d' in record
    )
      return decodePlain(record)
    const source = ('$o' in record ? record.$o : record) as Record<
      string,
      unknown
    >
    const out: Record<string, unknown> = {}
    for (const key of Object.keys(source))
      out[key] = await decodeValue(source[key])
    return out
  }
  return decodeAll(JSON.parse(text) as unknown[])
}

/** Rebuilds a plain value `encodePlain` wrote, such as JSON-RPC params or a result. */
export function decodePlain(value: unknown): unknown {
  if (value === null || typeof value !== 'object') return value
  if (Array.isArray(value)) {
    const out: unknown[] = []
    for (let i = 0; i < value.length; i++) {
      const item = value[i] as { hole?: number } | null
      if (item && typeof item === 'object' && item.hole === 1)
        out.length = i + 1
      else out[i] = decodePlain(item)
    }
    return out
  }
  const record = value as Record<string, unknown>
  if ('$u' in record) return undefined
  if ('$b' in record) return BigInt(record.$b as string)
  if ('$n' in record) return Number(record.$n)
  if ('$u8' in record) return fromHex(record.$u8 as string)
  if ('$ab' in record) return fromHex(record.$ab as string).buffer
  if ('$d' in record) return new Date(record.$d as number)
  if ('$map' in record)
    return new Map(
      (record.$map as [unknown, unknown][]).map(([key, item]) => [
        decodePlain(key),
        decodePlain(item),
      ]),
    )
  const source = ('$o' in record ? record.$o : record) as Record<
    string,
    unknown
  >
  const out: Record<string, unknown> = {}
  for (const key of Object.keys(source)) out[key] = decodePlain(source[key])
  return out
}

function encodeValue(value: unknown, context: Context): unknown {
  switch (typeof value) {
    case 'string':
    case 'boolean':
      return value
    case 'number':
      return Number.isFinite(value) && !Object.is(value, -0)
        ? value
        : { $n: Object.is(value, -0) ? '-0' : String(value) }
    case 'undefined':
      return { $u: 1 }
    case 'bigint':
      return { $b: value.toString() }
    case 'symbol':
      throw new Unreplayable('passes a symbol')
  }
  if (value === null) return null
  const object = value as object
  if (object instanceof Uint8Array) return { $u8: toHex(object) }
  // WebAuthn credentials carry ArrayBuffers, and EIP-712 hashing takes a Map of type hashes.
  if (object instanceof ArrayBuffer)
    return { $ab: toHex(new Uint8Array(object)) }
  if (object instanceof Date) return { $d: object.getTime() }
  if (object instanceof Map)
    return {
      $map: [...object].map(([key, item]) => [
        encodeValue(key, context),
        encodeValue(item, context),
      ]),
    }
  const { hooks } = context
  const known = hooks.known?.(object)
  if (known !== undefined) return known
  const ref = hooks.ref?.(object)
  if (ref !== undefined) return { $ref: ref }
  try {
    return encodeStructure(object, context)
  } catch (error) {
    if (!(error instanceof Unreplayable)) throw error
    // A value several calls returned tries the outermost call first. A call whose arguments cannot
    // be encoded leaves the value's own reason, which says more than its call's.
    const origins = hooks.origin?.(object) ?? []
    if (origins.length && context.depth <= 4 && !context.pending.has(object)) {
      context.depth++
      context.pending.add(object)
      try {
        for (const origin of origins)
          try {
            const args = origin.args.map((arg) => encodeValue(arg, context))
            if (origin.construct) return { $new: origin.key, $args: args }
            if (origin.async) return { $await: origin.key, $args: args }
            return { $call: origin.key, $args: args }
          } catch {}
      } finally {
        context.depth--
        context.pending.delete(object)
      }
    }
    if (typeof object === 'function' && hooks.sources) {
      const source = sourceOf(object)
      if (source !== undefined) return { $fn: source }
    }
    throw error
  }
}

function encodeStructure(object: object, context: Context): unknown {
  if (typeof object === 'function')
    throw new Unreplayable(
      /^class[\s{]/.test(Function.prototype.toString.call(object))
        ? 'passes a class'
        : 'passes a function',
    )
  const { seen } = context
  if (seen.has(object)) throw new Unreplayable('passes a cyclic object')
  const proto = Object.getPrototypeOf(object)
  seen.add(object)
  try {
    if (Array.isArray(object)) {
      if (proto !== Array.prototype)
        throw new Unreplayable('passes an array subclass')
      const out: unknown[] = []
      for (let i = 0; i < object.length; i++)
        out.push(
          i in object ? encodeValue(object[i], context) : { $u: 1, hole: 1 },
        )
      return out
    }
    if (proto !== Object.prototype && proto !== null)
      throw new Unreplayable(`passes ${describeInstance(object)}`)
    const record = object as Record<string, unknown>
    if (typeof record.request === 'function')
      throw new Unreplayable('passes a provider')
    const out: Record<string, unknown> = {}
    let escaped = false
    for (const key of Object.keys(record)) {
      if (key.startsWith('$')) escaped = true
      let item: unknown
      try {
        item = record[key]
      } catch {
        throw new Unreplayable('passes an object with a throwing getter')
      }
      out[key] = encodeValue(item, context)
    }
    return escaped ? { $o: out } : out
  } finally {
    seen.delete(object)
  }
}

/** Globals a function's source may use and still be rebuilt from its text in another process. */
const globals = new Set(
  `undefined NaN Infinity globalThis Object Array Function Boolean Number String Symbol BigInt
  Math JSON Date RegExp Error TypeError RangeError SyntaxError Promise Map Set WeakMap WeakSet
  ArrayBuffer DataView Uint8Array Uint16Array Uint32Array Int8Array Int16Array Int32Array
  Float32Array Float64Array BigInt64Array BigUint64Array TextEncoder TextDecoder parseInt
  parseFloat isNaN isFinite encodeURIComponent decodeURIComponent encodeURI decodeURI atob btoa
  setTimeout clearTimeout queueMicrotask structuredClone Reflect URL URLSearchParams
  AbortController AbortSignal Headers Response Request arguments`.split(/\s+/),
)

/**
 * The source of a function that can be rebuilt from its text alone, as an expression, or
 * `undefined` when it closes over anything but standard globals.
 */
function sourceOf(fn: Function): string | undefined {
  let text: string
  try {
    text = Function.prototype.toString.call(fn)
  } catch {
    return undefined
  }
  if (/\{\s*\[native code\]\s*\}$/.test(text) || /^class[\s{]/.test(text))
    return undefined
  const parse = (source: string) => {
    try {
      return acorn.parseExpressionAt(source, 0, {
        ecmaVersion: 'latest',
        preserveParens: true,
      })
    } catch {
      return undefined
    }
  }
  let expression = `(${text})`
  let node = parse(expression) as AstNode | undefined
  if (!node || node.end !== expression.length) {
    // A method, such as `format(args) { ... }`, is valid only inside an object literal.
    const object = `({${text}})`
    const parsed = parse(object) as AstNode | undefined
    const properties = (parsed?.expression as AstNode | undefined)?.properties
    const property = properties?.[0]
    if (
      !parsed ||
      parsed.end !== object.length ||
      properties?.length !== 1 ||
      property?.computed ||
      property?.key?.type !== 'Identifier'
    )
      return undefined
    expression = `${object}.${property.key.name}`
    node = parsed
  }
  return freeNames(node).every((name) => globals.has(name))
    ? expression
    : undefined
}

type AstNode = {
  type: string
  end: number
  name?: string
  computed?: boolean
  shorthand?: boolean
  key?: AstNode
  value?: AstNode
  properties?: AstNode[]
  [key: string]: unknown
}

/**
 * The names a function's source reads without declaring them. It treats a name declared anywhere
 * in the source as declared everywhere in it, which can only let a closure through as a function
 * that then throws when replayed, never reject a self-contained one.
 */
function freeNames(root: AstNode): string[] {
  const declared = new Set<string>()
  const used = new Set<string>()
  const declare = (pattern: AstNode | null | undefined) => {
    if (!pattern) return
    if (pattern.type === 'Identifier') declared.add(pattern.name!)
    else if (pattern.type === 'ObjectPattern')
      for (const property of pattern.properties!)
        if (property.type === 'RestElement')
          declare(property.argument as AstNode)
        else {
          if (property.computed) visit(property.key)
          declare(property.value)
        }
    else if (pattern.type === 'ArrayPattern')
      for (const element of pattern.elements as (AstNode | null)[])
        declare(element)
    else if (pattern.type === 'RestElement')
      declare(pattern.argument as AstNode)
    else if (pattern.type === 'AssignmentPattern') {
      declare(pattern.left as AstNode)
      visit(pattern.right as AstNode)
    } else visit(pattern)
  }
  const visit = (node: AstNode | null | undefined): void => {
    if (!node || typeof node.type !== 'string') return
    switch (node.type) {
      case 'Identifier':
        used.add(node.name!)
        return
      case 'FunctionExpression':
      case 'FunctionDeclaration':
      case 'ArrowFunctionExpression':
        declare(node.id as AstNode)
        for (const param of node.params as AstNode[]) declare(param)
        visit(node.body as AstNode)
        return
      case 'ClassDeclaration':
      case 'ClassExpression':
        declare(node.id as AstNode)
        visit(node.superClass as AstNode)
        visit(node.body as AstNode)
        return
      case 'VariableDeclarator':
        declare(node.id as AstNode)
        visit(node.init as AstNode)
        return
      case 'CatchClause':
        declare(node.param as AstNode)
        visit(node.body as AstNode)
        return
      case 'MemberExpression':
        visit(node.object as AstNode)
        if (node.computed) visit(node.property as AstNode)
        return
      case 'Property':
      case 'MethodDefinition':
      case 'PropertyDefinition':
        // A shorthand property's value is the identifier it reads.
        if (node.computed) visit(node.key)
        visit(node.value)
        return
      case 'LabeledStatement':
        visit(node.body as AstNode)
        return
      case 'BreakStatement':
      case 'ContinueStatement':
      case 'MetaProperty':
        return
    }
    for (const key of Object.keys(node)) {
      if (key === 'type' || key === 'start' || key === 'end') continue
      const child = node[key]
      if (Array.isArray(child)) for (const item of child) visit(item as AstNode)
      else if (child && typeof child === 'object') visit(child as AstNode)
    }
  }
  visit(root)
  return [...used].filter((name) => !declared.has(name))
}

function describeInstance(object: object): string {
  const name = (object as { constructor?: { name?: string } }).constructor?.name
  if (!name) return 'a class instance'
  if (name === 'Promise') return 'a promise'
  if (name.endsWith('Error') || object instanceof Error) return 'an error'
  return `a ${name}`
}

function toHex(bytes: Uint8Array): string {
  let out = ''
  for (const byte of bytes) out += byte.toString(16).padStart(2, '0')
  return out
}

function fromHex(hex: string): Uint8Array {
  const out = new Uint8Array(hex.length / 2)
  for (let i = 0; i < out.length; i++)
    out[i] = Number.parseInt(hex.slice(i * 2, i * 2 + 2), 16)
  return out
}
