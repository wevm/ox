/**
 * Vitest configuration that records what ox's own tests call each exported function with. It
 * reuses the config ox's tests run with (`testConfig()` in repo.ts): its aliases, with `ox`
 * resolving to the source, its setup files, and the `core` project's global setup, which starts
 * anvil through prool (forking mainnet). It adds a transform that wraps every export of ox's
 * modules in src/ (test files excluded, `internal/` modules included) with
 * `globalThis.__uphillWrap`, which `speed-record-setup.ts` installs. Without anvil, the tests that
 * need it fail at once and record less.
 *
 * Projects: `core` and `tempo-unit` as ox defines them; `frames-unit`, which runs the tests in src/
 * of ox's `tmp_frames` project (`TxEnvelopeEip8141.test.ts`) without its global setup, which
 * starts a frames node in Docker, so its unit tests record and the ones that need the node fail at
 * once; and `calls`, which runs `speed-calls.test.ts`, the calls for public functions no test
 * calls in a way the bench can replay. The browser and fuzz projects, and the Tempo end-to-end
 * tests, which need a Tempo node in Docker, are left out.
 *
 * `speed.ts` runs it with `UPHILL_SPEED_RECORD_DIR` set; no test file changes.
 *
 * @module
 */

import * as path from 'node:path'

import * as acorn from 'acorn'
import MagicString from 'magic-string'
import { defineConfig, type Plugin } from 'vitest/config'

import { testConfig } from './repo.ts'

const root = path.resolve(import.meta.dirname, '../..')
const setup = path.join(import.meta.dirname, 'speed-record-setup.ts')
const workers = Number(process.env.UPHILL_SPEED_RECORD_WORKERS) || 2

type Project = {
  test?: {
    name?: string
    include?: string[]
    setupFiles?: string[]
    globalSetup?: string[]
  }
}
type Base = {
  envPrefix?: string | string[]
  test?: {
    alias?: Record<string, string>
    projects?: unknown[]
    resolveSnapshotPath?: (path: string, extension: string) => string
  }
}
const base = (await testConfig()) as Base
const projects = (base.test?.projects ?? []) as Project[]
const ox = (name: string) => {
  const project = projects.find((project) => project.test?.name === name)?.test
  if (!project) throw new Error(`ox's vitest config has no ${name} project.`)
  return project
}
const core = ox('core')
const tempo = ox('tempo-unit')
const frames = ox('tmp_frames')

export default defineConfig({
  root,
  plugins: [record()],
  envPrefix: base.envPrefix,
  test: {
    alias: [
      // On 0.x, `ox` resolves through src/package.json's `module` to the build in src/_esm, which
      // the transform does not wrap, so it resolves to the source instead. Subpaths such as
      // `ox/tempo` are directories of src/ without a package.json, so they reach the source.
      { find: /^ox$/, replacement: path.join(root, 'src/index.ts') },
      ...Object.entries(base.test?.alias ?? {}).map(([find, replacement]) => ({
        find,
        replacement,
      })),
    ],
    resolveSnapshotPath: base.test?.resolveSnapshotPath,
    passWithNoTests: true,
    // Wrapped calls run slower than ox's own timeouts allow for.
    hookTimeout: 60_000,
    testTimeout: 60_000,
    // A failing test records the calls it made before failing; retrying it only wastes time.
    retry: 0,
    pool: 'forks',
    maxWorkers: workers,
    // A worker whose heap grows unchecked can get the whole run killed for memory on a shared
    // machine; a capped heap collects sooner. Logs of passing tests are not kept either.
    execArgv: ['--max-old-space-size=1280'],
    silent: 'passed-only',
    // Every test file runs in a fresh module graph, so one file's leftovers do not fill the
    // worker's heap, and the setup file seeds randomness for each file.
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
          name: 'frames-unit',
          include: (frames.include ?? []).filter((file) =>
            file.startsWith('src/'),
          ),
          setupFiles: [setup],
        },
      },
      {
        extends: true,
        test: {
          name: 'calls',
          include: ['.agents/uphill/speed-calls.test.ts'],
          setupFiles: [setup, ...(core.setupFiles ?? [])],
        },
      },
    ],
  },
})

/**
 * Wraps each export of an ox module once the module has run, and hands each export of a test
 * helper module (`test/**`) to `globalThis.__uphillFixture`, which remembers its path.
 */
function record(): Plugin {
  return {
    name: 'uphill-speed-record',
    enforce: 'post',
    transform(code, id) {
      if (
        id.startsWith(`${root}/test/`) &&
        id.endsWith('.ts') &&
        !id.endsWith('.test.ts')
      )
        return fixtures(code, id)
      if (!id.startsWith(`${root}/src/`) || !id.endsWith('.ts')) return
      if (
        /\/(_test|_snap|_esm|_cjs|_types)\/|\.(test|test-d|bench|bench-d|snap-d|fuzz|conformance)\.ts$/.test(
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
          // A re-export from another module, such as Mnemonic's `export { path } from
          // './HdKey.js'`, is that module's export, already wrapped there. A re-export from a
          // dependency, such as zod's functions from `ox/zod` or a bip39 wordlist, becomes a
          // local binding, so calls and values through ox's entry points record under this module.
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
            // `export { a, b as c }` of local bindings.
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
        // Line-level maps: the transform appends to modules and changes nothing in place but
        // `const` to `let` and dependency re-exports to local bindings.
        map: output.generateMap({ source: id }),
      }
    },
  }
}

/** Appends a call to `globalThis.__uphillFixture` for each export a test helper module declares. */
function fixtures(code: string, id: string) {
  const program = acorn.parse(code, {
    ecmaVersion: 'latest',
    sourceType: 'module',
  }) as unknown as { body: Node[] }
  const names: string[] = []
  for (const node of program.body) {
    if (node.type !== 'ExportNamedDeclaration' || node.source) continue
    const declaration = node.declaration
    if (declaration?.type === 'VariableDeclaration')
      for (const declarator of declaration.declarations!) {
        if (declarator.id!.type === 'Identifier')
          names.push(declarator.id!.name!)
      }
    else if (declaration?.id) names.push(declaration.id.name!)
  }
  if (!names.length) return
  const file = JSON.stringify(path.relative(root, id))
  const output = new MagicString(code)
  output.append(
    `\n;{ const __f = globalThis.__uphillFixture; if (__f) { ${names.map((name) => `__f(${name}, ${file}, ${JSON.stringify(name)});`).join(' ')} } }\n`,
  )
  return { code: output.toString(), map: output.generateMap({ source: id }) }
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
