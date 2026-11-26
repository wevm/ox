/**
 * Writes the library's fuzz metrics: for every public function, whether a fuzz harness ran on it,
 * whether fuzzing found no failure, and the share of the function's own lines the fuzzing ran.
 *
 * 1. Corpus. The corpus file (`fuzz.corpus`, by default
 *    local/fuzz-corpus.json) holds up to ten argument sets per function that
 *    the project's own tests passed it, snapshotted from the speed category's recording, so runs
 *    do not depend on a recording that changes with every edit. `FUZZ_CORPUS=refresh` snapshots
 *    the newest recording again. Without a corpus or a recording, the run goes on with structured
 *    properties and hand-written seeds alone.
 * 2. Plan. `fuzz-worker.ts plan` walks every entry point `entries()` in library.ts lists, as
 *    speed-worker.ts does, so functions have the same names as in the other categories, such as
 *    `lib:Math.add`, and lists each one's harnesses: the structured properties in the project's
 *    properties module (`fuzz.properties`), such as round trips, re-encoding of recorded values,
 *    differentials against reference implementations, and consistency between the library's
 *    functions, boundary mutations of its recorded arguments (fuzz-lib.ts), and hand-written
 *    seeds. A function several names reach is one item, under the first, such as `lib:Array.sum`
 *    for `lib:Math.sum`. The network is blocked, and WebAuthn prompts go to a stand-in `window`
 *    whose credential calls return nothing.
 * 3. Fuzz. `fuzz-worker.ts fuzz` runs a fixed shard of functions in one Node process, with fixed
 *    seeds and run counts, so two runs write the same lines. Shards run `UPHILL_CONCURRENCY`
 *    (default 2) at a time. A shard that hangs or grows past the memory limit is stopped, and its
 *    function is run again alone with tracing on, which names the input that did it.
 *    `FUZZ_ONLY=<regex>` fuzzes only the matching functions, for iterating on a harness.
 *
 * The crash oracle: documented errors (the library's error classes, plain `Error`s, the built-in
 * errors `fuzz.documentedErrors` lists, and validation the code throws on purpose) are fine; a
 * TypeError, RangeError, SyntaxError, or ReferenceError on an input that keeps the declared types,
 * a stack overflow, a hang, or runaway memory is a failure.
 *
 * @module
 */

import * as fs from 'node:fs'
import * as os from 'node:os'
import * as path from 'node:path'

import * as hot from './hot.ts'
import * as library from './library.ts'

if (
  library.skip(['fuzzed', 'fuzz-clean', 'fuzz-coverage', 'hot-fuzz-coverage'])
)
  process.exit(0)

const here = import.meta.dir
const metricsFile = process.env.UPHILL_METRICS
const concurrency = Math.max(1, Number(process.env.UPHILL_CONCURRENCY) || 2)
const node = Bun.which('node')
if (!node) throw new Error('node is not on PATH.')

/** Fixed shards, so a function's neighbours (and so its run) do not depend on concurrency. */
const shardCount = 24
/** A function still running after this long is a hang. */
const functionTimeoutMs = 90_000
/** A worker whose resident memory grows past this is stopped. */
const memoryLimitBytes = 2_000_000_000
/** Functions that change global state run alone. */
const isolated = new Set(library.config.fuzz?.isolated ?? [])
/** Where speed.ts keeps its recordings, which the corpus snapshots. */
const recordings = path.join(
  library.root,
  'node_modules/.cache/uphill-typescript-speed',
)

type Location = { url: string; line: number; column: number }
type Planned = {
  name: string
  package?: string
  properties: string[]
  seeds: number
  reason?: string
  location?: Location
}
type FailureRecord = {
  oracle: string
  harness: string
  kind: string
  input: string
  message: string
  site?: string
}
type Result = {
  name: string
  harnesses: { id: string; oracle: string; runs: number }[]
  failures: FailureRecord[]
  coverage?: { percent: number; lines: number; covered: number }
  ms: number
  calls: number
}

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'uphill-fuzz-'))
try {
  await main()
} finally {
  fs.rmSync(tmp, { recursive: true, force: true })
}

async function main() {
  const started = performance.now()
  const corpus = corpusFile()

  const planFile = path.join(tmp, 'plan.json')
  const planned = await run(
    [node!, path.join(here, 'fuzz-worker.ts'), 'plan', corpus, planFile],
    300_000,
  )
  if (planned.code !== 0 || !fs.existsSync(planFile)) {
    process.stderr.write(planned.stderr)
    throw new Error('Planning failed.')
  }
  const plan = JSON.parse(fs.readFileSync(planFile, 'utf8')) as {
    items: Planned[]
    properties: { id: string; oracle: string; covers: string[] }[]
    unknownCovers: string[]
  }
  if (plan.unknownCovers.length)
    throw new Error(
      `Properties cover functions that are not public: ${plan.unknownCovers.join(', ')}`,
    )
  const fuzzable = plan.items.filter((item) => !item.reason)
  log(
    `Public functions: ${plan.items.length}; ${fuzzable.length} have a harness (${fuzzable.filter((item) => item.properties.length).length} with structured properties, ${fuzzable.filter((item) => item.seeds).length} with recorded or hand-written arguments); ${plan.properties.length} properties.`,
  )

  // Fixed shards: a module's functions share a shard, so costly setups (a trusted setup, a
  // reference implementation's wallets) load once; modules go, largest first, to the shard with
  // the fewest functions so far. Isolated functions run alone.
  const locations = Object.fromEntries(
    plan.items
      .filter((item) => item.location)
      .map((item) => [item.name, item.location!]),
  )
  const only = process.env.FUZZ_ONLY
    ? new RegExp(process.env.FUZZ_ONLY)
    : undefined
  const sorted = fuzzable
    .map((item) => item.name)
    .filter((name) => !only || only.test(name))
    .sort()
  const byModule = new Map<string, string[]>()
  for (const name of sorted) {
    if (isolated.has(name)) continue
    const module = moduleOf(name)
    if (!byModule.has(module)) byModule.set(module, [])
    byModule.get(module)!.push(name)
  }
  const shards: string[][] = Array.from({ length: shardCount }, () => [])
  for (const [, names] of [...byModule].sort(
    ([a, x], [b, y]) => y.length - x.length || (a < b ? -1 : 1),
  )) {
    const smallest = shards.reduce(
      (best, shard, i) => (shard.length < shards[best]!.length ? i : best),
      0,
    )
    shards[smallest]!.push(...names)
  }
  for (const name of sorted) if (isolated.has(name)) shards.push([name])

  const results = new Map<string, Result>()
  let peakRss = 0
  const fuzzStarted = performance.now()
  await pool(
    shards
      .filter((shard) => shard.length)
      .map((shard, i) => () => runShard(i, shard)),
    concurrency,
  )
  const fuzzSeconds = (performance.now() - fuzzStarted) / 1000

  /** Runs a shard; when the worker dies, records the function it died in and runs the rest. */
  async function runShard(id: number, names: string[]) {
    let remaining = names
    let attempt = 0
    while (remaining.length) {
      const out = path.join(tmp, `shard-${id}-${attempt}.jsonl`)
      const job = path.join(tmp, `job-${id}-${attempt}.json`)
      fs.writeFileSync(
        job,
        JSON.stringify({ items: remaining, corpus, locations }),
      )
      const outcome = await runWorker(job, out)
      const lines = fs.existsSync(out)
        ? fs
            .readFileSync(out, 'utf8')
            .split('\n')
            .filter(Boolean)
            .map((line) => JSON.parse(line))
        : []
      let current: string | undefined
      for (const line of lines) {
        if (line.start) current = line.start
        else if (line.done) peakRss = Math.max(peakRss, line.maxRss)
        else {
          results.set(line.name, line)
          current = undefined
        }
      }
      peakRss = Math.max(peakRss, outcome.peakRss)
      const finished = new Set(
        lines.filter((line) => line.name).map((line) => line.name),
      )
      if (outcome.code === 0 && !current) return
      // The worker died: in the function it had started, or before it started any.
      const culprit = current ?? remaining.find((name) => !finished.has(name))!
      results.set(culprit, await diagnose(id, culprit, outcome))
      remaining = remaining.filter(
        (name) => !finished.has(name) && name !== culprit,
      )
      attempt++
    }
  }

  /** Runs one function alone with tracing on, and names the input that stopped the worker. */
  async function diagnose(
    id: number,
    name: string,
    first: WorkerOutcome,
  ): Promise<Result> {
    const out = path.join(tmp, `diagnose-${id}.jsonl`)
    const job = path.join(tmp, `diagnose-${id}.json`)
    const trace = path.join(tmp, `trace-${id}.jsonl`)
    fs.writeFileSync(
      job,
      JSON.stringify({ items: [name], corpus, locations, trace }),
    )
    const outcome = await runWorker(job, out)
    peakRss = Math.max(peakRss, outcome.peakRss)
    const lines = fs.existsSync(out)
      ? fs
          .readFileSync(out, 'utf8')
          .split('\n')
          .filter(Boolean)
          .map((line) => JSON.parse(line))
      : []
    const done = lines.find((line) => line.name === name) as Result | undefined
    if (done && outcome.code === 0) return done // It only failed alongside other functions.
    // The trace has a line per call, so it counts the calls made before the worker stopped.
    const traced = fs.existsSync(trace)
      ? fs.readFileSync(trace, 'utf8').split('\n').filter(Boolean)
      : []
    const last = traced.at(-1)
    const input = last
      ? (JSON.parse(last) as {
          harness: string
          input: string
          changes?: string[]
        })
      : undefined
    const kind =
      (outcome.killed ?? first.killed) === 'memory'
        ? 'runaway memory'
        : (outcome.killed ?? first.killed) === 'time'
          ? 'hang'
          : 'worker crashed'
    return {
      name,
      harnesses: [
        {
          id: input?.harness ?? 'unknown',
          oracle: 'crash',
          runs: traced.length,
        },
      ],
      failures: [
        {
          oracle: 'crash',
          harness: input?.harness ?? 'unknown',
          kind,
          input: input
            ? `${input.input}${input.changes ? ` (${input.changes.join('; ')})` : ''}`
            : 'unknown',
          message:
            kind === 'runaway memory'
              ? `resident memory passed ${memoryLimitBytes / 1e9} GB`
              : kind === 'hang'
                ? `still running after ${functionTimeoutMs / 1000}s`
                : errorLine(outcome.stderr || first.stderr),
        },
      ],
      ms: 0,
      calls: traced.length,
    }
  }

  const lines: string[] = []
  const reasons = new Map<string, number>()
  const failing: { name: string; failure: FailureRecord }[] = []
  let coverageTotal = 0
  let coverageCount = 0
  for (const item of plan.items) {
    const result = results.get(item.name)
    if (item.reason) {
      const category = item.reason.split(':')[0]!.replace(/, re-exported.*/, '')
      reasons.set(category, (reasons.get(category) ?? 0) + 1)
    } else if (!result) {
      if (only) continue
      throw new Error(`${item.name} has no result.`)
    } else {
      for (const failure of result.failures)
        failing.push({ name: item.name, failure })
      if (result.coverage) {
        coverageTotal += result.coverage.percent
        coverageCount++
      }
    }
    lines.push(...linesOf(item, result))
  }
  if (metricsFile)
    fs.appendFileSync(
      metricsFile,
      `${[...lines, ...hot.hot(lines)].join('\n')}\n`,
    )
  else console.log(lines.join('\n'))

  log(
    `Fuzzed ${fuzzable.length} of ${plan.items.length} public functions; not fuzzed: ${[
      ...reasons,
    ]
      .sort((a, b) => b[1] - a[1])
      .map(([reason, count]) => `${count} ${reason}`)
      .join(', ')}.`,
  )
  log(
    `${failing.length} failures in ${new Set(failing.map((entry) => entry.name)).size} functions; mean coverage ${(coverageTotal / Math.max(1, coverageCount)).toFixed(1)}% over ${coverageCount} functions.`,
  )
  for (const { name, failure } of failing)
    log(
      `  ✗ ${name}: ${failure.oracle}/${failure.kind} (${failure.harness}): ${failure.message}${failure.site ? ` at ${failure.site}` : ''}\n      input ${failure.input}`,
    )
  log(
    `Fuzzed ${shards.filter((shard) => shard.length).length} shards in ${fuzzSeconds.toFixed(0)}s at concurrency ${concurrency}; ${((performance.now() - started) / 1000).toFixed(0)}s in all; peak worker memory ${(peakRss / 1e6).toFixed(0)} MB.`,
  )
}

/** A function's metric lines. */
function linesOf(item: Planned, result: Result | undefined) {
  const { name } = item
  const note = (text: string) => quote(text)
  if (item.reason)
    return [`fuzzed ${quote(name)} fail note ${note(item.reason)}`]
  const ran = result!.harnesses.filter((harness) => harness.runs > 0)
  const summary = ran
    .map((harness) => `${harness.id} ×${harness.runs}`)
    .join('; ')
  const lines = [
    ran.length
      ? `fuzzed ${quote(name)} pass note ${note(summary)}`
      : `fuzzed ${quote(name)} fail note ${note('its harness made no calls')}`,
  ]
  if (result!.failures.length) {
    const failures = result!.failures
      .map(
        (failure) =>
          `${failure.oracle} (${failure.harness}): ${failure.kind}: ${failure.message}${failure.site ? ` at ${failure.site}` : ''}; input ${failure.input}`,
      )
      .join(' | ')
    lines.push(
      `fuzz-clean ${quote(name)} fail note ${note(failures.slice(0, 1500))}`,
    )
  } else if (ran.length)
    lines.push(
      `fuzz-clean ${quote(name)} pass note ${note(`${result!.calls} inputs`)}`,
    )
  const coverage = result!.coverage
  if (coverage)
    lines.push(
      `fuzz-coverage ${quote(name)} ${coverage.percent} note ${note(`${coverage.covered} of ${coverage.lines} lines of its own source ran`)}`,
    )
  return lines
}

/** The module a function belongs to, such as `lib/Math` for `lib:Math.add`. */
function moduleOf(name: string) {
  const [entry, member] = name.split(':') as [string, string]
  const dot = member.indexOf('.')
  return dot < 0 ? entry : `${entry}/${member.slice(0, dot)}`
}

/** The corpus fixture, snapshotted from the newest speed recording when missing or asked for. */
function corpusFile() {
  const file = path.resolve(
    library.root,
    library.config.fuzz?.corpus ?? path.join(library.local, 'fuzz-corpus.json'),
  )
  if (fs.existsSync(file) && process.env.FUZZ_CORPUS !== 'refresh') return file
  const found = fs.existsSync(recordings)
    ? fs
        .readdirSync(recordings)
        .filter((name) => /^recording-[0-9a-f]+\.json$/.test(name))
        .map((name) => path.join(recordings, name))
        .sort((a, b) => fs.statSync(b).mtimeMs - fs.statSync(a).mtimeMs)
    : []
  if (!found.length) {
    if (process.env.FUZZ_CORPUS === 'refresh')
      throw new Error(
        'There is no speed recording to snapshot. Run speed.ts first.',
      )
    // Structured properties and hand-written seeds still run without recorded arguments.
    log(
      `No corpus: ${path.relative(library.root, file)} is missing and there is no speed recording to snapshot; fuzzing without recorded arguments.`,
    )
    const empty = path.join(tmp, 'corpus.json')
    fs.writeFileSync(empty, JSON.stringify({ source: 'none', functions: {} }))
    return empty
  }
  fs.mkdirSync(path.dirname(file), { recursive: true })
  const result = Bun.spawnSync(
    [node!, path.join(here, 'fuzz-worker.ts'), 'corpus', found[0]!, file],
    {
      cwd: library.root,
      stderr: 'inherit',
    },
  )
  if (result.exitCode !== 0) throw new Error('Snapshotting the corpus failed.')
  log(`Snapshotted the corpus from ${path.relative(library.root, found[0]!)}.`)
  return file
}

type WorkerOutcome = {
  code: number | null
  stderr: string
  killed?: 'time' | 'memory' | undefined
  peakRss: number
}

/**
 * Runs a fuzz worker, stopping it when one function runs past `functionTimeoutMs` or its resident
 * memory passes `memoryLimitBytes`.
 */
async function runWorker(job: string, out: string): Promise<WorkerOutcome> {
  const child = Bun.spawn(
    [
      node!,
      '--max-old-space-size=1536',
      '--stack-size=984',
      path.join(here, 'fuzz-worker.ts'),
      'fuzz',
      job,
      out,
    ],
    { cwd: library.root, stdout: 'ignore', stderr: 'pipe' },
  )
  let killed: WorkerOutcome['killed']
  let peakRss = 0
  let lastSize = -1
  let lastChange = performance.now()
  const watch = setInterval(() => {
    const rss = residentBytes(child.pid)
    peakRss = Math.max(peakRss, rss)
    if (rss > memoryLimitBytes) {
      killed = 'memory'
      child.kill('SIGKILL')
      return
    }
    const size = fs.existsSync(out) ? fs.statSync(out).size : 0
    if (size !== lastSize) {
      lastSize = size
      lastChange = performance.now()
    } else if (performance.now() - lastChange > functionTimeoutMs) {
      killed = 'time'
      child.kill('SIGKILL')
    }
  }, 100)
  const stderr = await new Response(child.stderr).text()
  await child.exited
  clearInterval(watch)
  return { code: child.exitCode, stderr, killed, peakRss }
}

function residentBytes(pid: number) {
  try {
    const status = fs.readFileSync(`/proc/${pid}/status`, 'utf8')
    const match = status.match(/VmRSS:\s+(\d+) kB/)
    return match ? Number(match[1]) * 1024 : 0
  } catch {
    return 0
  }
}

async function run(command: string[], timeoutMs: number) {
  const child = Bun.spawn(command, {
    cwd: library.root,
    stdout: 'pipe',
    stderr: 'pipe',
  })
  const timer = setTimeout(() => child.kill('SIGKILL'), timeoutMs)
  const [stdout, stderr] = await Promise.all([
    new Response(child.stdout).text(),
    new Response(child.stderr).text(),
  ])
  await child.exited
  clearTimeout(timer)
  return { code: child.exitCode, stdout, stderr }
}

async function pool(tasks: (() => Promise<void>)[], size: number) {
  let next = 0
  await Promise.all(
    Array.from({ length: Math.min(size, tasks.length) }, async () => {
      while (next < tasks.length) await tasks[next++]!()
    }),
  )
}

/** Quotes an item or note for a metric line, escaping `"` and `\`, on one line. */
function quote(text: string) {
  return `"${text.replace(/[\\"]/g, (character) => `\\${character}`).replace(/\s+/g, ' ')}"`
}

/** The line of a crashed worker's output that names the error, rather than Node's version banner. */
function errorLine(text: string) {
  const lines = text.split('\n').map((line) => line.trim())
  return (
    lines
      .find((line) =>
        /^(\w+Error|Error|RangeError|FATAL|#)\b|out of memory/i.test(line),
      )
      ?.slice(0, 200) ?? lastLine(text)
  )
}

function lastLine(text: string) {
  return (
    text
      .trim()
      .split('\n')
      .filter((line) => line.trim())
      .at(-1)
      ?.slice(0, 200) ?? 'no output'
  )
}

function log(message: string) {
  process.stdout.write(`${message}\n`)
}
