/**
 * The entry points, compiler options and caching CompilerHost that the types helpers share. Each
 * consumer file is checked in a fresh `ts.Program` with a fresh checker, but every program reuses
 * the parsed `SourceFile`s of `lib.*.d.ts`, the declarations and their dependencies, and one module
 * resolution cache, so a program only redoes checking, not parsing. Node runs these helpers.
 *
 * @module
 */

import * as fs from 'node:fs'
import * as path from 'node:path'

import ts from 'typescript'

import { getExports } from '../../scripts/utils/exports.ts'

/** The ox checkout, which the helpers run from. */
export const root = process.cwd()

/** The built declarations: `src/_types`, or a copy that `UPHILL_TYPES_DIR` names. */
export const typesDir = path.resolve(
  process.env.UPHILL_TYPES_DIR ?? path.join(root, 'src/_types'),
)
const defaultTypesDir = path.join(root, 'src/_types')

/** One entry point of the published package. */
export type Entry = {
  /** The specifier a consumer imports, such as `ox`, `ox/Hex` or `ox/tempo/TxEnvelopeTempo`. */
  name: string
  /** Its declarations in `typesDir`. */
  types: string
  /** Its source file, such as `src/core/Hex.ts`. */
  source: string
  /** Its build, such as `src/_esm/core/Hex.js`. */
  esm: string
  /**
   * Whether it only re-exports leaf modules as namespaces, such as `ox` and `ox/tempo`. A barrel's
   * namespaces are measured under their leaf entries.
   */
  barrel: boolean
}

/**
 * Each entry point, in `getExports().dist` order: the subpaths prepublish writes to
 * src/package.json#exports, without `./package.json`, `./index.docs`, and the `*.test-d` files
 * that getExports does not skip.
 */
export const entries: Entry[] = (() => {
  const { dist, src } = getExports()
  return Object.entries(dist).flatMap(([key, value]) => {
    if (typeof value === 'string') return []
    if (key === './index.docs' || key.endsWith('.test-d')) return []
    return [
      {
        name: key === '.' ? 'ox' : `ox/${key.slice(2)}`,
        types: path.join(typesDir, path.relative('./_types', value.types)),
        source: path.join(root, 'src', src[key]!),
        esm: path.join(root, 'src', value.import),
        barrel: value.types.endsWith('/index.d.ts'),
      },
    ]
  })
})()
const entryFiles = new Map(entries.map((entry) => [entry.name, entry.types]))

/**
 * The virtual consumer file. It sits in `src/`, the published package, so the dependencies that
 * declarations name, such as `abitype` and `@noble/curves`, resolve to the copies ox ships with.
 */
export const consumerFile = path.join(root, 'src/__uphill_types_consumer__.mts')

/**
 * ox's compiler options from tsconfig.base.json, without the ones that only drive ox's own build:
 * emit and incremental state. What stays shapes how a consumer's types resolve: `strict`,
 * `exactOptionalPropertyTypes`, NodeNext resolution, ES2022 and DOM libs, `@types/node`, and
 * `skipLibCheck`.
 */
export const consumerOptions = options('tsconfig.base.json')
for (const key of [
  'composite',
  'declaration',
  'declarationMap',
  'incremental',
  'outDir',
  'rootDir',
  'sourceMap',
  'tsBuildInfoFile',
])
  delete consumerOptions[key]

/**
 * The options ox's tests and attest snapshots check with: the root tsconfig.json, whose `paths`
 * point `ox` and its barrels at the sources. attest reads the same file.
 */
export const testOptions = options('tsconfig.json')

/** Parses a tsconfig file, without emit. */
function options(file: string): ts.CompilerOptions {
  const configPath = path.join(root, file)
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
export type Host = ts.CompilerHost & {
  /** Sets the text of a virtual file, which programs read instead of the disk. */
  setFile(fileName: string, text: string): void
}

const sourceFiles = new Map<string, ts.SourceFile>()

export function createHost(options: ts.CompilerOptions): Host {
  const base = ts.createCompilerHost(options)
  const cache = ts.createModuleResolutionCache(root, (name) => name, options)
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
        // the entry's types file, so a copy in `UPHILL_TYPES_DIR` replaces `src/_types`.
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
        // dependencies resolve from where `src/_types` would import them.
        if (
          resolved.resolvedModule ||
          typesDir === defaultTypesDir ||
          !containingFile.startsWith(typesDir)
        )
          return resolved
        const original = path.join(
          defaultTypesDir,
          path.relative(typesDir, containingFile),
        )
        return ts.resolveModuleName(
          literal.text,
          original,
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
