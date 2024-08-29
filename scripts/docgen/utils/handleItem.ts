import { readFileSync } from 'node:fs'
import * as model from '@microsoft/api-extractor-model'
import { moduleRegex } from './regex.js'
import { processDocComment, renderDocNode } from './tsdoc.js'

export type Data = Pick<model.ApiItem, 'displayName' | 'kind'> &
  ExtraData & {
    canonicalReference: string
    children: readonly string[]
    childrenIncompleteDetails?: string | undefined
    childrenIncomplete?: boolean | undefined
    comment?:
      | {
          alias: string
          comment: string
          summary: string
          deprecated: string
          default: string
          remarks: string
          returns: string
          since: string
          docGroup: string
          examples: readonly string[]
          alpha: boolean
          beta: boolean
          experimental: boolean
        }
      | undefined
    excerpt: string
    file: {
      lineNumber: number | undefined
      path: string | undefined
      url: string | undefined
    }
    id: string
    module: string | undefined
    parent: string | null
    references: readonly {
      canonicalReference: string | undefined
      text: string
    }[]
    releaseTag: string
  }

export function handleItem(item: model.ApiItem, lookup: Record<string, Data>) {
  for (const child of item.members) handleItem(child, lookup)

  const id = getId(item)
  if (
    item instanceof model.ApiInterface ||
    item instanceof model.ApiPropertySignature ||
    item instanceof model.ApiFunction ||
    item instanceof model.ApiClass ||
    item instanceof model.ApiMethod ||
    item instanceof model.ApiProperty ||
    item instanceof model.ApiConstructor ||
    item instanceof model.ApiMethodSignature ||
    item instanceof model.ApiTypeAlias ||
    item instanceof model.ApiEnum ||
    item instanceof model.ApiEnumMember ||
    item instanceof model.ApiVariable ||
    item instanceof model.ApiNamespace
  ) {
    const parent = item.parent ? getId(item.parent) : null
    const module = parent?.match(moduleRegex)?.groups?.module

    const sourceFilePath =
      item.fileUrlPath ??
      item.sourceLocation.fileUrl?.replace(
        'https://github.com/wevm/ox/blob/main/',
        '',
      )

    const data = {
      id,
      ...extractChildren(item),
      canonicalReference: item.canonicalReference.toString(),
      comment: processDocComment(item.tsdocComment),
      displayName: item.displayName,
      excerpt: item.excerpt.text,
      file: {
        lineNumber: processLocation(sourceFilePath, module, item),
        path: sourceFilePath,
        url: item.sourceLocation.fileUrl,
      },
      kind: item.kind,
      module,
      parent,
      references: item.excerpt.tokens
        .filter(
          (token, index) =>
            token.kind === 'Reference' &&
            token.canonicalReference &&
            // prevent duplicates
            item.excerpt.tokens.findIndex(
              (other) => other.canonicalReference === token.canonicalReference,
            ) === index,
        )
        .map((token) => ({
          canonicalReference: token.canonicalReference?.toString(),
          text: formatType(token.text),
        })),
      releaseTag: model.ReleaseTag[item.releaseTag],
      ...extraData(item),
    } satisfies Data
    lookup[id] = data
  }
}

function processLocation(
  sourceFilePath: string | undefined,
  module: string | undefined,
  item: model.ApiItem,
) {
  if (!sourceFilePath) return

  const content = readFileSync(sourceFilePath, 'utf-8')
  if (item.kind === model.ApiItemKind.Function) {
    const functionName = module
      ? `${module}_${item.displayName}`
      : item.displayName
    let lineNumber = 0
    for (const line of content.split('\n')) {
      lineNumber++
      if (!line.includes(functionName)) continue
      break
    }
    return lineNumber
  }

  return
}

function getId(item: model.ApiItem) {
  return item.canonicalReference.toString()
}

function extractChildren(item: model.ApiItem) {
  if (model.ApiItemContainerMixin.isBaseClassOf(item)) {
    const extracted = item.findMembersWithInheritance()
    if (extracted.maybeIncompleteResult) {
      return {
        children: Array.from(
          new Set(
            extracted.items.map(getId).concat(item.members.map(getId)),
          ).values(),
        ),
        childrenIncomplete: true,
        childrenIncompleteDetails: extracted.messages
          .map((m) => m.text)
          .join('\n'),
      }
    }

    return {
      children: extracted.items.map(getId),
      childrenIncomplete: false,
    }
  }

  return { children: item.members.map(getId) }
}

type ExtraData = {
  abstract?: boolean
  optional?: boolean
  implements?: readonly string[]
  parameters?: readonly {
    comment: string
    name: string
    optional: boolean
    primaryCanonicalReference?: string | undefined
    primaryGenericArguments?: any | undefined
    type: string
  }[]
  protected?: boolean
  readonly?: boolean
  returnType?: {
    type: string
    primaryCanonicalReference?: string | undefined
    primaryGenericArguments?: any | undefined
  }
  static?: boolean
  type?: string
  typeParameters?: readonly {
    comment: string
    constraint: string
    defaultType: string
    name: string
    optional: boolean
  }[]
}

function formatType(type: string) {
  return type.replaceAll('_', '.')
}

function extraData(item: model.ApiItem) {
  const ret: ExtraData = {}
  if (model.ApiParameterListMixin.isBaseClassOf(item)) {
    ret.parameters = item.parameters.map((p) => ({
      ...extractPrimaryReference(formatType(p.parameterTypeExcerpt.text), item),
      name: p.name,
      optional: p.isOptional,
      comment: renderDocNode(p.tsdocParamBlock?.content.nodes),
    }))
  }

  if (model.ApiTypeParameterListMixin.isBaseClassOf(item)) {
    ret.typeParameters = item.typeParameters.map((p) => ({
      name: p.name,
      optional: p.isOptional,
      defaultType: p.defaultTypeExcerpt.text,
      constraint: p.constraintExcerpt.text,
      comment: renderDocNode(p.tsdocTypeParamBlock?.content.nodes),
    }))
  }

  if (model.ApiReadonlyMixin.isBaseClassOf(item)) ret.readonly = item.isReadonly
  if (model.ApiOptionalMixin.isBaseClassOf(item)) ret.optional = item.isOptional
  if (model.ApiAbstractMixin.isBaseClassOf(item)) ret.abstract = item.isAbstract
  if (model.ApiStaticMixin.isBaseClassOf(item)) ret.static = item.isStatic
  if (model.ApiProtectedMixin.isBaseClassOf(item))
    ret.protected = item.isProtected
  if (model.ApiReturnTypeMixin.isBaseClassOf(item))
    ret.returnType = extractPrimaryReference(item.returnTypeExcerpt.text, item)

  return Object.assign(
    ret,
    item instanceof model.ApiTypeAlias
      ? {
          type: formatType(item.typeExcerpt.text),
        }
      : item instanceof model.ApiPropertyItem
        ? {
            type: formatType(item.propertyTypeExcerpt.text),
          }
        : item instanceof model.ApiClass
          ? {
              implements: item.implementsTypes.map((p) => p.excerpt.text),
            }
          : {},
  )
}

function extractPrimaryReference(type: string, item: model.ApiItem) {
  if (!(item instanceof model.ApiDeclaredItem))
    return { type: formatType(type) }

  const ast = parseAst(type)
  if (!ast) return { type: formatType(type) }

  const primaryReference = skipToPrimaryType(ast)
  const referencedTypeName = primaryReference?.name?.value
  const referencedType = item.excerptTokens?.find(
    (r) => r.text === referencedTypeName,
  )

  return {
    type: formatType(type),
    primaryCanonicalReference: referencedType?.canonicalReference?.toString(),
    primaryGenericArguments: primaryReference?.generics?.map(
      (g: { unparsed: boolean }) => g.unparsed,
    ),
  }
}

type AstNode = {
  type: string
  start: number
  end: number
  [other: string]: any
}

function getRegexParser(
  regex: RegExp,
  type: string,
  valueFromMatch = (match: RegExpMatchArray) => match[0],
) {
  return function regexParser(
    code: string,
    index_: number,
  ): AstNode | null | undefined {
    let index = index_
    while (code[index] === ' ') index++
    const match = code.slice(index).match(regex)
    return (
      match && {
        type,
        value: valueFromMatch(match),
        start: index,
        end: index + match[0].length,
      }
    )
  }
}

function lookahead(code: string, index_: number, left: AstNode): AstNode {
  let index = index_
  while (code[index] === ' ') index++
  let node = left as AstNode
  let found: number | undefined

  if (code[index] === '[' && code[index + 1] === ']') {
    node = {
      type: 'TypeExpression',
      name: 'Array',
      generics: [left],
      start: index,
      end: index + 2,
    }
  } else if (code[index] === '|') {
    const right = parseExpression(code, index + 1)
    node = {
      type: 'Union',
      left,
      right,
      start: left.start,
      end: right.end,
    }
  } else if (code[index] === '&') {
    const right = parseExpression(code, index + 1)
    node = {
      type: 'Intersection',
      left,
      right,
      start: left.start,
      end: right.end,
    }
  } else if ((found = peekFixedString(code, index, 'extends'))) {
    const constraint = parseExpression(code, found)
    const question = constraint && peekFixedString(code, constraint.end, '?')
    const trueCase = question && parseExpression(code, question)
    const colon = trueCase && peekFixedString(code, trueCase.end, ':')
    const falseCase = colon && parseExpression(code, colon)

    if (falseCase) {
      node = {
        type: 'Conditional',
        expression: left,
        extends: constraint,
        trueCase,
        falseCase,
        start: left.start,
        end: falseCase.end,
      }
    }
  }

  if (node !== left) return lookahead(code, node.end, node)
  return node
}

function parseExpression(code: string, index_: number): AstNode {
  let index = index_
  while (code[index] === ' ') index++
  let node =
    parseArrowFunction(code, index) ||
    parseParenthesis(code, index) ||
    parseInterfaceDefinition(code, index) ||
    getRegexParser(
      /^(true|false|void|undefined|object|string|number|boolean)/,
      'Keyword',
    )(code, index) ||
    parsePropertyAccess(code, index) ||
    parseTypeExpression(code, index) ||
    getRegexParser(/^\d+(\.\d+)?/, 'Number')(code, index) ||
    parseTemplateString(code, index) ||
    parseString(code, index) ||
    parseObject(code, index) ||
    parseTuple(code, index)

  if (!node)
    throw new Error(`could not parse expression at \`${code.slice(index)}\``)

  node = { unparsed: code.slice(node.start, node.end), ...node }

  node = lookahead(code, node.end, node)

  node = { unparsed: code.slice(node.start, node.end), ...node }
  return node
}

// TODO: Make sure this doesn't capture too much
function parseTemplateString(
  code: string,
  index: number,
): AstNode | null | undefined {
  const delim = code[index]
  if (delim === '`') {
    const skipped = skipBetweenDelimiters(code, index)
    return skipped && { type: 'String', start: index, end: skipped.end }
  }
  return
}

function parseString(code: string, index: number): AstNode | null | undefined {
  const delim = code[index]
  if (delim === '"' || delim === "'") {
    const skipped = skipBetweenDelimiters(code, index)
    return skipped && { type: 'String', start: index, end: skipped.end }
  }
  return
}

function parseObject(code: string, index: number): AstNode | null | undefined {
  if (code[index] === '{') {
    const skipped = skipBetweenDelimiters(code, index)
    return skipped && { type: 'Object', start: index, end: skipped.end }
  }
  return
}

function parseTuple(code: string, index: number): AstNode | null | undefined {
  if (code[index] === '[') {
    const skipped = skipBetweenDelimiters(code, index)
    return skipped && { type: 'Tuple', start: index, end: skipped.end }
  }
  return
}

function parseTypeExpression(
  code: string,
  index: number,
): AstNode | null | undefined {
  const identifier = getRegexParser(/^[a-zA-Z]\w*/, 'Identifier')(code, index)
  if (!identifier) return null
  if (code[identifier.end] !== '<')
    return {
      type: 'TypeExpression',
      name: identifier,
      start: index,
      end: identifier.end,
    }

  const generics = []
  for (let i = identifier.end; i < code.length; i++) {
    switch (code[i]) {
      case '<':
      case ',': {
        const generic = parseExpression(code, i + 1)
        generics.push(generic)
        i = generic.end - 1
        const extendsEnd = peekFixedString(code, i + 1, 'extends')
        if (extendsEnd) {
          const constraint = parseExpression(code, extendsEnd)
          i = constraint.end - 1
        }
        const defaultEnd = peekFixedString(code, i + 1, '=')
        if (defaultEnd) {
          const defaultType = parseExpression(code, defaultEnd)
          i = defaultType.end - 1
        }
        break
      }
      case '>':
        return {
          type: 'TypeExpression',
          name: identifier,
          generics,
          start: index,
          end: i + 1,
        }
      case ' ':
        break
      default:
        return null
    }
  }

  return
}

function parseArrowFunction(
  code: string,
  index: number,
): AstNode | null | undefined {
  const parameters =
    code[index] === '('
      ? skipBetweenDelimiters(code, index)
      : getRegexParser(/^[a-zA-Z]\w*/, 'Identifier')(code, index)
  const arrowEnd = parameters && peekFixedString(code, parameters.end, '=>')
  const returnValue = arrowEnd && parseExpression(code, arrowEnd)
  if (!returnValue) return

  return {
    type: 'ArrowFunction',
    parameters,
    returnType: returnValue,
    start: index,
    end: returnValue.end,
  }
}

function parseParenthesis(
  code: string,
  index: number,
): AstNode | null | undefined {
  if (code[index] === '(') {
    const expression = parseExpression(code, index + 1)
    const finalIndex = peekFixedString(code, expression.end, ')')
    if (finalIndex) return expression
  }
  return
}

function parsePropertyAccess(
  code: string,
  index: number,
): AstNode | null | undefined {
  const parent = getRegexParser(/^[a-zA-Z]\w*/, 'Identifier')(code, index)
  const dotAccessStart = parent && peekFixedString(code, parent.end, '.')
  if (dotAccessStart) {
    const property = getRegexParser(/^[a-zA-Z]\w*/, 'Identifier')(
      code,
      dotAccessStart,
    )
    return (
      property && {
        type: 'PropertyAccess',
        parent,
        property,
        start: index,
        end: property.end,
      }
    )
  }
  const propertyAccessStart = parent && peekFixedString(code, parent.end, '[')
  if (propertyAccessStart) {
    if (peekFixedString(code, propertyAccessStart, ']')) {
      // array expression not handled here
      return null
    }
    const property = parseExpression(code, propertyAccessStart)
    const propertyAccessEnd = peekFixedString(code, property.end, ']')
    if (!propertyAccessEnd) return

    return {
      type: 'PropertyAccess',
      parent,
      property,
      start: index,
      end: propertyAccessEnd,
    }
  }

  return
}

function parseInterfaceDefinition(
  code: string,
  index_: number,
): AstNode | null | undefined {
  let index = index_
  index = peekFixedString(code, index, 'export') || index
  const typeEnd = peekFixedString(code, index, 'interface')
  const signature = typeEnd && parseExpression(code, typeEnd)

  if (!signature) return
  return {
    type: 'InterfaceDeclaration',
    signature,
    start: index,
    end: signature.end,
  }
}

function skipBetweenDelimiters(
  code: string,
  index: number,
): AstNode | null | undefined {
  const validDelimiters = ['"', "'", '`', '{', '[', '(']
  const oppositeDelimiters = ['"', "'", '`', '}', ']', ')']

  const delim = code[index]!
  const idx = validDelimiters.indexOf(delim)
  if (idx === -1) return null
  const lookFor = oppositeDelimiters[idx]

  for (let i = index + 1; i < code.length; i++) {
    const char = code[i]!
    if (char === '\\') {
      i++
    } else if (char === lookFor) {
      return { type: 'Skipped', start: index, end: i + 1 }
    } else if (
      validDelimiters.includes(char) &&
      delim !== '"' &&
      delim !== "'" &&
      delim !== '`'
    ) {
      const child = skipBetweenDelimiters(code, i) as AstNode
      i = child.end - 1
    }
  }

  return
}

function peekFixedString(
  code: string,
  index_: number,
  string: string,
): number | undefined {
  if (string === '') throw new Error('string must not be empty')
  let index = index_
  while (code[index] === ' ') index++
  if (code.slice(index, index + string.length) === string)
    return index + string.length
  return
}

function parseAst(code: string) {
  try {
    return parseExpression(code, 0)
  } catch (e) {
    /**
     * This might leave single parts of the API documentation without the right "primary reference type",
     * but it won't make the docs unusable in any way, so we only log it and don't fail.
     */
    console.warn(
      'Encountered error while parsing expression %s. ',
      code,
      ':',
      e,
    )
    return null
  }
}

function skipToPrimaryType(ast: AstNode): AstNode | null {
  if (!ast) return null

  const skipToGeneric = {
    Omit: 0,
    Partial: 0,
    Promise: 0,
    NoInfer: 0,
    Array: 0,
    Observable: 0,
    Map: 1,
  }
  if (ast.type === 'TypeExpression' && ast.name.value in skipToGeneric)
    return skipToPrimaryType(
      ast.generics[skipToGeneric[ast.name.value as keyof typeof skipToGeneric]],
    )

  if (ast.type === 'Union' || ast.type === 'Intersection') {
    if (ast.left.type === 'Keyword') return skipToPrimaryType(ast.right)
    if (ast.right.type === 'Keyword') return skipToPrimaryType(ast.left)
    return null
  }
  if (ast.type === 'TypeDeclaration') return skipToPrimaryType(ast.expression)

  return ast.type === 'TypeExpression' ? ast : null
}
