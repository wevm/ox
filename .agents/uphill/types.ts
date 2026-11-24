/**
 * Writes the type-checking cost of every public export of the entry points in package.json,
 * values and types, and of each test in the attest files, `src/**\/*.snap-d.ts` and
 * `src/**\/*.bench-d.ts`.
 *
 * For each export, types-enumerate.ts writes a small consumer file that imports it and forces its
 * type to resolve; its comments say which forms each kind of export gets. A pool of Node workers
 * (types-worker.ts) checks each consumer in a fresh `ts.Program` with ox's compiler options and
 * subtracts a baseline that only imports the entry point:
 *
 * - `instantiations`: type instantiations, exact and repeatable.
 * - `check-time`: CPU time to check the consumer.
 * - `check-memory`: heap bytes the check allocates.
 * - `bench-instantiations`: the instantiations attest counts for each attest test, the way
 *   `attest.instantiations` does: the file with every `test()` removed is the baseline, and the
 *   test's function is added back as a constant. A test that pins a count with
 *   `attest.instantiations([count, 'instantiations'])` gets that count plus 20%, the threshold
 *   attest enforces; the others pin type strings, so their lines carry no target.
 *
 * Node runs the TypeScript work, as it does for `tsc` and editors, and V8 counts allocated bytes,
 * which JavaScriptCore does not. The script checks the declarations `pnpm build` writes to dist.
 * `UPHILL_CONCURRENCY` sets the pool size, which free memory caps.
 *
 * @module
 */

import * as fs from 'node:fs'
import * as os from 'node:os'
import * as path from 'node:path'

import ts from 'typescript'

import type { Item } from './types-enumerate.ts'
import { hot } from './hot.ts'
import { consumerFile, typesDir } from './types-host.ts'
import type { Job, Result } from './types-worker.ts'

/**
 * Each worker's V8 heap limit in MB. A check that needs more is checked again in a worker of its
 * own with `largeHeap`.
 */
const heap = 1536
const largeHeap = 4096
/** The resident memory one worker can reach, which caps the pool by free memory. */
const workerBytes = 1.75e9

const root = process.cwd()
const metrics = process.env.UPHILL_METRICS
if (!metrics) throw new Error('UPHILL_METRICS is not set')
const here = import.meta.dir
const started = performance.now()

const enumerated = Bun.spawnSync(
  ['node', path.join(here, 'types-enumerate.ts')],
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
console.error(
  `${typesDir}: ${found} exports across the entry points, ${topLevel} unique; ${namespaces} namespaces among ${unique} unique symbols expand into their members, and ${foreign} are zod's, leaving ${items.length} exports to measure`,
)

type Measured = {
  line: string
  job: Job
  forms?: Record<string, string> | undefined
  /** The count an attest test pins with `attest.instantiations`. */
  pinned?: number | undefined
  /** What an attest test without a pinned count asserts instead, for its note. */
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
measured.push(...benches())
for (const [id, entry] of measured.entries()) entry.job.id = id

const concurrency = Math.max(
  1,
  Math.min(
    Number(process.env.UPHILL_CONCURRENCY) || os.availableParallelism(),
    Math.floor(os.freemem() / workerBytes),
  ),
)

// The costliest checks start first, so the slowest one does not run alone at the end. The last
// run's CPU times order the queue; they only decide the order, never a value.
const costsFile = path.join(os.tmpdir(), 'uphill-ox-types-costs.json')
const costs: Record<string, number> = fs.existsSync(costsFile)
  ? JSON.parse(fs.readFileSync(costsFile, 'utf8'))
  : {}
const order = (job: Job) =>
  costs[measured[job.id]!.line] ?? Number.POSITIVE_INFINITY
const exportQueue = measured
  .filter((entry) => entry.job.mode === 'export')
  .map((entry) => entry.job)
exportQueue.sort((a, b) => order(b) - order(a) || a.id - b.id)
// The attest tests import ox's sources rather than its declarations, so one worker parses those.
const benchQueue = measured
  .filter((entry) => entry.job.mode === 'bench')
  .map((entry) => entry.job)
console.error(`checking ${measured.length} consumers in ${concurrency} workers`)

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
await Promise.all(
  Array.from({ length: concurrency }, (_, index) =>
    work(index ? [] : benchQueue),
  ),
)

const lines: string[] = []
const exportsMeasured = measured.filter((entry) => entry.job.mode === 'export')
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
      .slice(0, 15),
  ),
)
for (const entry of measured) {
  const { line, job, pinned, pins } = entry
  const result = results.get(job.id)!
  const { instantiations, cpu, bytes } = cost(entry)
  // A test without its siblings leaves imports unused, which attest sees as well.
  for (const error of result.errors)
    if (job.mode === 'export' || ![6133, 6192, 6196, 6198].includes(error.code))
      console.error(`${line}: TS${error.code}: ${error.message}`)
  if (job.mode === 'bench') {
    // attest's own threshold: a test fails 20% above its pinned count.
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
fs.appendFileSync(metrics, `${[...lines, ...hot(lines)].join('\n')}\n`)
const next = Object.fromEntries(
  exportsMeasured.map((entry) => [entry.line, cost(entry).cpu]),
)
fs.writeFileSync(`${costsFile}.${process.pid}`, JSON.stringify(next))
fs.renameSync(`${costsFile}.${process.pid}`, costsFile)
console.error(
  `checked ${measured.length} consumers in ${((performance.now() - started) / 1000).toFixed(1)}s with ${concurrency} workers; peak worker memory ${size(Math.max(...peaks))}`,
)

/**
 * Runs one Node worker until the queues are empty: first its own jobs, then the shared export
 * queue. A worker that runs out of memory hands its job to a worker with a larger heap.
 */
async function work(own: Job[] = [], limit = heap): Promise<void> {
  const worker = Bun.spawn(
    [
      'node',
      `--max-old-space-size=${limit}`,
      path.join(here, 'types-worker.ts'),
    ],
    {
      stdin: 'pipe',
      stdout: 'pipe',
      stderr: 'inherit',
    },
  )
  const pending = [...warmup, ...warmup]
  let current: Job | undefined
  const send = () => {
    current =
      pending.shift() ??
      own.shift() ??
      (limit === heap ? exportQueue.shift() : undefined)
    if (current) worker.stdin.write(`${JSON.stringify(current)}\n`)
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
            console.error(`${results.size} of ${measured.length} checked`)
        }
        send()
      }
    }
  }
  const status = await worker.exited
  if (status === 0) return
  if (!current || current.id < 0 || limit !== heap)
    throw new Error(`a types worker exited with status ${status}`)
  console.error(
    `${measured[current.id]!.line} ran a worker out of memory; checking it with a ${largeHeap}MB heap`,
  )
  await work([current], largeHeap)
  await work(own)
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
 * One job per test in the attest files, built the way attest counts instantiations: the file with
 * every `bench()`, `it()` and `test()` call removed, at any depth, is the baseline, and the test's
 * function is added back as a constant.
 */
function benches(): Measured[] {
  const result: Measured[] = []
  const names = ['bench', 'it', 'test']
  const repeats = new Map<string, number>()
  const files = [
    ...new Bun.Glob('src/**/*.{snap,bench}-d.ts').scanSync(root),
  ].sort()
  for (const relative of files) {
    const file = path.join(root, relative)
    const text = fs.readFileSync(file, 'utf8')
    const source = ts.createSourceFile(file, text, ts.ScriptTarget.ES2022, true)
    const tests: ts.CallExpression[] = []
    const visit = (node: ts.Node) => {
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
      const pinned = /attest\.instantiations\(\[\s*([\d_]+)/.exec(bodyText)?.[1]
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
          text: `${baseline}\nconst $attestIsolatedBench = ${body.getFullText(source)}`,
          group: relative,
          baseline,
        },
      })
    }
  }
  return result
}

/** The names of the `describe` calls around a test, outermost first. */
function describePath(node: ts.Node, source: ts.SourceFile): string[] {
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
