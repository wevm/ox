import * as model from '@microsoft/api-extractor-model'
import dedent from 'dedent'

import type { Data } from './handleItem.js'

export function renderApiFunction(options: {
  item: Data
  lookup: Record<string, Data>
  overloads: string[] | undefined
}) {
  const { item, lookup, overloads } = options

  const { comment, displayName, module } = item
  if (!module) throw new Error('Module not found')

  const content = [`# ${module}.${displayName}`]
  if (comment?.summary) content.push(comment.summary)
  content.push(renderImports({ module }))
  if (comment?.examples)
    content.push(renderExamples({ examples: comment.examples }))

  content.push(renderSignature({ item, lookup, overloads }))
  if (item.parameters)
    content.push(
      renderParameters({
        item,
        lookup,
        parameters: item.parameters,
        overloads,
      }),
    )
  if (item.returnType)
    content.push(
      renderReturnType({
        comment: comment?.returns,
        returnType: item.returnType,
      }),
    )

  const errorIds = resolveErrorData({
    id: `ox!${module}.${displayName}.ErrorType:type`,
    lookup,
  })
  if (errorIds.size)
    content.push(
      renderErrors({
        errorIds: Array.from(errorIds).sort((a, b) => (a > b ? 1 : -1)),
        item,
        lookup,
      }),
    )

  return content.join('\n\n').trim()
}

function renderImports(options: {
  module: string
}) {
  const { module } = options
  return dedent`
    ## Imports

    \`\`\`ts twoslash
    // @noErrors
    import { ${module} } from 'ox'
    import * as ${module} from 'ox/${module}'
    \`\`\`
  `
}

function renderExamples(options: { examples: readonly string[] }) {
  const { examples } = options
  const content = ['## Examples']
  for (const example of examples) {
    // TODO: Typecheck example
    // TODO: Capture example output
    content.push(example)
  }
  return content.join('\n\n')
}

function renderSignature(options: {
  arrow?: boolean | undefined
  item: Data
  lookup: Record<string, Data>
  overloads: string[] | undefined
}) {
  const { arrow = false, item, lookup, overloads } = options
  const { displayName, parameters = [], returnType, typeParameters = [] } = item

  const content = ['## Signature']

  let paramSignature = parameters
    .map((x, i) => {
      let name = x.name
      if (x.optional) name += '?'
      const type = resolveInlineParameterTypeForOverloads({
        index: i,
        lookup,
        overloads,
        parameter: x,
      })
      name += `: ${type}`
      return name
    })
    .join(',\n  ')
  if (paramSignature) paramSignature = `\n  ${paramSignature},\n`
  const genericSignature = typeParameters.length
    ? `<${typeParameters.map((x) => x.name).join(', ')}>`
    : ''
  const returnTypeSignature = resolveReturnTypeForOverloads({
    lookup,
    overloads,
    returnType,
  })
  const signature = `${arrow ? '' : 'function '}${
    displayName
  }${genericSignature}(${paramSignature})${arrow ? ' =>' : ':'} ${
    returnTypeSignature
  }`

  content.push(`\`\`\`ts\n${signature}\n\`\`\``)
  content.push(
    `Source: [${item.file.path}](${item.file.url}${item.file.lineNumber ? `#L${item.file.lineNumber}` : ''})`,
  )
  return content.join('\n\n')
}

function renderParameters(options: {
  item: Data
  lookup: Record<string, Data>
  overloads: string[] | undefined
  parameters: NonNullable<Data['parameters']>
}) {
  const { lookup, overloads, parameters } = options

  const content = ['## Parameters']

  let parameterIndex = 0
  for (const parameter of parameters) {
    content.push(`### \`${parameter.name}\``)

    // Swap out the inline type for the namespace type for overloads
    // e.g. `{ foo: string; bar: bigint }` -> `Foo.bar.Options`
    const type = resolveInlineParameterTypeForOverloads({
      index: parameterIndex,
      lookup,
      overloads,
      parameter,
    })
    const listContent = [`- **Type:** \`${type}\``]
    if (parameter.optional) listContent.push('- **Optional**')
    content.push(listContent.join('\n'))

    if (parameter.comment) content.push(parameter.comment)

    const interfaceItem = lookup[`ox!${parameter.type}:interface`]
    const inlineParameterType =
      parameter.type.startsWith('{') && parameter.type.endsWith('}')
    const properties = []
    if (interfaceItem) {
      for (const child of interfaceItem.children) {
        const childItem = lookup[child]
        if (!childItem) continue
        properties.push({
          ...childItem,
          ...childItem.comment,
          name: childItem.displayName,
        })
      }
    } else if (inlineParameterType) {
      // TODO: Get descriptions from source
      for (const value of parameter.type
        .slice(1, -1)
        .split(';')
        .map((x) => x.trim())) {
        if (!value) continue

        const parts = value.split(': ')
        properties.push({
          default: undefined, // TODO
          name: parts[0]?.replace(/\?$/, ''),
          optional: parts[0]?.endsWith('?'),
          summary: undefined, // TODO
          type: parts[1],
        })
      }
    }

    for (const property of properties) {
      content.push(`#### \`${property.name}\``)

      const listContent = [`- **Type:** \`${property.type}\``]
      if (property.default)
        listContent.push(`- **Default:** \`${property.default}\``)
      if (!property.default && property.optional)
        listContent.push('- **Optional**')
      content.push(listContent.join('\n'))

      if (property.summary) content.push(property.summary)
    }

    parameterIndex += 1
  }

  return content.join('\n\n')
}

function renderReturnType(options: {
  comment: NonNullable<Data['comment']>['returns'] | undefined
  returnType: NonNullable<Data['returnType']>
}) {
  const { comment, returnType } = options

  const content = ['## Return Type']
  if (comment) content.push(comment)
  content.push(`\`${returnType.type}\``)

  return content.join('\n\n')
}

function renderErrors(options: {
  item: Data
  errorIds: string[]
  lookup: Record<string, Data>
}) {
  const { errorIds, item, lookup } = options

  const errorTypeId = `${item.canonicalReference.split(':')[0]}.ErrorType:type`
  const parseErrorId = `${item.canonicalReference.split(':')[0]}.parseError:function(1)`
  const errorTypeItem = lookup[errorTypeId]
  const parseErrorItem = lookup[parseErrorId]

  if (!(errorTypeItem && parseErrorItem)) return ''

  const content = ['## Error Type']

  const typeRegex = /^ox!(?<type>.+):type/
  const errorType =
    errorTypeItem.canonicalReference.match(typeRegex)?.groups?.type
  if (errorType) content.push(`\`${errorType}\``)

  if (errorIds.length) {
    const errorsContent = []
    for (const error of errorIds) {
      const errorItem = lookup[error]
      if (!errorItem) continue
      errorsContent.push(
        `- [\`${errorItem.displayName}\`](/api/${errorItem.module}/errors#${errorItem.displayName.toLowerCase()})`,
      )
    }
    content.push(errorsContent.join('\n'))
  }

  return content.join('\n\n')
}

function resolveInlineParameterTypeForOverloads(options: {
  index: number
  lookup: Record<string, Data>
  overloads: string[] | undefined
  parameter: NonNullable<Data['parameters']>[number]
}) {
  const { index, lookup, overloads, parameter } = options

  const inlineParameterType =
    parameter.type.startsWith('{') && parameter.type.endsWith('}')
  if (overloads && inlineParameterType) {
    const overload = overloads.find(
      (x) => lookup[x]?.parameters?.[index]?.type !== parameter.type,
    )
    if (overload)
      return (
        lookup[overload]?.parameters?.[index]?.type.replace(
          /(<.*>)$/, // remove type params
          '',
        ) ?? parameter.type
      )
  }
  return parameter.type
}

function resolveReturnTypeForOverloads(options: {
  lookup: Record<string, Data>
  overloads: string[] | undefined
  returnType: Data['returnType']
}) {
  const { lookup, overloads, returnType } = options

  if (overloads && returnType) {
    const overload = overloads.find(
      (x) => lookup[x]?.returnType?.type !== returnType.type,
    )
    if (overload)
      return (
        lookup[overload]?.returnType?.type.replace(
          /(<.*>)$/, // remove type params
          '',
        ) ?? returnType.type
      )
  }
  return returnType?.type
}

function resolveErrorData(options: {
  id: string
  lookup: Record<string, Data>
}) {
  const { id, lookup } = options

  const errorData = lookup[id]
  if (!errorData) return new Set([])
  if (errorData.references.length === 0) return new Set([errorData.id])

  const errors = new Set<string>()
  for (const reference of errorData.references) {
    const nextErrorData =
      lookup[`ox!${reference.text}:type`] ??
      (reference.canonicalReference
        ? lookup[reference.canonicalReference?.toString()]
        : null)
    if (!nextErrorData) continue

    if (
      nextErrorData.references.length &&
      nextErrorData.kind !== model.ApiItemKind.Class
    ) {
      const resolved = resolveErrorData({
        id: nextErrorData.id,
        lookup,
      })
      for (const resolvedError of resolved) errors.add(resolvedError)
    } else errors.add(nextErrorData.id)
  }

  return errors
}
