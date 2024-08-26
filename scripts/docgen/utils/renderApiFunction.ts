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

  const parametersContent =
    parameters.length === 0
      ? ''
      : `
## Parameters

${parameters
  .map((p) => {
    let content = ''
    const id = `ox!${p.type}:interface`
    const lookupItem = lookup[id]
    if (lookupItem)
      for (const child of lookupItem.children) {
        const childItem = lookup[child]
        if (!childItem) continue
        content += `
#### ${p.name}.${childItem.displayName}

- **Type:** \`${childItem.type}\`
${childItem.comment?.default ? `- **Default:** \`${childItem.comment.default}\`` : ''}

${childItem.comment?.summary}
`
      }
    // const interfaceReference = p.primaryCanonicalReference?.endsWith(
    //   ':interface',
    // )
    //   ? p.primaryCanonicalReference
    //   : undefined
    // if (interfaceReference) console.log(interfaceReference)
    //
    return `### ${p.name}

- **Type:** \`${p.type}\`
${comment?.default ? `- **Default:** \`${comment.default}\`` : ''}

${p.comment}

${content}

`
  })
  .join('\n')}
`

  // if (module === 'Address' && displayName === 'fromPublicKey')
  //   console.log(
  //     item,
  //     lookup['ox!Address.fromPublicKey:namespace'],
  //     lookup['ox!Address.fromPublicKey.ReturnType:type'],
  //   )

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

${errorTypeItem.references.map((r) => `- \`${r.text}\``).join('\n')}
`

  const arrow = false
  let paramSignature = parameters
    .map((p) => {
      let pStr = p.name
      if (p.optional) pStr += '?'
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
