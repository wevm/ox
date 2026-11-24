/**
 * Vitest setup file for recording. It installs `globalThis.__uphillWrap`, which the transform in
 * `speed-vitest.config.ts` calls on every export of `src/**`, and writes what the wrapped functions
 * were called with to `$UPHILL_SPEED_RECORD_DIR/<pid>.jsonl` after each test file.
 *
 * A value a wrapped export returned remembers that call, so a later call that passes it, such as
 * a key pair from `WebCryptoP256.createKeyPair`, records the call that rebuilds it; an instance of
 * an exported class, such as an error, remembers its construction. Every value an export reaches,
 * such as a zod schema or a constant, remembers that path (see speed-codec.ts).
 *
 * Tests reach the local anvil the global setup starts. A request to any other host gets a "method
 * not found" error, so no test reaches the network and recordings repeat. It seeds `Math.random`
 * and `crypto.getRandomValues` per test file for the same reason.
 *
 * @module
 */

import { AsyncLocalStorage } from 'node:async_hooks'
import * as fs from 'node:fs'
import * as path from 'node:path'
import { afterAll, afterEach, beforeEach, expect } from 'vitest'

import { encode, type Origin, Unreplayable } from './speed-codec.ts'

/** Argument sets encoded per function and test file, for calls made from test code. */
const directBudget = 200
/** Argument sets encoded per function and test file, for calls made by other ox functions. */
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
/** A recorded call in progress. */
type Frame = { depth: number; done: boolean }
type State = {
  keys: Map<string, Key>
  file: string
  test: string
  inTest: boolean
  frames: AsyncLocalStorage<Frame>
  proxies: WeakMap<object, Map<string, unknown>>
  /** The calls that returned each object or function a wrapped export returned, outermost first. */
  produced: WeakMap<object, Origin[]>
  /** The export path of each value an export reaches. */
  refs: WeakMap<object, string>
}

const root = path.resolve(import.meta.dirname, '../..')
const g = globalThis as typeof globalThis & {
  __uphillState?: State
  __uphillWrap?: (value: unknown, file: string, name: string) => unknown
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
        ...value,
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
    frames: new AsyncLocalStorage<Frame>(),
    proxies: new WeakMap(),
    produced: new WeakMap(),
    refs: new WeakMap(),
  }
  g.__uphillWrap = (value, file, name) => {
    const key = `${file}#${name}`
    if (value && typeof value === 'object') reach(value, key, 0)
    return wrap(value, key)
  }
  blockNetwork()
  return created

  function wrap(value: unknown, key: string): unknown {
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
      remember(value, key)
      remember(proxy as object, key)
    }
    return proxy
  }

  /** Remembers the export path of an exported object and of the values its properties hold. */
  function reach(value: unknown, key: string, depth: number) {
    if (!value || (typeof value !== 'object' && typeof value !== 'function'))
      return
    if (value instanceof Uint8Array) return
    remember(value, key)
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
      reach(member, `${key}.${property}`, depth + 1)
    }
  }

  /** Keeps the shortest path for a value reachable at several, so the choice does not depend on load order. */
  function remember(value: object, key: string) {
    const existing = created.refs.get(value)
    if (
      existing === undefined ||
      key.length < existing.length ||
      (key.length === existing.length && key < existing)
    )
      created.refs.set(value, key)
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
    const parent = current.frames.getStore()
    const depth = parent?.depth ?? 0
    // A call from test code, rather than from another ox function or a module's top level.
    const direct = depth === 0 && current.inTest
    if (direct) entry.direct++
    const frame: Frame = { depth: depth + 1, done: false }
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
      if (frame.done) return
      frame.done = true
      if (encoded === undefined) return
      if (!ok) {
        entry.threw++
        if (entry.error === undefined) {
          entry.error = String(
            (error as { shortMessage?: string })?.shortMessage ??
              (error as Error)?.message ??
              error,
          ).slice(0, 200)
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
        entry.okLength + encoded.length <= keptLengthPerFile
      ) {
        entry.ok.set(encoded, { n: 1, direct, where })
        entry.okLength += encoded.length
      }
    }
    let result: unknown
    try {
      result = current.frames.run(frame, () =>
        Reflect.apply(target, self, args),
      )
    } catch (error) {
      settle(false, error)
      throw error
    }
    const thenable =
      !!result && typeof (result as Promise<unknown>).then === 'function'
    if (!thenable) {
      produce(result, { key, args })
      settle(true)
    } else
      (result as Promise<unknown>).then(
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
   * after it, so the outermost call comes first.
   */
  function produce(value: unknown, origin: Origin) {
    if (
      typeof value !== 'function' &&
      (typeof value !== 'object' ||
        value === null ||
        Array.isArray(value) ||
        value instanceof Uint8Array)
    )
      return
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
 * Seeds `Math.random` and `crypto.getRandomValues` from the test file's path, so tests that make
 * random keys or inputs record the same arguments every time the source is recorded.
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
}

/** Answers every request to a host other than this machine with a "method not found" error. */
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
