/**
 * Names items the way users import them, as ox's main branch does, so a target pattern means the
 * same item on both branches: a leaf module's export becomes `<index entry>:<Namespace>.<member>`,
 * such as `ox:Hex.fromString` for `ox/Hex:fromString`, and a whole leaf module becomes
 * `<index entry>:<Namespace>`, such as `ox:Hex`. The index entries are the barrels that re-export
 * leaf modules as namespaces, such as `ox` and `ox/tempo`, and the namespace is the name the
 * barrel gives the module (`ox/TxEnvelope` is `ox:TransactionEnvelope`). An entry no barrel
 * re-exports, such as `ox/window`, keeps its own name. The per-module metrics (`tree-shaking`,
 * `import-time` and `import-memory`) name their items by the module entry and do not rename them.
 *
 * It imports every entry from src/_esm, so it needs `pnpm build`.
 *
 * @module
 */

import * as path from 'node:path'
import { getExports } from '../../scripts/utils/exports.js'

const root = path.resolve(import.meta.dir, '../..')

const modules = new Map<string, unknown>()
for (const [subpath, target] of Object.entries(getExports().dist))
  if (
    typeof target !== 'string' &&
    !subpath.endsWith('.test-d') &&
    subpath !== './index.docs'
  )
    modules.set(
      `ox${subpath.slice(1)}`,
      await import(path.join(root, 'src', target.import)),
    )

/** The namespace each leaf entry is re-exported as, such as `ox/Hex` → `ox:Hex`. */
const namespaces = new Map<string, string>()
for (const [index, module] of modules)
  for (const [name, value] of Object.entries(module as object))
    for (const [leaf, candidate] of modules)
      if (candidate === value && leaf !== index && !namespaces.has(leaf))
        namespaces.set(leaf, `${index}:${name}`)

/** Renames a leaf entry's item, such as `ox/Hex:fromString` or `ox/Hex`, to the shared scheme. */
export function rename(item: string): string {
  const colon = item.indexOf(':')
  const namespace = namespaces.get(colon === -1 ? item : item.slice(0, colon))
  if (!namespace) return item
  return colon === -1 ? namespace : `${namespace}.${item.slice(colon + 1)}`
}
