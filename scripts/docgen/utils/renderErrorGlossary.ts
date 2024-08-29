import * as model from '@microsoft/api-extractor-model'

import type { Data } from './handleItem.js'

export function renderErrorGlossary(options: {
  item: model.ApiItem
  lookup: Record<string, Data>
}) {
  const { item, lookup } = options

  let content = ''
  for (const member of item.members) {
    if (member.kind !== model.ApiItemKind.Class) continue
    if (!member.displayName.endsWith('Error')) continue

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

# ${item.displayName} [Glossary of Errors in Ox]

${content}
`
}
