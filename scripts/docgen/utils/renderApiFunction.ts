import dedent from 'dedent'
import type { Data } from './handleItem.js'

export function renderApiFunction(options: {
  item: Data
  lookup: Record<string, Data>
}) {
  const { item, lookup } = options
  const { comment, displayName, module } = item

  // if (module === 'Address' && displayName === 'fromPublicKey')
  //   console.log(
  //     item,
  //     lookup['ox!Address.fromPublicKey:namespace'],
  //     lookup['ox!Address.fromPublicKey.ReturnType:type'],
  //   )

  return `
# ${module ? `${module}.` : ''}${displayName}

${comment?.summary}

${renderImports(module)}

${renderExamples(comment?.examples)}

${renderSignature({ item, lookup })}

${renderParameters({ item, lookup })}

${renderReturnType({ item })}

${renderErrorType({ item, lookup })}
`
}

function renderImports(module: string | undefined) {
  if (!module) return ''
  return dedent`
    ## Imports

    \`\`\`ts twoslash
    // @noErrors
    import { ${module} } from 'ox'
    import * as ${module} from 'ox/${module}'
    \`\`\`
  `
}

function renderExamples(examples: readonly string[] | undefined) {
  if (!examples || examples.length === 0) return
  return `
## Examples

${examples.join('\n\n')}
`
}

function renderParameters(options: {
  item: Data
  lookup: Record<string, Data>
}) {
  const { item, lookup } = options
  const { comment, parameters } = item
  if (!parameters || parameters.length === 0) return ''

  function renderParameter(parameter: NonNullable<Data['parameters']>[number]) {
    return `
### \`${parameter.name}\`

- **Type:** \`${parameter.type}\`
${comment?.default ? `- **Default:** \`${comment.default}\`` : ''}
${!comment?.default && parameter.optional ? '- **Optional**' : ''}

${parameter.comment}
`
  }

  function renderProperty(name: string, data: Data) {
    return `
#### \`${name}.${data.displayName}\`

- **Type:** \`${data.type}\`
${data.comment?.default ? `- **Default:** \`${data.comment.default}\`` : ''}
${!data.comment?.default && data.optional ? '- **Optional**' : ''}

${data.comment?.summary}
`
  }

  return `
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
        content += renderProperty(p.name, childItem)
      }

    return `
      ${renderParameter(p)}

      ${content}
    `
  })
  .join('\n')}
`
}

function renderReturnType(options: {
  item: Data
}) {
  const { item } = options
  const { comment, returnType } = item

  if (!returnType || returnType?.type === 'void') return ''

  return `
## Return Type

${comment?.returns}

\`${returnType.type}\`
`
}

function renderErrorType(options: {
  item: Data
  lookup: Record<string, Data>
}) {
  const { item, lookup } = options

  const errorTypeId = `${item.canonicalReference.split(':')[0]}.ErrorType:type`
  const parseErrorId = `${item.canonicalReference.split(':')[0]}.parseError:function(1)`
  const errorTypeItem = lookup[errorTypeId]
  const parseErrorItem = lookup[parseErrorId]

  const typeRegex = /^ox!(?<type>.+):type/
  if (!(errorTypeItem && parseErrorItem)) return ''
  return dedent`
    ## Error Type

    \`${errorTypeItem.canonicalReference.match(typeRegex)?.groups?.type}\`

    ${errorTypeItem.references.map((r) => `- \`${r.text}\``).join('\n')}
  `
}

function renderSignature(options: {
  item: Data
  lookup: Record<string, Data>
}) {
  const { item } = options
  const { displayName, parameters = [], returnType, typeParameters } = item

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

  return `
## Signature

\`\`\`ts
${signature}
\`\`\`

[${item.file.path}](${item.file.url}${item.file.lineNumber ? `#L${item.file.lineNumber}` : ''})
`
}
