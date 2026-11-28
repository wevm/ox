/**
 * Vitest configuration that records what the library's own tests call each exported function
 * with. It reuses the project's vitest config, whose path `speed.ts` passes in
 * `UPHILL_SPEED_TEST_CONFIG`: its test options and aliases, with the package name resolving to the
 * root entry's source, and its projects with their setup files and global setup. It adds a
 * transform that wraps every export of the library's modules in the sources (test files excluded,
 * `internal/` modules included) with `globalThis.__uphillWrap`, which `speed-record-setup.ts`
 * installs.
 *
 * Projects: every project of the config that does not run in a browser, or the config's one test
 * config, unless `speed.projects` in `local/config.ts` picks and adjusts them. That
 * hook can drop a global setup that starts a server the recording cannot reach, narrow a
 * project's test files, and add test files of its own, such as calls for public functions no test
 * calls in a way the bench can replay.
 *
 * `speed.ts` runs it with `UPHILL_SPEED_RECORD_DIR` set. No test file changes.
 *
 * @module
 */

import * as path from 'node:path'
import { pathToFileURL } from 'node:url'

import * as acorn from 'acorn'
import MagicString from 'magic-string'
import type { Plugin } from 'vitest/config'

import * as library from './library.ts'

const root = library.root
const setup = path.join(import.meta.dirname, 'speed-record-setup.ts')
const workers = Number(process.env.UPHILL_SPEED_RECORD_WORKERS) || 2
const configFile = process.env.UPHILL_SPEED_TEST_CONFIG
if (!configFile) throw new Error('UPHILL_SPEED_TEST_CONFIG is not set.')

type Test = library.SpeedProject & {
  alias?: Record<string, string> | { find: string | RegExp }[] | undefined
  projects?: unknown[] | undefined
}

type Base = {
  envPrefix?: string | string[] | undefined
  plugins?: unknown[] | undefined
  resolve?: unknown
  test?: Test | undefined
}

// The config may export a function of the command and mode, or a promise.
const base = await (async (): Promise<Base> => {
  const module = (await import(pathToFileURL(configFile).href)) as {
    default: unknown
  }
  const exported = await module.default
  return typeof exported === 'function'
    ? await exported({ command: 'serve', mode: 'test' })
    : (exported as Base)
})()

const list = (value: string | string[] | undefined) =>
  value === undefined ? [] : [value].flat()

// Each project extends the root options, which merge arrays, so the test files and setup files
// stay on the projects.
const {
  browser,
  exclude,
  globalSetup,
  include,
  projects: listed,
  setupFiles,
  ...options
} = base.test ?? {}
const found = listed
  ? listed.flatMap((project) => {
      if (!project || typeof project !== 'object' || !('test' in project))
        return []
      const test = (project as { test: library.SpeedProject }).test
      return [
        {
          ...test,
          exclude:
            exclude || test.exclude
              ? [...(exclude ?? []), ...(test.exclude ?? [])]
              : undefined,
          globalSetup: [...list(globalSetup), ...list(test.globalSetup)],
          setupFiles: [...list(setupFiles), ...list(test.setupFiles)],
        },
      ]
    })
  : [
      {
        browser,
        environment: options.environment,
        exclude,
        globalSetup,
        include,
        name: 'tests',
        setupFiles,
      },
    ]

const projects =
  library.config.speed?.projects?.(found) ??
  found.filter((project) => !project.browser?.enabled)

const alias = options.alias ?? {}
const entry = library.entries().find((entry) => entry.name === library.name)
const build = `${library.build}/`
const sources = `${library.sources}/`

export default {
  root,
  plugins: [...(base.plugins ?? []), project(), record()],
  envPrefix: base.envPrefix,
  resolve: base.resolve,
  test: {
    ...options,
    alias: [
      // The package name can resolve through package.json to the build, which the transform does
      // not wrap, so it resolves to the root entry's source instead.
      ...(entry
        ? [
            {
              find: new RegExp(
                `^${library.name.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&')}$`,
              ),
              replacement: entry.source,
            },
          ]
        : []),
      ...(Array.isArray(alias)
        ? alias
        : Object.entries(alias).map(([find, replacement]) => ({
            find,
            replacement,
          }))),
    ],
    passWithNoTests: true,
    // Wrapped calls run slower than the project's own timeouts allow for.
    hookTimeout: 60_000,
    testTimeout: 60_000,
    // A failing test records the calls it made before failing. Retrying it only wastes time.
    retry: 0,
    pool: 'forks',
    maxWorkers: workers,
    // A worker whose heap grows unchecked can get the whole run killed for memory on a shared
    // machine, and a capped heap collects sooner. Logs of passing tests are not kept either.
    execArgv: ['--max-old-space-size=1280'],
    silent: 'passed-only',
    // Every test file runs in a fresh module graph, so one file's leftovers do not fill the
    // worker's heap, and the setup file seeds randomness for each file.
    isolate: true,
    projects: projects.map((project) => ({
      extends: true,
      test: {
        name: project.name,
        include: project.include,
        exclude: project.exclude,
        environment: project.environment,
        globalSetup: list(project.globalSetup),
        setupFiles: [setup, ...list(project.setupFiles)],
      },
    })),
  },
}

/**
 * Resolves `vitest` in the recorder's files from the project, since the pack can live outside the
 * project, and the setup file must share the vitest instance that runs it.
 */
function project(): Plugin {
  return {
    name: 'uphill-speed-project',
    enforce: 'pre',
    resolveId(id, importer) {
      if (id !== 'vitest' || !importer?.startsWith(`${import.meta.dirname}/`))
        return
      return this.resolve(id, path.join(root, 'package.json'), {
        skipSelf: true,
      })
    },
  }
}

/**
 * Wraps each export of a library module once the module has run, and hands each export of a test
 * helper module (a module outside the sources that is not a test file) to
 * `globalThis.__uphillFixture`, which remembers its path.
 */
function record(): Plugin {
  return {
    name: 'uphill-speed-record',
    enforce: 'post',
    transform(code, id) {
      if (
        !id.endsWith('.ts') ||
        !id.startsWith(`${root}/`) ||
        id.startsWith(build) ||
        id.includes('/node_modules/')
      )
        return
      if (!id.startsWith(sources))
        return /\.(test|spec)\.ts$/.test(id) ? undefined : fixtures(code, id)
      if (
        /\/(_test|_snap|_esm|_cjs|_types)\/|\.(test|spec|test-d|bench|bench-d|snap-d|fuzz|conformance)\.ts$/.test(
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
          // A re-export from another module, such as `export { add } from './Math.js'`, is that
          // module's export, already wrapped there. A re-export from a dependency, such as a
          // schema library's functions or a wordlist, becomes a local binding, so calls and values
          // through the library's entry points record under this module.
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
