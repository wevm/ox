/**
 * Vitest setup file for recording. It installs `globalThis.__uphillWrap`, which the transform in
 * `speed-vitest.config.ts` calls on every export of the library's modules in the sources, and
 * writes what the wrapped functions were called with to `$UPHILL_SPEED_RECORD_DIR/<pid>.jsonl`
 * after each test file.
 *
 * Calls from test code and calls one library function makes to another are both recorded, keyed
 * by the module that defines the export (`src/Math.ts#add`): the library's modules import each
 * other by relative path, and each module's own bindings are the wrapped functions, so a call
 * inside a module goes through the wrapper too. A function an exported namespace object or
 * function holds records under its path from the export (`src/<file>.ts#<export>.<member>`). A
 * call is direct when test code made it, and internal when it ran inside another wrapped call.
 *
 * A value a wrapped export returned remembers that call, and so do the objects and functions at
 * its own properties, so a later call that passes it, such as a `CryptoKey` from a key pair
 * function or an implementation object from a factory, records the call that rebuilds it. An
 * instance of an exported class, such as an error, remembers its construction. Every value an
 * export reaches, such as a schema or a constant, remembers that path (see speed-codec.ts), and so
 * does every value a test helper module (outside the sources, not a test file) exports, for
 * arguments nothing else can carry.
 *
 * Tests reach this machine, such as servers a global setup or the tests start. A request to any
 * other host gets a JSON-RPC "method not found" error, so no test reaches the network and
 * recordings repeat. It seeds `Math.random`, `crypto.getRandomValues`, and `crypto.randomUUID` per
 * test file for the same reason.
 *
 * @module
 */

import { AsyncLocalStorage } from 'node:async_hooks'
import * as fs from 'node:fs'
import * as path from 'node:path'
import { afterAll, afterEach, beforeEach, expect } from 'vitest'

import {
  encode,
  maxEncodedLength,
  type Origin,
  Unreplayable,
} from './speed-codec.ts'

/** Argument sets encoded per function and test file, for calls made from test code. */
const directBudget = 200
/** Argument sets encoded per function and test file, for calls made by other library functions. */
const internalBudget = 20
/** Distinct successful argument sets kept per function and test file, and their total length. */
const keptPerFile = 12
const keptLengthPerFile = 2_500_000
/** Calls kept per returned value; a value many exports return keeps the first. */
const maxOrigins = 6

type Sample = { n: number; direct: boolean; where: string }
type Key = {
  calls: number
  direct: number
  directTries: number
  internalTries: number
  unreplayable: Record<string, number>
  threw: number
  error?: string | undefined
  errorWhere?: string | undefined
  ok: Map<string, Sample>
  okLength: number
}
type State = {
  keys: Map<string, Key>
  file: string
  test: string
  inTest: boolean
  /** How many wrapped calls the current one runs inside. */
  depth: AsyncLocalStorage<number>
  proxies: WeakMap<object, Map<string, unknown>>
  /** Every proxy the recorder made, so an export that re-exports another is not wrapped twice. */
  wrapped: WeakSet<object>
  /** The calls that returned each object or function a wrapped export returned, outermost first. */
  produced: WeakMap<object, Origin[]>
  /** The export path of each value an export reaches. */
  refs: WeakMap<object, string>
  /** The export path of each value a test helper module exports or reaches. */
  fixtures: WeakMap<object, string>
}

const root = process.cwd()
const g = globalThis as typeof globalThis & {
  __uphillState?: State
  __uphillWrap?: (value: unknown, file: string, name: string) => unknown
  __uphillFixture?: (value: unknown, file: string, name: string) => void
}

const state: State = (g.__uphillState ??= install())

state.file = path.relative(root, expect.getState().testPath ?? '')
state.test = '(module scope)'
state.inTest = false
seedRandomness(state.file)

beforeEach((context) => {
  const names: string[] = []
  let task: { name: string; suite?: unknown } | undefined = context.task
  while (task?.name) {
    names.unshift(task.name)
    task = task.suite as typeof task
  }
  state.test = names.join(' > ')
  state.inTest = true
})

afterEach(() => {
  state.test = '(after hook)'
  state.inTest = false
})

afterAll(() => {
  const dir = process.env.UPHILL_SPEED_RECORD_DIR
  if (dir && state.keys.size) {
    const keys: Record<string, unknown> = {}
    for (const [key, value] of state.keys)
      keys[key] = {
        calls: value.calls,
        direct: value.direct,
        unreplayable: value.unreplayable,
        threw: value.threw,
        error: value.error,
        errorWhere: value.errorWhere,
        ok: [...value.ok].map(([args, sample]) => ({ args, ...sample })),
      }
    fs.appendFileSync(
      path.join(dir, `${process.pid}.jsonl`),
      `${JSON.stringify({ file: state.file, keys })}\n`,
    )
  }
  state.keys = new Map()
})

function install(): State {
  const created: State = {
    keys: new Map(),
    file: '',
    test: '',
    inTest: false,
    depth: new AsyncLocalStorage<number>(),
    proxies: new WeakMap(),
    wrapped: new WeakSet(),
    produced: new WeakMap(),
    refs: new WeakMap(),
    fixtures: new WeakMap(),
  }
  g.__uphillWrap = (value, file, name) => {
    const key = `${file}#${name}`
    if (value && typeof value === 'object') reach(value, key, 0, created.refs)
    return wrap(value, key)
  }
  g.__uphillFixture = (value, file, name) =>
    reach(value, `${file}#${name}`, 0, created.fixtures)
  blockNetwork()
  return created

  /**
   * Wraps a function, a class, or a namespace object of functions. A value the recorder wrapped
   * already, such as an export that re-exports another module's, is left as it is.
   */
  function wrap(value: unknown, key: string): unknown {
    if (!value || (typeof value !== 'function' && typeof value !== 'object'))
      return value
    if (created.wrapped.has(value)) return value
    if (typeof value === 'function') {
      // An instance of an exported class, such as an error, remembers its construction.
      if (isClass(value))
        return cached(value, key, () => {
          const proxy: object = new Proxy(value, {
            construct: (target, args, newTarget) => {
              const direct = newTarget === proxy
              const instance = Reflect.construct(
                target,
                args,
                direct ? target : newTarget,
              )
              if (direct && !created.produced.has(instance))
                created.produced.set(instance, [{ key, args, construct: true }])
              return instance
            },
          })
          return proxy
        })
      return cached(
        value,
        key,
        () =>
          new Proxy(value, {
            apply: (target, self, args) => record(key, target, self, args),
            get: (target, property, receiver) => {
              const member = Reflect.get(target, property, receiver)
              if (
                typeof property === 'string' &&
                property !== 'prototype' &&
                typeof member === 'function' &&
                Object.hasOwn(target, property)
              )
                return wrap(member, `${key}.${property}`)
              return member
            },
          }),
      )
    }
    if (isNamespace(value))
      return cached(
        value,
        key,
        () =>
          new Proxy(value, {
            get: (target, property, receiver) => {
              const member = Reflect.get(target, property, receiver)
              if (
                typeof property === 'string' &&
                Object.hasOwn(target, property)
              )
                return wrap(member, `${key}.${property}`)
              return member
            },
          }),
      )
    return value
  }

  function cached(value: object, key: string, make: () => unknown) {
    let byKey = created.proxies.get(value)
    if (!byKey) created.proxies.set(value, (byKey = new Map()))
    let proxy = byKey.get(key)
    if (!proxy) {
      byKey.set(key, (proxy = make()))
      created.wrapped.add(proxy as object)
      remember(value, key, created.refs)
      remember(proxy as object, key, created.refs)
    }
    return proxy
  }

  /** Remembers the export path of an exported object and of the values its properties hold. */
  function reach(
    value: unknown,
    key: string,
    depth: number,
    paths: WeakMap<object, string>,
  ) {
    if (!value || (typeof value !== 'object' && typeof value !== 'function'))
      return
    if (value instanceof Uint8Array) return
    remember(value, key, paths)
    if (depth >= 3 || typeof value !== 'object' || Array.isArray(value)) return
    const proto = Object.getPrototypeOf(value)
    if (proto !== Object.prototype && proto !== null) return
    for (const property of Object.keys(value)) {
      if (!/^[A-Za-z_$][\w$]*$/.test(property)) continue
      let member: unknown
      try {
        member = (value as Record<string, unknown>)[property]
      } catch {
        continue
      }
      reach(member, `${key}.${property}`, depth + 1, paths)
    }
  }

  /** Keeps the shortest path for a value reachable at several, so the choice does not depend on load order. */
  function remember(
    value: object,
    key: string,
    paths: WeakMap<object, string>,
  ) {
    const existing = paths.get(value)
    if (
      existing === undefined ||
      key.length < existing.length ||
      (key.length === existing.length && key < existing)
    )
      paths.set(value, key)
  }

  function record(
    key: string,
    target: Function,
    self: unknown,
    args: unknown[],
  ) {
    const current = g.__uphillState!
    let entry = current.keys.get(key)
    if (!entry)
      current.keys.set(
        key,
        (entry = {
          calls: 0,
          direct: 0,
          directTries: 0,
          internalTries: 0,
          unreplayable: {},
          threw: 0,
          ok: new Map(),
          okLength: 0,
        }),
      )
    entry.calls++
    const depth = current.depth.getStore() ?? 0
    // A call from test code, rather than from another library function or a module's top level.
    const direct = depth === 0 && current.inTest
    if (direct) entry.direct++
    let encoded: string | undefined
    if (
      direct
        ? entry.directTries++ < directBudget
        : entry.internalTries++ < internalBudget
    )
      try {
        encoded = encode(args, {
          origin: (value) => current.produced.get(value),
          ref: (value) => created.refs.get(value),
          fixture: (value) => created.fixtures.get(value),
          sources: true,
        })
      } catch (error) {
        unreplayable(
          entry,
          error instanceof Unreplayable
            ? error.reason
            : 'passes arguments that cannot be read',
        )
      }
    const where = `${current.file} > ${current.test}`
    const settle = (ok: boolean, error?: unknown) => {
      if (encoded === undefined) return
      if (!ok) {
        entry.threw++
        if (entry.error === undefined) {
          entry.error = String(
            (error as { shortMessage?: string })?.shortMessage ??
              (error as Error)?.message ??
              error,
          )
            .split('\n')[0]!
            .slice(0, 200)
          entry.errorWhere = where
        }
        return
      }
      const sample = entry.ok.get(encoded)
      if (sample) {
        sample.n++
        sample.direct ||= direct
      } else if (
        entry.ok.size < keptPerFile &&
        entry.okLength + encoded.length <= keptLengthPerFile &&
        encoded.length <= maxEncodedLength
      ) {
        entry.ok.set(encoded, { n: 1, direct, where })
        entry.okLength += encoded.length
      }
    }
    let result: unknown
    try {
      result = current.depth.run(depth + 1, () =>
        Reflect.apply(target, self, args),
      )
    } catch (error) {
      settle(false, error)
      throw error
    }
    if (!isThenable(result)) {
      produce(result, { key, args })
      settle(true)
    } else
      result.then(
        (value) => {
          produce(value, { key, args, async: true })
          settle(true)
        },
        (error) => settle(false, error),
      )
    return result
  }

  /**
   * Remembers where an object or function came from, so a later call that passes it can be
   * replayed by making this call again. A call that returns what an inner call returned settles
   * after it, so the outermost call comes first. The objects and functions at the value's own
   * properties remember the call too, with their property, such as the `privateKey` of a key
   * pair or the key function `Keystore.pbkdf2` returns first, unless a call returned them itself.
   */
  function produce(value: unknown, origin: Origin) {
    if (Array.isArray(value)) {
      value.forEach((member, index) => {
        if (isObject(member) && !created.produced.has(member))
          add(member, { ...origin, path: [String(index)] })
      })
      return
    }
    if (!isObject(value)) return
    add(value, origin)
    if (typeof value !== 'object') return
    const proto = Object.getPrototypeOf(value)
    if (proto !== Object.prototype && proto !== null) return
    for (const property of Object.keys(value)) {
      let member: unknown
      try {
        member = (value as Record<string, unknown>)[property]
      } catch {
        continue
      }
      if (!isObject(member) || created.produced.has(member)) continue
      add(member, { ...origin, path: [property] })
    }
  }

  function add(value: object, origin: Origin) {
    const origins = created.produced.get(value)
    if (!origins) created.produced.set(value, [origin])
    else if (
      origins.length < maxOrigins &&
      !origins.some((existing) => existing.key === origin.key)
    )
      origins.unshift(origin)
  }

  function unreplayable(entry: Key, reason: string) {
    entry.unreplayable[reason] = (entry.unreplayable[reason] ?? 0) + 1
  }
}

/** An object or function a later call could pass, other than bytes and arrays. */
function isObject(value: unknown): value is object {
  return (
    typeof value === 'function' ||
    (typeof value === 'object' &&
      value !== null &&
      !Array.isArray(value) &&
      !(value instanceof Uint8Array))
  )
}

function isThenable(value: unknown): value is PromiseLike<unknown> {
  return (
    !!value &&
    (typeof value === 'object' || typeof value === 'function') &&
    typeof (value as PromiseLike<unknown>).then === 'function'
  )
}

function isClass(value: unknown) {
  return /^class[\s{]/.test(Function.prototype.toString.call(value))
}

/** A module namespace, or a plain object whose values are all functions or namespaces. */
function isNamespace(value: unknown, depth = 0): value is object {
  if (!value || typeof value !== 'object' || depth > 3) return false
  if (Object.prototype.toString.call(value) === '[object Module]') return true
  const proto = Object.getPrototypeOf(value)
  if (proto !== Object.prototype && proto !== null) return false
  try {
    const values = Object.values(value)
    return (
      values.length > 0 &&
      values.every(
        (item) => typeof item === 'function' || isNamespace(item, depth + 1),
      )
    )
  } catch {
    return false
  }
}

/**
 * Seeds `Math.random`, `crypto.getRandomValues`, and `crypto.randomUUID` from the test file's
 * path, so tests that make random keys, inputs, or keystore ids record the same arguments every
 * time the source is recorded. Keys WebCrypto generates stay random.
 */
function seedRandomness(file: string) {
  let seed = 2166136261
  for (let i = 0; i < file.length; i++)
    seed = Math.imul(seed ^ file.charCodeAt(i), 16777619)
  // mulberry32
  const next = () => {
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
  Math.random = next
  Object.defineProperty(globalThis.crypto, 'getRandomValues', {
    configurable: true,
    writable: true,
    value: <array extends ArrayBufferView | null>(array: array) => {
      if (!array) return array
      const bytes = new Uint8Array(
        array.buffer,
        array.byteOffset,
        array.byteLength,
      )
      for (let i = 0; i < bytes.length; i++) bytes[i] = (next() * 256) | 0
      return array
    },
  })
  Object.defineProperty(globalThis.crypto, 'randomUUID', {
    configurable: true,
    writable: true,
    value: () => {
      const hex = Array.from({ length: 32 }, () =>
        ((next() * 16) | 0).toString(16),
      ).join('')
      return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-4${hex.slice(13, 16)}-${(8 | (Number.parseInt(hex[16]!, 16) & 3)).toString(16)}${hex.slice(17, 20)}-${hex.slice(20)}`
    },
  })
}

/** Answers every request to a host other than this machine with a JSON-RPC "method not found" error. */
function blockNetwork() {
  const { fetch } = globalThis
  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = new URL(
      typeof input === 'string' || input instanceof URL ? input : input.url,
    )
    if (/^(localhost|127\.0\.0\.1|\[::1\])$/.test(url.hostname))
      return fetch(input, init)
    let id: unknown = 0
    try {
      id = JSON.parse(String(init?.body)).id ?? 0
    } catch {}
    return new Response(
      JSON.stringify({
        jsonrpc: '2.0',
        id,
        error: {
          code: -32601,
          message: 'uphill speed recording: no network',
        },
      }),
      { headers: { 'content-type': 'application/json' } },
    )
  }) as typeof fetch
}
