/**
 * Node process that `speed.ts` starts for each piece of measured work, so measured code runs
 * under Node, as ox's users run it, and every function is measured in a fresh process.
 *
 * - `node speed-worker.ts enumerate <in.json> <out.json>` walks every leaf entry point that
 *   `getExports()` in scripts/utils/exports.ts lists (in its order), lists each distinct public
 *   function, and maps each recorded key (`src/<file>.ts#<export>`) to the public function it is.
 *   Barrels, such as `ox` and `ox/tempo`, only re-export leaf modules as namespaces, so they are
 *   listed as entry points only.
 * - `node --expose-gc --single-threaded speed-worker.ts bench <job.json> <out.json>` replays one
 *   function with its recorded arguments and measures CPU time and heap bytes per call.
 *
 * Every call, for the cold number, starts with ox's caches empty: `Caches.clear()` runs before each
 * call that follows a write to them, and for a function that writes to them, it also runs in the
 * loop whose time is subtracted. The network is blocked, so a call that reaches for it fails
 * instead of measuring a round trip.
 *
 * @module
 */

import * as fs from 'node:fs'
import {
  createRequire,
  registerHooks,
  syncBuiltinESMExports,
} from 'node:module'
import * as path from 'node:path'
import { pathToFileURL } from 'node:url'
import * as v8 from 'node:v8'

import { getExports } from '../../scripts/utils/exports.ts'
import { decode, encode, keys, type Rebuild } from './speed-codec.ts'

const root = path.resolve(import.meta.dirname, '../..')
const [mode, input, output] = process.argv.slice(2)
/** Whether `loadTestHelpers` registered its hooks. */
const hooked = { helpers: false }

if (mode === 'enumerate') await enumerate()
else if (mode === 'bench') await bench()
else throw new Error(`Unknown mode: ${mode}`)
process.exit(0)

/**
 * The module a recorded key names: for `src/<file>.ts#<export>` its build in src/_esm, and for a
 * test helper, `test/<file>.ts#<export>`, the helper itself (see `loadTestHelpers`).
 */
function esmFile(key: string) {
  const file = key.slice(0, key.indexOf('#'))
  if (file.startsWith('test/')) {
    loadTestHelpers()
    return path.join(root, file)
  }
  return path.join(
    root,
    'src/_esm',
    file.replace(/^src\//, '').replace(/\.ts$/, '.js'),
  )
}

/** The value a recorded key names, following an export path such as `noble.CURVE`. */
async function resolve(key: string): Promise<unknown> {
  const exportPath = key.slice(key.indexOf('#') + 1)
  let value: unknown = await import(pathToFileURL(esmFile(key)).href).catch(
    () => null,
  )
  for (const part of exportPath.split('.'))
    value =
      value && (typeof value === 'object' || typeof value === 'function')
        ? (value as Record<string, unknown>)[part]
        : undefined
  return value
}

/**
 * Lets Node import ox's test helpers, such as test/kzg.ts, as vitest runs them: `ox` and its
 * subpaths resolve to the build in src/_esm, and `__dirname` and `__filename` are defined.
 */
function loadTestHelpers() {
  if (hooked.helpers) return
  hooked.helpers = true
  const test = pathToFileURL(path.join(root, 'test')).href
  registerHooks({
    resolve(specifier, context, nextResolve) {
      if (specifier === 'ox' || specifier.startsWith('ox/'))
        return nextResolve(
          pathToFileURL(
            path.join(root, 'src/_esm', specifier.slice(3), 'index.js'),
          ).href,
          context,
        )
      return nextResolve(specifier, context)
    },
    load(url, context, nextLoad) {
      const result = nextLoad(url, context)
      if (!url.startsWith(`${test}/`) || result.source === undefined)
        return result
      return {
        ...result,
        source: `const __dirname = import.meta.dirname, __filename = import.meta.filename;${String(result.source)}`,
      }
    },
  })
}

/**
 * The entry points that packages see, in `getExports()` order, without `./package.json`,
 * `./index.docs`, and the `*.test-d` files `getExports()` lists by mistake.
 */
function entryPoints() {
  const { dist, src } = getExports()
  const entries: {
    name: string
    file: string
    barrel: boolean
  }[] = []
  for (const [entry, target] of Object.entries(dist)) {
    if (typeof target === 'string') continue
    if (/(^|\/)index\.docs$|\.test-d$/.test(entry)) continue
    entries.push({
      name: entry === '.' ? 'ox' : `ox/${entry.slice(2)}`,
      file: path.join(root, 'src', target.import),
      barrel: /(^|\/)index\.ts$/.test(src[entry] ?? ''),
    })
  }
  return entries
}

async function enumerate() {
  const { keys } = JSON.parse(fs.readFileSync(input!, 'utf8')) as {
    keys: string[]
  }
  type Item = { name: string; entry: string; keys: string[] }
  const items: Item[] = []
  // Every public function's name, in order, and the item that measures it: a function another
  // entry exports too, such as `ox/Mnemonic:path`, is measured once, under its first name.
  const exports: { name: string; item: string }[] = []
  const byFunction = new Map<unknown, Item>()
  const seen = new Set<unknown>()
  const counts = { functions: 0, classes: 0, values: 0 }
  const entries = entryPoints()

  for (const entry of entries) {
    if (entry.barrel) continue
    const module = await import(pathToFileURL(entry.file).href)
    for (const [name, value] of Object.entries(module)) {
      const existing = byFunction.get(value)
      if (existing) {
        counts.functions++
        exports.push({ name: `${entry.name}:${name}`, item: existing.name })
        continue
      }
      if (seen.has(value)) continue
      if (value && (typeof value === 'object' || typeof value === 'function'))
        seen.add(value)
      if (typeof value !== 'function') counts.values++
      else if (isClass(value)) counts.classes++
      else {
        counts.functions++
        const item = {
          name: `${entry.name}:${name}`,
          entry: entry.name,
          keys: [],
        }
        items.push(item)
        exports.push({ name: item.name, item: item.name })
        byFunction.set(value, item)
      }
    }
  }

  const unmatched: string[] = []
  for (const key of keys) {
    const item = byFunction.get(await resolve(key))
    if (item) item.keys.push(key)
    else unmatched.push(key)
  }

  fs.writeFileSync(
    output!,
    JSON.stringify({ items, exports, counts, entries, unmatched }),
  )
}

type Candidate = { args: string; where: string; direct: boolean }
type Job = {
  name: string
  key: string
  candidates: Candidate[]
  sampleMs: number
  samples: number
  warmupMs: number
}

async function bench() {
  const job = JSON.parse(fs.readFileSync(input!, 'utf8')) as Job
  const write = (result: Record<string, unknown>) =>
    fs.writeFileSync(output!, JSON.stringify({ name: job.name, ...result }))
  process.on('unhandledRejection', () => {})
  const network = blockNetwork()
  const caches = await trackCaches()

  // The function, and every export whose calls or paths rebuild values in the arguments, such as
  // `WebCryptoP256.createKeyPair` for a `CryptoKey`.
  const exports = new Map<string, unknown>()
  for (const key of new Set([
    job.key,
    ...job.candidates.flatMap((candidate) => keys(candidate.args)),
  ]))
    exports.set(key, await resolve(key))
  const call = exports.get(job.key) as (...args: unknown[]) => unknown
  if (typeof call !== 'function')
    return write({ ok: false, error: `${job.key} is not a function` })
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

  // Every call starts with empty caches, as a first call with its input does; caches still work
  // within the call. `Caches.clear()` runs only after a call wrote to a cache, as clearing empty
  // maps costs more than many of ox's functions do.
  const reset = () => {
    if (caches.cold && caches.dirty) {
      caches.clear()
      caches.dirty = false
    }
  }

  // The first candidate that replays without throwing is the one measured.
  let chosen: Candidate | undefined
  let args: unknown[] = []
  let async = false
  let mutates = false
  let window = false
  let failure: string | undefined
  for (let index = 0; index < job.candidates.length; index++) {
    const candidate = job.candidates[index]!
    const origins = new Map<object, unknown>()
    // The arguments' encoding before and after the call, which differ when the call changed them.
    // A value rebuilt from a call, an export, or a source encodes as what rebuilt it.
    const snapshot = () => {
      try {
        return encode(replay, { known: (value) => origins.get(value) })
      } catch {
        return undefined
      }
    }
    let replay: unknown[] = []
    let before: string | undefined
    network.attempts = 0
    async = false
    try {
      replay = await decode(candidate.args, rebuild, origins)
      before = snapshot()
      caches.clear()
      caches.sets = 0
      const result = call(...replay)
      if (isThenable(result)) {
        async = true
        await withTimeout(result, 10_000)
      }
      // A call that recovers from the blocked network, say by retrying, measures the recovery.
      if (network.attempts) throw new Error('the network is disabled')
    } catch (error) {
      // ox's WebAuthn defaults, such as the relying party, read the browser's `window`, which
      // the tests stub; so does the replay, once one needs it.
      if (!window && /window is not defined/.test(message(error))) {
        window = true
        ;(globalThis as { window?: unknown }).window = {
          document: { title: 'My Website' },
          location: { hostname: 'example.com', origin: 'https://example.com' },
        }
        index--
        continue
      }
      failure ??= reachedNetwork(error)
        ? `replay needs the network (args from ${candidate.where})`
        : `replay threw: ${message(error)} (args from ${candidate.where})`
      continue
    }
    mutates = before === undefined || snapshot() !== before
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
  // second loop that only rebuilds them measures, and which is subtracted. Otherwise a loop that
  // calls nothing measures what measuring costs. Both clear the caches every time when the
  // function writes to them, as the measured loop then does. An async function's `await` stays
  // in, as its caller pays it.
  const clear = () => {
    if (caches.cold && cached) caches.clear()
  }
  const overhead = mutates
    ? makeLoop(() => undefined, [], false, chosen.args, fresh, clear)
    : makeLoop(() => undefined, args, false, undefined, fresh, clear)
  const subtract = async (count: number) => {
    const extra: number[] = []
    for (let i = 0; i < 3; i++)
      extra.push(((await time(overhead, count)).cpu * 1000) / count)
    return median(extra)
  }

  const { count, times } = await measure(loop, job, job.warmupMs * 1000)
  const ns = Math.max(0, median(times) - (await subtract(count)))

  const bytes = Math.max(
    0,
    (await allocated(loop, count)) - (await allocated(overhead, count)),
  )
  // The value is the cold-cache time; the note also gives the time once the caches hold the
  // input, as repeated calls with one input see.
  let warm: number | undefined
  if (cached) {
    caches.cold = false
    // The loop is warm by now.
    const measured = await measure(loop, job, 0)
    warm = Math.max(
      0,
      median(measured.times) - (await subtract(measured.count)),
    )
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
    noops: chosen.args.includes('"$noop":1'),
    window,
    cached,
    where: chosen.where,
    direct: chosen.direct,
  })
}

type Loop = (count: number) => unknown

/**
 * Grows the iteration count until one run of the loop takes about `sampleMs` of CPU time, and
 * keeps running it until three runs in a row agree within 15% and `warmup` µs of CPU time have
 * gone into it, so V8 has compiled the function and its callees, and sized its young generation,
 * before the `samples` timings (ns per call) are taken. With `--single-threaded` V8 compiles and
 * collects on this thread, so early runs can take several times longer than later ones: without
 * the warm-up, three runs of `Secp256k1.sign` agree after about 85 ms and its samples then range
 * from 260 to 510 µs; after 300 ms they agree within 3% at 230 µs, as noble's own `sign` does. A
 * call that waits, such as on a timer, takes wall time without CPU time, so a run is kept under
 * half a second of wall time.
 */
async function measure(loop: Loop, job: Job, warmup: number) {
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
    if (
      last.length === 3 &&
      Math.max(...last) / Math.min(...last) < 1.15 &&
      spent >= warmup
    )
      break
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
 * `Caches.clear()` from the build, and a count of writes to ox's LRU caches (`getAddress`'s
 * checksums, signature and type hashes), which marks a function whose warm time can differ.
 */
async function trackCaches() {
  const { clear } = await import(
    pathToFileURL(path.join(root, 'src/_esm/core/Caches.js')).href
  )
  const { LruMap } = await import(
    pathToFileURL(path.join(root, 'src/_esm/core/internal/lru.js')).href
  )
  const caches = {
    sets: 0,
    dirty: false,
    cold: true,
    clear: clear as () => void,
  }
  const set = LruMap.prototype.set
  LruMap.prototype.set = function (key: unknown, value: unknown) {
    caches.sets++
    caches.dirty = true
    return set.call(this, key, value)
  }
  return caches
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
  const require = createRequire(import.meta.url)
  const net = require('node:net')
  net.connect = net.createConnection = blocked
  for (const name of ['node:http', 'node:https']) {
    const http = require(name)
    http.request = http.get = blocked
  }
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
