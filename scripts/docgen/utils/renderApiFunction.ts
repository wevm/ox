import type { Data } from './handleItem.js'

export function renderApiFunction(item: Data, lookup: Record<string, Data>) {
  const {
    comment,
    displayName,
    module,
    parameters = [],
    returnType,
    typeParameters,
  } = item

  /// Render

  const headerContent = `
# ${module ? `${module}.` : ''}${displayName}

${comment?.summary}
`

  const importContent = !module
    ? ''
    : `
## Imports

\`\`\`ts twoslash
// @noErrors
import { ${module} } from 'ox'
import * as ${module} from 'ox/${module}'
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

- **Type:** \`${p.type.replace('_', '.')}\`

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

\`${returnType.type}\`

${comment?.returns}
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

\`${errorTypeItem.canonicalReference.match(typeRegex)?.groups?.type}\`

${errorTypeItem.references.map((r) => `- \`${r.text.replace('_', '.')}\``).join('\n')}
`

  const arrow = false
  let paramSignature = parameters
    .map((p) => {
      let pStr = p.name
      if (p.optional) pStr += '?'
      pStr += `: ${p.type.replace('_', '.')}`
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

[${item.file.path}](${item.file.url}${item.file.lineNumber ? `#L${item.file.lineNumber}` : ''})
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
