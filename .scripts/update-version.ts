import { join } from 'node:path'
import fs from 'fs-extra'

const packageJsonPath = join(import.meta.dirname, '../src/package.json')
const packageJson = fs.readJsonSync(packageJsonPath)

// Update JSR version.
const jsrJsonPath = join(import.meta.dirname, '../src/jsr.json')
const jsrJson = fs.readJsonSync(jsrJsonPath)
jsrJson.version = packageJson.version
fs.writeJsonSync(jsrJsonPath, jsrJson, { spaces: 2 })
