/**
 * Writes what each public export costs a consumer, and whether each module tree-shakes away when
 * nothing is used from it.
 *
 * - `entry-size`: the gzipped size of the bundle rolldown builds for one use of an export, such as
 *   `import { Hex } from 'ox'; export const $ = Hex.fromNumber`, for every runtime member of every
 *   namespace each entry point exports, for each whole namespace (`export { Hex } from 'ox'`), and
 *   for each whole entry point (`export * from 'ox/tempo'`). Rolldown tree-shakes and minifies each
 *   import for the browser, as a consumer's bundler would.
 * - `tree-shaking`: for every module entry, such as `ox/Hex`, whether `import 'ox/Hex'` bundles to
 *   nothing when the bundler ignores ox's `"sideEffects": false`, as it does once ox is inlined
 *   into another package's bundle. Top-level code a bundler cannot prove pure, such as a call
 *   without a `\/*#__PURE__*\/` annotation, a `2n ** 8n`, a runtime TypeScript namespace, or a
 *   static class field, fails the check, and stays in every bundle that uses anything from that
 *   module, even with the flag. The note names the modules that keep code.
 *
 * The builds run in a pool of `UPHILL_CONCURRENCY` builds, or one per core.
 *
 * Entry points come from package.json in its order, and a value several entries reach, such as
 * `Hex` from `ox` and from `ox/Hex`, is measured once under the first. zod's own functions, which
 * `ox/zod`'s `z` re-exports, are zod's and are left out.
 *
 * @module
 */

import * as fs from 'node:fs'
import { isBuiltin } from 'node:module'
import * as os from 'node:os'
import * as path from 'node:path'
import { type OutputChunk, rolldown } from 'rolldown'

import { entries } from './entries.ts'
import { hot } from './hot.ts'

const metrics = process.env.UPHILL_METRICS
if (!metrics) throw new Error('UPHILL_METRICS is not set')

const started = performance.now()
const root = path.resolve(import.meta.dir, '../..')
const dist = path.join(root, 'dist/')
const concurrency =
  Number(process.env.UPHILL_CONCURRENCY) || os.availableParallelism()

// A consumer's bundler finds ox in its node_modules and resolves each subpath through the exports
// map in package.json. Rolldown follows the link to the checkout, so ox's dependencies resolve
// from ox's node_modules.
const scratch = fs.mkdtempSync(path.join(os.tmpdir(), 'footprint-'))
fs.mkdirSync(path.join(scratch, 'node_modules'))
fs.symlinkSync(root, path.join(scratch, 'node_modules/ox'))

type Job = {
  code: string
  /** The built module the tree-shaking check treats as having side effects. */
  file?: string | undefined
  item: string
  metric: 'entry-size' | 'tree-shaking'
}
const jobs: Job[] = []
const seen = new Set<unknown>()
const zod = new Set<unknown>(Object.values(await import('zod/mini')))
for (const entry of entries()) {
  const module = await import(entry.file)
  if (!entry.index)
    jobs.push({
      code: `import '${entry.name}'\n`,
      file: fs.realpathSync(entry.file),
      item: entry.name,
      metric: 'tree-shaking',
    })
  if (entry.index) {
    // A whole entry is named by its bare specifier, so a target pattern such as `ox/tempo:*`
    // matches its exports and not the entry itself.
    jobs.push({
      code: `export * from '${entry.name}'\n`,
      item: entry.name,
      metric: 'entry-size',
    })
  } else if (!seen.has(module)) {
    // A module entry that no index reaches, such as `ox/TxEnvelope`, is measured whole too.
    seen.add(module)
    jobs.push({
      code: `export * from '${entry.name}'\n`,
      item: entry.name,
      metric: 'entry-size',
    })
  }
  // A namespace, such as `Hex` or zod's `z.Abi`, is measured whole and then member by member.
  const walk = (top: string, members: string[], value: unknown) => {
    const isObject =
      (!!value && typeof value === 'object') || typeof value === 'function'
    if (isObject && (seen.has(value) || zod.has(value))) return
    if (isObject) seen.add(value)
    const item = `${entry.name}:${[top, ...members].join('.')}`
    jobs.push({
      code: members.length
        ? `import { ${top} } from '${entry.name}'\nexport const $ = ${[top, ...members].join('.')}\n`
        : `export { ${top} } from '${entry.name}'\n`,
      item,
      metric: 'entry-size',
    })
    if (isModule(value) && members.length < 2)
      for (const [member, inner] of Object.entries(value))
        walk(top, [...members, member], inner)
  }
  for (const [name, value] of Object.entries(module)) walk(name, [], value)
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
  // Dropping JSDoc and the `// <module path>` comments leaves the minified code unchanged, and keeps
  // comments out of each module's rendered bytes, which rank what the bundle holds.
  const bundle = await rolldown({
    input,
    platform: 'browser',
    logLevel: 'silent',
    experimental: { attachDebugInfo: 'none' },
    // The tree-shaking check treats the entry's own module as having side effects, as a bundler
    // does when a consumer uses anything from it, and keeps only its top-level statements that
    // could have an effect. Property reads and unknown globals count as pure, so declaring a class
    // that extends `Errors.BaseError` passes, and a call or a `2n ** 8n` does not.
    ...(job.file
      ? {
          plugins: [sideEffects(job.file)],
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
      // Node built-ins, which `ox/node` imports, are left to the runtime. Any other import left in
      // the output is a module rolldown could not find.
      else if (!isBuiltin(id)) throw new Error(`could not resolve "${id}"`)
    }
  }
  load(output.output[0])

  let size = 0
  for (const chunk of loaded) size += Bun.gzipSync(chunk.code).length

  if (job.metric === 'tree-shaking') {
    const kept = rank(loaded)
    if (kept.length === 0) return `tree-shaking ${quote(job.item)} pass`
    const top = kept.slice(0, 3).map(([name, bytes]) => `${name} ${bytes} B`)
    return `tree-shaking ${quote(job.item)} fail note ${quote(`keeps ${size} B gzipped: ${top.join(', ')}`)}`
  }

  const line = `entry-size ${quote(job.item)} ${size}B`
  if (size <= 3000) return line

  // Above 3 kB, name the three packages or ox modules that render the most bytes, so a reader
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

/** A rolldown plugin that marks one built module as having side effects. */
function sideEffects(file: string) {
  return {
    name: 'side-effects',
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
      // The consumer module only imports or re-exports.
      if (id.startsWith(scratch) && !id.includes('/node_modules/')) continue
      const name = owner(id)
      bytes.set(name, (bytes.get(name) ?? 0) + module.renderedLength)
    }
  return [...bytes].sort((a, b) => b[1] - a[1] || (a[0] < b[0] ? -1 : 1))
}

/** Returns the package a module belongs to, or the path of an ox module inside dist. */
function owner(id: string): string {
  const modules = id.lastIndexOf('/node_modules/')
  if (modules !== -1) {
    const [scope, name] = id.slice(modules + '/node_modules/'.length).split('/')
    return scope!.startsWith('@') ? `${scope}/${name}` : scope!
  }
  if (id.startsWith(dist)) return id.slice(dist.length)
  return id.replace('\0', '')
}

function isModule(value: unknown): value is Record<string, unknown> {
  return (
    !!value &&
    typeof value === 'object' &&
    Object.prototype.toString.call(value) === '[object Module]'
  )
}

/** Quotes an item or note for a metric line. */
function quote(text: string): string {
  return `"${text.replace(/["\\]/g, '\\$&')}"`
}
