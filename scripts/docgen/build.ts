import * as model from '@microsoft/api-extractor-model'
import fs from 'fs-extra'

import { renderApiFunction } from './render/apiFunction.js'
import {
  type ModuleItem,
  renderNamespace,
  renderNamespaceErrors,
  renderNamespaceGlossary,
  renderNamespaceTypes,
} from './render/apiNamespace.js'
import { createDataLookup, getId } from './utils/model.js'
import { namespaceRegex } from './utils/regex.js'
import { extractNamespaceDocComments } from './utils/tsdoc.js'

// biome-ignore lint/suspicious/noConsoleLog:
console.log('Generating API docs.')

////////////////////////////////////////////////////////////
/// Load API Model and construct lookup
////////////////////////////////////////////////////////////
const fileName = './scripts/docgen/ox.api.json'
const apiPackage = new model.ApiModel().loadPackage(fileName)
const dataLookup = createDataLookup(apiPackage)

fs.writeFileSync(
  './scripts/docgen/lookup.json',
  JSON.stringify(dataLookup, null, 2),
)

////////////////////////////////////////////////////////////
/// Get API entrypoint and namespaces
////////////////////////////////////////////////////////////
const apiEntryPoint = apiPackage.members.find(
  (x) =>
    x.kind === model.ApiItemKind.EntryPoint &&
    x.canonicalReference.toString() === 'ox!',
) as model.ApiEntryPoint
if (!apiEntryPoint) throw new Error('Could not find api entrypoint')

const moduleDocComments = extractNamespaceDocComments('./src/index.ts')

const testNamespaces: string[] = []
const namespaces = []
const glossaryNamespaces = []
for (const member of apiEntryPoint.members) {
  if (member.kind !== model.ApiItemKind.Namespace) continue
  if (!namespaceRegex.test(getId(member))) continue
  if (['Caches', 'Constants', 'Internal'].includes(member.displayName)) continue
  if (['Errors', 'Types'].includes(member.displayName))
    glossaryNamespaces.push(member)
  if (testNamespaces.length && !testNamespaces.includes(member.displayName))
    continue
  namespaces.push(member)
}

////////////////////////////////////////////////////////////
/// Generate sidebar and markdown files
////////////////////////////////////////////////////////////

const pagesDir = './site/pages'
const apiReferenceSidebar = []

for (const namespace of namespaces) {
  const name = namespace.displayName
  const baseLink = `/api/${name}`
  const dir = `${pagesDir}/api/${name}`
  fs.ensureDirSync(dir)

  const items = []
  const errors: ModuleItem[] = []
  const functions: ModuleItem[] = []
  const types: ModuleItem[] = []

  for (const member of namespace.members) {
    const id = getId(member)
    const data = dataLookup[id]
    if (!data) throw new Error(`Could not find data for ${id}`)

    const { description, displayName } = data

    if (member.kind === model.ApiItemKind.Function) {
      // Resolve overloads for function
      const overloads = member
        .getMergedSiblings()
        .map(getId)
        .filter((x) => !x.endsWith('namespace'))
      // Skip overloads without TSDoc attached
      if (
        overloads.length > 1 &&
        overloads.find((x) => dataLookup[x]?.comment?.summary) !== id
      )
        continue

      const link = `${baseLink}/${displayName}`
      items.push({ text: `.${displayName}`, link })
      functions.push({ apiItem: member, description, link })

      const content = renderApiFunction({ data, dataLookup, overloads })
      fs.writeFileSync(`${dir}/${displayName}.md`, content)
    } else if (member.kind === model.ApiItemKind.Class) {
      if (displayName.endsWith('Error'))
        errors.push({
          apiItem: member,
          description,
          link: `${baseLink}/errors#${displayName.toLowerCase()}`,
        })
      else throw new Error(`Unsupported class: ${displayName}`)
    } else if (member.kind === model.ApiItemKind.TypeAlias) {
      types.push({
        apiItem: member,
        description,
        link: `${baseLink}/types#${displayName.toLowerCase()}`,
      })
    }
  }

  if (errors.length) {
    items.push({ text: 'Errors', link: `${baseLink}/errors` })
    const content = renderNamespaceErrors({ dataLookup, errors, name })
    fs.writeFileSync(`${dir}/errors.md`, content)
  }

  if (types.length) {
    items.push({ text: 'Types', link: `${baseLink}/types` })
    const content = renderNamespaceTypes({ dataLookup, types, name })
    fs.writeFileSync(`${dir}/types.md`, content)
  }

  apiReferenceSidebar.push({
    collapsed: true,
    items,
    link: baseLink,
    text: name,
  })

  const content = renderNamespace({
    apiItem: namespace,
    docComment: moduleDocComments[name],
    errors,
    functions,
    types,
  })
  fs.writeFileSync(`${dir}/index.md`, content)
}

// Errory glossary
const glossarySidebar = []
for (const namespace of glossaryNamespaces) {
  const name = namespace.displayName
  glossarySidebar.push({
    link: `/glossary/${name}`,
    text: name,
  })

  const content = renderNamespaceGlossary({
    apiItem: namespace,
    dataLookup,
    type: name as 'Errors' | 'Types',
  })
  const dir = `${pagesDir}/glossary`
  fs.ensureDirSync(dir)
  fs.writeFileSync(`${dir}/${name}.md`, content)
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
fs.writeFileSync(
  './site/sidebar-generated.ts',
  `export const sidebar = ${JSON.stringify(sidebar, null, 2)}`,
)

// biome-ignore lint/suspicious/noConsoleLog:
console.log('Done.')
