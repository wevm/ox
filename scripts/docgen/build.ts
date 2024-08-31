import * as model from '@microsoft/api-extractor-model'
import fs from 'fs-extra'

import { type Data, handleItem } from './utils/handleItem.js'
// import { extractNamespaceDocComments } from './utils/tsdoc.js'
import { namespaceRegex } from './utils/regex.js'
import { renderApiFunction } from './utils/renderApiFunction.js'

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

const content = JSON.stringify(lookup, null, 2)
fs.writeFileSync('./scripts/docgen/lookup.json', content)

const entrypointItem = pkg.members.find(
  (x) =>
    x.kind === model.ApiItemKind.EntryPoint &&
    x.canonicalReference.toString() === 'ox!',
)
if (!entrypointItem) throw new Error('Could not find entrypoint item')

const testModules = ['Address']
const hiddenModules = ['Caches', 'Constants', 'Errors', 'Internal', 'Types']
const moduleItems = entrypointItem.members.filter(
  (x) =>
    x.kind === model.ApiItemKind.Namespace &&
    namespaceRegex.test(x.canonicalReference.toString()) &&
    !hiddenModules.includes(x.displayName) &&
    (testModules.length === 0 || testModules.includes(x.displayName)),
)
// const moduleDocComments = extractNamespaceDocComments('./src/index.ts')

// const tsdocLinkRegex = /^{@link ((?<module>.+)#(?<type>.+))}$/
for (const moduleItem of moduleItems) {
  for (const member of moduleItem.members) {
    const item = lookup[member.canonicalReference.toString()]
    if (!item)
      throw new Error(
        `Could not find item for ${member.canonicalReference.toString()}`,
      )

    switch (member.kind) {
      case model.ApiItemKind.Function: {
        // Skip overloads without TSDoc attached
        const overloads = member
          .getMergedSiblings()
          .map((x) => x.canonicalReference.toString())
          .filter((x) => !x.endsWith('namespace'))
        const hasOverloads = overloads.length > 1
        if (hasOverloads) {
          const overloadWithDocumentation = overloads.find(
            (x) => lookup[x]?.comment?.summary,
          )
          if (item.id !== overloadWithDocumentation) continue
        }

        const content = renderApiFunction({
          item,
          lookup,
          overloads: hasOverloads ? overloads : undefined,
        })
        if (item.displayName === 'from')
          // biome-ignore lint/suspicious/noConsoleLog:
          console.log(content)
      }
    }
  }
}

//
// ////////////////////////////////////////////////////////////
// /// Construct Vocs sidebar, module pages, and glossary
// ////////////////////////////////////////////////////////////
// const apiReferenceSidebar = []
// for (const moduleItem of moduleItems) {
//   const baseLink = `/api/${moduleItem.displayName}`
//
//   const errors: ModuleItem[] = []
//   const functions: ModuleItem[] = []
//   const types: ModuleItem[] = []
//
//   const items = []
//   for (const member of moduleItem.members) {
//     const memberItem = lookup[member.canonicalReference.toString()]
//     if (!memberItem)
//       throw new Error(
//         `Could not find lookup item for ${member.canonicalReference.toString()}`,
//       )
//
//     const description =
//       memberItem.comment?.summary.split('\n')[0]?.trim() ?? 'TODO'
//
//     if (member.kind === model.ApiItemKind.Function) {
//       const link = `${baseLink}/${member.displayName}`
//       items.push({
//         text: `.${member.displayName}`,
//         link,
//         id: memberItem.id,
//       })
//       functions.push({ description, member, link })
//     }
//
//     if (
//       member.kind === model.ApiItemKind.Class &&
//       member.displayName.endsWith('Error')
//     )
//       errors.push({
//         description,
//         member,
//         link: `${baseLink}/errors#${member.displayName.toLowerCase()}`,
//       })
//
//     if (member.kind === model.ApiItemKind.TypeAlias)
//       types.push({
//         description,
//         member,
//         link: `${baseLink}/types#${member.displayName.toLowerCase()}`,
//       })
//   }
//
//   const dir = `${pagesDir}/api/${moduleItem.displayName}`
//   fs.ensureDirSync(dir)
//
//   if (types.length) {
//     const content = renderModuleErrorsIndex({
//       errors,
//       item: moduleItem,
//       lookup,
//     })
//     fs.writeFileSync(`${dir}/errors.md`, content)
//     items.push({ text: 'Errors', link: `${baseLink}/errors` })
//   }
//
//   if (types.length) {
//     const content = renderModuleTypesIndex({
//       item: moduleItem,
//       lookup,
//       types,
//     })
//     fs.writeFileSync(`${dir}/types.md`, content)
//     items.push({ text: 'Types', link: `${baseLink}/types` })
//   }
//
//   apiReferenceSidebar.push({
//     collapsed: true,
//     items,
//     link: baseLink,
//     text: moduleItem.displayName,
//   })
//
//   const content = renderModuleIndex({
//     docComment: moduleDocComments[moduleItem.displayName],
//     errors,
//     functions,
//     item: moduleItem,
//     types,
//   })
//   fs.writeFileSync(`${dir}/index.md`, content)
// }
//
// /// Errory glossary
// const glossarySidebar = []
// {
//   const errorItem = entrypointItem.members.find(
//     (x) =>
//       x.kind === model.ApiItemKind.Namespace &&
//       namespaceRegex.test(x.canonicalReference.toString()) &&
//       ['Errors'].includes(x.displayName),
//   )
//   if (!errorItem) throw new Error('Could not find error item')
//
//   glossarySidebar.push({
//     link: '/errors',
//     text: errorItem.displayName,
//   })
//
//   const content = renderErrorGlossary({ item: errorItem, lookup })
//   fs.writeFileSync(`${pagesDir}/errors.md`, content)
// }
//
// const sidebar = [
//   {
//     text: 'API Reference',
//     items: apiReferenceSidebar,
//   },
//   {
//     text: 'Glossary',
//     items: glossarySidebar,
//   },
// ]
// const content = `
// export const sidebar = ${JSON.stringify(sidebar, null, 2)}
// `
// fs.writeFileSync('./site/sidebar-generated.ts', content)
//
// /// Build markdown files
// const ids = apiReferenceSidebar.flatMap((x) => x.items ?? []).map((x) => x.id)
// for (const id of ids) {
//   if (!id) continue
//
//   const item = lookup[id]
//   if (!item) throw new Error(`Could not find item with id ${id}`)
//
//   const content = (() => {
//     switch (item.kind) {
//       case model.ApiItemKind.Function:
//         return renderApiFunction({ item, lookup })
//       default:
//         throw new Error(`Unsupported item kind: ${item.kind}`)
//     }
//   })()
//
//   const module = item.parent?.match(namespaceRegex)?.groups?.module
//   const dir = `${pagesDir}/api/${module ? `${module}/` : ''}`
//   fs.writeFileSync(`${dir}${item.displayName}.md`, content)
// }

// biome-ignore lint/suspicious/noConsoleLog:
console.log('Done.')
