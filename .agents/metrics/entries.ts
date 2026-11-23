/**
 * The entry points every metric walks, from package.json's `exports` in its order: the index
 * entries, such as `ox` and `ox/tempo`, whose members are namespaces, and the module entries, such
 * as `ox/Hex`, which are the same namespaces again. `ox/index.docs`, which only feeds the docs
 * generator, and the `_types/*` pattern are left out.
 *
 * @module
 */

import * as fs from 'node:fs'
import * as path from 'node:path'

export const root = path.resolve(import.meta.dirname, '../..')

export type Entry = {
  /** The specifier a consumer imports, such as `ox/tempo`. */
  name: string
  /** The built module in dist. */
  file: string
  /** The built declarations in dist. */
  types: string
  /** The source module in src. */
  source: string
  /** Whether the entry is an index of namespaces, rather than one module. */
  index: boolean
}

export function entries(): Entry[] {
  const pkg = JSON.parse(
    fs.readFileSync(path.join(root, 'package.json'), 'utf8'),
  ) as {
    exports: Record<string, { src?: string; types?: string; default?: string }>
  }
  const result: Entry[] = []
  for (const [subpath, target] of Object.entries(pkg.exports)) {
    if (typeof target !== 'object' || !target.default || !target.src) continue
    if (subpath === './index.docs' || subpath.includes('*')) continue
    const name = subpath === '.' ? 'ox' : `ox/${subpath.slice(2)}`
    result.push({
      name,
      file: path.join(root, target.default),
      types: path.join(root, target.types!),
      source: path.join(root, target.src),
      index: path.basename(target.src) === 'index.ts',
    })
  }
  return result
}
