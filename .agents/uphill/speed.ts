/**
 * Writes ox's speed metrics: for every public function, the CPU time and heap bytes of one call
 * replaying the arguments ox's own tests call it with, and whether it could be benched; and for
 * every entry point, barrels included, the CPU time to import it and the heap it holds afterwards.
 *
 * 1. Record. `speed-vitest.config.ts` runs ox's `core` and `tempo-unit` test projects, the unit
 *    tests of `tmp_frames`, and `speed-calls.test.ts` under vitest, with the global setup that
 *    starts anvil, and wraps every export of ox's public modules to record the arguments of each
 *    call and whether it returned or resolved. Anvil forks mainnet through `forkProxy`, which
 *    caches what mainnet nodes answer and falls back across public nodes. The recording is cached
 *    in node_modules/.cache/uphill-speed by a hash of src/, test/, the lockfile, and the recorder's
 *    scripts, and Uphill's five runs share one recording; its format is described at the top of
 *    speed-codec.ts. Without anvil the tests that need it fail at once, and fewer functions are
 *    benched.
 * 2. Enumerate. `speed-worker.ts enumerate` walks each leaf entry point `getExports()` lists (in
 *    its order) and maps every recorded export to the public function it is. A function exported
 *    from several entries, such as `ox/HdKey:path` and `ox/Mnemonic:path`, is measured once,
 *    under the first, and the others repeat its values with a note naming it. Lines name each
 *    function the way users import it, such as `ox:HdKey.path` (see names.ts), and each entry
 *    point by its specifier.
 * 3. Replay. `speed-worker.ts bench` replays each function in a fresh Node process, sharded across
 *    `UPHILL_CONCURRENCY` processes at a time (default 2). Import probes run in the same pool.
 *
 * Measured code runs from src/_esm under Node with `--single-threaded`, so V8's garbage collection
 * and compiler work run on the main thread and `process.cpuUsage()` counts only what the call
 * costs. ox's caches are emptied with `Caches.clear()` before every call, so `Address.checksum` and
 * the functions that call it measure their full work, as a first call with an input does (a call
 * that checksums one address twice still computes it once); the note gives the time with the
 * caches warm too.
 *
 * @module
 */

import * as crypto from 'node:crypto'
import * as fs from 'node:fs'
import * as os from 'node:os'
import * as path from 'node:path'
import { hot } from './hot.ts'
import { rename } from './names.ts'

const root = path.resolve(import.meta.dir, '../..')
const here = import.meta.dir
const metricsFile = process.env.UPHILL_METRICS
if (!metricsFile) throw new Error('UPHILL_METRICS is not set.')
const concurrency = Math.max(1, Number(process.env.UPHILL_CONCURRENCY) || 2)
const node = Bun.which('node')
if (!node) throw new Error('node is not on PATH.')

/** CPU time one timing sample takes. */
const sampleMs = 20
/** Least CPU time a function runs before its samples, so V8 has settled (see speed-worker.ts). */
const warmupMs = 300
/** Timing samples per function; their median is the value. */
const samples = 5
/** Fresh processes per entry point for import time and memory; their median is the value. */
const importRuns = 5
/** Recorded argument sets tried per function until one replays. */
const candidatesPerFunction = 4
/** Distinct successful argument sets kept per function in the recording, and their total length. */
const keptPerFunction = 48
const keptLengthPerFunction = 5_000_000
/** A replay that takes longer is stopped and fails `benched`. */
const jobTimeoutMs = 60_000
/** Changes whenever the recording's format or meaning changes, which invalidates the cache. */
const recordingVersion = 1

type Sample = { args: string; n: number; direct: boolean; where: string }
type Key = {
  calls: number
  direct: number
  unreplayable: Record<string, number>
  threw: number
  error?: string | undefined
  errorWhere?: string | undefined
  ok: Sample[]
}
type TestFile = {
  file: string
  status: string
  passed: number
  failed: number
  skipped: number
}
type Recording = {
  version: number
  hash: string
  createdAt: string
  seconds: number
  concurrency: number
  files: TestFile[]
  keys: Record<string, Key>
}
type Item = { name: string; entry: string; keys: string[] }
type Enumeration = {
  items: Item[]
  exports: { name: string; item: string }[]
  counts: { functions: number; classes: number; values: number }
  entries: { name: string; file: string; barrel: boolean }[]
  unmatched: string[]
}

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'uphill-speed-'))
try {
  await main()
} finally {
  fs.rmSync(tmp, { recursive: true, force: true })
}

async function main() {
  const started = performance.now()
  const recording = await loadRecording()

  const enumeration = await enumerate(Object.keys(recording.keys))
  const { items } = enumeration
  log(
    `Public functions: ${enumeration.counts.functions} exported by ${enumeration.entries.filter((entry) => !entry.barrel).length} leaf entries, ${items.length} distinct; ${enumeration.counts.classes} classes and ${enumeration.counts.values} other values are not benched.`,
  )

  const lines: string[] = []
  const failures = new Map<string, string>()
  const jobs: { item: Item; candidates: Sample[] }[] = []
  for (const item of items) {
    const merged = mergeKeys(item.keys.map((key) => recording.keys[key]!))
    if (!merged?.ok.length) failures.set(item.name, whyNot(merged))
    else jobs.push({ item, candidates: pick(merged.ok) })
  }

  const replayStarted = performance.now()
  const tasks: (() => Promise<void>)[] = []
  const imports = new Map<string, { cpu: number; heap: number }[]>()
  for (const entry of enumeration.entries)
    for (let run = 0; run < importRuns; run++)
      tasks.push(async () => {
        const result = await importProbe(entry.file)
        if (!imports.has(entry.name)) imports.set(entry.name, [])
        imports.get(entry.name)!.push(result)
      })
  const results = new Map<string, BenchResult>()
  for (const [index, job] of jobs.entries())
    tasks.push(async () => {
      results.set(job.item.name, await benchProbe(index, job))
    })
  await pool(shuffle(tasks), concurrency)
  const replaySeconds = (performance.now() - replayStarted) / 1000

  for (const entry of enumeration.entries) {
    const runs = imports.get(entry.name) ?? []
    if (runs.length < importRuns)
      throw new Error(`Importing ${entry.name} failed.`)
    const note = entry.barrel ? ' note "barrel"' : ''
    lines.push(
      `import-time ${quote(entry.name)} ${formatTime(median(runs.map((run) => run.cpu)) * 1000)}${note}`,
      `import-memory ${quote(entry.name)} ${formatSize(median(runs.map((run) => run.heap)))}${note}`,
    )
  }

  const reasons = new Map<string, number>()
  for (const { name: leaf, item } of enumeration.exports) {
    const result = results.get(item)
    const name = rename(leaf)
    const same = leaf === item ? [] : [`the same function as ${rename(item)}`]
    if (result?.ok) {
      const notes = [
        ...same,
        result.direct
          ? `args from ${result.where}`
          : `args from a call another ox function made in ${result.where}`,
      ]
      if (result.async) notes.push('awaited')
      if (result.cached)
        notes.push(
          `caches emptied before each call${result.warm === undefined ? '' : ` (${formatTime(result.warm)} with them warm)`}`,
        )
      if (result.mutates)
        notes.push('mutates its arguments, so they are rebuilt per call')
      if (result.window)
        notes.push('runs with a stub window, as the WebAuthn tests do')
      if (result.noops)
        notes.push(
          "the test's event callbacks, such as onProgress, replay as no-ops",
        )
      const note = quote(notes.join('; '))
      lines.push(
        `call-time ${quote(name)} ${formatTime(result.ns)} note ${note}`,
        `call-memory ${quote(name)} ${formatSize(result.bytes)} note ${note}`,
        `benched ${quote(name)} pass note ${note}`,
      )
      continue
    }
    const reason = result
      ? (result.error ?? 'replay failed')
      : failures.get(item)!
    if (leaf === item)
      reasons.set(category(reason), (reasons.get(category(reason)) ?? 0) + 1)
    lines.push(
      `benched ${quote(name)} fail note ${quote([...same, reason].join('; '))}`,
    )
  }
  fs.appendFileSync(metricsFile!, `${[...lines, ...hot(lines)].join('\n')}\n`)

  const benched = [...results.values()].filter((result) => result.ok).length
  const missing = [...reasons]
    .sort((a, b) => b[1] - a[1])
    .map(([reason, count]) => `${count} ${reason}`)
  log(
    `Benched ${benched} of ${items.length} public functions${missing.length ? `; not benched: ${missing.join(', ')}` : ''}.`,
  )
  log(
    `Replayed ${jobs.length} functions and imported ${enumeration.entries.length} entry points ${importRuns} times in ${replaySeconds.toFixed(0)}s at concurrency ${concurrency}; ${((performance.now() - started) / 1000).toFixed(0)}s in all.`,
  )
}

/** Loads the cached recording for the current source, or records and caches it. */
async function loadRecording(): Promise<Recording> {
  const hash = hashInputs()
  const cacheDir = path.join(root, 'node_modules/.cache/uphill-speed')
  const cacheFile = path.join(cacheDir, `recording-${hash}.json`)
  if (fs.existsSync(cacheFile)) {
    const recording = JSON.parse(
      fs.readFileSync(cacheFile, 'utf8'),
    ) as Recording
    log(
      `Using the recording cached at ${path.relative(root, cacheFile)} (${recording.createdAt}).`,
    )
    summarizeRecording(recording)
    return recording
  }

  fs.mkdirSync(cacheDir, { recursive: true })
  const dir = path.join(tmp, 'record')
  fs.mkdirSync(dir)
  const logFile = path.join(cacheDir, `recording-${hash}.log`)
  log(
    `Recording calls from ox's tests (vitest, ${concurrency} workers); log in ${path.relative(root, logFile)}.`,
  )
  const started = performance.now()
  const out = fs.openSync(logFile, 'w')
  const report = path.join(tmp, 'vitest.json')
  const fork = forkProxy(path.join(cacheDir, 'fork-rpc.json'))
  const child = Bun.spawn(
    [
      node!,
      // The machine is shared; a capped heap collects sooner instead of growing.
      '--max-old-space-size=1024',
      'node_modules/vitest/vitest.mjs',
      'run',
      '--config',
      path.join(here, 'speed-vitest.config.ts'),
      '--reporter=dot',
      '--reporter=json',
      `--outputFile.json=${report}`,
    ],
    {
      cwd: root,
      env: {
        ...process.env,
        // foundryup installs anvil here without putting it on PATH.
        PATH: [process.env.PATH, path.join(os.homedir(), '.foundry/bin')]
          .filter(Boolean)
          .join(path.delimiter),
        // Snapshots a test lacks are not written into ox's test files.
        CI: 'true',
        VITE_ANVIL_FORK_URL: fork.url,
        UPHILL_SPEED_RECORD_DIR: dir,
        UPHILL_SPEED_RECORD_WORKERS: String(concurrency),
      },
      stdout: out,
      stderr: out,
    },
  )
  await child.exited
  fs.closeSync(out)
  fork.stop()
  if (!fs.existsSync(report)) {
    const tail = fs.readFileSync(logFile, 'utf8').split('\n').slice(-40)
    process.stderr.write(`${tail.join('\n')}\n`)
    throw new Error(
      `Recording wrote no report (vitest exited with ${child.exitCode}).`,
    )
  }
  const seconds = (performance.now() - started) / 1000

  const chunks = fs.readdirSync(dir).filter((file) => file.endsWith('.jsonl'))
  if (!chunks.length) throw new Error('Recording wrote nothing.')

  // Merged in test file order, whichever worker ran each file, and trimmed as they grow.
  const lines = chunks
    .flatMap((chunk) =>
      fs.readFileSync(path.join(dir, chunk), 'utf8').split('\n'),
    )
    .filter(Boolean)
    .map((line) => ({
      line,
      file: line.match(/^\{"file":"([^"]*)"/)?.[1] ?? '',
    }))
    .sort((a, b) => (a.file < b.file ? -1 : a.file > b.file ? 1 : 0))
  const keys: Record<string, Key> = {}
  for (const { line } of lines) {
    const { keys: recorded } = JSON.parse(line) as {
      keys: Record<string, Key>
    }
    for (const [key, value] of Object.entries(recorded)) {
      const merged = mergeKeys([keys[key], value])!
      if (merged.ok.length > 2 * keptPerFunction) merged.ok = trim(merged.ok)
      keys[key] = merged
    }
  }
  lines.length = 0
  for (const value of Object.values(keys)) value.ok = trim(value.ok)

  const files = readReport(report)
    .map((result) => {
      const count = (status: string) =>
        result.assertionResults.filter((test) => test.status === status).length
      return {
        file: path.relative(root, result.name),
        status: result.status,
        passed: count('passed'),
        failed: count('failed'),
        skipped:
          result.assertionResults.length - count('passed') - count('failed'),
      }
    })
    .sort((a, b) => a.file.localeCompare(b.file))

  const recording: Recording = {
    version: recordingVersion,
    hash,
    createdAt: new Date().toISOString(),
    seconds,
    concurrency,
    files,
    keys: Object.fromEntries(
      Object.entries(keys).sort(([a], [b]) => (a < b ? -1 : 1)),
    ),
  }
  const partial = `${cacheFile}.${process.pid}`
  fs.writeFileSync(partial, JSON.stringify(recording))
  fs.renameSync(partial, cacheFile)
  log(`Recorded to ${path.relative(root, cacheFile)}.`)
  // Keep the three newest recordings, so switching branches does not always re-record.
  const old = fs
    .readdirSync(cacheDir)
    .filter((file) => /^recording-[0-9a-f]+\.json$/.test(file))
    .map((file) => path.join(cacheDir, file))
    .sort((a, b) => fs.statSync(b).mtimeMs - fs.statSync(a).mtimeMs)
    .slice(3)
  for (const file of old) {
    fs.rmSync(file, { force: true })
    fs.rmSync(file.replace(/\.json$/, '.log'), { force: true })
  }
  summarizeRecording(recording)
  return recording
}

/**
 * A JSON-RPC server for anvil to fork from, which answers each request from a cache of what
 * mainnet nodes answered, kept in `file` across recordings, and asks upstream only for requests it
 * has not seen. ox's tests fork mainnet at a fixed block, whose state never changes, so the cached
 * answers stay right and recordings repeat. Upstream is `VITE_ANVIL_FORK_URL` or thirdweb, as in
 * test/prool.ts, then other public archive nodes, each tried in turn, with backoff between rounds,
 * when one is rate limited or lacks the state, so a public node's rate limit does not fail the
 * tests that use anvil.
 */
function forkProxy(file: string) {
  const upstreams = [
    process.env.VITE_ANVIL_FORK_URL ?? 'https://1.rpc.thirdweb.com',
    'https://eth.drpc.org',
    'https://rpc.mevblocker.io',
    'https://eth-mainnet.public.blastapi.io',
  ]
  type Answer = { result?: unknown; error?: { code?: number } | undefined }
  const cache = new Map<string, Answer>(
    fs.existsSync(file)
      ? Object.entries(JSON.parse(fs.readFileSync(file, 'utf8')))
      : [],
  )
  const pending = new Map<string, Promise<Answer>>()
  const stats = { cached: 0, fetched: 0, failed: 0 }
  const ask = async (method: string, params: unknown): Promise<Answer> => {
    let last: Answer = { error: { code: -32603 } }
    for (let round = 0; round < 4; round++) {
      if (round) await Bun.sleep(500 * 2 ** round)
      for (const upstream of upstreams) {
        const body = await fetch(upstream, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }),
          signal: AbortSignal.timeout(10_000),
        })
          .then((response) => (response.ok ? response.json() : undefined))
          .catch(() => undefined)
        if (!body || typeof body !== 'object') continue
        const { result, error } = body as Answer
        if (error === undefined) return { result }
        // "Method not found" is the answer, as when anvil asks whether upstream is anvil. Any
        // other error, such as a rate limit or missing historical state, is one node's.
        last = { error }
        if (error.code === -32601) return last
      }
    }
    return { ...last, failed: true } as Answer
  }
  const answer = (method: string, params: unknown) => {
    const key = `${method}\0${JSON.stringify(params ?? [])}`
    const cached = cache.get(key)
    if (cached) {
      stats.cached++
      return cached
    }
    let promise = pending.get(key)
    if (!promise) {
      promise = ask(method, params).then(
        ({ failed, ...value }: Answer & { failed?: boolean }) => {
          pending.delete(key)
          if (failed) stats.failed++
          else {
            cache.set(key, value)
            stats.fetched++
          }
          return value
        },
      )
      pending.set(key, promise)
    }
    return promise
  }
  type Request = { id?: unknown; method: string; params?: unknown }
  const server = Bun.serve({
    hostname: '127.0.0.1',
    port: 0,
    idleTimeout: 0,
    async fetch(request) {
      const body = (await request.json()) as Request | Request[]
      const requests = Array.isArray(body) ? body : [body]
      const responses = await Promise.all(
        requests.map(async ({ id, method, params }) => ({
          jsonrpc: '2.0',
          id,
          ...(await answer(method, params)),
        })),
      )
      return Response.json(Array.isArray(body) ? responses : responses[0])
    },
  })
  return {
    url: `http://127.0.0.1:${server.port}`,
    stop() {
      server.stop(true)
      log(
        `Anvil's fork: ${stats.cached} requests answered from ${path.relative(root, file)}, ${stats.fetched} from mainnet nodes, ${stats.failed} failed.`,
      )
      if (!stats.fetched) return
      fs.writeFileSync(
        `${file}.${process.pid}`,
        JSON.stringify(Object.fromEntries(cache)),
      )
      fs.renameSync(`${file}.${process.pid}`, file)
    },
  }
}

/** The test files of a vitest JSON report. */
function readReport(report: string) {
  return (
    JSON.parse(fs.readFileSync(report, 'utf8')) as {
      testResults: {
        name: string
        status: string
        assertionResults: { status: string }[]
      }[]
    }
  ).testResults
}

function summarizeRecording(recording: Recording) {
  const { files, keys } = recording
  const sum = (field: 'passed' | 'failed' | 'skipped') =>
    files.reduce((total, file) => total + file[field], 0)
  const failedFiles = files.filter((file) => file.status !== 'passed').length
  const values = Object.values(keys)
  const calls = values.reduce((total, key) => total + key.calls, 0)
  const replayable = values.filter((key) => key.ok.length).length
  log(
    `Recording: ${files.length} test files ran (${files.length - failedFiles} passed, ${failedFiles} failed or errored); ${sum('passed')} tests passed, ${sum('failed')} failed, ${sum('skipped')} skipped. ${calls} calls to ${values.length} exports were recorded, ${replayable} with a replayable successful call. Recording took ${recording.seconds.toFixed(0)}s at concurrency ${recording.concurrency}.`,
  )
}

/** Hashes everything the recording depends on: the source, the tests, the lockfile, and the recorder. */
function hashInputs() {
  const files: string[] = []
  const visit = (dir: string) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const file = path.join(dir, entry.name)
      if (/^(_esm|_cjs|_types|node_modules)$|\.tsbuildinfo$/.test(entry.name))
        continue
      if (entry.isDirectory()) visit(file)
      else if (entry.isFile()) files.push(file)
    }
  }
  visit(path.join(root, 'src'))
  visit(path.join(root, 'test'))
  for (const file of [
    'pnpm-lock.yaml',
    '.agents/uphill/speed-calls.test.ts',
    '.agents/uphill/speed-codec.ts',
    '.agents/uphill/speed-record-setup.ts',
    '.agents/uphill/speed-vitest.config.ts',
  ])
    if (fs.existsSync(path.join(root, file))) files.push(path.join(root, file))
  files.sort()
  const hash = crypto.createHash('sha256')
  hash.update(
    `${recordingVersion}\0${Bun.spawnSync([node!, '--version']).stdout}`,
  )
  for (const file of files) {
    hash.update(`${path.relative(root, file)}\0`)
    hash.update(fs.readFileSync(file))
    hash.update('\0')
  }
  return hash.digest('hex').slice(0, 16)
}

async function enumerate(keys: string[]): Promise<Enumeration> {
  const input = path.join(tmp, 'keys.json')
  const output = path.join(tmp, 'enumeration.json')
  fs.writeFileSync(input, JSON.stringify({ keys }))
  const result = await run(
    [node!, path.join(here, 'speed-worker.ts'), 'enumerate', input, output],
    120_000,
  )
  if (result.code !== 0 || !fs.existsSync(output)) {
    process.stderr.write(result.stderr)
    throw new Error('Enumerating public functions failed.')
  }
  return JSON.parse(fs.readFileSync(output, 'utf8'))
}

type BenchResult = {
  ok: boolean
  error?: string
  ns: number
  warm?: number | undefined
  bytes: number
  async: boolean
  mutates: boolean
  noops?: boolean | undefined
  window?: boolean | undefined
  cached: boolean
  where: string
  direct: boolean
}

async function benchProbe(
  index: number,
  job: { item: Item; candidates: Sample[] },
): Promise<BenchResult> {
  const input = path.join(tmp, `job-${index}.json`)
  const output = path.join(tmp, `result-${index}.json`)
  fs.writeFileSync(
    input,
    JSON.stringify({
      name: job.item.name,
      key: job.item.keys[0],
      candidates: job.candidates.map(({ args, where, direct }) => ({
        args,
        where,
        direct,
      })),
      sampleMs,
      samples,
      warmupMs,
    }),
  )
  const result = await run(
    [
      node!,
      '--expose-gc',
      '--single-threaded',
      '--max-old-space-size=512',
      path.join(here, 'speed-worker.ts'),
      'bench',
      input,
      output,
    ],
    jobTimeoutMs,
  )
  if (fs.existsSync(output))
    return JSON.parse(fs.readFileSync(output, 'utf8')) as BenchResult
  const error = result.timedOut
    ? `replay timed out after ${jobTimeoutMs / 1000}s (args from ${job.candidates[0]!.where})`
    : `replay crashed: ${lastLine(result.stderr)} (args from ${job.candidates[0]!.where})`
  return { ok: false, error } as BenchResult
}

/** Imports one entry point in a fresh Node process, measuring inside it, so startup does not count. */
async function importProbe(file: string) {
  const script = `
const v8 = await import('node:v8')
gc(); gc()
const heap = v8.getHeapStatistics().used_heap_size
const start = process.cpuUsage()
await import(process.argv[1])
const { user, system } = process.cpuUsage(start)
gc(); gc()
process.stdout.write(JSON.stringify({ cpu: user + system, heap: v8.getHeapStatistics().used_heap_size - heap }))`
  const result = await run(
    [
      node!,
      '--expose-gc',
      '--single-threaded',
      '--input-type=module',
      '-e',
      script,
      Bun.pathToFileURL(file).href,
    ],
    jobTimeoutMs,
  )
  if (result.code !== 0) {
    process.stderr.write(result.stderr)
    throw new Error(`Importing ${file} failed.`)
  }
  // CPU time in µs, heap in bytes.
  return JSON.parse(result.stdout) as { cpu: number; heap: number }
}

async function run(command: string[], timeoutMs: number) {
  const child = Bun.spawn(command, {
    cwd: root,
    stdout: 'pipe',
    stderr: 'pipe',
  })
  let timedOut = false
  const timer = setTimeout(() => {
    timedOut = true
    child.kill('SIGKILL')
  }, timeoutMs)
  const [stdout, stderr] = await Promise.all([
    new Response(child.stdout).text(),
    new Response(child.stderr).text(),
  ])
  await child.exited
  clearTimeout(timer)
  return { code: child.exitCode, stdout, stderr, timedOut }
}

async function pool(tasks: (() => Promise<void>)[], size: number) {
  let next = 0
  await Promise.all(
    Array.from({ length: Math.min(size, tasks.length) }, async () => {
      while (next < tasks.length) await tasks[next++]!()
    }),
  )
}

/** Mixes import probes with replays, so no entry point's runs all share one stretch of load. */
function shuffle<value>(values: value[]) {
  let seed = 1
  const random = () => {
    seed = (seed * 16807) % 2147483647
    return seed / 2147483647
  }
  for (let i = values.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1))
    ;[values[i], values[j]] = [values[j]!, values[i]!]
  }
  return values
}

/** Merges what was recorded for one function, from several test files or several exports. */
function mergeKeys(values: (Key | undefined)[]): Key | undefined {
  const present = values.filter((value): value is Key => !!value)
  if (!present.length) return undefined
  const merged: Key = {
    calls: 0,
    direct: 0,
    unreplayable: {},
    threw: 0,
    ok: [],
  }
  const ok = new Map<string, Sample>()
  for (const value of present) {
    merged.calls += value.calls
    merged.direct += value.direct
    merged.threw += value.threw
    for (const [reason, count] of Object.entries(value.unreplayable))
      merged.unreplayable[reason] = (merged.unreplayable[reason] ?? 0) + count
    if (
      value.error !== undefined &&
      (merged.errorWhere === undefined || value.errorWhere! < merged.errorWhere)
    ) {
      merged.error = value.error
      merged.errorWhere = value.errorWhere
    }
    for (const sample of value.ok) {
      const existing = ok.get(sample.args)
      if (!existing) ok.set(sample.args, { ...sample })
      else {
        existing.n += sample.n
        existing.direct ||= sample.direct
        if (sample.where < existing.where) existing.where = sample.where
      }
    }
  }
  merged.ok = [...ok.values()]
  return merged
}

/** Keeps the argument sets tests pass most, then the shortest. */
function trim(samples: Sample[]) {
  let length = 0
  return samples
    .sort(
      (a, b) =>
        Number(b.direct) - Number(a.direct) ||
        b.n - a.n ||
        a.args.length - b.args.length ||
        (a.args < b.args ? -1 : 1),
    )
    .filter((sample, index) => {
      length += sample.args.length
      return index === 0 || length <= keptLengthPerFunction
    })
    .slice(0, keptPerFunction)
}

/**
 * Orders the argument sets to try: calls from test code before calls from other ox functions,
 * and in each group the median-sized set first, so neither an empty edge case nor a stress input
 * stands for the function. The same recording always yields the same order.
 */
function pick(samples: Sample[]) {
  const order = (group: Sample[]) => {
    const sorted = [...group].sort(
      (a, b) => a.args.length - b.args.length || (a.args < b.args ? -1 : 1),
    )
    const middle = (sorted.length - 1) >> 1
    return sorted
      .map((sample, index) => ({ sample, distance: Math.abs(index - middle) }))
      .sort((a, b) => a.distance - b.distance)
      .map(({ sample }) => sample)
  }
  return [
    ...order(samples.filter((sample) => sample.direct)),
    ...order(samples.filter((sample) => !sample.direct)),
  ].slice(0, candidatesPerFunction)
}

/** Why a function has no call to replay, from what the recording saw. */
function whyNot(key: Key | undefined) {
  if (!key || key.calls === 0) return 'no test calls it'
  const reasons = Object.entries(key.unreplayable).sort(
    (a, b) => b[1] - a[1] || (a[0] < b[0] ? -1 : 1),
  )
  // The recording answers every request to a host other than this machine with "method not
  // found", so a call that reached for one needs the network to succeed.
  const verb = key.error?.includes('uphill speed recording: no network')
    ? 'needs the network'
    : 'threw'
  const threw = `${verb} (${key.threw}): ${key.error} (${key.errorWhere})`
  if (!reasons.length && key.threw)
    return `every recorded call ${threw.replace(/ \(\d+\)/, '')}`
  if (!reasons.length) return 'no recorded call could be sampled'
  const parts = reasons.map(([reason, count]) => `${reason} (${count})`)
  if (key.threw) parts.push(threw)
  return `every recorded call ${parts.join(' or ')}`
}

/** A short reason for the summary, such as "passes a function". */
function category(reason: string) {
  return reason.split(/ \(|:/)[0]!
}

function quote(text: string) {
  return `"${text.replace(/[\\"]/g, (character) => `\\${character}`).replace(/\s+/g, ' ')}"`
}

function formatTime(ns: number) {
  if (ns < 1e3) return `${digits(ns)}ns`
  if (ns < 1e6) return `${digits(ns / 1e3)}µs`
  if (ns < 1e9) return `${digits(ns / 1e6)}ms`
  return `${digits(ns / 1e9)}s`
}

function formatSize(bytes: number) {
  if (bytes < 1e3) return `${Math.round(bytes)}B`
  if (bytes < 1e6) return `${digits(bytes / 1e3)}kB`
  return `${digits(bytes / 1e6)}MB`
}

/** About three significant digits, never in exponent notation. */
function digits(value: number) {
  return value >= 100
    ? value.toFixed(0)
    : value >= 10
      ? value.toFixed(1)
      : value.toFixed(2)
}

function median(values: number[]) {
  const sorted = [...values].sort((a, b) => a - b)
  const middle = sorted.length >> 1
  return sorted.length % 2
    ? sorted[middle]!
    : (sorted[middle - 1]! + sorted[middle]!) / 2
}

function lastLine(text: string) {
  return (
    text
      .trim()
      .split('\n')
      .filter((line) => line.trim())
      .at(-1)
      ?.slice(0, 160) ?? 'no output'
  )
}

function log(message: string) {
  process.stdout.write(`${message}\n`)
}
