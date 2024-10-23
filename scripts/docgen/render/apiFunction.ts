import * as model from '@microsoft/api-extractor-model'

import type { Data } from '../utils/model.js'

export function renderApiFunction(options: {
  data: Data
  dataLookup: Record<string, Data>
  overloads: string[]
}) {
  const { data, dataLookup, overloads } = options
  const { comment, displayName, module } = data
  if (!module) throw new Error('Module not found')

  const content = [`# ${module}.${displayName}`]
  if (comment?.summary) content.push(comment.summary)

  content.push(renderImports({ module }))

  if (comment?.examples)
    content.push(renderExamples({ examples: comment.examples }))

  content.push(renderSignature({ data, dataLookup, overloads }))

  if (data.parameters?.length)
    content.push(
      renderParameters({
        data,
        dataLookup,
        parameters: data.parameters,
        overloads,
      }),
    )

  if (data.returnType)
    content.push(
      renderReturnType({
        comment: comment?.returns,
        returnType: data.returnType,
      }),
    )

  const errorIds = resolveErrorData({
    dataLookup,
    id: `ox!${module}.${displayName}.ErrorType:type`,
  })
  if (errorIds.size)
    content.push(
      renderErrors({
        data,
        dataLookup,
        errorIds: Array.from(errorIds).sort((a, b) => (a > b ? 1 : -1)),
      }),
    )

  return content.join('\n\n').trim()
}

function renderImports(options: {
  module: string
}) {
  const { module } = options
  const content = [
    '## Imports',
    [
      '```ts twoslash',
      '// @noErrors',
      `import { ${module} } from 'ox'`,
      `import * as ${module} from 'ox/${module}'`,
      '```',
    ].join('\n'),
  ]
  return content.join('\n\n')
}

function renderExamples(options: { examples: readonly string[] }) {
  const { examples } = options
  const content = ['## Examples']
  for (const example of examples) {
    content.push(example)
  }
  return content.join('\n\n')
}

function renderSignature(options: {
  data: Data
  dataLookup: Record<string, Data>
  overloads: string[]
}) {
  const { data, dataLookup, overloads } = options
  const { displayName, parameters = [], returnType, typeParameters = [] } = data

  const content = ['## Definition']

  let paramSignature = parameters
    .map((x, i) => {
      let name = x.name
      if (x.optional) name += '?'
      const type = resolveInlineParameterTypeForOverloads({
        dataLookup,
        index: i,
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
    dataLookup,
    overloads,
    returnType,
  })
  const signature = `function ${
    displayName
  }${genericSignature}(${paramSignature}): ${returnTypeSignature}`

  content.push(`\`\`\`ts\n${signature}\n\`\`\``)
  content.push(
    `Source: [${data.file.path}](${data.file.url}${data.file.lineNumber ? `#L${data.file.lineNumber}` : ''})`,
  )
  return content.join('\n\n')
}

function renderParameters(options: {
  data: Data
  dataLookup: Record<string, Data>
  overloads: string[]
  parameters: NonNullable<Data['parameters']>
}) {
  const { dataLookup, overloads, parameters } = options

  const content = ['## Parameters']

  let parameterIndex = 0
  for (const parameter of parameters) {
    content.push(`### \`${parameter.name}\``)

    // Swap out the inline type for the namespace type for overloads
    // e.g. `{ foo: string; bar: bigint }` -> `Foo.bar.Options`
    const type = resolveInlineParameterTypeForOverloads({
      index: parameterIndex,
      dataLookup,
      overloads,
      parameter,
    })
    parameterIndex += 1

    const listContent = [`- **Type:** \`${type}\``]
    if (parameter.optional) listContent.push('- **Optional**')
    content.push(listContent.join('\n'))

    if (parameter.comment) content.push(parameter.comment)

    const interfaceData = dataLookup[`ox!${parameter.type}:interface`]
    const inlineParameterType =
      parameter.type.startsWith('{') && parameter.type.endsWith('}')
    const properties = []
    if (interfaceData) {
      for (const child of interfaceData.children) {
        const childItem = dataLookup[child]
        if (!childItem) continue
        properties.push({
          ...childItem,
          ...childItem.comment,
          name: childItem.displayName,
        })
      }
    } else if (inlineParameterType) {
      for (const value of parameter.type
        .slice(1, -1)
        .split(';')
        .map((x) => x.trim())) {
        if (!value) continue

        const parts = value.split(': ')
        // https://github.com/apollographql/apollo-client/blob/main/docs/shared/ApiDoc/ParameterTable.js#L9
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
  data: Data
  dataLookup: Record<string, Data>
  errorIds: string[]
}) {
  const { errorIds, data, dataLookup } = options

  const namespaceMemberId = data.canonicalReference.split(':')[0]
  const errorTypeData = dataLookup[`${namespaceMemberId}.ErrorType:type`]
  const parseErrorData =
    dataLookup[`${namespaceMemberId}.parseError:function(1)`]

  if (!(errorTypeData && parseErrorData)) return ''

  const content = ['## Error Type']

  const typeRegex = /^ox!(?<type>.+):type/
  const errorType =
    errorTypeData.canonicalReference.match(typeRegex)?.groups?.type
  if (errorType) content.push(`\`${errorType}\``)

  if (errorIds.length) {
    const errorsContent = []
    for (const errorId of errorIds) {
      const errorData = dataLookup[errorId]
      if (!errorData) continue
      errorsContent.push(
        `- [\`${errorData.displayName.replace('_', '.')}\`](/api/glossary/Errors#${errorData.displayName.toLowerCase().replace('_', '')})`,
      )
    }
    content.push(errorsContent.join('\n'))
  }

  return content.join('\n\n')
}

function resolveInlineParameterTypeForOverloads(options: {
  dataLookup: Record<string, Data>
  index: number
  overloads: string[]
  parameter: NonNullable<Data['parameters']>[number]
}) {
  const { dataLookup, index, overloads, parameter } = options

  const inlineParameterType =
    parameter.type.startsWith('{') && parameter.type.endsWith('}')
  if (overloads.length && inlineParameterType) {
    const overload = overloads.find(
      (x) => dataLookup[x]?.parameters?.[index]?.type !== parameter.type,
    )
    if (overload)
      return (
        dataLookup[overload]?.parameters?.[index]?.type.replace(
          /(<.*>)$/, // remove type params
          '',
        ) ?? parameter.type
      )
  }
  return parameter.type
}

function resolveReturnTypeForOverloads(options: {
  dataLookup: Record<string, Data>
  overloads: string[]
  returnType: Data['returnType']
}) {
  const { dataLookup, overloads, returnType } = options

  if (overloads.length && returnType) {
    const overload = overloads.find(
      (x) => dataLookup[x]?.returnType?.type !== returnType.type,
    )
    if (overload)
      return (
        dataLookup[overload]?.returnType?.type.replace(
          /(<.*>)$/, // remove type params from type
          '',
        ) ?? returnType.type
      )
  }
  return returnType?.type
}

function resolveErrorData(options: {
  dataLookup: Record<string, Data>
  id: string
}) {
  const { id, dataLookup } = options

  const errorData = dataLookup[id]
  if (!errorData) return new Set([])
  if (errorData.references.length === 0) return new Set([errorData.id])

  const errors = new Set<string>()
  for (const reference of errorData.references) {
    const nextErrorData =
      dataLookup[`ox!${reference.text}:type`] ??
      (reference.canonicalReference
        ? dataLookup[reference.canonicalReference?.toString()]
        : null)
    if (!nextErrorData) continue

    if (
      nextErrorData.references.length &&
      nextErrorData.kind !== model.ApiItemKind.Class
    ) {
      const resolved = resolveErrorData({
        id: nextErrorData.id,
        dataLookup,
      })
      for (const resolvedError of resolved) errors.add(resolvedError)
    } else errors.add(nextErrorData.id)
  }

  return errors
}
