import { relative, resolve } from 'node:path'
import * as model from '@microsoft/api-extractor-model'
import fs from 'fs-extra'

import { getExports } from '../utils/exports.js'
import { renderApiFunction } from './render/apiFunction.js'
import {
  type ModuleItem,
  renderNamespace,
  renderNamespaceErrors,
  renderNamespaceTypes,
} from './render/apiNamespace.js'
import {
  getZodAnchor,
  type ZodMember,
  renderZodMemberGroup,
  renderZodMemberPage,
  renderZodNamespace,
} from './render/apiZod.js'
import { frontmatter } from './utils/description.js'
import { createDataLookup, type Data, getId, getPath } from './utils/model.js'
import { namespaceRegex } from './utils/regex.js'
import {
  extractNamespaceDocComments,
  type processDocComment,
} from './utils/tsdoc.js'

// Minimal structural subset of Vocs' sidebar/top-nav config types. Vocs is only
// installed in the `site` workspace, so it can't be imported from here; the
// generated config is validated against the real Vocs types on the site side.
type SidebarItem = {
  collapsed?: boolean
  items?: SidebarItem[]
  link?: string
  text: string
}
type TopNavLink = { link: string; text: string }
type TopNav = readonly (
  | TopNavLink
  | { items: readonly TopNavLink[]; text: string }
)[]

console.log('Generating API docs.')

////////////////////////////////////////////////////////////
/// Clean previously generated pages
////////////////////////////////////////////////////////////

for (const dir of ['api', 'ercs', 'tempo', 'webauthn', 'zod']) {
  fs.removeSync(`./site/src/pages/${dir}`)
}

////////////////////////////////////////////////////////////
/// Load API Model
////////////////////////////////////////////////////////////

const fileName = './scripts/docgen/ox.api.json'
const apiPackage = new model.ApiModel().loadPackage(fileName)

////////////////////////////////////////////////////////////
/// Get namespace doc comments
////////////////////////////////////////////////////////////

const exports = getExports()

type DocComments = ReturnType<typeof extractNamespaceDocComments>

export let namespaceDocComments: DocComments = {}
const docCommentsByPath: Record<string, DocComments> = {}
for (const path of Object.values(exports.src)) {
  if (!path.endsWith('index.ts')) continue
  const comments = extractNamespaceDocComments(
    resolve(import.meta.dirname, '../../src', path),
    apiPackage,
  )
  if (!comments) continue
  docCommentsByPath[path] = comments
  // First writer wins. When a namespace name is exported from multiple
  // entrypoints (e.g. `Transaction` from both `./index.ts` and
  // `./tempo/index.ts`), api-extractor keeps the first-encountered export as
  // the canonical top-level namespace. `./index.ts` (Core) is processed first,
  // so its doc comment must take precedence to keep the rendered page on the
  // correct (`/api/...`) path rather than being hijacked by a later entrypoint.
  for (const [name, comment] of Object.entries(comments))
    namespaceDocComments[name] ??= comment
}

////////////////////////////////////////////////////////////
/// Construct lookup
////////////////////////////////////////////////////////////

const dataLookup = createDataLookup(apiPackage)

fs.writeFileSync(
  './scripts/docgen/lookup.json',
  JSON.stringify(dataLookup, null, 2),
)

////////////////////////////////////////////////////////////
/// Get API entrypoints and namespaces
////////////////////////////////////////////////////////////

const testNamespaces: string[] = []
const excludeNamespaces = ['Caches', 'Errors', 'Solidity', 'Types']

function getApiEntryPoint(apiPackage: model.ApiPackage) {
  const apiEntryPoint = apiPackage.members.find(
    (x) =>
      x.kind === model.ApiItemKind.EntryPoint &&
      x.canonicalReference.toString() === 'ox!',
  ) as model.ApiEntryPoint | undefined
  if (!apiEntryPoint) throw new Error('Could not find api entrypoint')
  return apiEntryPoint
}

// Collects renderable top-level namespaces from an entry point. Pass `include`
// to restrict to a set of namespace names (used to render only the
// Tempo-flavoured modules whose names collide with Core in the merged model).
function collectNamespaces(
  apiEntryPoint: model.ApiEntryPoint,
  include?: ReadonlySet<string>,
) {
  const namespaces: model.ApiItem[] = []
  for (const member of apiEntryPoint.members) {
    if (member.kind !== model.ApiItemKind.Namespace) continue
    if (member.displayName === 'z') continue // handled by the dedicated Zod pass
    if (!namespaceRegex.test(getId(member))) continue
    if (excludeNamespaces.includes(member.displayName)) continue
    const name = member.displayName.replace(/_\d+$/, '')
    if (include && !include.has(name)) continue
    if (testNamespaces.length && !testNamespaces.includes(member.displayName))
      continue
    namespaces.push(member)
  }
  return namespaces
}

////////////////////////////////////////////////////////////
/// Build markdown files
////////////////////////////////////////////////////////////

type EntrypointCategory = string
type NamespaceCategory = string
type NamespaceItem = {
  docComment:
    | Pick<NonNullable<ReturnType<typeof processDocComment>>, 'summary'>
    | undefined
  link: string
  name: string
  sidebarItem: SidebarItem
}[]

const pagesDir = './site/src/pages'
const namespaceMap: Record<
  EntrypointCategory,
  Record<NamespaceCategory, NamespaceItem>
> = {}

function renderNamespaces(options: {
  apiPackage: model.ApiPackage
  dataLookup: Record<string, Data>
  docComments: typeof namespaceDocComments
  namespaces: readonly model.ApiItem[]
}) {
  const { apiPackage, dataLookup, docComments, namespaces } = options

  for (const namespace of namespaces) {
    const name = namespace.displayName.replace(/_\d+$/, '')
    const docComment = docComments[name]
    const basePath = docComment ? getPath(docComment) : '/'
    const baseLink = `${basePath}/${name}`
    const dir = `${pagesDir}${baseLink}`
    fs.ensureDirSync(dir)

    const data = dataLookup[getId(namespace)]
    const filePath = data?.file.path ?? ''
    const entrypoint = relative(
      resolve(import.meta.dirname, '../../src'),
      filePath,
    ).replace(/\/?index\.ts?$/, '')

    const items: SidebarItem[] = [{ text: 'Overview', link: baseLink }]
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
          docComments,
          entrypoint,
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

    const category = docComments[name]?.category
    if (!category)
      throw new Error(
        `Could not find category for namespace: ${name}. Please add a TSDoc \`@category\` tag.`,
      )

    const entrypointCategory = docComments[name]?.entrypointCategory
    if (!entrypointCategory)
      throw new Error(
        `Could not find entrypoint for namespace: ${name}. Please add a TSDoc \`@entrypointCategory\` tag.`,
      )

    namespaceMap[entrypointCategory] ??= {}
    namespaceMap[entrypointCategory][category] ??= []
    namespaceMap[entrypointCategory][category].push({
      docComment,
      link: baseLink,
      name,
      sidebarItem: {
        collapsed: true,
        items,
        text: name,
      },
    })

    const content = renderNamespace({
      apiItem: namespace,
      docComment,
      errors,
      functions,
      types,
    })
    fs.writeFileSync(`${dir}/index.md`, content)
  }
}

// Render Core plus every uniquely-named module from the merged `ox` model.
renderNamespaces({
  apiPackage,
  dataLookup,
  docComments: namespaceDocComments,
  namespaces: collectNamespaces(getApiEntryPoint(apiPackage)),
})

// Recover modules whose names collide with Core. When a non-Core entrypoint
// exports a namespace whose name also exists in Core (e.g. `RpcSchema` in
// `erc4337`, `Transaction` in `tempo`), api-extractor keeps Core as the
// canonical export in the merged `ox` model and drops the other. Each such
// module is recovered from its own single-entrypoint model and rendered with
// that entrypoint's doc comments, so its pages and self-links resolve under the
// entrypoint's own path while links to Core types still resolve to `/api/...`.
const coreNames = new Set(Object.keys(docCommentsByPath['./index.ts'] ?? {}))
const secondaryModels: Record<string, string> = {
  './erc4337/index.ts': './scripts/docgen/erc4337.api.json',
  './tempo/index.ts': './scripts/docgen/tempo.api.json',
}
for (const [path, modelPath] of Object.entries(secondaryModels)) {
  const comments = docCommentsByPath[path]
  if (!comments) continue
  const collidingNames = new Set(
    Object.keys(comments).filter((name) => coreNames.has(name)),
  )
  if (!collidingNames.size) continue

  const secondaryApiPackage = new model.ApiModel().loadPackage(modelPath)
  const docComments = { ...namespaceDocComments, ...comments }
  renderNamespaces({
    apiPackage: secondaryApiPackage,
    dataLookup: createDataLookup(secondaryApiPackage, docComments, true),
    docComments,
    namespaces: collectNamespaces(
      getApiEntryPoint(secondaryApiPackage),
      collidingNames,
    ),
  })
}

////////////////////////////////////////////////////////////
/// Build Zod entrypoint docs
////////////////////////////////////////////////////////////

const zodEntrypointCategory = 'Zod'

// Renders a Zod reference namespace as an overview page plus a dedicated page
// per exported schema/function (mirroring the per-member layout used by the
// Core/Tempo modules), and registers it in the sidebar with sub-items.
function writeZodPage(options: {
  category: string
  displayName: string
  members: readonly model.ApiItem[]
  pageName: string
  sidebarText: string
  summary?: string | undefined
  title: string
}) {
  const {
    category,
    displayName,
    members,
    pageName,
    sidebarText,
    summary,
    title,
  } = options

  const basePath = getPath({
    entrypointCategory: zodEntrypointCategory,
    category,
  })
  const baseLink = `${basePath}/${pageName}`
  const dir = `${pagesDir}${baseLink}`
  fs.ensureDirSync(dir)

  const items: SidebarItem[] = [{ text: 'Overview', link: baseLink }]
  const variables: ZodMember[] = []
  const functions: ZodMember[] = []
  const types: ZodMember[] = []
  const errors: ZodMember[] = []

  for (const member of [...members].toSorted((a, b) =>
    a.displayName.localeCompare(b.displayName),
  )) {
    const data = dataLookup[getId(member)]
    if (!data) throw new Error(`Could not find data for ${getId(member)}`)
    const fullName = `${displayName}.${data.displayName}`

    if (
      member.kind === model.ApiItemKind.Variable ||
      member.kind === model.ApiItemKind.Function
    ) {
      const link = `${baseLink}/${data.displayName}`
      const entry = { apiItem: member, description: data.description, link }
      if (member.kind === model.ApiItemKind.Variable) variables.push(entry)
      else functions.push(entry)
      items.push({ text: `.${data.displayName}`, link })
      fs.writeFileSync(
        `${dir}/${data.displayName}.md`,
        renderZodMemberPage({ data, displayName, member }),
      )
    } else if (member.kind === model.ApiItemKind.TypeAlias) {
      types.push({
        apiItem: member,
        description: data.description,
        link: `${baseLink}/types#${getZodAnchor(fullName)}`,
      })
    } else if (
      member.kind === model.ApiItemKind.Class &&
      member.displayName.endsWith('Error')
    ) {
      errors.push({
        apiItem: member,
        description: data.description,
        link: `${baseLink}/errors#${getZodAnchor(fullName)}`,
      })
    }
  }

  if (types.length) {
    items.push({ text: 'Types', link: `${baseLink}/types` })
    fs.writeFileSync(
      `${dir}/types.md`,
      renderZodMemberGroup({
        dataLookup,
        displayName,
        members: types,
        title: `${displayName} Types`,
      }),
    )
  }

  if (errors.length) {
    items.push({ text: 'Errors', link: `${baseLink}/errors` })
    fs.writeFileSync(
      `${dir}/errors.md`,
      renderZodMemberGroup({
        dataLookup,
        displayName,
        members: errors,
        title: `${displayName} Errors`,
      }),
    )
  }

  fs.writeFileSync(
    `${dir}/index.md`,
    renderZodNamespace({
      errors,
      functions,
      summary,
      title,
      types,
      variables,
    }),
  )

  namespaceMap[zodEntrypointCategory] ??= {}
  namespaceMap[zodEntrypointCategory][category] ??= []
  namespaceMap[zodEntrypointCategory][category].push({
    docComment: { summary: summary ?? `${displayName} schemas.` },
    link: baseLink,
    name: sidebarText,
    sidebarItem: { collapsed: true, items, text: sidebarText },
  })
}

// Renders a single inline Zod reference page (used for synthetic groupings such
// as the direct integer schemas, where dedicated per-member pages would be
// excessive). Registers a single sidebar entry without sub-items.
function writeZodInlinePage(options: {
  category: string
  displayName: string
  members: readonly model.ApiItem[]
  pageName: string
  sidebarText: string
  summary?: string | undefined
  title: string
}) {
  const {
    category,
    displayName,
    members,
    pageName,
    sidebarText,
    summary,
    title,
  } = options

  const basePath = getPath({
    entrypointCategory: zodEntrypointCategory,
    category,
  })
  const baseLink = `${basePath}/${pageName}`
  const dir = `${pagesDir}${baseLink}`
  fs.ensureDirSync(dir)

  const sorted = [...members].toSorted((a, b) =>
    a.displayName.localeCompare(b.displayName),
  )
  const memberEntries: ZodMember[] = sorted.map((member) => {
    const data = dataLookup[getId(member)]
    if (!data) throw new Error(`Could not find data for ${getId(member)}`)
    return {
      apiItem: member,
      description: data.description,
      link: `${baseLink}#${getZodAnchor(`${displayName}.${data.displayName}`)}`,
    }
  })

  fs.writeFileSync(
    `${dir}/index.md`,
    renderZodMemberGroup({
      dataLookup,
      displayName,
      members: memberEntries,
      summary,
      title,
    }),
  )

  namespaceMap[zodEntrypointCategory] ??= {}
  namespaceMap[zodEntrypointCategory][category] ??= []
  namespaceMap[zodEntrypointCategory][category].push({
    docComment: { summary: summary ?? `${displayName} schemas.` },
    link: baseLink,
    name: sidebarText,
    sidebarItem: { link: baseLink, text: sidebarText },
  })
}

// Recursively collects renderable `z.*` namespaces (e.g. `z.Address`,
// `z.RpcSchema`, `z.tempo.Transaction`), skipping container-only namespaces.
function collectZodNamespaces(
  namespace: model.ApiNamespace,
  parts: string[] = [],
): { namespace: model.ApiNamespace; parts: string[] }[] {
  const out: { namespace: model.ApiNamespace; parts: string[] }[] = []
  for (const member of namespace.members) {
    if (member.kind !== model.ApiItemKind.Namespace) continue
    const child = member as model.ApiNamespace
    const childParts = [...parts, child.displayName]
    const renderable = child.members.some(
      (m) =>
        m.kind === model.ApiItemKind.Variable ||
        m.kind === model.ApiItemKind.Function ||
        m.kind === model.ApiItemKind.TypeAlias ||
        (m.kind === model.ApiItemKind.Class && m.displayName.endsWith('Error')),
    )
    if (renderable) out.push({ namespace: child, parts: childParts })
    out.push(...collectZodNamespaces(child, childParts))
  }
  return out
}

const zodNamespace = getApiEntryPoint(apiPackage).members.find(
  (member) =>
    member.kind === model.ApiItemKind.Namespace &&
    getId(member) === 'ox!z:namespace',
) as model.ApiNamespace | undefined

if (zodNamespace) {
  // Direct integer schema variables on `z` (Uint*, Int*, Number, BigInt).
  const integerVars = zodNamespace.members.filter(
    (m) => m.kind === model.ApiItemKind.Variable,
  )
  if (integerVars.length)
    writeZodInlinePage({
      category: 'Schemas',
      displayName: 'z',
      members: integerVars,
      pageName: 'Integers',
      sidebarText: 'Integers',
      summary: 'Integer quantity schemas exported directly from `z`.',
      title: 'Integer Schemas',
    })

  // Nested Ox schema namespaces (z.Address, z.RpcSchema, z.tempo.Transaction, …).
  for (const { namespace, parts } of collectZodNamespaces(zodNamespace)) {
    const category =
      parts[0] === 'tempo'
        ? 'Tempo'
        : parts[0] === 'RpcSchema'
          ? 'JSON-RPC'
          : 'Schemas'
    const displayName = ['z', ...parts].join('.')
    writeZodPage({
      category,
      displayName,
      members: namespace.members,
      pageName: parts.at(-1)!,
      sidebarText: displayName,
      title: displayName,
    })
  }
}

////////////////////////////////////////////////////////////
/// Build sidebar & top nav
////////////////////////////////////////////////////////////

const namespaceEntries: {
  entrypointCategory: EntrypointCategory
  categories: {
    category: NamespaceCategory
    items: NamespaceItem
  }[]
}[] = []

for (const [entrypointCategory, categories] of Object.entries(namespaceMap)) {
  let alphabetized = []
  for (const [category, items] of Object.entries(categories)) {
    alphabetized.push({
      category,
      items: items.toSorted((a, b) => a.name.localeCompare(b.name)),
    })
  }
  alphabetized = alphabetized.toSorted((a, b) =>
    a.category.localeCompare(b.category),
  )
  namespaceEntries.push({ entrypointCategory, categories: alphabetized })
}

const sidebar: Record<string, { backLink: true; items: SidebarItem[] }> = {}
for (const { entrypointCategory, categories } of namespaceEntries) {
  const path = getPath({ entrypointCategory })
  sidebar[path] = {
    backLink: true,
    items: [
      {
        text: 'Overview',
        link: path,
      },
      ...categories.map(({ category, items }) => ({
        text: category,
        items: items.map(({ sidebarItem }) => sidebarItem),
      })),
    ],
  }
}

const topNav = [
  {
    text: 'Core',
    link: getPath({ entrypointCategory: 'Core' }),
  },
  {
    text: 'Tempo',
    link: getPath({ entrypointCategory: 'Tempo' }),
  },
  {
    text: 'More',
    items: [
      {
        text: 'Account Abstraction',
        link: getPath({ entrypointCategory: 'WebAuthn' }),
      },
      {
        text: 'ERCs',
        link: getPath({ entrypointCategory: 'ERCs' }),
      },
      {
        text: 'Zod',
        link: getPath({ entrypointCategory: 'Zod' }),
      },
    ],
  },
] satisfies TopNav

fs.writeFileSync(
  './site/src/config-generated.ts',
  `export const sidebar = ${JSON.stringify(sidebar, null, 2)}\n` +
    `export const topNav = ${JSON.stringify(topNav, null, 2)}`,
)

////////////////////////////////////////////////////////////
/// Generate "API Reference" pages
////////////////////////////////////////////////////////////

for (const namespace of namespaceEntries) {
  let content = `${frontmatter({
    description: `API reference for ${namespace.entrypointCategory} modules, functions, types, and errors.`,
  })}\n\n# API Reference\n\n`

  const escapeTableCell = (value: string | undefined) =>
    (value ?? '').replaceAll('\n', ' ').replaceAll('|', '\\|')

  content += '| Module | Description |\n'
  content += '| --- | --- |\n'

  for (const { category, items } of namespace.categories) {
    content += `| **${escapeTableCell(category)}** | |\n`
    for (const item of items) {
      const description = item.docComment?.summary
        .split('\n\n')[0]
        ?.replaceAll('\n', ' ')
      content += `| [${escapeTableCell(item.name)}](${item.link}) | ${escapeTableCell(description)} |\n`
    }
  }

  const path = `${pagesDir}${getPath(namespace)}`
  fs.writeFileSync(`${path}/index.mdx`, content)
}

console.log('Done.')
