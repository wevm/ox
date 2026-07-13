import * as model from '@microsoft/api-extractor-model'
import * as ts from 'ts-morph'

import { frontmatter, toMetaDescription } from '../utils/description.js'
import {
  createResolveDeclarationReference,
  type Data,
  getModulePath,
  type NamespaceDocComments,
} from '../utils/model.js'
import { processDocComment, tsdocParser } from '../utils/tsdoc.js'
import { project } from '../utils/tsmorph.js'

export function renderApiFunction(options: {
  apiItem: model.ApiItem
  data: Data
  dataLookup: Record<string, Data>
  docComments: NamespaceDocComments
  entrypoint: string
  overloads: string[]
}) {
  const { apiItem, data, dataLookup, docComments, entrypoint, overloads } =
    options
  const { comment, displayName, module } = data
  if (!module) throw new Error('Module not found')

  const description = toMetaDescription(
    comment?.description ?? comment?.summary,
    {
      fallback: `${module}.${displayName} function reference`,
    },
  )
  const content = [frontmatter({ description }), `# ${module}.${displayName}`]
  if (comment?.summary) content.push(comment.summary)

  content.push(renderImports({ entrypoint, module }))

  if (comment?.examples)
    content.push(renderExamples({ examples: comment.examples }))

  content.push(renderSignature({ data, dataLookup, overloads }))

  if (data.parameters?.length)
    content.push(
      renderParameters({
        apiItem,
        data,
        dataLookup,
        docComments,
        overloads,
        parameters: data.parameters,
      }),
    )

  if (data.returnType && !data.returnType.type.startsWith('asserts '))
    content.push(
      renderReturnType({
        comment: comment?.returns,
        dataLookup,
        docComments,
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
        docComments,
        errorIds: Array.from(errorIds).sort((a, b) => (a > b ? 1 : -1)),
      }),
    )

  return content.join('\n\n').trim()
}

function renderImports(options: { entrypoint: string; module: string }) {
  const { entrypoint, module } = options
  const content = [
    '## Imports',
    [
      ':::code-group',
      '```ts [Named]',
      `import { ${module} } from 'ox${entrypoint ? `/${entrypoint}` : ''}'`,
      '```',
      '```ts [Entrypoint]',
      `import * as ${module} from 'ox/${entrypoint ? `${entrypoint}/` : ''}${module}'`,
      '```',
      ':::',
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
    `**Source:** [${data.file.path}](${data.file.url}${data.file.lineNumber ? `#L${data.file.lineNumber}` : ''})`,
  )
  return content.join('\n\n')
}

function renderParameters(options: {
  apiItem: model.ApiItem
  data: Data
  dataLookup: Record<string, Data>
  docComments: NamespaceDocComments
  overloads: string[]
  parameters: NonNullable<Data['parameters']>
}) {
  const { apiItem, data, dataLookup, docComments, overloads, parameters } =
    options

  const parameterDeclarations = extractParameterDeclarations(data)

  const content = ['## Parameters']

  let parameterIndex = 0
  for (const parameter of parameters) {
    if (parameter.name.startsWith('_')) continue

    content.push(`### ${parameter.name}`)

    // Swap out the inline type for the namespace type for overloads
    // e.g. `{ foo: string; bar: bigint }` -> `Foo.bar.Options`
    const type = resolveInlineParameterTypeForOverloads({
      index: parameterIndex,
      dataLookup,
      overloads,
      parameter,
    })
    parameterIndex += 1

    const link = getTypeLink({ dataLookup, docComments, type: parameter })

    const c = `\`${type}\``
    const listContent = link
      ? [`- **Type:** [${c}](${link})`]
      : [`- **Type:** ${c}`]
    if (parameter.optional) listContent.push('- **Optional**')
    content.push(listContent.join('\n'))

    if (parameter.comment) content.push(parameter.comment)

    const node = extractParameterTypeNode(parameter, parameterDeclarations)
    if (node)
      content.push(renderProperties({ apiItem, docComments, node, parameter }))
  }

  return content.join('\n\n')
}

function renderProperties(options: {
  apiItem: model.ApiItem
  docComments: NamespaceDocComments
  node: ts.TypeNode
  parameter: NonNullable<Data['parameters']>[number]
}) {
  const { apiItem, docComments, node, parameter } = options

  const contentMap = new Map<string, string>()

  function render(node: ts.TypeNode) {
    const properties = node.getDescendantsOfKind(
      ts.SyntaxKind.PropertySignature,
    )
    for (const property of properties) {
      const propertyName = property.getName()
      const typeNode = property.getTypeNode()

      if (propertyName.startsWith('_')) continue

      let type = typeNode
        ?.getType()
        ?.getText(
          undefined,
          ts.TypeFormatFlags.UseAliasDefinedOutsideCurrentScope,
        )
      if (type === 'any') type = typeNode?.getText()
      if (type === 'undefined') continue

      const content = [`#### ${parameter.name}.${propertyName}`, '']

      const comment = property.getJsDocs().at(0)?.getDescription()
      const tsDoc = getTsDoc(comment, apiItem, docComments)

      if (type)
        content.push(
          `- **Type:** \`${type.replaceAll('`', '').replace(/(<.*>)/, '')}\``,
        )
      if (tsDoc?.default) content.push(`- **Default:** \`${tsDoc.default}\``)
      const questionToken = property.getQuestionTokenNode()
      if (questionToken) content.push('- **Optional**')

      if (typeof tsDoc?.summary === 'string') content.push(`\n${tsDoc.summary}`)

      contentMap.set(propertyName, content.join('\n'))
    }

    // Expand sibling type references
    const reference = node.getFirstDescendantByKind(ts.SyntaxKind.TypeReference)
    const isChild = reference
      ? properties.some((x) => x.getDescendants().includes(reference))
      : false
    if (isChild) return

    const references = [
      reference,
      ...(reference
        ?.getNextSiblings()
        .filter((x) => x.isKind(ts.SyntaxKind.TypeReference)) ?? []),
    ]

    const nodes = references
      .map((x) => {
        const typeName = x?.getTypeName()

        const identifier = typeName?.isKind(ts.SyntaxKind.QualifiedName)
          ? typeName.getRight()
          : typeName

        if (!identifier) return undefined
        if (!identifier.isKind(ts.SyntaxKind.Identifier)) return undefined
        return identifier
          .getDefinitionNodes()
          .find((x) => x.isKind(ts.SyntaxKind.TypeAliasDeclaration))
          ?.getTypeNode()
      })
      .filter(Boolean) as ts.TypeNode[]

    if (nodes.length) for (const node of nodes) render(node)
  }
  render(node)

  // sort properties alphabetically
  const contents = Array.from(contentMap.entries()).sort(([a], [b]) =>
    a > b ? 1 : -1,
  )

  return contents.map(([, content]) => content).join('\n\n')
}

function renderReturnType(options: {
  comment: NonNullable<Data['comment']>['returns'] | undefined
  dataLookup: Record<string, Data>
  docComments: NamespaceDocComments
  returnType: NonNullable<Data['returnType']>
}) {
  const { comment, dataLookup, docComments, returnType } = options

  const content = ['## Return Type']
  if (comment) content.push(comment)
  const link = getTypeLink({ dataLookup, docComments, type: returnType })
  const type = expandInlineType({ dataLookup, type: returnType })
  const c = `\`${type}\``
  content.push(link ? `[${c}](${link})` : c)

  return content.join('\n\n')
}

function renderErrors(options: {
  data: Data
  dataLookup: Record<string, Data>
  docComments: NamespaceDocComments
  errorIds: string[]
}) {
  const { docComments, errorIds, data, dataLookup } = options

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
      if (!errorData.module) continue
      const name = errorData.module + '.' + errorData.displayName
      const modulePath = getModulePath(errorData.module, docComments)
      errorsContent.push(
        `- [\`${name}\`](${modulePath}/${errorData.module}/errors#${name.toLowerCase().replace('.', '')})`,
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

  return expandInlineType({ dataLookup, type: parameter })
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

function extractParameterDeclarations(data: Data) {
  const functionNameMatch = data.excerpt.match(/function (.*?)(\(|<)/)
  const functionName = functionNameMatch?.[1]
  const file = project.addSourceFileAtPath(data.file.path!)
  const declaration = file
    .getDescendantsOfKind(ts.SyntaxKind.FunctionDeclaration)
    .find((x) => x.getName() === functionName)
  const declarations = declaration?.getParameters()
  return declarations ?? []
}

function extractParameterTypeNode(
  parameter: NonNullable<Data['parameters']>[number],
  parameterDeclarations: ts.ParameterDeclaration[],
) {
  const declaration = parameterDeclarations.find(
    (x) => x.getName() === parameter.name,
  )
  const reference = declaration
    ?.getDescendantsOfKind(ts.SyntaxKind.TypeReference)
    .at(0)
  const typeAliasDeclaration = reference
    ?.getTypeName()
    .getSymbol()
    ?.getDeclarations()
    .at(0)
  if (!typeAliasDeclaration?.isKind(ts.SyntaxKind.TypeAliasDeclaration)) return
  return typeAliasDeclaration.getTypeNode()
}

function getTsDoc(
  comment: string | undefined,
  apiItem: model.ApiItem,
  docComments: NamespaceDocComments,
) {
  if (!comment) return
  const context = tsdocParser.parseString(`/**${comment}*/`)
  return processDocComment(
    context.docComment,
    createResolveDeclarationReference(apiItem, docComments),
  )
}

function getTypeLink(options: {
  dataLookup: Record<string, Data>
  docComments: NamespaceDocComments
  type: Pick<
    NonNullable<Data['returnType']>,
    'primaryCanonicalReference' | 'primaryGenericArguments' | 'type'
  >
}) {
  const { dataLookup, docComments, type } = options

  const data = (() => {
    // TODO: fix `type` link resolution.
    // if (dataLookup[`ox!${type.type}:type`])
    //   return dataLookup[`ox!${type.type}:type`]
    if (type.primaryCanonicalReference && !type.primaryGenericArguments)
      return (
        dataLookup[type.primaryCanonicalReference] ??
        dataLookup[type.primaryCanonicalReference.replace('_2', '')]
      )
    return
  })()
  if (!data?.module) return

  const basePath = getModulePath(data.module, docComments)
  const displayNameWithNamespace = `${data.module}.${data.displayName}`
  return `${basePath}/${data.module}/types#${displayNameWithNamespace.toLowerCase().replace('.', '')}`
}

function expandInlineType(options: {
  dataLookup: Record<string, Data>
  type: Pick<
    NonNullable<Data['returnType']>,
    'primaryCanonicalReference' | 'primaryGenericArguments' | 'type'
  >
}) {
  const { dataLookup, type } = options
  // expand inline type to include namespace (e.g. `Address` => `Address.Address`)
  const expandRegex = /^ox!(?<type>.+)(_2):type/
  if (
    type.primaryCanonicalReference &&
    expandRegex.test(type.primaryCanonicalReference) &&
    !type.primaryGenericArguments
  ) {
    const groups =
      type.primaryCanonicalReference.match(expandRegex)?.groups ?? {}
    if (groups.type) return groups.type.replace(/~(.*)_\d/, '$1')
  } else if (dataLookup[`ox!${type.type}:type`]) return type.type
  return type.type
}
