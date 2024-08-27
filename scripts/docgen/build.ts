import * as model from '@microsoft/api-extractor-model'
import fs from 'fs-extra'

import { type Data, handleItem } from './utils/handleItem.js'
import { moduleRegex } from './utils/regex.js'
import { renderApiErrorClass } from './utils/renderApiErrorClass.js'
import { renderApiFunction } from './utils/renderApiFunction.js'
import { extractNamespaceDocComments } from './utils/tsdoc.js'

// TODO
// - Expand properties/types and lookup links
// - Show list of references under complex types
// - Link errors/types
// - Remove underscores for names

// Vocs TODO
// - Throw build if twoslash block has errors
// - Group multiple twoslash logs together (e.g. `// @log:`)
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
const moduleDocComments = extractNamespaceDocComments('./src/index.ts')

for (const item of moduleItems) {
  const baseLink = `/gen/${item.displayName}`

  const errors: { member: model.ApiItem }[] = []
  const functions: { member: model.ApiItem; link: string }[] = []
  const types: { member: model.ApiItem }[] = []

  const items = []
  for (const member of item.members) {
    const lookupItem = lookup[member.canonicalReference.toString()]
    if (!lookupItem)
      throw new Error(
        `Could not find lookup item for ${member.canonicalReference.toString()}`,
      )

    if (member.kind === model.ApiItemKind.Function) {
      const link = `${baseLink}/${member.displayName}`
      items.push({
        text: `.${member.displayName}`,
        link,
        id: lookupItem.id,
      })
      functions.push({
        member,
        link,
      })
    }

    if (member.kind === model.ApiItemKind.TypeAlias) {
      types.push({ member })
    }

    if (
      member.kind === model.ApiItemKind.Class &&
      member.displayName.endsWith('Error')
    ) {
      errors.push({ member })
    }
  }

  const docComment = moduleDocComments[item.displayName]

  const { examples = [], summary = '' } = docComment ?? {}

  sidebar.push({
    collapsed: true,
    items,
    link: baseLink,
    text: item.displayName,
  })

  const content = `
# ${item.displayName}

${summary}

${examples.length ? '## Examples' : ''}

${examples.join('\n\n')}

${functions.length ? '## Functions' : ''}

${functions.map((x) => `- [\`${item.displayName}.${x.member.displayName}\`](${x.link})`).join('\n')}

${types.length ? '## Types' : ''}

${types.map((x) => `- \`${item.displayName}.${x.member.displayName}\``).join('\n')}

${errors.length ? '## Errors' : ''}

${errors.map((x) => `- \`${item.displayName}.${x.member.displayName}\``).join('\n')}
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
