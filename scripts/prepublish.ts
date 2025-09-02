import { join } from 'node:path'
import fs from 'fs-extra'
import { getExports } from './utils/exports.js'

const packageJsonPath = join(import.meta.dirname, '../src/package.json')
const packageJson = fs.readJsonSync(packageJsonPath)

const jsrJsonPath = join(import.meta.dirname, '../src/jsr.json')
const jsrJson = fs.readJsonSync(jsrJsonPath)

const exports = getExports()

packageJson.exports = exports.dist
jsrJson.exports = exports.src

delete packageJson.type

fs.writeJsonSync(packageJsonPath, packageJson, { spaces: 2 })
fs.writeJsonSync(jsrJsonPath, jsrJson, { spaces: 2 })
