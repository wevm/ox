import * as model from '@microsoft/api-extractor-model'
import fs from 'fs-extra'

import { pagesDir } from './constants.js'
import { type Data, handleItem } from './utils/handleItem.js'
import { moduleRegex } from './utils/regex.js'
import { renderApiFunction } from './utils/renderApiFunction.js'
import { renderErrorGlossary } from './utils/renderErrorGlossary.js'
import {
  type ModuleItem,
  renderModuleErrorsIndex,
  renderModuleIndex,
  renderModuleTypesIndex,
} from './utils/renderModuleIndex.js'
import { extractNamespaceDocComments } from './utils/tsdoc.js'

// TODO
// - Show list of references under complex types
// - Expand properties/types and lookup links
// - Link errors/types
// - Show optional params/properties

// Vocs TODO
// - Throw build if twoslash block has errors
// - Group multiple twoslash logs together (e.g. `// @log:`)
// - For generated files, hide or link "Suggest changes to this page" to source code

// biome-ignore lint/suspicious/noConsoleLog:
console.log('Generating API docs.')

////////////////////////////////////////////////////////////
/// Load API Model
////////////////////////////////////////////////////////////
const fileName = './scripts/docgen/ox.api.json'
const pkg = new model.ApiModel().loadPackage(fileName)

////////////////////////////////////////////////////////////
/// Construct lookup with updated data
////////////////////////////////////////////////////////////
const lookup: Record<string, Data> = {}
handleItem(pkg, lookup)

const moduleDocComments = extractNamespaceDocComments('./src/index.ts')
const entrypointItem = pkg.members.find(
  (x) =>
    x.kind === model.ApiItemKind.EntryPoint &&
    x.canonicalReference.toString() === 'ox!',
)
if (!entrypointItem) throw new Error('Could not find entrypoint item')

const hiddenModules = ['Caches', 'Constants', 'Errors', 'Internal', 'Types']
const moduleItems = entrypointItem.members.filter(
  (x) =>
    x.kind === model.ApiItemKind.Namespace &&
    moduleRegex.test(x.canonicalReference.toString()) &&
    !hiddenModules.includes(x.displayName),
)

////////////////////////////////////////////////////////////
/// Construct Vocs sidebar, module pages, and glossary
////////////////////////////////////////////////////////////
const apiReferenceSidebar = []
for (const moduleItem of moduleItems) {
  const baseLink = `/api/${moduleItem.displayName}`

  const errors: ModuleItem[] = []
  const functions: ModuleItem[] = []
  const types: ModuleItem[] = []

  const items = []
  for (const member of moduleItem.members) {
    const memberItem = lookup[member.canonicalReference.toString()]
    if (!memberItem)
      throw new Error(
        `Could not find lookup item for ${member.canonicalReference.toString()}`,
      )

    const description =
      memberItem.comment?.summary.split('\n')[0]?.trim() ?? 'TODO'

    if (member.kind === model.ApiItemKind.Function) {
      const link = `${baseLink}/${member.displayName}`
      items.push({
        text: `.${member.displayName}`,
        link,
        id: memberItem.id,
      })
      functions.push({ description, member, link })
    }

    if (
      member.kind === model.ApiItemKind.Class &&
      member.displayName.endsWith('Error')
    )
      errors.push({
        description,
        member,
        link: `${baseLink}/errors#${member.displayName.toLowerCase()}`,
      })

    if (member.kind === model.ApiItemKind.TypeAlias)
      types.push({
        description,
        member,
        link: `${baseLink}/types#${member.displayName.toLowerCase()}`,
      })
  }

  const dir = `${pagesDir}/api/${moduleItem.displayName}`
  fs.ensureDirSync(dir)

  if (types.length) {
    const content = renderModuleErrorsIndex({
      errors,
      item: moduleItem,
      lookup,
    })
    fs.writeFileSync(`${dir}/errors.md`, content)
    items.push({ text: 'Errors', link: `${baseLink}/errors` })
  }

  if (types.length) {
    const content = renderModuleTypesIndex({
      item: moduleItem,
      lookup,
      types,
    })
    fs.writeFileSync(`${dir}/types.md`, content)
    items.push({ text: 'Types', link: `${baseLink}/types` })
  }

  apiReferenceSidebar.push({
    collapsed: true,
    items,
    link: baseLink,
    text: moduleItem.displayName,
  })

  const content = renderModuleIndex({
    docComment: moduleDocComments[moduleItem.displayName],
    errors,
    functions,
    item: moduleItem,
    types,
  })
  fs.writeFileSync(`${dir}/index.md`, content)
}

/// Errory glossary
const glossarySidebar = []
{
  const errorItem = entrypointItem.members.find(
    (x) =>
      x.kind === model.ApiItemKind.Namespace &&
      moduleRegex.test(x.canonicalReference.toString()) &&
      ['Errors'].includes(x.displayName),
  )
  if (!errorItem) throw new Error('Could not find error item')

  glossarySidebar.push({
    link: '/glossary/errors',
    text: errorItem.displayName,
  })

  const content = renderErrorGlossary({ item: errorItem, lookup })

  const dir = `${pagesDir}/glossary/errors`
  fs.ensureDirSync(dir)
  fs.writeFileSync(`${dir}/index.md`, content)
}

const sidebar = [
  {
    text: 'API Reference',
    items: apiReferenceSidebar,
  },
  {
    text: 'Glossary',
    items: glossarySidebar,
  },
]
const content = `
export const sidebar = ${JSON.stringify(sidebar, null, 2)}
`
fs.writeFileSync('./site/sidebar-generated.ts', content)

/// Build markdown files
const ids = apiReferenceSidebar.flatMap((x) => x.items ?? []).map((x) => x.id)
for (const id of ids) {
  if (!id) continue

  const item = lookup[id]
  if (!item) throw new Error(`Could not find item with id ${id}`)

  const content = (() => {
    switch (item.kind) {
      case model.ApiItemKind.Function:
        return renderApiFunction({ item, lookup })
      default:
        throw new Error(`Unsupported item kind: ${item.kind}`)
    }
  })()

  const module = item.parent?.match(moduleRegex)?.groups?.module
  const dir = `${pagesDir}/api/${module ? `${module}/` : ''}`
  fs.writeFileSync(`${dir}${item.displayName}.md`, content)
}

// biome-ignore lint/suspicious/noConsoleLog:
console.log('Done.')
