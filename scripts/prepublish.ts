import { join, relative, resolve } from 'node:path'
import fs from 'fs-extra'
import { getExports } from './utils/exports.js'

const packageJsonPath = join(import.meta.dirname, '../src/package.json')
const packageJson = fs.readJsonSync(packageJsonPath)

const jsrJsonPath = join(import.meta.dirname, '../src/jsr.json')
const jsrJson = fs.readJsonSync(jsrJsonPath)

// We don't want to publish the type field.
delete packageJson.type

const exports = getExports({
  onEntry: ({ entryName, name, parentEntryName }) => {
    const distBasePath = parentEntryName
      ? `./_dist/${parentEntryName}/${name}`
      : `./_dist/${name}`

    try {
      fs.mkdirSync(resolve(import.meta.dirname, '../src', entryName))
    } catch {}
    fs.writeJsonSync(
      resolve(import.meta.dirname, '../src', entryName, 'package.json'),
      {
        type: 'module',
        types: relative(
          resolve(import.meta.dirname, '../src'),
          `${distBasePath}.d.ts`,
        ),
        main: relative(
          resolve(import.meta.dirname, '../src'),
          `${distBasePath}.js`,
        ),
      },
      { spaces: 2 },
    )
  },
})

packageJson.exports = exports.dist
jsrJson.exports = exports.src

fs.writeJsonSync(packageJsonPath, packageJson, { spaces: 2 })
fs.writeJsonSync(jsrJsonPath, jsrJson, { spaces: 2 })
