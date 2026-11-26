/**
 * Resolves exports, array writes, and test assertions that depend on TypeScript bindings.
 * @module
 */
import * as path from 'node:path'
import * as ts from 'typescript'

import type { Project } from './compiler.js'

/** Per-file evidence for checks that need more than one syntax node. */
type Evidence = {
  acrossTry: string[]
  arrays: string[]
  assertions: number
  inline: number
  typeExports: string[]
  unresolved: string[]
}

/** Uses each project's module resolution, and a separate inferred program for remaining files. */
export function inspect(
  files: readonly string[],
  projects: readonly Project[],
) {
  const result = new Map<string, Evidence>()
  const remaining = new Set(files)

  function inspectProgram(
    roots: readonly string[],
    options: ts.CompilerOptions,
  ) {
    const program = ts.createProgram(roots, options)
    const checker = program.getTypeChecker()
    const sources = program
      .getSourceFiles()
      .filter((source) =>
        remaining.has(path.relative(process.cwd(), source.fileName)),
      )
    const mutated = new Set<ts.Node>()

    function visit(node: ts.Node, action: (node: ts.Node) => void) {
      action(node)
      ts.forEachChild(node, (child) => visit(child, action))
    }

    // Follow direct aliases and function results. A write through either is evidence that the
    // declaration's mutable array is part of its contract, not an accidental mutable view.
    function write(node: ts.Expression): void {
      if (ts.isParenthesizedExpression(node) || ts.isNonNullExpression(node))
        return write(node.expression)
      if (ts.isCallExpression(node)) {
        const declaration = checker.getResolvedSignature(node)?.declaration
        if (declaration && 'type' in declaration && declaration.type)
          mutated.add(declaration.type)
        return
      }
      const symbol = checker.getSymbolAtLocation(
        ts.isPropertyAccessExpression(node) ? node.name : node,
      )
      for (const declaration of symbol?.declarations ?? []) {
        if (mutated.has(declaration)) continue
        mutated.add(declaration)
        if (ts.isVariableDeclaration(declaration) && declaration.initializer)
          write(declaration.initializer)
      }
    }

    for (const source of sources)
      visit(source, (node) => {
        if (
          ts.isCallExpression(node) &&
          ts.isPropertyAccessExpression(node.expression) &&
          /^(copyWithin|fill|pop|push|reverse|shift|sort|splice|unshift)$/.test(
            node.expression.name.text,
          )
        )
          write(node.expression.expression)
        if (
          ts.isBinaryExpression(node) &&
          node.operatorToken.kind >= ts.SyntaxKind.FirstAssignment &&
          node.operatorToken.kind <= ts.SyntaxKind.LastAssignment &&
          (ts.isElementAccessExpression(node.left) ||
            (ts.isPropertyAccessExpression(node.left) &&
              node.left.name.text === 'length'))
        )
          write(node.left.expression)
      })

    for (const source of sources) {
      const file = path.relative(process.cwd(), source.fileName)
      const evidence: Evidence = {
        acrossTry: [],
        arrays: [],
        assertions: 0,
        inline: 0,
        typeExports: [],
        unresolved: [],
      }
      const line = (node: ts.Node) =>
        source.getLineAndCharacterOfPosition(node.getStart(source)).line + 1

      visit(source, (node) => {
        if (ts.isTryStatement(node) && node.catchClause) {
          const assigned = (block: ts.Block) => {
            const symbols = new Set<ts.Symbol>()
            function assignments(child: ts.Node) {
              if (ts.isFunctionLike(child) || ts.isClassLike(child)) return
              if (
                ts.isBinaryExpression(child) &&
                child.operatorToken.kind === ts.SyntaxKind.EqualsToken &&
                ts.isIdentifier(child.left)
              ) {
                const symbol = checker.getSymbolAtLocation(child.left)
                if (symbol) symbols.add(symbol)
              }
              ts.forEachChild(child, assignments)
            }
            assignments(block)
            return symbols
          }
          const caught = assigned(node.catchClause.block)
          for (const symbol of assigned(node.tryBlock)) {
            const declaration = symbol.valueDeclaration
            if (
              caught.has(symbol) &&
              declaration &&
              ts.isVariableDeclaration(declaration) &&
              declaration.getSourceFile() === source &&
              declaration.end <= node.pos &&
              declaration.parent.flags & ts.NodeFlags.Let
            )
              evidence.acrossTry.push(
                `line ${line(declaration)}: let ${symbol.name} is assigned across try and catch`,
              )
          }
        }

        if (
          (ts.isArrayTypeNode(node) &&
            !(
              ts.isTypeOperatorNode(node.parent) &&
              node.parent.operator === ts.SyntaxKind.ReadonlyKeyword
            )) ||
          (ts.isTypeReferenceNode(node) &&
            node.typeName.getText(source) === 'Array')
        ) {
          if (!mutated.has(node) && !mutated.has(node.parent))
            evidence.arrays.push(`line ${line(node)}: ${node.getText(source)}`)
        }

        if (
          ts.isExportSpecifier(node) &&
          !node.isTypeOnly &&
          !node.parent.parent.isTypeOnly
        ) {
          const local = checker.getExportSpecifierLocalTargetSymbol(node)
          const target =
            local &&
            (local.flags & ts.SymbolFlags.Alias
              ? checker.getAliasedSymbol(local)
              : local)
          if (
            target &&
            target.flags & ts.SymbolFlags.Type &&
            !(target.flags & ts.SymbolFlags.Value)
          )
            evidence.typeExports.push(
              `line ${line(node)}: ${node.name.text} is a type-only export`,
            )
          else if (!target?.declarations?.length)
            evidence.unresolved.push(
              `line ${line(node)}: could not resolve export ${node.name.text}`,
            )
        }

        if (
          !ts.isCallExpression(node) ||
          !isExpect(node.expression, checker, source)
        )
          return
        evidence.assertions++
        let parent: ts.Node = node.parent
        while (
          ts.isPropertyAccessExpression(parent) ||
          ts.isElementAccessExpression(parent)
        ) {
          const name = ts.isPropertyAccessExpression(parent)
            ? parent.name.text
            : ts.isStringLiteral(parent.argumentExpression)
              ? parent.argumentExpression.text
              : ''
          if (
            ts.isCallExpression(parent.parent) &&
            /^(toMatchInlineSnapshot|toThrowErrorMatchingInlineSnapshot)$/.test(
              name,
            )
          )
            evidence.inline++
          parent = parent.parent
        }
      })
      result.set(file, evidence)
      remaining.delete(file)
    }
  }

  for (const project of projects) {
    if (project.parsed.fileNames.length)
      inspectProgram(project.parsed.fileNames, project.parsed.options)
  }
  if (remaining.size)
    inspectProgram([...remaining], {
      module: ts.ModuleKind.NodeNext,
      jsx: ts.JsxEmit.Preserve,
      ...projects[0]?.parsed.options,
    })
  return result
}

/** Identifies the framework import behind an alias, namespace, or unshadowed global `expect`. */
function isExpect(
  expression: ts.Expression,
  checker: ts.TypeChecker,
  source: ts.SourceFile,
): boolean {
  const namespace =
    ts.isPropertyAccessExpression(expression) &&
    expression.name.text === 'expect'
  const id = namespace ? expression.expression : expression
  if (!ts.isIdentifier(id)) return false
  const declarations = checker.getSymbolAtLocation(id)?.declarations ?? []
  for (const declaration of declarations) {
    const imported =
      ts.isImportSpecifier(declaration) &&
      !namespace &&
      (declaration.propertyName ?? declaration.name).text === 'expect'
    if (!imported && !(namespace && ts.isNamespaceImport(declaration))) continue
    let parent = declaration.parent as ts.Node
    while (!ts.isSourceFile(parent) && !ts.isImportDeclaration(parent))
      parent = parent.parent
    if (
      ts.isImportDeclaration(parent) &&
      ts.isStringLiteral(parent.moduleSpecifier) &&
      /^(bun:test|vitest|@jest\/globals|@playwright\/test)$/.test(
        parent.moduleSpecifier.text,
      )
    )
      return true
  }
  return (
    !namespace &&
    id.text === 'expect' &&
    declarations.every(
      (declaration) =>
        !ts.isImportSpecifier(declaration) &&
        declaration.getSourceFile() !== source &&
        declaration.getSourceFile().isDeclarationFile,
    )
  )
}
