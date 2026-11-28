/**
 * The TypeScript, entry points, compiler options and caching CompilerHost that the types helpers
 * share. Each consumer file is checked in a fresh `ts.Program` with a fresh checker, but every
 * program reuses the parsed `SourceFile`s of `lib.*.d.ts`, the declarations and their
 * dependencies, and one module resolution cache, so a program only redoes checking, not parsing.
 * Node runs these helpers.
 *
 * @module
 */

import { execFileSync } from 'node:child_process'
import * as fs from 'node:fs'
import { createRequire } from 'node:module'
import * as path from 'node:path'

import type * as TS from 'typescript'

import * as library from './library.ts'

/**
 * The project's own TypeScript, resolved from the root, so the checks count what the library's
 * compiler counts rather than what another version would. A compiler without the JavaScript API,
 * such as a native port, cannot build programs, so the pack's own TypeScript stands in for it. It
 * is `undefined` when neither has the API.
 */
export const ts = (() => {
  for (const from of [library.manifest, import.meta.filename]) {
    try {
      const loaded = createRequire(from)('typescript') as typeof TS
      if (loaded.createProgram) return loaded
    } catch {}
  }
  return undefined as unknown as typeof TS
})()

/**
 * The types metrics' virtual consumer file, where the dependencies that the declarations name
 * resolve to the copies the library installs.
 */
export const consumerFile = path.join(
  library.root,
  '__uphill_types_consumer__.mts',
)

/** The declarations the build writes, or a copy of them that `UPHILL_TYPES_DIR` names. */
export const typesDir = path.resolve(
  process.env.UPHILL_TYPES_DIR ?? library.declarations,
)

/**
 * Each entry point, the root entry first, then the other index entries, then the module entries,
 * with its declarations in `typesDir`.
 */
export const entries = library.entries().map((entry) => ({
  ...entry,
  types: path.join(typesDir, path.relative(library.declarations, entry.types)),
}))
const entryFiles = new Map(entries.map((entry) => [entry.name, entry.types]))

/**
 * The library's compiler options from `types.consumerTsconfig`, without the ones that only drive
 * its own build: emit, incremental state, and unused-name checks. What stays shapes how a
 * consumer's types resolve, such as `strict`, `exactOptionalPropertyTypes`, module resolution,
 * libs, `types`, and `skipLibCheck`.
 */
export const consumerOptions = options(
  path.join(
    library.root,
    library.config.types?.consumerTsconfig ?? 'tsconfig.json',
  ),
)
for (const key of [
  'composite',
  'declaration',
  'declarationMap',
  'incremental',
  'outDir',
  'rootDir',
  'sourceMap',
  'tsBuildInfoFile',
  'noUnusedLocals',
  'noUnusedParameters',
])
  delete consumerOptions[key]

/**
 * The options the library's type tests check with, from `types.testTsconfig`, whose `paths` can
 * point the package and its entries at the sources.
 */
export const testOptions = options(
  path.join(
    library.root,
    library.config.types?.testTsconfig ?? 'tsconfig.json',
  ),
)
for (const key of ['noUnusedLocals', 'noUnusedParameters'])
  delete testOptions[key]

/** Parses a tsconfig file, without emit. */
function options(configPath: string): TS.CompilerOptions {
  if (!ts || !fs.existsSync(configPath)) return {}

  const config = ts.readConfigFile(configPath, ts.sys.readFile)
  if (config.error)
    throw new Error(
      ts.flattenDiagnosticMessageText(config.error.messageText, '\n'),
    )
  const parsed = ts.parseJsonConfigFileContent(
    config.config,
    ts.sys,
    path.dirname(configPath),
    undefined,
    configPath,
  )
  return { ...parsed.options, noEmit: true }
}

/** One host per option set. All of them share the parsed files. */
export type Host = TS.CompilerHost & {
  /** Sets the text of a virtual file, which programs read instead of the disk. */
  setFile(fileName: string, text: string): void
}

const sourceFiles = new Map<string, TS.SourceFile>()

export function createHost(options: TS.CompilerOptions): Host {
  const base = ts.createCompilerHost(options)
  const cache = ts.createModuleResolutionCache(
    library.root,
    (name) => name,
    options,
  )
  const virtual = new Map<string, string>()
  const exists = new Map<string, boolean>()
  const host: Host = {
    ...base,
    setFile(fileName, text) {
      virtual.set(fileName, text)
    },
    fileExists(fileName) {
      if (virtual.has(fileName)) return true
      let result = exists.get(fileName)
      if (result === undefined)
        exists.set(fileName, (result = base.fileExists(fileName)))
      return result
    },
    readFile(fileName) {
      return virtual.get(fileName) ?? base.readFile(fileName)
    },
    getModuleResolutionCache: () => cache,
    getSourceFile(fileName, languageVersion, onError) {
      const text = virtual.get(fileName)
      if (text !== undefined)
        return ts.createSourceFile(fileName, text, languageVersion)
      let file = sourceFiles.get(fileName)
      if (!file) {
        file = base.getSourceFile(fileName, languageVersion, onError)
        if (file) sourceFiles.set(fileName, file)
      }
      return file
    },
    resolveModuleNameLiterals(
      literals,
      containingFile,
      redirect,
      options,
      containingSourceFile,
    ) {
      return literals.map((literal) => {
        // The consumer imports each entry point by its package specifier, which maps straight to
        // the entry's declarations, so a copy in `UPHILL_TYPES_DIR` replaces the build's.
        const entry =
          containingFile === consumerFile && entryFiles.get(literal.text)
        if (entry)
          return {
            resolvedModule: {
              resolvedFileName: entry,
              extension: ts.Extension.Dts,
              isExternalLibraryImport: false,
            },
          }
        const mode = ts.getModeForUsageLocation(
          containingSourceFile,
          literal,
          options,
        )
        const resolved = ts.resolveModuleName(
          literal.text,
          containingFile,
          options,
          host,
          cache,
          redirect,
          mode,
        )
        // A copy of the declarations outside the checkout has no node_modules beside it, so its
        // dependencies resolve from where the build's declarations would import them.
        if (
          resolved.resolvedModule ||
          typesDir === library.declarations ||
          !containingFile.startsWith(typesDir)
        )
          return resolved
        return ts.resolveModuleName(
          literal.text,
          path.join(
            library.declarations,
            path.relative(typesDir, containingFile),
          ),
          options,
          host,
          cache,
          redirect,
          mode,
        )
      })
    },
  }
  return host
}

/** The memory the kernel says is available, in bytes, which caps how many workers start. */
export function availableMemory(): number {
  const match = /^MemAvailable:\s+(\d+) kB/m.exec(
    fs.readFileSync('/proc/meminfo', 'utf8'),
  )
  return match ? Number(match[1]) * 1024 : 0
}

/**
 * The Node binary that runs the helpers: `node` from PATH if it is Node 26 or later, else the Node
 * 26 that `npx --yes node@26` installs. The workers count the bytes a check allocates with V8's
 * `total_allocated_bytes`, which `v8.getHeapStatistics()` reports from Node 26 on.
 */
export function nodeBinary(): string {
  const probe = ['-p', 'process.versions.node + "\\n" + process.execPath']
  const found: string[] = []
  for (const command of [['node'], ['npx', '--yes', 'node@26']]) {
    const [version, binary] = (() => {
      try {
        return execFileSync(command[0]!, [...command.slice(1), ...probe], {
          encoding: 'utf8',
          stdio: ['ignore', 'pipe', 'ignore'],
        })
          .trim()
          .split('\n')
          .slice(-2)
      } catch {
        return []
      }
    })()
    found.push(
      `${command.join(' ')} ${version ? `is Node ${version}` : 'failed'}`,
    )
    if (version && binary && Number(version.split('.')[0]) >= 26) {
      if (found.length > 1) process.stderr.write(`${found.join('; ')}\n`)
      return binary
    }
  }
  throw new Error(
    `The types metrics need Node 26 or later, whose V8 reports the bytes a check allocates, but ${found.join(' and ')}. Put Node 26 first on PATH.`,
  )
}
