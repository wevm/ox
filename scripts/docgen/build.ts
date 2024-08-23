import * as model from '@microsoft/api-extractor-model'
import * as tsdoc from '@microsoft/tsdoc'
import fs from 'fs-extra'

// TODO
// - generate index page for each module
// - parse inline {@link} tags and link to pages
// - add range to github source links
// - error type linking
// - glossary pages for: constants, errors, and types
// - filter examples based on module (e.g. `isBytesEqual` @example for `Bytes` module should not show up on `Hex` module)
// - display multiple aliases when applicable on pages
// - Validate aliases
// - Update Vocs to throw if twoslash block has errors
// - Add generated md files to gitignore

// biome-ignore lint/suspicious/noConsoleLog:
console.log('Generating API doc.')

/// Load API Model
const fileName = './site/docgen/ox.api.json'
const pkg = new model.ApiModel().loadPackage(fileName)

/// Construct lookup with updated data
const lookup: Record<string, Data> = {}
handleItem(pkg)

/// Construct vocs sidebar
const entrypointItem = pkg.members.find(
  (x) =>
    x.kind === model.ApiItemKind.EntryPoint &&
    x.canonicalReference.toString() === 'ox!',
)
if (!entrypointItem) throw new Error('Could not find entrypoint item')

const moduleRegex = /^ox!(?<module>[A-Za-z0-9]+):namespace$/
const namespaceItems = entrypointItem.members.filter(
  (x) =>
    x.kind === model.ApiItemKind.Namespace &&
    moduleRegex.test(x.canonicalReference.toString()) &&
    !['Caches', 'Constants', 'Errors', 'Internal', 'Types'].includes(
      x.displayName,
    ),
)
const sidebar = []
for (const item of namespaceItems) {
  const baseLink = `/gen/${item.displayName}`

  const items = []
  for (const member of item.members) {
    if (member.kind !== model.ApiItemKind.Function) continue
    const lookupItem = lookup[member.canonicalReference.toString()]
    if (!lookupItem)
      throw new Error(
        `Could not find lookup item for ${member.canonicalReference.toString()}`,
      )
    // filter out aliases from appearing in sidebar (e.g. `Hex.toHex` should not appear since `Hex.from` does)
    if (
      lookupItem.comment?.aliases?.length &&
      lookupItem.comment.aliases.includes(member.canonicalReference.toString())
    )
      continue

    items.push({
      text: `.${member.displayName}`,
      link: `${baseLink}/${member.displayName}`,
      id: lookupItem.id,
    })
  }

  const sidebarItem = {
    text: item.displayName,
    collapsed: true,
    link: baseLink,
    items,
  }
  sidebar.push(sidebarItem)
}
const content = `
export const sidebar = ${JSON.stringify(sidebar, null, 2)}
`
fs.writeFileSync('./site/docgen/sidebar.ts', content)

/// Build markdown files
const pagesDir = './site/pages/gen'
const ids = sidebar.flatMap((x) => x.items).map((x) => x.id)
for (const id of ids) {
  const item = lookup[id]
  if (!item) throw new Error(`Could not find item with id ${id}`)

  const content = (() => {
    switch (item.kind) {
      case model.ApiItemKind.Function:
        return renderApiFunction(item)
      default:
        throw new Error(`Unsupported item kind: ${item.kind}`)
    }
  })()

  const module = item.parent?.match(moduleRegex)?.groups?.module
  const dir = `${pagesDir}/${module ? `${module}/` : ''}`
  fs.ensureDirSync(dir)
  fs.writeFileSync(`${dir}${item.displayName}.md`, content)
}

// biome-ignore lint/suspicious/noConsoleLog:
console.log('Done.')

/////////////////////////////////////////////////////////////
/// Utils
/////////////////////////////////////////////////////////////

function renderApiFunction(item: Data) {
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

type Data = Pick<model.ApiItem, 'displayName' | 'kind'> &
  ExtraData & {
    canonicalReference: string
    children: readonly string[]
    childrenIncompleteDetails?: string | undefined
    childrenIncomplete?: boolean | undefined
    comment?:
      | {
          alias: string
          aliases: readonly string[]
          comment: string
          summary: string
          deprecated: string
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
    file: string | undefined
    id: string
    parent: string | null
    references: readonly {
      canonicalReference: string | undefined
      text: string
    }[]
    releaseTag: string
  }

function handleItem(item: model.ApiItem) {
  for (const child of item.members) {
    handleItem(child)
  }

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
    item instanceof model.ApiEnumMember
  ) {
    const data = {
      id,
      ...extractChildren(item),
      canonicalReference: item.canonicalReference.toString(),
      comment: processDocComment(item.tsdocComment),
      displayName: item.displayName,
      excerpt: item.excerpt.text,
      file: item.sourceLocation.fileUrl || item.fileUrlPath,
      kind: item.kind,
      parent: item.parent ? getId(item.parent) : null,
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
          text: token.text,
        })),
      releaseTag: model.ReleaseTag[item.releaseTag],
      ...extraData(item),
    } satisfies Data
    lookup[id] = data
  }
}

function getId(item: model.ApiItem) {
  return item.canonicalReference.toString()
}

function processDocComment(docComment?: tsdoc.DocComment | undefined) {
  if (!docComment) return

  return {
    alias: cleanDoc(
      renderDocNode(
        docComment.customBlocks.find((v) => v.blockTag.tagName === '@alias'),
      ),
      '@alias',
    ),
    aliases: docComment?.customBlocks
      .filter((v) => v.blockTag.tagName === '@alias')
      .map(renderDocNode)
      .map((example) => cleanDoc(example, '@alias')),
    comment: docComment?.emitAsTsdoc(),
    summary: cleanDoc(renderDocNode(docComment?.summarySection)),
    deprecated: cleanDoc(
      renderDocNode(docComment?.deprecatedBlock),
      '@deprecated',
    ),
    remarks: cleanDoc(renderDocNode(docComment?.remarksBlock), '@remarks'),
    returns: cleanDoc(renderDocNode(docComment?.returnsBlock), '@returns'),
    since: cleanDoc(
      renderDocNode(
        docComment.customBlocks.find((v) => v.blockTag.tagName === '@since'),
      ),
      '@since',
    ),
    docGroup: cleanDoc(
      renderDocNode(
        docComment.customBlocks.find((v) => v.blockTag.tagName === '@docGroup'),
      ),
      '@docGroup',
    ),
    examples: docComment?.customBlocks
      .filter((v) => v.blockTag.tagName === '@example')
      .map(renderDocNode)
      .map((example) => cleanDoc(example, '@example')),
    alpha: docComment.modifierTagSet.isAlpha(),
    beta: docComment.modifierTagSet.isBeta(),
    experimental: docComment.modifierTagSet.isExperimental(),
  }
}

function cleanDoc(docString: string, removeTag?: undefined | string) {
  if (removeTag)
    return docString.replace(new RegExp(`^\\s*${removeTag}`, 'g'), '').trim()
  return docString.trim()
}

function renderDocNode(
  node?: tsdoc.DocNode | ReadonlyArray<tsdoc.DocNode> | undefined,
): string {
  if (!node) return ''
  if (Array.isArray(node))
    return node.map((node) => renderDocNode(node)).join('')

  const docNode = node as tsdoc.DocNode

  let result = ''
  if (docNode) {
    if (docNode instanceof tsdoc.DocFencedCode) {
      let code = docNode.code.toString()
      let meta = ''
      code = code.replace(
        /^\s*\/\/\s*codeblock-meta(\s.*?)$\n?/gm,
        (_line, metaMatch) => {
          meta += metaMatch
          return ''
        },
      )
      return `\`\`\`${docNode.language}${meta}\n${code}\`\`\``
    }
    if (docNode instanceof tsdoc.DocExcerpt)
      result += docNode.content.toString()

    for (const childNode of docNode.getChildNodes())
      result += renderDocNode(childNode)
  }
  return result
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

function extraData(item: model.ApiItem) {
  const ret: ExtraData = {}
  if (model.ApiParameterListMixin.isBaseClassOf(item)) {
    ret.parameters = item.parameters.map((p) => ({
      ...extractPrimaryReference(p.parameterTypeExcerpt.text, item),
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
          type: item.typeExcerpt.text,
        }
      : item instanceof model.ApiPropertyItem
        ? {
            type: item.propertyTypeExcerpt.text,
          }
        : item instanceof model.ApiClass
          ? {
              implements: item.implementsTypes.map((p) => p.excerpt.text),
            }
          : {},
  )
}

function extractPrimaryReference(type: string, item: model.ApiItem) {
  if (!(item instanceof model.ApiDeclaredItem)) return { type }

  const ast = parseAst(type)
  if (!ast) return { type }

  const primaryReference = skipToPrimaryType(ast)
  const referencedTypeName = primaryReference?.name?.value
  const referencedType = item.excerptTokens?.find(
    (r) => r.text === referencedTypeName,
  )

  return {
    type,
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
