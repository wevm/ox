import * as model from '@microsoft/api-extractor-model'
import fs from 'fs-extra'

import { type Data, handleItem } from './utils/handleItem.js'
import { moduleRegex } from './utils/regex.js'
import { renderApiErrorClass } from './utils/renderApiErrorClass.js'
import { renderApiFunction } from './utils/renderApiFunction.js'

// TODO
// - Expand properties/types and lookup links
// - Link errors
// - Remove underscores
// - Parse inline {@link} tags and link to pages

// Vocs TODO
// - Throw build if twoslash block has errors
// - For generated files, hide or link "Suggest changes to this page" to source code
// - Multiline errors (e.g. `// @error: Foo bar baz`)

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

const sidebar = []
const pagesDir = './site/pages/gen'

const moduleItems = entrypointItem.members.filter(
  (x) =>
    x.kind === model.ApiItemKind.Namespace &&
    moduleRegex.test(x.canonicalReference.toString()) &&
    !['Caches', 'Constants', 'Errors', 'Internal', 'Types'].includes(
      x.displayName,
    ),
)
for (const item of moduleItems) {
  const baseLink = `/gen/${item.displayName}`

  const items = []
  for (const member of item.members) {
    if (member.kind !== model.ApiItemKind.Function) continue
    const lookupItem = lookup[member.canonicalReference.toString()]
    if (!lookupItem)
      throw new Error(
        `Could not find lookup item for ${member.canonicalReference.toString()}`,
      )

    items.push({
      text: `.${member.displayName}`,
      link: `${baseLink}/${member.displayName}`,
      id: lookupItem.id,
    })
  }

  sidebar.push({
    collapsed: true,
    items,
    link: baseLink,
    text: item.displayName,
  })

  const content = `
# ${item.displayName}

${items.map((x) => `- [\`${x.text}\`](${x.link})`).join('\n')}
`
  const dir = `${pagesDir}/${item.displayName}`
  fs.ensureDirSync(dir)
  fs.writeFileSync(`${dir}/index.md`, content)
}

{
  const errorItem = entrypointItem.members.find(
    (x) =>
      x.kind === model.ApiItemKind.Namespace &&
      moduleRegex.test(x.canonicalReference.toString()) &&
      ['Errors'].includes(x.displayName),
  )
  if (!errorItem) throw new Error('Could not find error item')
  const baseLink = `/gen/${errorItem.displayName}`

  let content = `---
showOutline: 1
---

# ${errorItem.displayName} [Glossary of Errors in Ox]
`
  for (const member of errorItem.members) {
    if (member.kind !== model.ApiItemKind.Class) continue
    const lookupItem = lookup[member.canonicalReference.toString()]
    if (!lookupItem)
      throw new Error(
        `Could not find lookup item for ${member.canonicalReference.toString()}`,
      )

    content += `\n\n${renderApiErrorClass(lookupItem, lookup)}`
  }

  sidebar.push({
    link: baseLink,
    text: errorItem.displayName,
  })

  const dir = `${pagesDir}/${errorItem.displayName}`
  fs.ensureDirSync(dir)
  fs.writeFileSync(`${dir}/index.md`, content)
}

const content = `
export const sidebar = ${JSON.stringify(sidebar, null, 2)}
`
fs.writeFileSync('./site/sidebar-generated.ts', content)

/// Build markdown files
const ids = sidebar.flatMap((x) => x.items ?? []).map((x) => x.id)
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
