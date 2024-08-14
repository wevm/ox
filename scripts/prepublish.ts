import { join, relative, resolve } from 'node:path'
import fs from 'fs-extra'

const ignore = ['node_modules', '_esm', '_cjs']

const packageJsonPath = join(import.meta.dirname, '../src/package.json')
const packageJson = fs.readJsonSync(packageJsonPath)

const jsrJsonPath = join(import.meta.dirname, '../src/jsr.json')
const jsrJson = fs.readJsonSync(jsrJsonPath)

// We don't want to publish the type field.
delete packageJson.type

const entries = fs.readdirSync(resolve(import.meta.dirname, '../src'), {
  withFileTypes: true,
})

// Set up exports.
packageJson.exports = {}
jsrJson.exports = {}
for (const parentEntry of entries) {
  if (ignore.includes(parentEntry.name)) continue

  if (!parentEntry.isDirectory()) {
    if (parentEntry.name.endsWith('test.ts')) continue
    if (parentEntry.name === 'jsr.json') continue
    if (
      !parentEntry.name.endsWith('.ts') &&
      !parentEntry.name.endsWith('.json')
    )
      continue

    const name = parentEntry.name.replace(/\.ts$/, '')
    const entryName = `.${name === 'index' ? '' : `/${name}`}`

    if (!parentEntry.name.endsWith('.ts')) {
      packageJson.exports[entryName] = entryName
      jsrJson.exports[entryName] = entryName
    } else {
      packageJson.exports[entryName] = {
        import: {
          types: `./_esm/${name}.d.ts`,
          default: `./_esm/${name}.js`,
        },
        default: {
          types: `./_cjs/${name}.d.ts`,
          default: `./_cjs/${name}.js`,
        },
      }
      jsrJson.exports[entryName] = `./${name}.ts`

      if (name === 'index') continue

      try {
        fs.mkdirSync(resolve(import.meta.dirname, '../src', entryName))
      } catch {}
      fs.writeJsonSync(
        resolve(import.meta.dirname, '../src', entryName, 'package.json'),
        {
          type: 'module',
          types: relative(
            resolve(import.meta.dirname, '../src'),
            `./_esm/${name}.d.ts`,
          ),
          module: relative(
            resolve(import.meta.dirname, '../src'),
            `./_esm/${name}.js`,
          ),
          main: relative(
            resolve(import.meta.dirname, '../src'),
            `./_cjs/${name}.js`,
          ),
        },
        { spaces: 2 },
      )
    }

    continue
  }

  const entries = fs.readdirSync(
    resolve(parentEntry.parentPath, parentEntry.name),
    {
      withFileTypes: true,
    },
  )
  for (const entry of entries) {
    if (ignore.includes(entry.name)) continue
    if (entry.name.endsWith('test.ts')) continue
    if (entry.isDirectory()) continue

    const isIndex = entry.name === 'index.ts'
    const name = entry.name.replace(/\.ts$/, '')

    if (!/^[A-Z]/.test(name) && name !== 'index') continue

    const entryName = `.${parentEntry.name === 'core' ? '' : `/${parentEntry.name}`}${isIndex ? '' : `/${name}`}`

    packageJson.exports[entryName] = {
      import: {
        types: `./_esm/${parentEntry.name}/${name}.d.ts`,
        default: `./_esm/${parentEntry.name}/${name}.js`,
      },
      default: {
        types: `./_cjs/${parentEntry.name}/${name}.d.ts`,
        default: `./_cjs/${parentEntry.name}/${name}.js`,
      },
    }
    jsrJson.exports[entryName] = `./${parentEntry.name}/${name}.ts`

    if (entryName !== '.') {
      try {
        fs.mkdirSync(resolve(import.meta.dirname, '../src', entryName))
      } catch {}
      fs.writeJsonSync(
        resolve(import.meta.dirname, '../src', entryName, 'package.json'),
        {
          type: 'module',
          types: relative(
            resolve(import.meta.dirname, '../src'),
            `./_esm/${parentEntry.name}/${name}.d.ts`,
          ),
          module: relative(
            resolve(import.meta.dirname, '../src'),
            `./_esm/${parentEntry.name}/${name}.js`,
          ),
          main: relative(
            resolve(import.meta.dirname, '../src'),
            `./_cjs/${parentEntry.name}/${name}.js`,
          ),
        },
        { spaces: 2 },
      )
    }
  }
}

fs.writeJsonSync(packageJsonPath, packageJson, { spaces: 2 })
fs.writeJsonSync(jsrJsonPath, jsrJson, { spaces: 2 })
