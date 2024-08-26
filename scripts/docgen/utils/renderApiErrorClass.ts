import type { Data } from './handleItem.js'

export function renderApiErrorClass(item: Data, _lookup: Record<string, Data>) {
  const { comment, displayName } = item

  return `
## \`${displayName}\`

${comment?.summary ?? 'TODO'}
`
}
