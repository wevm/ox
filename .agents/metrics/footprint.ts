/**
 * Writes what each public export of ox costs a consumer, and whether each entry point tree-shakes
 * away entirely when nothing is used from it.
 *
 * - `entry-size`: the gzipped size of the bundle rolldown builds for one use of an export, the way
 *   users import it: `import { Hex } from 'ox'; export const $ = Hex.fromString` for every
 *   runtime export of every leaf module, `export { Hex } from 'ox'` for each whole module, and
 *   `export * from 'ox/tempo'` for each barrel. Items are named the same way, such as
 *   `ox:Hex.fromString`, `ox:Hex` and `ox/tempo` (see names.ts). Rolldown tree-shakes and
 *   minifies each import for the browser, as a consumer's bundler would.
 * - `tree-shaking`: for every leaf entry, whether `import '<entry>'` bundles to nothing when the
 *   bundler ignores ox's `"sideEffects": false`, as it does once ox is inlined into another
 *   package's bundle. Top-level code a bundler cannot prove pure, such as a call without a
 *   `\/*#__PURE__*\/` annotation, fails the check, and stays in every bundle that uses anything from
 *   that module, even with the flag. The note names the modules that keep code.
 *
 * The builds run in a pool of `UPHILL_CONCURRENCY` builds, or one per core.
 *
 * @module
 */

import * as fs from 'node:fs'
import { isBuiltin } from 'node:module'
import * as os from 'node:os'
import * as path from 'node:path'
import { type OutputChunk, rolldown } from 'rolldown'
import { getExports } from '../../scripts/utils/exports.js'
import { hot } from './hot.ts'
import { rename } from './names.ts'

const metrics = process.env.UPHILL_METRICS
if (!metrics) throw new Error('UPHILL_METRICS is not set')

const started = performance.now()
const root = process.cwd()
const esm = path.join(root, 'src/_esm/')
const concurrency =
  Number(process.env.UPHILL_CONCURRENCY) || os.availableParallelism()

// The exports map prepublish writes to src/package.json. `*.test-d` subpaths are type tests that
// getExports does not skip, and `index.docs` exists only for the docs generator.
const entries = Object.entries(getExports().dist).filter(
  (entry): entry is [string, { import: string }] =>
    typeof entry[1] !== 'string' &&
    !entry[0].endsWith('.test-d') &&
    entry[0] !== './index.docs',
)

// A consumer's bundler finds ox in its node_modules and resolves each subpath through the exports
// map. The scratch package carries that map with src/package.json's other fields, and links the
// build and ox's node_modules, so ox's dependencies resolve as they do for a consumer.
const scratch = fs.mkdtempSync(path.join(os.tmpdir(), 'footprint-'))
const ox = path.join(scratch, 'node_modules/ox')
fs.mkdirSync(ox, { recursive: true })
fs.symlinkSync(path.join(root, 'src/_esm'), path.join(ox, '_esm'))
fs.symlinkSync(path.join(root, 'node_modules'), path.join(ox, 'node_modules'))
const pkg = await Bun.file(path.join(root, 'src/package.json')).json()
fs.writeFileSync(
  path.join(ox, 'package.json'),
  JSON.stringify({
    ...pkg,
    exports: Object.fromEntries(
      entries.map(([subpath, target]) => [subpath, { import: target.import }]),
    ),
  }),
)

type Job = { code: string; item: string; metric: 'entry-size' | 'tree-shaking' }
const jobs: Job[] = []
for (const [subpath, target] of entries) {
  const entry = `ox${subpath.slice(1)}`
  const module = await import(path.join(root, 'src', target.import))
  // A barrel only re-exports leaf modules as namespaces, whose exports are measured through it
  // below, so it is measured as a whole.
  const barrel = Object.values(module).every(
    (value) =>
      typeof value === 'object' &&
      value !== null &&
      Object.prototype.toString.call(value) === '[object Module]',
  )
  if (barrel) {
    jobs.push({
      code: `export * from '${entry}'\n`,
      item: entry,
      metric: 'entry-size',
    })
    continue
  }
  jobs.push({
    code: `import '${entry}'\n`,
    item: entry,
    metric: 'tree-shaking',
  })
  // A module no barrel re-exports is measured from its own entry.
  const namespace = rename(entry)
  const [index, name] =
    namespace === entry ? [entry] : (namespace.split(':') as [string, string])
  jobs.push({
    code: name
      ? `export { ${name} } from '${index}'\n`
      : `export * from '${entry}'\n`,
    item: namespace,
    metric: 'entry-size',
  })
  for (const member of Object.keys(module))
    jobs.push({
      code: name
        ? `import { ${name} } from '${index}'\nexport const $ = ${name}.${member}\n`
        : `export { ${member} } from '${entry}'\n`,
      item: name ? `${namespace}.${member}` : `${entry}:${member}`,
      metric: 'entry-size',
    })
}

// Each worker takes the next job until none are left, or until a build fails.
const lines: string[] = []
let next = 0
let failure: string | undefined
await Promise.all(
  Array.from({ length: Math.min(concurrency, jobs.length) }, async () => {
    while (failure === undefined && next < jobs.length) {
      const index = next++
      const job = jobs[index]!
      try {
        lines[index] = await measure(index, job)
      } catch (error) {
        failure ??= `${job.item}: ${(error as Error).message}`
      }
    }
  }),
)
fs.rmSync(scratch, { force: true, recursive: true })

if (failure) {
  // biome-ignore lint/suspicious/noConsole: a metric script reports failures on stderr
  console.error(`footprint: could not measure ${failure}`)
  process.exit(1)
}

fs.appendFileSync(metrics, `${[...lines, ...hot(lines)].join('\n')}\n`)
console.log(
  `footprint: measured ${jobs.length} items in ${((performance.now() - started) / 1000).toFixed(1)}s, ${concurrency} builds at a time`,
)

/** Bundles one consumer module, and returns its metric line. */
async function measure(index: number, job: Job): Promise<string> {
  const input = path.join(scratch, `${index}.js`)
  fs.writeFileSync(input, job.code)
  // Dropping JSDoc comments leaves the minified code unchanged, and keeps comments out of each
  // module's rendered bytes, which rank what the bundle holds.
  const bundle = await rolldown({
    input,
    platform: 'browser',
    logLevel: 'silent',
    experimental: { attachDebugInfo: 'none' },
    // The tree-shaking check treats the entry's own module as having side effects, as a bundler
    // does when a consumer uses anything from it, and keeps only its top-level statements that
    // could have an effect. Property reads and unknown globals count as pure, so declaring a class
    // that extends `Errors.BaseError` passes, and a call or a `2n ** 8n` does not.
    ...(job.metric === 'tree-shaking'
      ? {
          plugins: [included(job.item)],
          treeshake: {
            propertyReadSideEffects: false as const,
            unknownGlobalSideEffects: false,
          },
        }
      : {}),
  })
  const output = await bundle
    .generate({ format: 'esm', minify: true, comments: { jsdoc: false } })
    .finally(() => bundle.close())

  // The consumer loads the entry chunk and every chunk it imports statically. Chunks that a dynamic
  // `import()` loads stay out, since they load only when that code runs.
  const chunks = new Map<string, OutputChunk>()
  for (const file of output.output)
    if (file.type === 'chunk') chunks.set(file.fileName, file)
  const loaded = new Set<OutputChunk>()
  const load = (chunk: OutputChunk) => {
    if (loaded.has(chunk)) return
    loaded.add(chunk)
    for (const id of chunk.imports) {
      const imported = chunks.get(id)
      if (imported) load(imported)
      else if (!isBuiltin(id)) throw new Error(`could not resolve "${id}"`)
    }
  }
  load(output.output[0])

  if (job.metric === 'tree-shaking') {
    const kept = rank(loaded)
    if (kept.length === 0) return `tree-shaking ${quote(job.item)} pass`
    let size = 0
    for (const chunk of loaded) size += Bun.gzipSync(chunk.code).length
    const top = kept.slice(0, 3).map(([name, bytes]) => `${name} ${bytes} B`)
    return `tree-shaking ${quote(job.item)} fail note ${quote(`keeps ${size} B gzipped: ${top.join(', ')}`)}`
  }

  let size = 0
  for (const chunk of loaded) size += Bun.gzipSync(chunk.code).length
  const line = `entry-size ${quote(job.item)} ${size}B`
  if (size <= 5000) return line

  // Above 5 kB, name the three packages or ox modules that render the most bytes, so a reader
  // knows what to cut first.
  const ranked = rank(loaded)
  const total = ranked.reduce((sum, [, bytes]) => sum + bytes, 0)
  const top = ranked
    .map(([name, bytes]) => [name, Math.round((bytes / total) * 100)] as const)
    .filter(([, share]) => share > 0)
    .slice(0, 3)
    .map(([name, share]) => `${name} ${share}%`)
  return `${line} note ${quote(`most bytes: ${top.join(', ')}`)}`
}

/** A rolldown plugin that marks the module an entry resolves to as having side effects. */
function included(entry: string) {
  const file = fs.realpathSync(
    path.join(
      root,
      'src',
      entries.find(([subpath]) => `ox${subpath.slice(1)}` === entry)![1].import,
    ),
  )
  return {
    name: 'included',
    load(id: string) {
      if (id === file)
        return { code: fs.readFileSync(id, 'utf8'), moduleSideEffects: true }
      return null
    },
  }
}

/** Ranks the packages and ox modules of a bundle by the minified bytes they render. */
function rank(loaded: Set<OutputChunk>): (readonly [string, number])[] {
  const bytes = new Map<string, number>()
  for (const chunk of loaded)
    for (const [id, module] of Object.entries(chunk.modules)) {
      if (module.renderedLength === 0) continue
      // The consumer module only re-exports or imports.
      if (id.startsWith(scratch) && !id.includes('/node_modules/')) continue
      const name = owner(id)
      bytes.set(name, (bytes.get(name) ?? 0) + module.renderedLength)
    }
  return [...bytes].sort((a, b) => b[1] - a[1] || (a[0] < b[0] ? -1 : 1))
}

/** Returns the package a module belongs to, or the path of an ox module inside src/_esm. */
function owner(id: string): string {
  const real = fs.existsSync(id) ? fs.realpathSync(id) : id
  if (real.startsWith(esm)) return real.slice(esm.length)
  const modules = real.lastIndexOf('/node_modules/')
  if (modules !== -1) {
    const [scope, name] = real
      .slice(modules + '/node_modules/'.length)
      .split('/')
    return scope!.startsWith('@') ? `${scope}/${name}` : scope!
  }
  return real.replace('\0', '')
}

/** Quotes an item or note for a metric line. */
function quote(text: string): string {
  return `"${text.replace(/["\\]/g, '\\$&')}"`
}
