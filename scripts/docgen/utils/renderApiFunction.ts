import type { Data } from './handleItem.js'
import { moduleRegex } from './regex.js'

export function renderApiFunction(item: Data, lookup: Record<string, Data>) {
  const {
    comment,
    displayName,
    parameters = [],
    returnType,
    typeParameters,
  } = item

  /// Join data

  const moduleImport = item.parent?.match(moduleRegex)?.groups?.module
  const aliasItem = comment?.alias && lookup[comment.alias]

  /// Render

  const headerContent = `
# ${moduleImport ? `${moduleImport}.` : ''}${displayName}

${aliasItem ? `**Alias:** \`${aliasItem.displayName}\`\n` : ''}
${comment?.summary}
`

  const importContent = !moduleImport
    ? ''
    : `
## Imports

\`\`\`ts twoslash
// @noErrors
import { ${moduleImport} } from 'ox'
import * as ${moduleImport} from 'ox/${moduleImport}'
${aliasItem ? `import { ${aliasItem.displayName} } from 'ox/${moduleImport}'` : ''}
\`\`\`
`

  const exampleContent =
    comment?.examples.length === 0
      ? ''
      : `
## Examples

${comment?.examples.join('\n\n')}
`

  // TODO: Show/hide child attributes
  const parametersContent =
    parameters.length === 0
      ? ''
      : `
## Parameters

${parameters
  .map((p) => {
    return `### ${p.name}

- **Type:** \`${p.type}\`

${p.comment}
`
  })
  .join('\n')}
`

  // TODO: Show child attributes (e.g. options.size)
  const returnTypeContent =
    !returnType || returnType?.type === 'void'
      ? ''
      : `
## Return Type
\`\`\`ts
${returnType.type}
\`\`\`
`

  const errorTypeId = `${item.canonicalReference.split(':')[0]}.ErrorType:type`
  const parseErrorId = `${item.canonicalReference.split(':')[0]}.parseError:function(1)`
  const errorTypeItem = lookup[errorTypeId]
  const parseErrorItem = lookup[parseErrorId]

  const typeRegex = /^ox!(?<type>.+):type/
  const errorTypeContent = !(errorTypeItem && parseErrorItem)
    ? ''
    : `
## Error Type

\`\`\`ts
${errorTypeItem.canonicalReference.match(typeRegex)?.groups?.type}
\`\`\`

${errorTypeItem.references.map((r) => `- \`${r.text}\``).join('\n')}
`

  const arrow = false
  let paramSignature = parameters
    .map((p) => {
      let pStr = p.name
      if (p.optional) {
        pStr += '?'
      }
      pStr += `: ${p.type}`
      return pStr
    })
    .join(',\n  ')
  if (paramSignature) paramSignature = `\n  ${paramSignature}\n`
  const genericSignature = typeParameters?.length
    ? `<${typeParameters.map((p) => p.name).join(', ')}>`
    : ''
  const signature = `${arrow ? '' : 'function '}${
    displayName
  }${genericSignature}(${paramSignature})${arrow ? ' =>' : ':'} ${
    returnType?.type
  }`
  const signatureContent = `
## Signature

\`\`\`ts
${signature}
\`\`\`

[(${item.file})](https://github.com/wevm/ox/blob/main/${item.file})
`

  return `
${headerContent}
${importContent}
${exampleContent}
${signatureContent}
${parametersContent}
${returnTypeContent}
${errorTypeContent}

`
}
