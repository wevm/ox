import { readdirSync } from 'node:fs'
import { resolve } from 'node:path'

const srcPath = resolve(import.meta.dirname, '../../src')

export function getExports() {
  const src = {} as Record<string, string>

  src['.'] = './index.ts'

  const dirs = readdirSync(srcPath, { withFileTypes: true })
    .filter((d) => d.isDirectory() && !d.name.startsWith('_'))
    .map((d) => d.name)

  for (const dir of dirs) {
    const files = readdirSync(resolve(srcPath, dir))
    if (!files.includes('index.ts')) continue
    const key = dir === 'core' ? '.' : `./${dir}`
    src[key] = `./${dir}/index.ts`
  }

  return { src }
}
