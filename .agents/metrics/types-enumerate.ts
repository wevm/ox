/**
 * Lists every public export of each leaf entry's declarations with the TypeScript checker, and
 * writes the consumer file that measures each one as JSON on standard output. types.ts runs it in
 * Node, so its program is gone before the workers start.
 *
 * Exports are named `<leaf entry>:<name>`, such as `ox/Hex:fromString`. Barrels such as `ox` and
 * `ox/tempo` only re-export leaf modules as namespaces (`export * as Hex from './core/Hex.js'`),
 * so a barrel's namespaces are measured under their leaf entries; anything else a barrel exports,
 * such as `ox:Register`, is measured under the barrel. An export that several entries re-export
 * resolves to one symbol, measured once under the first entry in `getExports()` order.
 *
 * The types a function's `declare namespace`, such as `Hex.fromString.Options`, are not separate
 * exports: the function's own consumer reaches them through `Parameters` and `ReturnType`.
 *
 * @module
 */

import * as fs from 'node:fs'
import * as path from 'node:path'

import ts from 'typescript'

import {
  consumerFile,
  consumerOptions,
  createHost,
  entries,
} from './types-host.ts'

/**
 * One export and the consumer file that forces its type to resolve. `forms` describes each of the
 * consumer's exported aliases, with the declared type behind it, for notes.
 */
export type Item = {
  item: string
  group: string
  text: string
  forms: Record<string, string>
}

const host = createHost(consumerOptions)
host.setFile(consumerFile, 'export {}')
const program = ts.createProgram({
  rootNames: [consumerFile, ...entries.map((entry) => entry.types)],
  options: consumerOptions,
  host,
})
const checker = program.getTypeChecker()
const consumer = program.getSourceFile(consumerFile)!
const printer = ts.createPrinter({ removeComments: true })
const entrySpecifiers = new Map(
  entries.map((entry) => [entry.types, entry.name]),
)
const leafFiles = new Set(
  entries.filter((entry) => !entry.barrel).map((entry) => entry.types),
)

const seen = new Set<ts.Symbol>()
const items: Item[] = []
const baselines: Record<string, string> = {}
let found = 0
let namespaces = 0
let duplicates = 0

// Leaves first, so a symbol that a barrel also reaches keeps its leaf name; lines keep
// `getExports()` order, since barrels only add names that no leaf exports.
for (const entry of [
  ...entries.filter((entry) => !entry.barrel),
  ...entries.filter((entry) => entry.barrel),
]) {
  const { name: specifier, types: file } = entry
  const source = program.getSourceFile(file)
  if (!source) throw new Error(`${file} is missing; run \`pnpm build\` first`)
  const module = checker.getSymbolAtLocation(source)
  // An entry with no exports, such as `ox/window`, only augments globals.
  if (!module) continue
  const exports = checker.getExportsOfModule(module)
  found += exports.length
  if (exports[0])
    // The baseline imports the entry and nothing else. Importing any name resolves the entry's
    // export table, which every consumer of the entry pays as well.
    baselines[specifier] =
      `import type { ${exports[0].name} as $ } from '${specifier}'\nexport type { $ }\n`
  // Breadth first, so a top-level export keeps its shortest name.
  const queue = exports.map((symbol) => ({
    symbol,
    top: symbol.name,
    member: '',
  }))
  for (const { symbol, top, member } of queue) {
    const target =
      symbol.flags & ts.SymbolFlags.Alias
        ? checker.getAliasedSymbol(symbol)
        : symbol
    const module = target.declarations?.find(ts.isSourceFile)
    if (target.flags & ts.SymbolFlags.ValueModule && module) {
      // A leaf module that a barrel re-exports is measured under its own entry.
      if (leafFiles.has(module.fileName)) continue
      if (seen.has(target)) continue
      seen.add(target)
      namespaces++
      for (const child of checker.getExportsOfModule(target))
        queue.push({
          symbol: child,
          top,
          member: member ? `${member}.${child.name}` : child.name,
        })
      continue
    }
    if (seen.has(target)) {
      duplicates++
      continue
    }
    seen.add(target)
    const name = member ? `${top}.${member}` : top
    const consumer = consumerText(
      target,
      specifier,
      top,
      member ? `$.${member}` : '$',
      symbol.name,
    )
    if (consumer)
      items.push({
        item: `${specifier}:${name}`,
        group: specifier,
        ...consumer,
      })
  }
}
const order = new Map(entries.map((entry, index) => [entry.name, index]))
items.sort((a, b) => order.get(a.group)! - order.get(b.group)!)

process.stdout.write(
  JSON.stringify({
    found,
    duplicates,
    namespaces,
    items,
    baselines,
  }),
)

/**
 * Writes the consumer for one export. TypeScript resolves types lazily: `type T = typeof x` only
 * resolves the declared type, and an object type's properties wait until something reads them. So
 * each form is followed by `Members<T>`, which reads the type of every property one level down,
 * as passing an object literal to a parameter or reading a result would. It goes no deeper, so a
 * recursive type stays finite and the count stays comparable across exports.
 *
 * - A function, or a value with call signatures: `typeof x`, `Parameters<typeof x>`, and
 *   `ReturnType<typeof x>`, awaited before its members are read. A generic signature is resolved
 *   at its type parameters' constraints, as TypeScript infers from it, and an overloaded one by its
 *   last overload, as these helpers pick it.
 * - A class: `typeof x`, `ConstructorParameters<typeof x>`, and `InstanceType<typeof x>`.
 * - Any other value: `typeof x`.
 * - A type: the type with its defaults, or with its constraints where a parameter has no default.
 */
function consumerText(
  symbol: ts.Symbol,
  specifier: string,
  top: string,
  ref: string,
  name: string,
) {
  const lines = [`import type { ${top} as $ } from '${specifier}'`]
  const members: [type: string, description: string][] = []
  const forms: Record<string, string> = {}
  const declarations = symbol.declarations ?? []
  if (symbol.flags & ts.SymbolFlags.Value) {
    lines.push(`export type Value = typeof ${ref}`)
    forms.Value = `typeof ${name}`
    const signatures = checker.getSignaturesOfType(
      checker.getTypeOfSymbol(symbol),
      ts.SignatureKind.Call,
    )
    if (symbol.flags & ts.SymbolFlags.Class) {
      lines.push(
        'export type Params = ConstructorParameters<Value>',
        'export type Instance = InstanceType<Value>',
      )
      forms.Params = `ConstructorParameters<typeof ${name}>`
      forms.Instance = `InstanceType<typeof ${name}>`
      members.push(
        ['Params[number]', 'its parameters'],
        ['Instance', 'its instances'],
      )
    } else if (signatures.length) {
      lines.push(
        'export type Params = Parameters<Value>',
        'export type Return = ReturnType<Value>',
      )
      // The helpers read the last overload, so the notes name its declared types.
      const declaration = signatures.at(-1)!.getDeclaration()
      const parameters = declaration?.parameters.map(
        (parameter) => parameter.type?.getText() ?? 'any',
      )
      forms.Params = `Parameters<typeof ${name}>${declared(parameters && `(${parameters.join(', ')})`)}`
      forms.Return = `ReturnType<typeof ${name}>${declared(declaration?.type?.getText())}`
      members.push(
        ['Params[number]', 'its parameters'],
        ['Awaited<Return>', 'its awaited return type'],
      )
    } else {
      forms.Value += declared(
        declarations.find(ts.isVariableDeclaration)?.type?.getText(),
      )
      members.push(['Value', `typeof ${name}`])
    }
  }
  if (symbol.flags & (ts.SymbolFlags.TypeAlias | ts.SymbolFlags.Interface)) {
    const { aliases, args } = typeArguments(symbol)
    lines.push(...aliases, `export type Type = ${ref}${args}`)
    forms.Type = `${name}${declared(declarations.find(ts.isTypeAliasDeclaration)?.type.getText())}`
    members.push(['Type', name])
  }
  if (lines.length === 1) return undefined
  members.forEach(([type, description], index) => {
    lines.push(`export type Members${index} = Members<${type}>`)
    forms[`Members${index}`] = `reading the properties of ${description}`
  })
  lines.push('type Members<T> = T extends object ? T[keyof T] : T')
  return { text: `${lines.join('\n')}\n`, forms }
}

/** Describes a declared type for a note, shortened to its first 80 characters. */
function declared(text: string | undefined): string {
  if (!text) return ''
  const flat = text.replace(/\s+/g, ' ')
  return `, declared as ${flat.length > 80 ? `${flat.slice(0, 79)}…` : flat}`
}

/**
 * The type arguments for a generic type's parameters that have no default. Each one is its
 * constraint with the arguments before it substituted, as `$T0`, `$T1`, and so on, so
 * `keys extends keyof type` becomes `keyof $T0`. A parameter with no constraint gets `unknown`. The
 * checker prints each constraint relative to the consumer, with `import()` types for names it
 * does not import.
 */
function typeArguments(symbol: ts.Symbol): { aliases: string[]; args: string } {
  const declaration = symbol.declarations?.find(
    (node): node is ts.TypeAliasDeclaration | ts.InterfaceDeclaration =>
      (ts.isTypeAliasDeclaration(node) || ts.isInterfaceDeclaration(node)) &&
      !!node.typeParameters,
  )
  const parameters = declaration?.typeParameters ?? []
  const required = parameters.filter((parameter) => !parameter.default)
  if (!required.length) return { aliases: [], args: '' }
  const names = new Map(
    parameters.map((parameter, index) => [parameter.name.text, index]),
  )
  const aliases = required.map((parameter, index) => {
    let text = 'unknown'
    if (parameter.constraint) {
      const declared = print(
        checker.getTypeFromTypeNode(parameter.constraint),
        (name) => {
          const position = names.get(name)
          return position !== undefined && position < index
            ? `$T${position}`
            : undefined
        },
      )
      // A constraint that names its own parameter or a later one falls back to its base constraint.
      if (declared && !declared.unresolved) text = declared.text
      else {
        const base = checker.getBaseConstraintOfType(
          checker.getTypeAtLocation(parameter),
        )
        text = (base && print(base, () => undefined)?.text) || 'unknown'
      }
    }
    return `type $T${index} = ${text}`
  })
  return {
    aliases,
    args: `<${required.map((_, index) => `$T${index}`).join(', ')}>`,
  }

  /** Prints a type in the consumer, replacing the type parameters that `rename` maps. */
  function print(type: ts.Type, rename: (name: string) => string | undefined) {
    const node = checker.typeToTypeNode(
      type,
      consumer,
      ts.NodeBuilderFlags.NoTruncation | ts.NodeBuilderFlags.IgnoreErrors,
    )
    if (!node) return undefined
    let unresolved = false
    const visit = (child: ts.Node): ts.Node => {
      if (
        ts.isTypeReferenceNode(child) &&
        ts.isIdentifier(child.typeName) &&
        !child.typeArguments
      ) {
        const name = child.typeName.text
        if (names.has(name)) {
          const replacement = rename(name)
          if (replacement)
            return ts.factory.createTypeReferenceNode(replacement)
          unresolved = true
        }
      }
      return ts.visitEachChild(child, visit, undefined)
    }
    const text = printer
      .printNode(ts.EmitHint.Unspecified, visit(node), consumer)
      .replace(/\s+/g, ' ')
      .replace(/import\("([^"]+)"\)/g, (match, specifier: string) => {
        if (!path.isAbsolute(specifier)) return match
        // An entry's own types file is imported by its package specifier, so it resolves the way
        // the consumer's own import does. Anything else, such as abitype's declarations, gets the
        // extension NodeNext needs.
        const entry = entrySpecifiers.get(`${specifier}.d.ts`)
        if (entry) return `import("${entry}")`
        if (fs.existsSync(`${specifier}.d.ts`))
          return `import("${specifier}.js")`
        if (fs.existsSync(`${specifier}/index.d.ts`))
          return `import("${specifier}/index.js")`
        return match
      })
    return { text, unresolved }
  }
}
