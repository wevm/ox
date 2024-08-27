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

export function processDocComment(docComment?: tsdoc.DocComment | undefined) {
  if (!docComment) return

  return {
    alias: cleanDoc(
      renderDocNode(
        docComment.customBlocks.find((v) => v.blockTag.tagName === '@alias'),
      ),
      '@alias',
    ),
    comment: docComment?.emitAsTsdoc(),
    summary: cleanDoc(renderDocNode(docComment?.summarySection)),
    default: cleanDoc(
      renderDocNode(
        docComment.customBlocks.find((v) => v.blockTag.tagName === '@default'),
      ),
      '@default',
    ),
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

export function cleanDoc(docString: string, removeTag?: undefined | string) {
  if (removeTag)
    return docString.replace(new RegExp(`^\\s*${removeTag}`, 'g'), '').trim()
  return docString.trim()
}

export function renderDocNode(
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

  return result.replaceAll(
    /\{@link ((?<module>\w+)#(?<type>\w+))\}/g,
    // TODO: Link to correct page and location
    '[$<module>.$<type>](TODO)', // /gen/$<module>/$<type>
  )
}
