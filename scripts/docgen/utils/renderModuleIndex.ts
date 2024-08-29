import type * as model from '@microsoft/api-extractor-model'
import dedent from 'dedent'

import type { Data } from './handleItem.js'
import type { processDocComment } from './tsdoc.js'

export type ModuleItem = {
  description: string
  member: model.ApiItem
  link: string
}

export function renderModuleIndex(options: {
  docComment: ReturnType<typeof processDocComment>
  errors: ModuleItem[]
  functions: ModuleItem[]
  item: model.ApiItem
  types: ModuleItem[]
}) {
  const {
    docComment = { examples: [], summary: '' },
    errors,
    functions,
    item,
    types,
  } = options
  const { examples, summary } = docComment

  return `
    # ${item.displayName}

    ${summary}

    ${examples.length ? '## Examples' : ''}

    ${examples.join('\n\n')}

${
  functions.length
    ? (() =>
        dedent`
## Functions

| Name | Description |
| ---- | ----------- |
${renderRows(item, functions)}
`)()
    : ''
}

${
  errors.length
    ? (() =>
        dedent`
## Errors

| Name | Description |
| ---- | ----------- |
${renderRows(item, errors)}
`)()
    : ''
}

${
  types.length
    ? (() =>
        dedent`
## Types

| Name | Description |
| ---- | ----------- |
${renderRows(item, types)}
`)()
    : ''
}
  `
}

function renderRows(item: model.ApiItem, items: ModuleItem[]) {
  return items
    .map(
      (x) =>
        `| [\`${item.displayName}.${x.member.displayName}\`](${x.link}) | ${x.description} |`,
    )
    .join('\n')
}

export function renderModuleErrorsIndex(options: {
  errors: ModuleItem[]
  item: model.ApiItem
  lookup: Record<string, Data>
}) {
  const { errors, item, lookup } = options

  let content = ''
  for (const error of errors) {
    const { member } = error
    const lookupItem = lookup[member.canonicalReference.toString()]
    if (!lookupItem)
      throw new Error(
        `Could not find lookup item for ${member.canonicalReference.toString()}`,
      )

    content += dedent`\n\n
## \`${lookupItem.displayName}\`

${lookupItem.comment?.summary ?? 'TODO'}
`
  }

  return dedent`---
showOutline: 1
---

# ${item.displayName} Errors

${content}
`
}

export function renderModuleTypesIndex(options: {
  item: model.ApiItem
  lookup: Record<string, Data>
  types: ModuleItem[]
}) {
  const { types, item, lookup } = options

  let content = ''
  for (const type of types) {
    const { member } = type
    const lookupItem = lookup[member.canonicalReference.toString()]
    if (!lookupItem)
      throw new Error(
        `Could not find lookup item for ${member.canonicalReference.toString()}`,
      )

    content += `\n\n
## \`${lookupItem.displayName}\`

${lookupItem.comment?.summary ?? 'TODO'}
`
  }

  return `---
showOutline: 1
---

# ${item.displayName} Types

${content}
`
}
