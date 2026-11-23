/**
 * Vitest configuration that records what ox's own tests call each exported function with. It
 * reuses vite.config.ts's aliases and the `core` and `tempo-unit` projects, with their setup
 * files and the global setup that starts anvil (forking mainnet), and adds a transform that wraps
 * every export of `src/**` (test files excluded) with `globalThis.__uphillWrap`, which
 * `speed-record-setup.ts` installs. Without Foundry, the tests that need anvil fail at once and
 * record less. Its `calls` project runs `speed-calls.test.ts`, which calls public functions no
 * test calls. The Tempo end-to-end tests, which need a Tempo node in Docker, and the frame
 * transaction tests, which need a frames node, are left out.
 *
 * `speed.ts` runs it with `UPHILL_SPEED_RECORD_DIR` set; no test file changes.
 *
 * @module
 */

import * as path from 'node:path'

import * as acorn from 'acorn'
import MagicString from 'magic-string'
import { defineConfig, type Plugin } from 'vitest/config'

import base from '../../vite.config.ts'

const root = path.resolve(import.meta.dirname, '../..')
const setup = path.join(import.meta.dirname, 'speed-record-setup.ts')
const workers = Number(process.env.UPHILL_SPEED_RECORD_WORKERS) || 2
const projects = (base.test?.projects ?? []) as {
  test?: {
    name?: string
    include?: string[]
    setupFiles?: string[]
    globalSetup?: string[]
  }
}[]
const ox = (name: string) => {
  const project = projects.find((project) => project.test?.name === name)?.test
  if (!project) throw new Error(`vite.config.ts has no ${name} project.`)
  return project
}
const core = ox('core')
const tempo = ox('tempo-unit')

export default defineConfig({
  root,
  plugins: [record()],
  envPrefix: base.envPrefix,
  test: {
    alias: base.test?.alias,
    resolveSnapshotPath: base.test?.resolveSnapshotPath,
    passWithNoTests: true,
    hookTimeout: 60_000,
    testTimeout: 60_000,
    // A failing test records the calls it made before failing; retrying it only wastes time.
    retry: 0,
    pool: 'forks',
    maxWorkers: workers,
    // A worker whose heap grows unchecked can get the whole run killed for memory; a capped heap
    // collects sooner. Logs of passing tests are not kept either.
    execArgv: ['--max-old-space-size=1280'],
    silent: 'passed-only',
    isolate: true,
    projects: [
      {
        extends: true,
        test: {
          name: 'core',
          include: core.include,
          globalSetup: core.globalSetup,
          setupFiles: [setup, ...(core.setupFiles ?? [])],
        },
      },
      {
        extends: true,
        test: {
          name: 'tempo-unit',
          include: tempo.include,
          setupFiles: [setup, ...(tempo.setupFiles ?? [])],
        },
      },
      {
        extends: true,
        test: {
          name: 'calls',
          include: ['.agents/metrics/speed-calls.test.ts'],
          setupFiles: [setup, path.join(root, 'test/setup.ts')],
        },
      },
    ],
  },
})

/** Wraps each export of a `src/**` module once the module has run. */
function record(): Plugin {
  return {
    name: 'uphill-speed-record',
    enforce: 'post',
    transform(code, id) {
      if (!id.startsWith(`${root}/src/`) || !id.endsWith('.ts')) return
      if (
        /\/_test\/|\/_snap\/|\.(test|test-d|bench|bench-d|snap-d|fuzz|conformance)\.ts$/.test(
          id,
        )
      )
        return
      const file = path.relative(root, id)
      const program = acorn.parse(code, {
        ecmaVersion: 'latest',
        sourceType: 'module',
      }) as unknown as { body: Node[] }
      const output = new MagicString(code)
      const consts = new Map<string, Node>()
      const imports = new Set<string>()
      const exports: [local: string, exported: string][] = []
      const relet = new Set<Node>()
      let reexports = 0

      for (const node of program.body) {
        if (node.type === 'ImportDeclaration')
          for (const specifier of node.specifiers!)
            imports.add(specifier.local!.name!)
        else if (node.type === 'VariableDeclaration' && node.kind === 'const')
          for (const declarator of node.declarations!)
            if (declarator.id!.type === 'Identifier')
              consts.set(declarator.id!.name!, node)
        if (node.type !== 'ExportNamedDeclaration') continue
        const declaration = node.declaration
        if (
          declaration?.type === 'FunctionDeclaration' ||
          declaration?.type === 'ClassDeclaration'
        )
          exports.push([declaration.id!.name!, declaration.id!.name!])
        else if (declaration?.type === 'VariableDeclaration') {
          for (const declarator of declaration.declarations!)
            if (declarator.id!.type === 'Identifier')
              exports.push([declarator.id!.name!, declarator.id!.name!])
          if (declaration.kind === 'const') relet.add(declaration)
        } else if (node.source) {
          // A re-export from a dependency, such as zod's functions from `ox/zod`, becomes a local
          // binding so calls through ox's entry points record under this module.
          const source = String(node.source.value)
          if (source.startsWith('.') || source.startsWith('/')) continue
          const locals: string[] = []
          const specifiers = node.specifiers!.filter(
            (specifier) =>
              specifier.local!.type === 'Identifier' &&
              specifier.exported!.type === 'Identifier',
          )
          if (
            !specifiers.length ||
            specifiers.length !== node.specifiers!.length
          )
            continue
          const imported = specifiers.map((specifier) => {
            const local = `__uphill_reexport_${reexports++}`
            locals.push(`${specifier.exported!.name} = ${local}`)
            exports.push([specifier.exported!.name!, specifier.exported!.name!])
            return `${specifier.local!.name} as ${local}`
          })
          output.overwrite(
            node.start,
            node.end,
            `import { ${imported.join(', ')} } from ${JSON.stringify(source)};\nexport let ${locals.join(', ')};`,
          )
        } else
          for (const specifier of node.specifiers!) {
            if (specifier.local!.type !== 'Identifier') continue
            exports.push([
              specifier.local!.name!,
              specifier.exported!.name ?? String(specifier.exported!.value),
            ])
          }
      }

      const wraps: string[] = []
      for (const [local, exported] of exports) {
        if (imports.has(local)) continue
        const declaration = consts.get(local)
        if (declaration) relet.add(declaration)
        wraps.push(
          `${local} = __w(${local}, ${JSON.stringify(file)}, ${JSON.stringify(exported)});`,
        )
      }
      if (!wraps.length) return
      for (const declaration of relet)
        output.overwrite(declaration.start, declaration.start + 5, 'let  ')
      output.append(
        `\n;{ const __w = globalThis.__uphillWrap; if (__w) { ${wraps.join(' ')} } }\n`,
      )
      return {
        code: output.toString(),
        map: output.generateMap({ source: id }),
      }
    },
  }
}

type Node = {
  type: string
  start: number
  end: number
  kind?: string
  name?: string
  value?: unknown
  id?: Node
  local?: Node
  exported?: Node
  source?: Node
  declaration?: Node | null
  declarations?: Node[]
  specifiers?: Node[]
}
