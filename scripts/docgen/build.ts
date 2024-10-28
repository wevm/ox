import * as model from '@microsoft/api-extractor-model'
import fs from 'fs-extra'

import { renderApiFunction } from './render/apiFunction.js'
import {
  type ModuleItem,
  renderNamespace,
  renderNamespaceErrors,
  renderNamespaceTypes,
} from './render/apiNamespace.js'
import { createDataLookup, getId } from './utils/model.js'
import { namespaceRegex } from './utils/regex.js'
import {
  extractNamespaceDocComments,
  type processDocComment,
} from './utils/tsdoc.js'

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

const moduleDocComments = extractNamespaceDocComments(
  './src/index.ts',
  apiPackage,
)

const testNamespaces: string[] = []
const excludeNamespaces = ['Caches', 'Constants', 'Errors', 'Internal', 'Types']
const namespaces = []
for (const member of apiEntryPoint.members) {
  if (member.kind !== model.ApiItemKind.Namespace) continue
  if (!namespaceRegex.test(getId(member))) continue
  if (excludeNamespaces.includes(member.displayName)) continue
  if (testNamespaces.length && !testNamespaces.includes(member.displayName))
    continue
  namespaces.push(member)
}

////////////////////////////////////////////////////////////
/// Generate sidebar and markdown files
////////////////////////////////////////////////////////////

const pagesDir = './site/pages'
const namespaceMap = new Map<
  string,
  {
    baseLink: string
    category: string
    docComment: ReturnType<typeof processDocComment>
    name: string
    sidebarItem: {
      items: { text: string; link: string }[]
      link: string
      text: string
    }
  }[]
>()

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
    const displayNameWithNamespace = `${name}.${displayName}`

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

      const content = renderApiFunction({
        apiItem: apiPackage,
        data,
        dataLookup,
        overloads,
      })
      fs.writeFileSync(`${dir}/${displayName}.md`, content)
    } else if (member.kind === model.ApiItemKind.Class) {
      if (displayName.endsWith('Error'))
        errors.push({
          apiItem: member,
          description,
          link: `${baseLink}/errors#${displayNameWithNamespace.toLowerCase().replace('.', '')}`,
        })
      else throw new Error(`Unsupported class: ${displayName}`)
    } else if (member.kind === model.ApiItemKind.TypeAlias) {
      types.push({
        apiItem: member,
        description,
        link: `${baseLink}/types#${displayNameWithNamespace.toLowerCase().replace('.', '')}`,
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

  const category = moduleDocComments[name]?.category
  if (!category)
    throw new Error(
      `Could not find sidebar category for namespace: ${name}. Please add a TSDoc \`@category\` tag.`,
    )

  const item = {
    baseLink,
    category,
    docComment: moduleDocComments[name],
    name,
    sidebarItem: { collapsed: true, items, link: baseLink, text: name },
  }

  if (namespaceMap.has(category)) namespaceMap.get(category)?.push(item)
  else namespaceMap.set(category, [item])

  const content = renderNamespace({
    apiItem: namespace,
    docComment: moduleDocComments[name],
    errors,
    functions,
    types,
  })
  fs.writeFileSync(`${dir}/index.md`, content)
}

const alphabetizedNamespaceMap = new Map(
  [...namespaceMap].sort(([categoryA], [categoryB]) =>
    categoryA.localeCompare(categoryB),
  ),
)

const namespaceSidebarItems = []
for (const [category, items] of alphabetizedNamespaceMap)
  namespaceSidebarItems.push({
    text: category,
    items: items.map((item) => item.sidebarItem),
  })

const sidebar = [
  {
    text: 'Overview',
    link: '/api',
  },
  ...namespaceSidebarItems,
]
fs.writeFileSync(
  './site/sidebar-generated.ts',
  `export const sidebar = ${JSON.stringify(sidebar, null, 2)}`,
)

////////////////////////////////////////////////////////////
/// Generate "API Reference" page
////////////////////////////////////////////////////////////

let content = '# API Reference\n\n'

content += '<table className="vocs_Table">\n'
content += '<tbody>\n'

for (const [category, items] of alphabetizedNamespaceMap) {
  content += `<tr><td className="vocs_TableCell" colSpan="2" style={{ backgroundColor: 'var(--vocs-color_background2)' }}>**${category}**</td></tr>\n`
  for (const item of items) {
    const description = item.docComment?.summary
      .split('\n\n')[0]
      ?.replace('\n', ' ')
    content += `<tr><td className="vocs_TableCell"><a className="vocs_Anchor vocs_Link vocs_Link_accent_underlined" href="/api/${item.name}">${item.name}</a></td><td className="vocs_TableCell">${description}</td></tr>\n`
  }
}
content += '</tbody>\n'
content += '</table>\n'

fs.writeFileSync(`${pagesDir}/api/index.mdx`, content)

// biome-ignore lint/suspicious/noConsoleLog:
console.log('Done.')
