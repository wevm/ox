/**
 * Node process that `speed.ts` starts for each piece of measured work, so measured code runs
 * under Node, as most of ox's users run it, and every function is measured in a fresh process.
 *
 * - `node speed-worker.ts enumerate <in.json> <out.json>` walks every entry point in
 *   package.json (see entries.ts), lists each distinct public function (namespace members), and
 *   maps each recorded key (`src/<file>.ts#<export path>`) to the public function it is.
 * - `node --expose-gc --single-threaded speed-worker.ts bench <job.json> <out.json>` replays one
 *   function with its recorded arguments and measures CPU time and heap bytes per call.
 *
 * The network is blocked, so a replay that reaches for it fails instead of timing a request. For
 * the cold number, ox's caches (`Caches.clear()`) are emptied before every call; the reset also
 * runs in the loop whose time is subtracted.
 *
 * @module
 */

import * as fs from 'node:fs'
import * as inspector from 'node:inspector/promises'
import { createRequire, syncBuiltinESMExports } from 'node:module'
import * as path from 'node:path'
import { pathToFileURL } from 'node:url'
import * as v8 from 'node:v8'

import { entries as listEntries } from './entries.ts'
import { decode, encode, keys, type Rebuild } from './speed-codec.ts'

const root = path.resolve(import.meta.dirname, '../..')
const [mode, input, output] = process.argv.slice(2)

if (mode === 'enumerate') await enumerate()
else if (mode === 'bench') await bench()
else throw new Error(`Unknown mode: ${mode}`)
process.exit(0)

/** The value a recorded key, `src/<file>.ts#<export path>`, names in the build in dist. */
async function resolve(key: string): Promise<unknown> {
  const [file, exportPath] = key.split('#') as [string, string]
  const built = path.join(
    root,
    'dist',
    file.replace(/^src\//, '').replace(/\.ts$/, '.js'),
  )
  let value: unknown = await import(pathToFileURL(built).href).catch(() => null)
  for (const part of exportPath.split('.'))
    value =
      value && (typeof value === 'object' || typeof value === 'function')
        ? (value as Record<string, unknown>)[part]
        : undefined
  return value
}

async function enumerate() {
  const { keys } = JSON.parse(fs.readFileSync(input!, 'utf8')) as {
    keys: string[]
  }
  type Item = {
    name: string
    entry: string
    keys: string[]
    package?: string | undefined
  }
  const items: Item[] = []
  const byFunction = new Map<unknown, Item>()
  const walked = new Set<unknown>()
  const counts = { functions: 0, errors: 0, classes: 0, values: 0, foreign: 0 }
  const entries: { name: string; file: string }[] = []

  const walk = (entry: string, name: string, value: unknown) => {
    if (typeof value === 'function') {
      if (isClass(value)) {
        if (!walked.has(value))
          counts[value.prototype instanceof Error ? 'errors' : 'classes']++
        walked.add(value)
        return
      }
      if (byFunction.has(value) || walked.has(value)) return
      counts.functions++
      const item = { name: `${entry}:${name}`, entry, keys: [] }
      items.push(item)
      byFunction.set(value, item)
      return
    }
    if (isNamespace(value)) {
      if (walked.has(value)) return
      walked.add(value)
      for (const [key, member] of Object.entries(value))
        walk(entry, name ? `${name}.${key}` : key, member)
      return
    }
    if (!walked.has(value)) counts.values++
    if (value && typeof value === 'object') walked.add(value)
  }

  for (const entry of listEntries()) {
    entries.push({ name: entry.name, file: entry.file })
    const module = await import(pathToFileURL(entry.file).href)
    if (walked.has(module)) continue
    walked.add(module)
    for (const [name, value] of Object.entries(module))
      walk(entry.name, name, value)
  }

  // Names the dependency, such as zod, that defines each function, and leaves those out: they are
  // re-exported for convenience, and benching them measures the dependency.
  const session = new inspector.Session()
  session.connect()
  const scripts = new Map<string, string>()
  session.on('Debugger.scriptParsed', ({ params }) =>
    scripts.set(params.scriptId, params.url),
  )
  await session.post('Debugger.enable')
  const probe = globalThis as { __uphillProbe?: unknown }
  for (const [fn, item] of byFunction) {
    probe.__uphillProbe = fn
    const { result } = await session.post('Runtime.evaluate', {
      expression: 'globalThis.__uphillProbe',
    })
    const { internalProperties } = await session.post('Runtime.getProperties', {
      objectId: result.objectId!,
    })
    const location = internalProperties?.find(
      (property) => property.name === '[[FunctionLocation]]',
    )?.value?.value as { scriptId: string } | undefined
    const url = location ? scripts.get(location.scriptId) : undefined
    // A built-in, such as `Error.captureStackTrace` that zod re-exports, has no location.
    item.package = url
      ? url.match(/.*\/node_modules\/((?:@[^/]+\/)?[^/]+)\//)?.[1]
      : 'built-in'
  }
  session.disconnect()
  for (const [fn, item] of [...byFunction])
    if (item.package) {
      byFunction.delete(fn)
      counts.foreign++
      counts.functions--
    }
  const own = items.filter((item) => !item.package)

  const unmatched: string[] = []
  for (const key of keys) {
    const item = byFunction.get(await resolve(key))
    if (item) item.keys.push(key)
    else unmatched.push(key)
  }

  fs.writeFileSync(
    output!,
    JSON.stringify({ items: own, counts, entries, unmatched }),
  )
}

type Candidate = { args: string; where: string; direct: boolean }
type Job = {
  name: string
  key: string
  candidates: Candidate[]
  sampleMs: number
  samples: number
}

async function bench() {
  const job = JSON.parse(fs.readFileSync(input!, 'utf8')) as Job
  const write = (result: Record<string, unknown>) =>
    fs.writeFileSync(output!, JSON.stringify({ name: job.name, ...result }))
  process.on('unhandledRejection', () => {})
  const network = blockNetwork()
  const caches = await trackCaches()

  // The function, and every export whose calls or paths rebuild values in the arguments.
  const exports = new Map<string, unknown>()
  for (const key of new Set([
    job.key,
    ...job.candidates.flatMap((candidate) => keys(candidate.args)),
  ]))
    exports.set(key, await resolve(key))
  let call = exports.get(job.key) as (...args: unknown[]) => unknown
  if (typeof call !== 'function')
    return write({ ok: false, error: `${job.key} is not a function` })
  // A method that uses `this` is called on its object, as the test called it.
  if (
    job.key.slice(job.key.indexOf('#')).includes('.') &&
    /\bthis\b/.test(Function.prototype.toString.call(call))
  )
    call = call.bind(await resolve(job.key.slice(0, job.key.lastIndexOf('.'))))
  const rebuild: Rebuild = {
    call: (key, args) => {
      const fn = exports.get(key)
      if (typeof fn !== 'function') throw new Error(`${key} is not a function`)
      return fn(...args)
    },
    construct: (key, args) => {
      const Class = exports.get(key)
      if (typeof Class !== 'function') throw new Error(`${key} is not a class`)
      return Reflect.construct(Class, args)
    },
    ref: (key) => exports.get(key),
  }

  // Every call starts with empty caches; caches still work within the call.
  const reset = () => {
    if (caches.cold) caches.clear()
  }

  // The first candidate that replays without throwing is the one measured.
  let chosen: Candidate | undefined
  let args: unknown[] = []
  let async = false
  let mutates = false
  let failure: string | undefined
  for (const candidate of job.candidates) {
    const origins = new Map<object, unknown>()
    let replay: unknown[] = []
    network.attempts = 0
    async = false
    try {
      replay = await decode(candidate.args, rebuild, origins)
      reset()
      caches.sets = 0
      const result = call(...replay)
      if (isThenable(result)) {
        async = true
        await withTimeout(result, 5_000)
      }
      // A call that recovers from the blocked network, say by retrying, measures the recovery.
      if (network.attempts) throw new Error('the network is disabled')
    } catch (error) {
      failure ??= reachedNetwork(error)
        ? `replay needs the network (args from ${candidate.where})`
        : `replay threw: ${message(error)} (args from ${candidate.where})`
      continue
    }
    mutates = (() => {
      try {
        return (
          encode(replay, { known: (value) => origins.get(value) }) !==
          candidate.args
        )
      } catch {
        return true
      }
    })()
    chosen = candidate
    args = mutates ? [] : replay
    break
  }
  if (!chosen) return write({ ok: false, error: failure })
  const cached = caches.sets > 0

  const fresh = (text: string) => decode(text, rebuild)
  const loop = makeLoop(
    call,
    args,
    async,
    mutates ? chosen.args : undefined,
    fresh,
    reset,
  )
  // Rebuilding the arguments of a function that mutates them costs time and memory, which a
  // second loop that only rebuilds them measures, and which is subtracted.
  const rebuilds = mutates
    ? makeLoop(() => undefined, [], false, chosen.args, fresh, reset)
    : undefined
  // Subtracts only what measuring costs, the reset included. An async function's `await` stays
  // in, as its caller pays it.
  const noop = makeLoop(() => undefined, args, false, undefined, fresh, reset)

  const { count, times } = await measure(loop, job)
  let ns = median(times)
  const extra: number[] = []
  for (let i = 0; i < 3; i++)
    extra.push(((await time(rebuilds ?? noop, count)).cpu * 1000) / count)
  ns = Math.max(0, ns - median(extra))

  const bytes = Math.max(
    0,
    (await allocated(loop, count)) - (await allocated(rebuilds ?? noop, count)),
  )
  // The value is the cold-cache time; the note also gives the time once the caches hold the
  // input, as repeated calls with one input see.
  let warm: number | undefined
  if (cached) {
    caches.cold = false
    warm = median((await measure(loop, job)).times)
    warm = Math.max(0, warm - (median(times) - ns))
  }
  write({
    ok: true,
    ns,
    warm,
    times,
    bytes,
    count,
    async,
    mutates,
    cached,
    where: chosen.where,
    direct: chosen.direct,
  })
}

type Loop = (count: number) => unknown

/**
 * Grows the iteration count until one run of the loop takes about `sampleMs` of CPU time, and
 * keeps running it until three runs in a row agree within 15%, so V8 has compiled the function
 * and its callees before the `samples` timings (ns per call) are taken. With `--single-threaded`
 * V8 compiles on this thread, so early runs can take several times longer than later ones. A call
 * that waits takes wall time without CPU time, so a run is kept under half a second of wall time.
 */
async function measure(loop: Loop, job: Job) {
  const target = job.sampleMs * 1000
  let count = 1
  let spent = 0
  let waited = 0
  const perCall: number[] = []
  for (;;) {
    const { cpu, wall } = await time(loop, count)
    spent += cpu
    waited += wall
    const most = Math.max(1, Math.floor((count * 500) / Math.max(wall, 1)))
    if (waited >= 5000) {
      count = Math.min(count, most)
      break
    }
    if (cpu < target / 2 && count < most) {
      count = Math.min(
        most,
        cpu < target / 20
          ? count * 10
          : Math.max(count + 1, Math.ceil((count * target) / Math.max(cpu, 1))),
      )
      continue
    }
    perCall.push(cpu / count)
    const last = perCall.slice(-3)
    if (last.length === 3 && Math.max(...last) / Math.min(...last) < 1.15) break
    if (spent >= 1_500_000) break
    count = Math.min(most, Math.max(1, Math.round(target / median(last))))
  }
  const times: number[] = []
  for (let i = 0; i < job.samples; i++)
    times.push(((await time(loop, count)).cpu * 1000) / count)
  return { count, times }
}

/**
 * A fresh loop per function keeps its call site monomorphic. With `text`, every call rebuilds its
 * arguments from it, for functions that mutate their arguments. `reset` runs before every call.
 */
function makeLoop(
  fn: (...args: unknown[]) => unknown,
  args: unknown[],
  async: boolean,
  text: string | undefined,
  decode: (text: string) => Promise<unknown[]>,
  reset: () => void,
): Loop {
  const params = args.map((_, i) => `a${i}`)
  // Rebuilding arguments is async, as rebuilding a value an async export returned awaits it.
  const call = text ? `fn(...(await decode(text)))` : `fn(${params.join(', ')})`
  return new Function(
    'fn',
    'args',
    'decode',
    'text',
    'reset',
    `const [${params.join(', ')}] = args
return ${async || text ? 'async ' : ''}function loop(count) {
  let result
  for (let i = 0; i < count; i++) {
    reset()
    result = ${async ? 'await ' : ''}${call}
  }
  return result
}`,
  )(fn, args, decode, text, reset)
}

/** CPU time of the whole process in µs, which `--single-threaded` keeps on this thread. */
async function time(loop: Loop, count: number) {
  const wall = performance.now()
  const start = process.cpuUsage()
  const result = loop(count)
  if (isThenable(result)) await result
  const { user, system } = process.cpuUsage(start)
  return { cpu: user + system, wall: performance.now() - wall }
}

/**
 * Heap bytes allocated per call: the growth of the used heap over the loop plus everything each
 * garbage collection during the loop freed, which `v8.GCProfiler` reports. Median of 3.
 */
async function allocated(loop: Loop, count: number) {
  const samples: number[] = []
  for (let i = 0; i < 3; i++) {
    globalThis.gc!()
    globalThis.gc!()
    const profiler = new v8.GCProfiler()
    profiler.start()
    const before = v8.getHeapStatistics().used_heap_size
    const result = loop(count)
    if (isThenable(result)) await result
    const after = v8.getHeapStatistics().used_heap_size
    let freed = 0
    for (const event of profiler.stop()?.statistics ?? [])
      freed +=
        event.beforeGC.heapStatistics.usedHeapSize -
        event.afterGC.heapStatistics.usedHeapSize
    samples.push((after - before + freed) / count)
  }
  return median(samples)
}

/**
 * Tracks writes to ox's caches (the checksum, signature hash, and type hash caches), so a cold call
 * can start with all of them empty while they still work within the call: a call that checksums
 * one address twice computes it once, as a first call with that input does. `sets` counts writes,
 * which mark a function as cached.
 */
async function trackCaches() {
  const { caches: all } = await import(
    pathToFileURL(path.join(root, 'dist/core/internal/caches.js')).href
  )
  const tracked = {
    sets: 0,
    cold: true,
    clear: () => {
      for (const cache of Object.values(all) as { clear(): void }[])
        cache.clear()
    },
  }
  for (const cache of Object.values(all) as {
    set(key: unknown, value: unknown): unknown
  }[]) {
    const set = cache.set
    cache.set = function (key: unknown, value: unknown) {
      tracked.sets++
      return set.call(this, key, value)
    }
  }
  return tracked
}

/** A replayed call that reaches for the network throws instead. */
function blockNetwork() {
  const network = { attempts: 0 }
  const blocked = () => {
    network.attempts++
    throw new Error('the network is disabled in the speed bench')
  }
  globalThis.fetch = (async () => blocked()) as unknown as typeof fetch
  ;(globalThis as { WebSocket?: unknown }).WebSocket = class {
    constructor() {
      blocked()
    }
  }
  const net = createRequire(import.meta.url)('node:net')
  net.connect = net.createConnection = blocked
  syncBuiltinESMExports()
  return network
}

function withTimeout(promise: PromiseLike<unknown>, ms: number) {
  let timer: NodeJS.Timeout | undefined
  return Promise.race([
    promise,
    new Promise((_, reject) => {
      timer = setTimeout(
        () => reject(new Error(`did not settle within ${ms / 1000}s`)),
        ms,
      )
    }),
  ]).finally(() => clearTimeout(timer))
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
  const values = Object.values(value)
  return (
    values.length > 0 &&
    values.every(
      (item) => typeof item === 'function' || isNamespace(item, depth + 1),
    )
  )
}

/** Whether an error, or an error it wraps, is `blockNetwork`'s. */
function reachedNetwork(error: unknown): boolean {
  for (let cause = error, depth = 0; cause && depth < 10; depth++) {
    if (/network is disabled/.test(String((cause as Error).message)))
      return true
    cause = (cause as Error).cause
  }
  return false
}

function message(error: unknown) {
  const text = String(
    (error as { shortMessage?: string })?.shortMessage ??
      (error as Error)?.message ??
      error,
  )
  return text.split('\n')[0]!.slice(0, 160)
}

function median(values: number[]) {
  const sorted = [...values].sort((a, b) => a - b)
  const middle = sorted.length >> 1
  return sorted.length % 2
    ? sorted[middle]!
    : (sorted[middle - 1]! + sorted[middle]!) / 2
}
