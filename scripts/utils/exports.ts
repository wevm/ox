import { resolve } from 'node:path'
import fs from 'fs-extra'

export function getExports({
  onEntry,
}: {
  onEntry?: (entry: {
    entryName: string
    name: string
    parentEntryName?: string | undefined
  }) => void
} = {}) {
  const dist = {} as Record<
    string,
    string | { types: string; default: string; import: string }
  >
  const src = {} as Record<string, string>

  const entries = fs.readdirSync(resolve(import.meta.dirname, '../../src'), {
    withFileTypes: true,
  })

  for (const parentEntry of entries) {
    if (['node_modules', '_types', '_esm', '_cjs'].includes(parentEntry.name))
      continue

    if (!parentEntry.isDirectory()) {
      if (parentEntry.name.endsWith('test.ts')) continue
      if (parentEntry.name === 'jsr.json') continue
      if (parentEntry.name === 'tsdoc.json') continue
      if (
        !parentEntry.name.endsWith('.ts') &&
        !parentEntry.name.endsWith('.json')
      )
        continue

      const name = parentEntry.name.replace(/\.ts$/, '')
      const entryName = `.${name === 'index' ? '' : `/${name}`}`

      if (!parentEntry.name.endsWith('.ts')) {
        dist[entryName] = entryName
        src[entryName] = entryName
      } else {
        dist[entryName] = {
          types: `./_types/${name}.d.ts`,
          import: `./_esm/${name}.js`,
          default: `./_cjs/${name}.js`,
        }
        src[entryName] = `./${name}.ts`

        if (name === 'index') continue

        onEntry?.({ entryName, name })
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
      if (['node_modules', '_types', '_esm', '_cjs'].includes(entry.name))
        continue
      if (entry.name.endsWith('test.ts')) continue
      if (entry.isDirectory()) continue

      const isIndex = entry.name === 'index.ts'
      const name = entry.name.replace(/\.ts$/, '')

      if (!/^[A-Z]/.test(name) && name !== 'index') continue

      const entryName = `.${parentEntry.name === 'core' ? '' : `/${parentEntry.name}`}${isIndex ? '' : `/${name}`}`

      dist[entryName] = {
        types: `./_types/${parentEntry.name}/${name}.d.ts`,
        import: `./_esm/${parentEntry.name}/${name}.js`,
        default: `./_cjs/${parentEntry.name}/${name}.js`,
      }
      src[entryName] = `./${parentEntry.name}/${name}.ts`

      if (entryName !== '.')
        onEntry?.({ entryName, name, parentEntryName: parentEntry.name })
    }
  }

  return { dist, src }
}
