/**
 * Writes the type-checking cost of every public export of the library's entry points (see
 * library.ts), values and types, and of each test in the type-test files that `types.benches`
 * matches.
 *
 * For each export, types-enumerate.ts writes a small consumer file that imports it and forces its
 * type to resolve; its comments say which forms each kind of export gets. A pool of Node workers
 * (types-worker.ts) checks each consumer in a fresh `ts.Program` with the library's compiler
 * options and subtracts a baseline that only imports the entry point:
 *
 * - `instantiations`: type instantiations, exact and repeatable.
 * - `check-time`: CPU time to check the consumer.
 * - `check-memory`: heap bytes the check allocates.
 * - `bench-instantiations`: the instantiations of each type test, counted the way its runner's
 *   `.instantiations` assertion counts them: the file with every `test()` removed is the baseline,
 *   and the test's function is added back as a constant. A test that pins a count with
 *   `.instantiations([count, 'instantiations'])` gets that count plus 20%, the threshold the runner
 *   enforces; the others pin type strings, so their lines carry no target. Without
 *   `types.benches`, the metric is skipped.
 *
 * Node runs the TypeScript work, as it does for `tsc` and editors, and V8 counts allocated bytes,
 * which JavaScriptCore does not. V8 reports them from Node 26 on, so the script runs `node` from
 * PATH if it is Node 26 or later, and otherwise the Node 26 that `npx --yes node@26` installs.
 *
 * The script checks the declarations the build writes (see library.ts), or a copy of them that
 * `UPHILL_TYPES_DIR` names. `UPHILL_CONCURRENCY` sets the pool size (default 2), which available
 * memory caps.
 *
 * @module
 */

import * as fs from 'node:fs'
import * as os from 'node:os'
import * as path from 'node:path'

import type * as TS from 'typescript'

import { hot } from './hot.ts'
import * as library from './library.ts'
import type { Item } from './types-enumerate.ts'
import {
  availableMemory,
  consumerFile,
  nodeBinary,
  ts,
  typesDir,
} from './types-host.ts'
import type { Job, Result } from './types-worker.ts'

/**
 * Each worker's V8 heap limit in MB. Large parsed declarations take about 300MB, and the sources
 * the type tests import about 300MB more. A check that needs more is checked again in a worker of its
 * own with `largeHeap`, if 2.5GB are available for it.
 */
const heap = 1536
const largeHeap = 2048
/** The resident memory one worker can reach, which caps the pool by available memory. */
const workerBytes = 1.75e9

const metrics = process.env.UPHILL_METRICS
if (!metrics) throw new Error('UPHILL_METRICS is not set')
if (
  library.skip([
    'instantiations',
    'check-time',
    'check-memory',
    'bench-instantiations',
    'hot-instantiations',
  ])
)
  process.exit(0)
if (!ts)
  throw new Error(
    'The types metrics need the JavaScript API of the typescript package.',
  )

const here = import.meta.dir
const node = nodeBinary()
const started = performance.now()

const enumerated = Bun.spawnSync(
  [node, `--max-old-space-size=${heap}`, path.join(here, 'types-enumerate.ts')],
  { stderr: 'inherit' },
)
if (!enumerated.success) throw new Error('types-enumerate.ts failed')
const { found, topLevel, unique, namespaces, foreign, items, baselines } =
  JSON.parse(enumerated.stdout.toString()) as {
    found: number
    topLevel: number
    unique: number
    namespaces: number
    foreign: number
    items: Item[]
    baselines: Record<string, string>
  }
log(
  `${typesDir}: ${found} exports across the entry points, ${topLevel} unique; ${namespaces} namespaces among ${unique} unique symbols expand into their members, and ${foreign} belong to re-exported dependencies, leaving ${items.length} exports to measure`,
)

type Measured = {
  line: string
  job: Job
  forms?: Record<string, string> | undefined
  /** The count a type test pins with `.instantiations`. */
  pinned?: number | undefined
  /** What a type test without a pinned count asserts instead, for its note. */
  pins?: string | undefined
}
const measured: Measured[] = items.map((item) => ({
  line: item.item,
  forms: item.forms,
  job: {
    id: 0,
    mode: 'export',
    file: consumerFile,
    text: item.text,
    group: item.group,
    baseline: baselines[item.group]!,
  },
}))
const benchPattern = library.config.types?.benches
const benchJobs = benchPattern ? benches(benchPattern) : []
measured.push(...benchJobs)
for (const [id, entry] of measured.entries()) entry.job.id = id

const concurrency = Math.max(
  1,
  Math.min(
    Number(process.env.UPHILL_CONCURRENCY) || 2,
    Math.floor(availableMemory() / workerBytes),
  ),
)

// The costliest checks start first, so the slowest one does not run alone at the end. The last
// run's CPU times order the queue; they only decide the order, never a value.
const costsFile = path.join(
  os.tmpdir(),
  `uphill-types-costs-${library.name.replace(/[^\w.-]/g, '_')}.json`,
)
const costs: Record<string, number> = fs.existsSync(costsFile)
  ? JSON.parse(fs.readFileSync(costsFile, 'utf8'))
  : {}
const order = (job: Job) =>
  costs[measured[job.id]!.line] ?? Number.POSITIVE_INFINITY
const exportQueue = measured
  .filter((entry) => entry.job.mode === 'export')
  .map((entry) => entry.job)
exportQueue.sort((a, b) => order(b) - order(a) || a.id - b.id)
// The type tests import the library's sources rather than its declarations, so one worker parses
// those.
const benchQueue = measured
  .filter((entry) => entry.job.mode === 'bench')
  .map((entry) => entry.job)
log(`checking ${measured.length} consumers in ${concurrency} workers`)

// Every worker warms up its JIT on the same few consumers before it measures anything, so the first
// jobs it measures are not slower than the rest.
const warmup = items
  .filter((_, index) => index % Math.ceil(items.length / 8) === 0)
  .map((item, index) => ({
    ...measured[items.indexOf(item)]!.job,
    id: -1 - index,
  }))
const results = new Map<number, Result>()
const peaks: number[] = []
const skipped: string[] = []
await Promise.all(
  Array.from({ length: concurrency }, (_, index) =>
    work(index ? [] : benchQueue),
  ),
)

const lines: string[] = []
const exportsMeasured = measured.filter(
  (entry) => entry.job.mode === 'export' && results.has(entry.job.id),
)
const cost = (entry: Measured) => {
  const result = results.get(entry.job.id)!
  return {
    instantiations: result.instantiations - result.baseline.instantiations,
    cpu: Math.max(0, result.cpu - result.baseline.cpu),
    bytes: Math.max(0, result.bytes - result.baseline.bytes),
  }
}
// The costliest exports by instantiations and by check time say where their cost comes from.
const costliest = new Set(
  (['instantiations', 'cpu'] as const).flatMap((key) =>
    exportsMeasured
      .toSorted((a, b) => cost(b)[key] - cost(a)[key])
      .slice(0, 25),
  ),
)
for (const entry of measured) {
  const { line, job, pinned, pins } = entry
  const result = results.get(job.id)
  if (!result) continue
  const { instantiations, cpu, bytes } = cost(entry)
  // A test without its siblings leaves imports unused, which its runner sees as well.
  for (const error of result.errors)
    if (job.mode === 'export' || ![6133, 6192, 6196, 6198].includes(error.code))
      log(`${line}: TS${error.code}: ${error.message}`)
  if (job.mode === 'bench') {
    // The runner's own threshold: a test fails 20% above its pinned count.
    const target =
      pinned === undefined ? '' : ` target ${Math.round(pinned * 1.2)}`
    const text = pinned === undefined ? ` note ${quote(pins!)}` : ''
    lines.push(
      `bench-instantiations ${quote(line)} ${instantiations}${target}${text}`,
    )
    continue
  }
  const text = costliest.has(entry) ? note(result, entry.forms!) : ''
  lines.push(
    `instantiations ${quote(line)} ${instantiations}${text}`,
    `check-time ${quote(line)} ${cpu.toFixed(3)}ms${text}`,
    `check-memory ${quote(line)} ${size(bytes)}${text}`,
  )
}
if (!benchJobs.length) {
  const reason = benchPattern
    ? `no type tests in ${benchPattern}`
    : 'no type-test files: types.benches is not set'
  lines.push(`bench-instantiations skip note ${quote(reason)}`)
}

fs.appendFileSync(metrics, `${[...lines, ...hot(lines)].join('\n')}\n`)
const next = Object.fromEntries(
  exportsMeasured.map((entry) => [entry.line, cost(entry).cpu]),
)
fs.writeFileSync(`${costsFile}.${process.pid}`, JSON.stringify(next))
fs.renameSync(`${costsFile}.${process.pid}`, costsFile)
if (skipped.length)
  log(
    `${skipped.length} consumers ran a worker out of memory and were not measured: ${skipped.join(', ')}`,
  )
log(
  `checked ${results.size} consumers in ${((performance.now() - started) / 1000).toFixed(1)}s with ${concurrency} workers; peak worker memory ${size(Math.max(...peaks))}`,
)

/**
 * Runs one Node worker until the queues are empty: first its own jobs, then the shared export
 * queue. A worker that runs out of memory hands its job to a worker with a larger heap, once, if
 * the machine has the memory for it; otherwise the job is left out. That worker skips the warm-up,
 * so it only parses what the job needs.
 */
async function work(own: Job[], limit = heap): Promise<void> {
  const worker = Bun.spawn(
    [node, `--max-old-space-size=${limit}`, path.join(here, 'types-worker.ts')],
    {
      stdin: 'pipe',
      stdout: 'pipe',
      stderr: 'inherit',
    },
  )
  const pending = limit === heap ? [...warmup, ...warmup] : []
  let current: Job | undefined
  const send = () => {
    current =
      pending.shift() ??
      own.shift() ??
      (limit === heap ? exportQueue.shift() : undefined)
    if (current) worker.stdin.write(`${jsonLine(current)}\n`)
    else worker.stdin.end()
  }
  send()
  let buffer = ''
  for await (const chunk of worker.stdout.pipeThrough(
    new TextDecoderStream(),
  )) {
    buffer += chunk
    for (
      let newline = buffer.indexOf('\n');
      newline >= 0;
      newline = buffer.indexOf('\n')
    ) {
      const result: Result & { peak?: number } = JSON.parse(
        buffer.slice(0, newline),
      )
      buffer = buffer.slice(newline + 1)
      if (result.peak) peaks.push(result.peak)
      else {
        if (result.id >= 0) {
          results.set(result.id, result)
          if (results.size % 500 === 0)
            log(`${results.size} of ${measured.length} checked`)
        }
        send()
      }
    }
  }
  const status = await worker.exited
  if (status === 0) return
  if (!current || current.id < 0)
    throw new Error(`a types worker exited with status ${status}`)
  const line = measured[current.id]!.line
  if (limit !== heap || availableMemory() < 2.5e9) {
    log(
      `${line} ran a worker out of memory at ${limit}MB and there is no room for a larger heap; leaving it out`,
    )
    skipped.push(line)
  } else {
    log(
      `${line} ran a worker out of memory; checking it with a ${largeHeap}MB heap`,
    )
    await work([current], largeHeap)
  }
  if (limit === heap) await work(own)
}

/**
 * Says which of a consumer's forms the instantiations come from, such as its return type, and
 * the type it is declared as.
 */
function note(result: Result, forms: Record<string, string>): string {
  const total = Object.values(result.parts).reduce(
    (sum, count) => sum + count,
    0,
  )
  const [name, count] =
    Object.entries(result.parts).toSorted((a, b) => b[1] - a[1])[0] ?? []
  if (!name || !count || !total || !forms[name]) return ''
  return ` note ${quote(`${Math.round((count / total) * 100)}% of instantiations come from ${forms[name]}`)}`
}

/**
 * One job per test in the type-test files, built the way the runner counts instantiations: the
 * file with every `bench()`, `it()` and `test()` call removed, at any depth, is the baseline, and
 * the test's function is added back as a constant.
 */
function benches(pattern: string): Measured[] {
  const result: Measured[] = []
  const names = ['bench', 'it', 'test']
  const repeats = new Map<string, number>()
  // Build output and installed packages hold no tests of the library's own.
  const build = `${path.relative(library.root, library.build)}/`
  const files = [...new Bun.Glob(pattern).scanSync(library.root)]
    .filter(
      (file) =>
        !/(^|\/)node_modules\//.test(file) &&
        (build === '/' || !file.startsWith(build)),
    )
    .sort()
  for (const relative of files) {
    const file = path.join(library.root, relative)
    const text = fs.readFileSync(file, 'utf8')
    const source = ts.createSourceFile(file, text, ts.ScriptTarget.ES2022, true)
    const tests: TS.CallExpression[] = []
    const visit = (node: TS.Node) => {
      if (
        ts.isCallExpression(node) &&
        names.includes(node.expression.getText(source))
      )
        tests.push(node)
      ts.forEachChild(node, visit)
    }
    visit(source)
    let baseline = text
    for (const call of tests)
      baseline = baseline.replace(call.getFullText(source), '')
    for (const call of tests) {
      const name = call.arguments[0]
      const body = call.arguments.find(
        (node) => ts.isArrowFunction(node) || ts.isFunctionExpression(node),
      )
      if (!name || !ts.isStringLiteralLike(name) || !body) continue
      const bodyText = body.getText(source)
      const pinned = /\.instantiations\(\[\s*([\d_]+)/.exec(bodyText)?.[1]
      const count = (pattern: RegExp, what: string) => {
        const found = bodyText.match(pattern)?.length ?? 0
        return found ? [`${found} ${what}${found === 1 ? '' : 's'}`] : []
      }
      const asserted = [
        ...count(/\.snap\(/g, 'type string'),
        ...count(/expectTypeOf\(/g, 'expectTypeOf assertion'),
      ]
      // Tests with the same name in the same `describe` get a number from the second on.
      let line = [relative, ...describePath(call, source), name.text].join(
        ' > ',
      )
      const repeat = (repeats.get(line) ?? 0) + 1
      repeats.set(line, repeat)
      if (repeat > 1) line += ` (${repeat})`
      result.push({
        line,
        pinned:
          pinned === undefined ? undefined : Number(pinned.replaceAll('_', '')),
        pins: `pins ${asserted.join(' and ') || 'no types'}, not an instantiation count`,
        job: {
          id: 0,
          mode: 'bench',
          file: `${file}.nonexistent.ts`,
          text: `${baseline}\nconst $isolatedBench = ${body.getFullText(source)}`,
          group: relative,
          baseline,
        },
      })
    }
  }
  return result
}

/** The names of the `describe` calls around a test, outermost first. */
function describePath(node: TS.Node, source: TS.SourceFile): string[] {
  const names: string[] = []
  for (let current = node.parent; current; current = current.parent) {
    if (
      !ts.isCallExpression(current) ||
      current.expression.getText(source) !== 'describe'
    )
      continue
    const name = current.arguments[0]
    if (name)
      names.unshift(
        ts.isStringLiteralLike(name) ? name.text : name.getText(source),
      )
  }
  return names
}

/**
 * A job as one line of JSON. Node's readline also ends lines at U+2028 and U+2029, which
 * `JSON.stringify` leaves as they are and test files can hold.
 */
function jsonLine(job: Job): string {
  return JSON.stringify(job).replace(/[\u2028\u2029]/g, (char) =>
    char === '\u2028' ? '\\u2028' : '\\u2029',
  )
}

/** Quotes an item or note for a metric line, escaping `"` and `\`. */
function quote(text: string): string {
  return `"${text.replaceAll('\\', '\\\\').replaceAll('"', '\\"')}"`
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
