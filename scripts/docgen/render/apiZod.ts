import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import * as model from '@microsoft/api-extractor-model'

import { type Data, getId } from '../utils/model.js'

const repoRoot = resolve(import.meta.dirname, '../../..')

// Removes string/template literals and line comments so bracket counting in
// `getSchemaSource` isn't thrown off by delimiters that appear inside them.
function stripForDepth(line: string) {
  return line
    .replace(/\/\/.*$/, '')
    .replace(/'(?:[^'\\]|\\.)*'/g, "''")
    .replace(/"(?:[^"\\]|\\.)*"/g, '""')
    .replace(/`(?:[^`\\]|\\.)*`/g, '``')
}

// Extracts the verbatim source of a `export const <name> = …` schema
// declaration from its source file, so docs can show the schema as authored
// rather than its inferred Zod type.
function getSchemaSource(data: Data) {
  const path = data.file.path
  if (!path) return undefined

  let content: string
  try {
    content = readFileSync(resolve(repoRoot, path), 'utf-8')
  } catch {
    return undefined
  }

  const lines = content.split('\n')
  const startRegex = new RegExp(
    `^export (?:const|let|var) ${data.displayName}\\b`,
  )
  const startIdx = lines.findIndex((line) => startRegex.test(line))
  if (startIdx === -1) return undefined

  const out: string[] = []
  let depth = 0
  for (let i = startIdx; i < lines.length; i++) {
    const line = lines[i]!
    out.push(line)
    for (const char of stripForDepth(line)) {
      if (char === '(' || char === '[' || char === '{') depth++
      else if (char === ')' || char === ']' || char === '}') depth--
    }
    // Mid-expression — keep consuming lines.
    if (depth > 0) continue
    // Continue across fluent chains / multi-line expressions.
    const next = lines[i + 1]?.trim() ?? ''
    if (/^[.?:]|^&&|^\|\|/.test(next)) continue
    break
  }

  const source = out.join('\n')
  if (!source || source.length > 2000) return undefined
  return source
}

export type ZodMember = {
  apiItem: model.ApiItem
  description: string
  link: string
}

/** Anchor slug for a fully-qualified member name (e.g. `z.Address.Address`). */
export function getZodAnchor(value: string) {
  return value.toLowerCase().replaceAll('.', '').replaceAll('_', '')
}

function escapeTableCell(value: string | undefined) {
  return (value ?? '').replaceAll('\n', ' ').replaceAll('|', '\\|')
}

function sourceLink(data: Data) {
  if (!data.file.url) return undefined
  return `**Source:** [${data.file.path}](${data.file.url}${
    data.file.lineNumber ? `#L${data.file.lineNumber}` : ''
  })`
}

function renderImports(usage: string) {
  return [
    '## Imports',
    `\`\`\`ts\nimport { z } from 'ox/zod'\n\n${usage}\n\`\`\``,
  ].join('\n\n')
}

function renderDefinition(data: Data, member: model.ApiItem) {
  const definition = (() => {
    // For schemas, prefer showing the schema source as authored.
    if (member.kind === model.ApiItemKind.Variable) {
      const source = getSchemaSource(data)
      if (source) return source
      if (data.type) return `const ${data.displayName}: ${data.type}`
      return undefined
    }
    if (member.kind === model.ApiItemKind.TypeAlias && data.type)
      return `type ${data.displayName} = ${data.type}`
    if (member.kind === model.ApiItemKind.Function) return data.excerpt
    return undefined
  })()
  // Skip absurdly long signatures (e.g. large codec / union types) — they are
  // noise rather than useful reference material.
  if (!definition || definition.length > 2000) return undefined
  return ['## Definition', `\`\`\`ts\n${definition}\n\`\`\``].join('\n\n')
}

function renderParameters(data: Data) {
  const parameters = (data.parameters ?? []).filter(
    (parameter) => !parameter.name.startsWith('_'),
  )
  if (!parameters.length) return undefined
  return [
    '## Parameters',
    '| Name | Type | Description |',
    '| --- | --- | --- |',
    ...parameters.map(
      (parameter) =>
        `| \`${escapeTableCell(parameter.name)}${parameter.optional ? '?' : ''}\` | \`${escapeTableCell(
          parameter.type,
        )}\` | ${escapeTableCell(parameter.comment)} |`,
    ),
  ].join('\n')
}

/** Renders a dedicated page for a single Zod export (schema or function). */
export function renderZodMemberPage(options: {
  data: Data
  displayName: string
  member: model.ApiItem
}) {
  const { data, displayName, member } = options
  const fullName = `${displayName}.${data.displayName}`

  const content = [`# ${fullName}`]
  if (data.comment?.summary) content.push(data.comment.summary)

  content.push(renderImports(fullName))

  if (data.comment?.examples?.length)
    content.push('## Examples', ...data.comment.examples)

  const definition = renderDefinition(data, member)
  if (definition) content.push(definition)

  const parameters = renderParameters(data)
  if (parameters) content.push(parameters)

  if (data.returnType?.type)
    content.push('## Return Type', `\`${data.returnType.type}\``)

  const source = sourceLink(data)
  if (source) content.push(source)

  return content.join('\n\n').trim()
}

function renderTable(title: string, members: ZodMember[]) {
  if (!members.length) return undefined
  return [
    `## ${title}`,
    '| Name | Description |',
    '| --- | --- |',
    ...members.map(
      (member) =>
        `| [\`${escapeTableCell(member.apiItem.displayName)}\`](${member.link}) | ${escapeTableCell(
          member.description,
        )} |`,
    ),
  ].join('\n')
}

/** Renders the overview page for a Zod namespace, linking to member pages. */
export function renderZodNamespace(options: {
  errors: ZodMember[]
  functions: ZodMember[]
  summary?: string | undefined
  title: string
  types: ZodMember[]
  variables: ZodMember[]
  variablesTitle?: string | undefined
}) {
  const {
    errors,
    functions,
    summary,
    title,
    types,
    variables,
    variablesTitle = 'Schemas',
  } = options

  const content = ['---\nshowOutline: 1\n---', `# ${title}`]
  if (summary) content.push(summary)

  for (const section of [
    renderTable(variablesTitle, variables),
    renderTable('Functions', functions),
    renderTable('Types', types),
    renderTable('Errors', errors),
  ])
    if (section) content.push(section)

  return content.join('\n\n')
}

/** Renders an aggregate page (Types / Errors) with full JSDoc per member. */
export function renderZodMemberGroup(options: {
  dataLookup: Record<string, Data>
  displayName: string
  members: ZodMember[]
  summary?: string | undefined
  title: string
}) {
  const { dataLookup, displayName, members, summary, title } = options
  const content = ['---\nshowOutline: 1\n---', `# ${title}`]
  if (summary) content.push(summary)

  for (const { apiItem } of members) {
    const data = dataLookup[getId(apiItem)]
    if (!data) throw new Error(`Could not find data for ${getId(apiItem)}`)

    const fullName = `${displayName}.${data.displayName}`
    content.push(`<a id="${getZodAnchor(fullName)}"></a>`)
    content.push(`## \`${fullName}\``)
    if (data.comment?.summary) content.push(data.comment.summary)

    const definition = (() => {
      if (
        apiItem.kind === model.ApiItemKind.TypeAlias &&
        data.type &&
        data.type.length <= 2000
      )
        return `type ${data.displayName} = ${data.type}`
      if (apiItem.kind === model.ApiItemKind.Variable) {
        const source = getSchemaSource(data)
        if (source) return source
        if (data.type && data.type.length <= 2000)
          return `const ${data.displayName}: ${data.type}`
      }
      return undefined
    })()
    if (definition) content.push(`\`\`\`ts\n${definition}\n\`\`\``)

    if (data.comment?.examples?.length)
      content.push('### Examples', ...data.comment.examples)

    const source = sourceLink(data)
    if (source) content.push(source)
  }

  return content.join('\n\n')
}
