import * as model from '@microsoft/api-extractor-model'
import * as tsdoc from '@microsoft/tsdoc'
import { Project, ScriptTarget, SyntaxKind } from 'ts-morph'

export function extractNamespaceDocComments(file: string) {
  const project = new Project({
    compilerOptions: {
      target: ScriptTarget.ESNext,
    },
  })
  const entrypointAst = project.addSourceFileAtPath(file)

  const tsdocParser: tsdoc.TSDocParser = new tsdoc.TSDocParser()

  const nodes = entrypointAst.getDescendantsOfKind(SyntaxKind.ExportDeclaration)

  const docComments: Record<string, ReturnType<typeof processDocComment>> = {}
  for (const node of nodes) {
    const namespace = node
      .getDescendantsOfKind(SyntaxKind.NamespaceExport)[0]
      ?.getDescendantsOfKind(SyntaxKind.Identifier)[0]
      ?.getText()
    if (!namespace) continue

    const tsDoc = node.getDescendantsOfKind(SyntaxKind.JSDoc)[0]?.getText()
    if (!tsDoc) continue

    const parserContext: tsdoc.ParserContext = tsdocParser.parseString(tsDoc)
    const docComment = processDocComment(parserContext.docComment)
    if (!docComment) continue

    docComments[namespace] = docComment
  }
  return docComments
}

function getLinkForApiItem(item: model.ApiItem) {
  const parent = item.parent
  if (!parent) throw new Error('Parent not found')

  const baseLink = `/api/${parent.displayName}`
  if (item.kind === model.ApiItemKind.Function)
    return `${baseLink}/${item.displayName}`
  if (item.kind === model.ApiItemKind.TypeAlias)
    return `${baseLink}/types#${item.displayName.toLowerCase()}`
  if (
    item.kind === model.ApiItemKind.Class &&
    item.displayName.endsWith('Error')
  )
    return `${baseLink}/errors#${item.displayName.toLowerCase()}`
  throw new Error(`Missing URL structure for ${item.kind}`)
}

export function createResolveDeclarationReference(
  contextApiItem: model.ApiItem,
) {
  const hierarchy = contextApiItem.getHierarchy()
  const apiModel = hierarchy[0] as model.ApiModel
  const apiPackage = hierarchy[1]

  return (declarationReference: tsdoc.DocDeclarationReference) => {
    const result = apiModel.resolveDeclarationReference(
      declarationReference,
      apiPackage,
    )

    const item = result.resolvedApiItem
    if (item) {
      const url = getLinkForApiItem(item)
      return { url, text: item.displayName }
    }

    return
  }
}
type ResolveDeclarationReference = ReturnType<
  typeof createResolveDeclarationReference
>

export function processDocComment(
  docComment?: tsdoc.DocComment | undefined,
  resolveDeclarationReference?: ResolveDeclarationReference,
) {
  if (!docComment) return

  return {
    alias: cleanDoc(
      renderDocNode(
        docComment.customBlocks.find((v) => v.blockTag.tagName === '@alias'),
        resolveDeclarationReference,
      ),
      '@alias',
    ),
    alpha: docComment.modifierTagSet.isAlpha(),
    beta: docComment.modifierTagSet.isBeta(),
    comment: docComment?.emitAsTsdoc(),
    default: cleanDoc(
      renderDocNode(
        docComment.customBlocks.find((v) => v.blockTag.tagName === '@default'),
        resolveDeclarationReference,
      ),
      '@default',
    ),
    deprecated: cleanDoc(
      renderDocNode(docComment?.deprecatedBlock, resolveDeclarationReference),
      '@deprecated',
    ),
    docGroup: cleanDoc(
      renderDocNode(
        docComment.customBlocks.find((v) => v.blockTag.tagName === '@docGroup'),
        resolveDeclarationReference,
      ),
      '@docGroup',
    ),
    examples: docComment?.customBlocks
      .filter((v) => v.blockTag.tagName === '@example')
      .map((v) => renderDocNode(v, resolveDeclarationReference))
      .map((example) => cleanDoc(example, '@example')),
    experimental: docComment.modifierTagSet.isExperimental(),
    remarks: cleanDoc(
      renderDocNode(docComment?.remarksBlock, resolveDeclarationReference),
      '@remarks',
    ),
    returns: cleanDoc(
      renderDocNode(docComment?.returnsBlock, resolveDeclarationReference),
      '@returns',
    ),
    since: cleanDoc(
      renderDocNode(
        docComment.customBlocks.find((v) => v.blockTag.tagName === '@since'),
        resolveDeclarationReference,
      ),
      '@since',
    ),
    summary: cleanDoc(
      renderDocNode(docComment?.summarySection, resolveDeclarationReference),
    ),
    throws: docComment?.customBlocks
      .filter((v) => v.blockTag.tagName === '@throws')
      .map((v) => renderDocNode(v, resolveDeclarationReference))
      .map((throws) => cleanDoc(throws, '@throws')),
  }
}

export function cleanDoc(docString: string, removeTag?: undefined | string) {
  if (removeTag)
    return docString.replace(new RegExp(`^\\s*${removeTag}`, 'g'), '').trim()
  return docString.trim()
}

export function renderDocNode(
  node?: tsdoc.DocNode | ReadonlyArray<tsdoc.DocNode> | undefined,
  resolveDeclarationReference?: ResolveDeclarationReference,
): string {
  if (!node) return ''
  if (Array.isArray(node))
    return node
      .map((node) => renderDocNode(node, resolveDeclarationReference))
      .join('')

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

    if (docNode instanceof tsdoc.DocLinkTag) {
      const destination = docNode.codeDestination
      if (destination) {
        const result = resolveDeclarationReference?.(destination)
        if (result) return `[${result.text}](${result.url})`
      }
    }

    for (const childNode of docNode.getChildNodes())
      result += renderDocNode(childNode, resolveDeclarationReference)
  }

  return result
}

export function extractFencedBlocks(markdownContent: string) {
  const regex: RegExp = /^```[\s\S]*?^```/gm
  const blocks: string[] = []

  let match: RegExpExecArray | null
  while ((match = regex.exec(markdownContent)) !== null) {
    const block: string = match[0]
    const lines: string[] = block.split('\n')

    // Remove the first and last lines (fence syntax)
    lines.shift()
    lines.pop()

    // Remove any language identifier or attributes from the first line
    if (lines.length > 0 && lines[0]?.trim().startsWith('```')) {
      lines.shift()
    }

    blocks.push(lines.join('\n').trim())
  }

  return blocks.join('\n')
}
