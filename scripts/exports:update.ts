import { readdirSync } from 'node:fs'
import { join } from 'node:path'
import fs from 'fs-extra'

// Generates `package.json#exports` based on the contents of `./src`.
//
// Conventions:
// - `./src/index.ts`            → `.`
// - `./src/index.docs.ts`       → `./index.docs`
// - `./src/core/<Name>.ts`      → `./<Name>`              (flattened)
// - `./src/<dir>/index.ts`      → `./<dir>`
// - `./src/<dir>/<Name>.ts`     → `./<dir>/<Name>`
//
// Files starting with `_`, `.`, or a lowercase letter are ignored, as are
// `*.test.ts`, `*.test-d.ts`, `*.bench.ts`, `*.bench-d.ts`, and `*.snap-d.ts`.

const srcPath = join(import.meta.dirname, '../src')
const packageJsonPath = join(import.meta.dirname, '../package.json')

const ignoredFiles = new Set(['version.ts'])
const ignoredSuffixes = [
  '.test.ts',
  '.test-d.ts',
  '.bench.ts',
  '.bench-d.ts',
  '.snap-d.ts',
]

function isExportable(file: string) {
  if (ignoredFiles.has(file)) return false
  if (file.startsWith('_') || file.startsWith('.')) return false
  if (!file.endsWith('.ts')) return false
  if (ignoredSuffixes.some((s) => file.endsWith(s))) return false
  return true
}

function entry(key: string, srcPath: string) {
  const distPath = srcPath.replace(/^\.\/src\//, './dist/').replace(/\.ts$/, '')
  return [
    key,
    {
      types: `${distPath}.d.ts`,
      src: srcPath,
      default: `${distPath}.js`,
    },
  ] as const
}

const exports: Array<readonly [string, object]> = []

// Root: `./` and `./index.docs`
exports.push(entry('.', './src/index.ts'))
if (fs.existsSync(join(srcPath, 'index.docs.ts')))
  exports.push(entry('./index.docs', './src/index.docs.ts'))

// Subdirectories
const dirs = readdirSync(srcPath, { withFileTypes: true })
  .filter((d) => d.isDirectory() && !d.name.startsWith('_'))
  .map((d) => d.name)
  .sort()

const subExports: Array<readonly [string, object]> = []

for (const dir of dirs) {
  const dirPath = join(srcPath, dir)
  const files = readdirSync(dirPath).filter(isExportable).sort()

  if (dir === 'core') {
    // Flatten `core/<Name>.ts` → `./<Name>`
    for (const file of files) {
      const name = file.replace(/\.ts$/, '')
      if (name === 'index') continue
      exports.push(entry(`./${name}`, `./src/${dir}/${file}`))
    }
    continue
  }

  // `<dir>/index.ts` → `./<dir>`
  if (files.includes('index.ts'))
    subExports.push(entry(`./${dir}`, `./src/${dir}/index.ts`))

  for (const file of files) {
    const name = file.replace(/\.ts$/, '')
    if (name === 'index') continue
    subExports.push(entry(`./${dir}/${name}`, `./src/${dir}/${file}`))
  }
}

// Sort root-level (post-core) entries alphabetically, then append subdir entries.
const rootSorted = exports
  .filter(([k]) => k !== '.' && k !== './index.docs')
  .sort(([a], [b]) => a.localeCompare(b))
const rootSpecial = exports.filter(
  ([k]) => k === '.' || k === './index.docs',
)

const finalEntries = [...rootSpecial, ...rootSorted, ...subExports]

const packageJson = fs.readJsonSync(packageJsonPath)
packageJson.exports = Object.fromEntries(finalEntries)
fs.writeJsonSync(packageJsonPath, packageJson, { spaces: 2 })

console.log(`Updated package.json#exports with ${finalEntries.length} entries.`)
