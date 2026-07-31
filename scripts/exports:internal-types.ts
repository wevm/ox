import { join } from 'node:path'
import fs from 'fs-extra'

// Adds the `./_types/*` subpath to `package.json#exports` (+ `typesVersions`).
//
// This makes every built module addressable so TypeScript can name internal types while
// a consumer emits its own declarations. Without a public specifier for these files,
// exporting an inferred value whose type reaches a module-internal symbol fails with
// `TS2742` (`TS2883` on TypeScript 7). The concrete case: `erc4337/UserOperation` is a
// `OneOf<...>` instantiation, and the emitter preserves the alias reference, so it must
// name `OneOf` from `core/internal/types` — which no public specifier reaches.
//
// `./_types/*` is not public API and is excluded from semver. Import from the documented
// entrypoints; this exists only so the compiler has a name to write down.
//
// Runs after `zile` rather than inside `exports:update`, because zile requires a `src`
// field on every export entry and expands it as a glob to decide what to build; a
// `./src/*.ts` glob would pull test files into the package build.

const packageJsonPath = join(import.meta.dirname, '../package.json')

const key = './_types/*'
const types = './dist/*.d.ts'

const packageJson = fs.readJsonSync(packageJsonPath)

packageJson.exports = {
  ...Object.fromEntries(
    Object.entries(packageJson.exports).filter(([k]) => k !== key),
  ),
  [key]: { types, default: './dist/*.js' },
}

packageJson.typesVersions = {
  '*': {
    [key.replace(/^\.\//, '')]: [types],
    ...packageJson.typesVersions?.['*'],
  },
}

fs.writeJsonSync(packageJsonPath, packageJson, { spaces: 2 })

console.log(`Added ${key} export.`)
