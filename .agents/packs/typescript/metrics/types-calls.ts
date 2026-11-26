/**
 * Writes the type-checking cost of calling each public function the way the library's own tests
 * call it, and whether each public function has such a call.
 *
 * 1. Enumerate. `types-calls-worker.ts functions` lists the public functions: every function each
 *    entry point's build exports, namespace members included, such as `lib:Math.add`, with each
 *    namespace named by the first entry that reaches it, `lib` and the other index entries first
 *    (see library.ts). A function that several namespaces export, such as `lib:Math.round` and
 *    `lib:Number.round`, gets a line under each name. A worker walks each name from its entry's
 *    source to the declaration it resolves to.
 * 2. Scan. Workers list the calls in every test file (`callTypes.tests` in
 *    `local/config.ts`, or vitest's runtime and type tests) whose callee resolves,
 *    through imports and re-exports, to one of those declarations in the sources, such as
 *    `Math.add(...)` through `import { Math } from 'lib'`.
 * 3. Measure. Each function gets one call: the first in its own module's runtime tests, such as
 *    Math.test.ts for `lib:Math.add` (then its module's other runtime test files, such as
 *    Math.round.test.ts for `lib:Math.round`), else in its own type tests, such as Math.test-d.ts,
 *    else in any test file; within a file, the first in `describe('add')`.
 *    types-calls-worker.ts copies the call, with any calls chained on its result, out of its
 *    statement and checks it in a fresh checker after resolving what it references from outside
 *    it, so imports and fixtures, such as a large schema, do not count against it. Relating a fixture
 *    to the function's parameters does count: that is checking the call. A call that picks up a
 *    type error once copied out gives its place to the function's next call, up to five calls.
 *
 * - `instantiations`: type instantiations to check the call, exact and repeatable.
 * - `type-benched`: whether the function has a measured call, and why not when it has none.
 *
 * Check time and heap bytes are not written: the same call's time varies by a third between
 * checks, and a time or a varying size would make Uphill run this script five times, while
 * instantiations are exact. The workers run on Node 26 or later, as types.ts's do (see
 * `nodeBinary` in types-host.ts). `UPHILL_CONCURRENCY` sets the pool size (default 2), which
 * available memory caps.
 *
 * @module
 */

import * as fs from 'node:fs'
import * as os from 'node:os'
import * as path from 'node:path'

import * as hot from './hot.ts'
import * as library from './library.ts'
import type {
  EntriesResult,
  FunctionsResult,
  Job,
  Measurement,
  MeasureResult,
  ScanResult,
  Site,
} from './types-calls-worker.ts'
import * as typesHost from './types-host.ts'

/**
 * Each worker's V8 heap limit in MB, and the larger one a job that runs out of it gets, once, if
 * 2.5GB are available. A library of about 400 modules, with its parsed sources and test fixtures,
 * takes about 500MB.
 */
const heap = 1536
const largeHeap = 2048
/** The resident memory one worker can reach, which caps the pool by available memory. */
const workerBytes = 1.75e9
/** Notes say where the instantiations come from for calls that cost at least this many. */
const costly = 2000
/** Calls tried per function until one checks once copied out. */
const tries = 5

if (library.skip(['instantiations', 'hot-instantiations', 'type-benched']))
  process.exit(0)
if (!typesHost.ts)
  throw new Error(
    'The call-types metrics need the JavaScript API of the typescript package.',
  )

const here = import.meta.dir
const metrics = process.env.UPHILL_METRICS
if (!metrics) throw new Error('UPHILL_METRICS is not set')
const node = typesHost.nodeBinary()
const started = performance.now()

// 1. The public functions.
const { functions } = (() => {
  const result = Bun.spawnSync(
    [
      node,
      `--max-old-space-size=${heap}`,
      path.join(here, 'types-calls-worker.ts'),
      'functions',
    ],
    { cwd: library.root, stderr: 'inherit' },
  )
  if (!result.success) throw new Error('enumerating public functions failed')
  return JSON.parse(result.stdout.toString()) as FunctionsResult
})()
const moduleOf = new Map(functions.map((item) => [item.name, item.module]))
// Installed packages and the build hold no tests of the library's own.
const build = `${path.relative(library.root, library.build)}/`
const testFiles = [
  ...new Set(
    (
      library.config.callTypes?.tests ?? [
        '**/*.{test,spec}.{c,m,}{j,t}s{,x}',
        '**/*.{test,spec}-d.{c,m,}{j,t}s{,x}',
      ]
    ).flatMap((pattern) => [...new Bun.Glob(pattern).scanSync(library.root)]),
  ),
]
  .filter(
    (file) => !/(^|\/)node_modules\//.test(file) && !file.startsWith(build),
  )
  .sort()
  .map((file) => path.join(library.root, file))
log(
  `${functions.length} public functions; scanning ${testFiles.length} test files for calls`,
)

// 2. Resolve each function to its declarations, and scan every test file for calls.
const concurrency = Math.max(
  1,
  Math.min(
    Number(process.env.UPHILL_CONCURRENCY) || 2,
    Math.floor(typesHost.availableMemory() / workerBytes),
  ),
)
const workers = Array.from({ length: concurrency }, () => startWorker(heap))
let nextId = 0
/** The public functions each declaration key is, since a declaration can have several names. */
const declarations = new Map<string, string[]>()
const sitesByFile = new Map<string, Site[]>()
const texts = new Map<string, string>()
let missing: string[] = []
await run([
  {
    job: {
      kind: 'entries',
      id: nextId++,
      names: functions.map((item) => item.name),
    },
    done(result: EntriesResult) {
      for (const [name, keys] of Object.entries(result.declarations))
        for (const key of keys)
          declarations.set(key, [...(declarations.get(key) ?? []), name])
      missing = result.missing
    },
  },
  ...testFiles.map((file) => ({
    job: { kind: 'scan' as const, id: nextId++, file },
    done(result: ScanResult) {
      sitesByFile.set(result.file, result.sites)
      texts.set(result.file, result.text)
    },
  })),
])
if (missing.length)
  log(
    `${missing.length} public functions did not resolve to a declaration, such as ${missing.slice(0, 3).join(', ')}`,
  )

type Candidate = Site & { file: string; item: string }
const candidates = new Map<string, Candidate[]>()
let callCount = 0
// In file order, since scans finish in any order.
for (const file of [...sitesByFile.keys()].sort())
  for (const site of sitesByFile.get(file)!) {
    const items = declarations.get(site.declaration)
    if (!items) continue
    callCount++
    for (const item of items) {
      const list = candidates.get(item) ?? []
      list.push({ ...site, file, item })
      candidates.set(item, list)
    }
  }
log(
  `found ${callCount} calls to ${candidates.size} public functions in ${((performance.now() - started) / 1000).toFixed(1)}s`,
)

// 3. Measure one call per function: the first in its own module's runtime tests, such as Math.test.ts
// for `lib:Math.add`, then in a runtime test file named after it, such as Math.round.test.ts for
// `lib:Math.round`, then in its module's other runtime tests, such as Math.browser.test.ts, then in
// its type tests, such as Math.test-d.ts, then in any other test file. A file whose name ends in
// `-d` before its extension holds type tests. Within a file, calls in the
// `describe` block named after the function come first, which is most often the test named
// `default`, the way its documentation calls it. A call that fails to check once copied out gives
// its place to the function's next call, up to five calls.
const order = new Map<string, Candidate[]>()
for (const [item, list] of candidates) {
  const module = moduleOf.get(item)!
  // The function's own name, such as `add` for `lib:Math.add`.
  const name = item.slice(
    Math.max(item.indexOf(':'), item.lastIndexOf('.')) + 1,
  )
  const fileRank = (file: string) => {
    const base = path.basename(file)
    const types = /-d\.[cm]?[jt]sx?$/.test(base)
    // The name without its test suffix, such as `Math.round` for Math.round.test.ts.
    const stem = base.replace(/\.\w+(-d)?\.[cm]?[jt]sx?$/, '')
    if (!types && stem === module) return 0
    if (!types && stem === `${module}.${name}`) return 1
    if (!types && stem.startsWith(`${module}.`)) return 2
    if (types && stem === module) return 3
    return 4
  }
  // Within a file, calls in the `describe` block named after the function come first, such as
  // `describe('toJson')` rather than a `fromJson` test that calls `toJson` on its result.
  const rank = (candidate: Candidate) =>
    fileRank(candidate.file) * 2 +
    (candidate.test
      .split(' > ')
      .slice(1, -1)
      .some((block) => block === name || block.endsWith(`.${name}`))
      ? 0
      : 1)
  order.set(
    item,
    list
      .filter((candidate) => !candidate.skip)
      .sort(
        (a, b) =>
          rank(a) - rank(b) ||
          (a.file < b.file ? -1 : a.file > b.file ? 1 : 0) ||
          a.start - b.start,
      ),
  )
}

const timesFile = path.join(
  os.tmpdir(),
  `uphill-${library.name.replace(/\W/g, '-')}-types-calls-times.json`,
)
const lastTimes: Record<string, number> = fs.existsSync(timesFile)
  ? JSON.parse(fs.readFileSync(timesFile, 'utf8'))
  : {}
const times: Record<string, number> = {}
const measured = new Map<string, Measurement & { candidate: Candidate }>()
const rejected = new Map<string, (Measurement & { candidate: Candidate })[]>()
const tried = new Map<string, number>()
for (let round = 1; ; round++) {
  const chosen: Candidate[] = []
  for (const [item, list] of order) {
    const next = tried.get(item) ?? 0
    if (measured.has(item) || next >= Math.min(list.length, tries)) continue
    chosen.push(list[next]!)
    tried.set(item, next + 1)
  }
  if (!chosen.length) break
  const byFile = Map.groupBy(chosen, (candidate) => candidate.file)
  log(
    `measuring ${chosen.length} calls in ${byFile.size} test files (round ${round})`,
  )
  // The costliest files first, so the slowest job does not run alone at the end. The last run's
  // times order the queue, then the number of calls; they only decide the order, never a value.
  const jobs = [...byFile].sort(
    (a, b) =>
      (lastTimes[b[0]] ?? Number.POSITIVE_INFINITY) -
        (lastTimes[a[0]] ?? Number.POSITIVE_INFINITY) ||
      b[1].length - a[1].length,
  )
  await run(
    jobs.map(([file, list]) => ({
      job: {
        kind: 'measure' as const,
        id: nextId++,
        file,
        text: texts.get(file)!,
        sites: list.map((candidate, site) => ({
          site,
          start: candidate.start,
          end: candidate.end,
          outer: candidate.outer,
          anchor: candidate.anchor,
        })),
      },
      done(result: MeasureResult) {
        for (const measurement of result.measurements) {
          const candidate = list[measurement.site]!
          if (!measurement.errors.length)
            measured.set(candidate.item, { ...measurement, candidate })
          else
            rejected.set(candidate.item, [
              ...(rejected.get(candidate.item) ?? []),
              { ...measurement, candidate },
            ])
        }
      },
    })),
  )
}
const peak = Math.max(
  ...(await Promise.all(workers.map((worker) => worker.close()))),
)
fs.writeFileSync(`${timesFile}.${process.pid}`, JSON.stringify(times))
fs.renameSync(`${timesFile}.${process.pid}`, timesFile)

// 4. Lines: one value per measured function, and one check per public function.
const lines: string[] = []
const reasons = new Map<string, number>()
const reported: { item: string; value: number; note: string }[] = []
for (const { name } of functions) {
  const measurement = measured.get(name)
  if (measurement) {
    const text = note(measurement)
    lines.push(
      `instantiations ${quote(name)} ${measurement.instantiations} note ${quote(text)}`,
      `type-benched ${quote(name)} pass note ${quote(where(measurement.candidate))}`,
    )
    reported.push({ item: name, value: measurement.instantiations, note: text })
    continue
  }
  const reason = whyNot(name)
  const kind = reason.split(/[:(]/)[0]!.trim()
  reasons.set(kind, (reasons.get(kind) ?? 0) + 1)
  lines.push(`type-benched ${quote(name)} fail note ${quote(reason)}`)
}
fs.appendFileSync(metrics, `${[...lines, ...hot.hot(lines)].join('\n')}\n`)

log(
  `measured ${reported.length} of ${functions.length} public functions; not measured: ${[
    ...reasons,
  ]
    .sort((a, b) => b[1] - a[1])
    .map(([reason, count]) => `${count} ${reason}`)
    .join(', ')}`,
)
log('costliest calls:')
for (const { item, value, note } of reported
  .toSorted((a, b) => b.value - a.value)
  .slice(0, 25))
  log(`  ${value} ${item}: ${note}`)
log(
  `done in ${((performance.now() - started) / 1000).toFixed(1)}s with ${concurrency} workers; peak worker memory ${size(peak)}`,
)

/** Names a call's test, such as `src/Math.test.ts > add > default (line 12)`. */
function where(candidate: Candidate) {
  return `${candidate.test} (line ${candidate.line})`
}

/** The call's test and, for a costly one, which part of checking it the instantiations come from. */
function note(measurement: Measurement & { candidate: Candidate }) {
  const { candidate, parts, instantiations, signature } = measurement
  const text = [where(candidate)]
  if (candidate.chain)
    text.push(`with ${candidate.chain} chained on its result`)
  if (instantiations < costly) return text.join('; ')
  const share = (count: number) =>
    `${Math.min(100, Math.round((count / instantiations) * 100))}%`
  const declared = (parameters: string[]) => short(`(${parameters.join(', ')})`)
  const [count, description] = (
    [
      [
        parts.call,
        `inferring its type arguments and checking its arguments against ${declared(signature.parameters)}`,
      ],
      [
        parts.result,
        candidate.chain
          ? 'its return type and the calls chained on it'
          : `its return type${signature.returns ? `, declared as ${short(signature.returns)}` : ''}`,
      ],
      [parts.awaited, 'awaiting its result'],
    ] as const
  ).toSorted((a, b) => b[0] - a[0])[0]!
  text.push(`${share(count)} of instantiations come from ${description}`)
  return text.join('; ')
}

/** Why a public function has no measured call. */
function whyNot(name: string) {
  if (missing.includes(name))
    return 'no declaration names it, since it is built at run time'
  const all = candidates.get(name) ?? []
  if (!all.length) return 'no test calls it directly'
  const failed = rejected.get(name) ?? []
  if (failed.length) {
    const first = failed[0]!
    const error = first.errors[0]!
    return `every call measured fails to check once copied out of its statement: TS${error.code} ${error.message} (${where(first.candidate)})`
  }
  const counts = new Map<string, number>()
  for (const candidate of all)
    if (candidate.skip) {
      const reason = candidate.skip.replace(/naming \S+,/, 'naming a variable')
      counts.set(reason, (counts.get(reason) ?? 0) + 1)
    }
  return `every call in the tests is unmeasurable: ${[...counts]
    .sort((a, b) => b[1] - a[1])
    .map(
      ([reason, count]) =>
        `${count} ${count === 1 ? 'call' : 'calls'} ${reason}`,
    )
    .join(', ')} (such as ${where(all[0]!)})`
}

/** Shortens a declared type for a note to its first 100 characters. */
function short(text: string) {
  const flat = text.replace(/\s+/g, ' ')
  return flat.length > 100 ? `${flat.slice(0, 99)}…` : flat
}

/**
 * Runs jobs on the pool, each worker taking the next job as it finishes one. A worker that runs
 * out of memory is replaced, and its job runs again in a worker with a larger heap, once, if the
 * machine has the memory for it; otherwise the job's calls are left out.
 */
async function run(tasks: { job: Job; done: (result: never) => void }[]) {
  let next = 0
  let finished = 0
  await Promise.all(
    workers.map(async (_, index) => {
      while (next < tasks.length) {
        const task = tasks[next++]!
        const begun = performance.now()
        let result: unknown
        try {
          result = await workers[index]!.send(task.job)
        } catch (error) {
          workers[index] = startWorker(heap)
          if (typesHost.availableMemory() < 2.5e9) {
            log(`${String(error)}; no room for a larger heap, leaving it out`)
            if (task.job.kind !== 'measure') throw error
            continue
          }
          log(`${String(error)}; checking it again with a ${largeHeap}MB heap`)
          const large = startWorker(largeHeap)
          try {
            result = await large.send(task.job)
          } finally {
            await large.close()
          }
        }
        task.done(result as never)
        if (task.job.kind === 'measure')
          times[task.job.file] =
            (times[task.job.file] ?? 0) + performance.now() - begun
        if (++finished % 100 === 0)
          log(
            `${finished} of ${tasks.length} jobs done after ${((performance.now() - started) / 1000).toFixed(0)}s`,
          )
      }
    }),
  )
}

/** Starts one Node worker process, which takes one job at a time. */
function startWorker(limit: number) {
  const child = Bun.spawn(
    [
      node,
      `--max-old-space-size=${limit}`,
      path.join(here, 'types-calls-worker.ts'),
    ],
    { cwd: library.root, stdin: 'pipe', stdout: 'pipe', stderr: 'inherit' },
  )
  const reader = child.stdout.pipeThrough(new TextDecoderStream()).getReader()
  let buffer = ''
  const readLine = async (): Promise<string | undefined> => {
    for (;;) {
      const newline = buffer.indexOf('\n')
      if (newline >= 0) {
        const line = buffer.slice(0, newline)
        buffer = buffer.slice(newline + 1)
        return line
      }
      const { value, done } = await reader.read()
      if (done) return undefined
      buffer += value
    }
  }
  return {
    async send(job: Job): Promise<unknown> {
      child.stdin.write(`${jsonLine(job)}\n`)
      child.stdin.flush()
      const line = await readLine()
      if (line === undefined) {
        const status = await child.exited
        throw new Error(
          `a worker exited with status ${status} on ${'file' in job ? path.relative(library.root, job.file) : job.kind}`,
        )
      }
      return JSON.parse(line)
    },
    async close(): Promise<number> {
      child.stdin.end()
      const line = await readLine()
      await child.exited
      return line ? (JSON.parse(line) as { peak: number }).peak : 0
    },
  }
}

/**
 * A job as one line of JSON. Node's readline also ends lines at U+2028 and U+2029, which
 * `JSON.stringify` leaves as they are and a test file can hold in a string.
 */
function jsonLine(job: Job): string {
  return JSON.stringify(job).replace(/[\u2028\u2029]/g, (char) =>
    char === '\u2028' ? '\\u2028' : '\\u2029',
  )
}

/** Quotes an item or note for a metric line, escaping `"` and `\`. */
function quote(text: string): string {
  return `"${text.replace(/\s+/g, ' ').replaceAll('\\', '\\\\').replaceAll('"', '\\"')}"`
}

/** Formats bytes in decimal units. */
function size(bytes: number): string {
  if (bytes >= 1e9) return `${(bytes / 1e9).toFixed(2)}GB`
  if (bytes >= 1e6) return `${(bytes / 1e6).toFixed(2)}MB`
  if (bytes >= 1e3) return `${(bytes / 1e3).toFixed(1)}kB`
  return `${bytes}B`
}

function log(message: string) {
  process.stderr.write(`${message}\n`)
}
