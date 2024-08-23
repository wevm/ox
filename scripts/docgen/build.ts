import * as model from '@microsoft/api-extractor-model'
import fs from 'fs-extra'

import { type Data, handleItem } from './utils/handleItem.js'
import { moduleRegex } from './utils/regex.js'
import { renderApiFunction } from './utils/renderApiFunction.js'

// TODO
// - Parse inline {@link} tags and link to pages
// - Add range to github source links
// - Error type linking
// - Filter examples based on module (e.g. `isBytesEqual` @example for `Bytes` module should not show up on `Hex` module)
// - Glossary pages for: constants, errors, and types
// - Display multiple aliases (when applicable `aliases.length > 1`)
// - Validate aliases
// - Update Vocs to throw if twoslash block has errors
// - Add generated md files to gitignore
// - For generated files, hide or link "Suggest changes to this page" to source code

// biome-ignore lint/suspicious/noConsoleLog:
console.log('Generating API docs.')

/// Load API Model
const fileName = './scripts/docgen/ox.api.json'
const pkg = new model.ApiModel().loadPackage(fileName)

/// Construct lookup with updated data
const lookup: Record<string, Data> = {}
handleItem(pkg, lookup)

/// Construct Vocs sidebar
const entrypointItem = pkg.members.find(
  (x) =>
    x.kind === model.ApiItemKind.EntryPoint &&
    x.canonicalReference.toString() === 'ox!',
)
if (!entrypointItem) throw new Error('Could not find entrypoint item')

const namespaceItems = entrypointItem.members.filter(
  (x) =>
    x.kind === model.ApiItemKind.Namespace &&
    moduleRegex.test(x.canonicalReference.toString()) &&
    !['Caches', 'Constants', 'Errors', 'Internal', 'Types'].includes(
      x.displayName,
    ),
)

const sidebar = []
const pagesDir = './site/pages/gen'
for (const item of namespaceItems) {
  const baseLink = `/gen/${item.displayName}`

  const items = []
  for (const member of item.members) {
    if (member.kind !== model.ApiItemKind.Function) continue
    const lookupItem = lookup[member.canonicalReference.toString()]
    if (!lookupItem)
      throw new Error(
        `Could not find lookup item for ${member.canonicalReference.toString()}`,
      )
    // filter out aliases from appearing in sidebar (e.g. `Hex.toHex` should not appear since `Hex.from` does)
    if (
      lookupItem.comment?.aliases?.length &&
      lookupItem.comment.aliases.includes(member.canonicalReference.toString())
    )
      continue

    items.push({
      text: `.${member.displayName}`,
      link: `${baseLink}/${member.displayName}`,
      id: lookupItem.id,
    })
  }

  const sidebarItem = {
    text: item.displayName,
    collapsed: true,
    link: baseLink,
    items,
  }
  sidebar.push(sidebarItem)

  const content = `
# ${item.displayName}

${items.map((x) => `- [\`${x.text}\`](${x.link})`).join('\n')}
`
  const dir = `${pagesDir}/${item.displayName}`
  fs.ensureDirSync(dir)
  fs.writeFileSync(`${dir}/index.md`, content)
}

const content = `
export const sidebar = ${JSON.stringify(sidebar, null, 2)}
`
fs.writeFileSync('./site/sidebar-generated.ts', content)

/// Build markdown files
const ids = sidebar.flatMap((x) => x.items).map((x) => x.id)
for (const id of ids) {
  const item = lookup[id]
  if (!item) throw new Error(`Could not find item with id ${id}`)

  const content = (() => {
    switch (item.kind) {
      case model.ApiItemKind.Function:
        return renderApiFunction(item, lookup)
      default:
        throw new Error(`Unsupported item kind: ${item.kind}`)
    }
  })()

  const module = item.parent?.match(moduleRegex)?.groups?.module
  const dir = `${pagesDir}/${module ? `${module}/` : ''}`
  fs.writeFileSync(`${dir}${item.displayName}.md`, content)
}

// biome-ignore lint/suspicious/noConsoleLog:
console.log('Done.')
