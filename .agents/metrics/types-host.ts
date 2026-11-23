/**
 * The compiler options and the caching CompilerHost that the types helpers share. Each consumer
 * file is checked in a fresh `ts.Program` with a fresh checker, but every program reuses the parsed
 * `SourceFile`s of `lib.*.d.ts`, the declarations and their dependencies, and one module
 * resolution cache, so a program only redoes checking, not parsing. Node runs these helpers.
 *
 * @module
 */

import * as fs from 'node:fs'
import * as path from 'node:path'

import ts from 'typescript'

import { entries as listEntries, root } from './entries.ts'

export { root }

/** The built declarations in dist. */
export const typesDir = path.join(root, 'dist')

/**
 * Each entry point's specifier, such as `ox/tempo`, and its declarations in dist, in package.json
 * order.
 */
export const entries: [specifier: string, file: string][] = listEntries().map(
  (entry) => [entry.name, entry.types],
)
const entryFiles = new Map(entries)

/**
 * The virtual consumer file. It sits at the root of the checkout, so the dependencies that
 * declarations name, such as `abitype` and `zod`, resolve to the copies ox installs.
 */
export const consumerFile = path.join(root, '__uphill_types_consumer__.mts')

/**
 * ox's compiler options from tsconfig.base.json, without the ones that only drive ox's own build:
 * emit and incremental state. What stays shapes how a consumer's types resolve: `strict`,
 * `exactOptionalPropertyTypes`, NodeNext resolution, ES2022 and DOM libs, and `skipLibCheck`.
 * `@types/node` comes from src/tsconfig.json, as ox's own sources see it.
 */
export const consumerOptions = options('src/tsconfig.json')
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
 * The options ox's type tests run with: test/tsconfig.json, whose `paths` point `ox` and its
 * entries at the sources.
 */
export const testOptions = options('test/tsconfig.json')
for (const key of ['noUnusedLocals', 'noUnusedParameters'])
  delete testOptions[key]

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
        // the entry's declarations.
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
        return ts.resolveModuleName(
          literal.text,
          containingFile,
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
