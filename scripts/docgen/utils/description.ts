// Helpers for deriving SEO-friendly page meta descriptions and emitting YAML
// frontmatter for generated documentation pages.

const minWords = 5
const maxWords = 15
const defaultContext = 'in TypeScript'

/**
 * Derives a plain-text SEO meta description (targeting 5-15 words) from a
 * TSDoc summary or an explicit `@description` tag.
 *
 * Markdown links, inline code, and emphasis are stripped, the first paragraph
 * is taken, overly long text is clamped to {@link maxWords}, and short text is
 * padded with a contextual suffix so it reaches {@link minWords}.
 */
export function toMetaDescription(
  value: string | undefined,
  options: { context?: string | undefined; fallback?: string | undefined } = {},
): string {
  const { context = defaultContext, fallback } = options

  let text = clean(firstParagraph(value ?? ''))
  if (!text && fallback) text = clean(firstParagraph(fallback))
  if (!text) return ''

  const words = text.split(/\s+/)
  if (words.length > maxWords)
    return stripTrailingPunctuation(words.slice(0, maxWords).join(' '))
  if (words.length < minWords && context)
    return `${stripTrailingPunctuation(text)} ${context}.`
  return text
}

/** Serializes a record of fields into a YAML frontmatter block. */
export function frontmatter(
  fields: Record<string, string | number | undefined>,
): string {
  const lines = Object.entries(fields)
    .filter(([, value]) => value !== undefined && value !== '')
    .map(([key, value]) =>
      typeof value === 'number'
        ? `${key}: ${value}`
        : `${key}: ${JSON.stringify(value)}`,
    )
  return ['---', ...lines, '---'].join('\n')
}

function firstParagraph(value: string) {
  return (value.split('\n\n')[0] ?? '').trim()
}

function clean(value: string) {
  return value
    .replace(/\[`?([^`\]]+?)`?\]\([^)]*\)/g, '$1') // [text](url) -> text
    .replace(/`([^`]+)`/g, '$1') // `code` -> code
    .replace(/\*\*([^*]+)\*\*/g, '$1') // **bold** -> bold
    .replace(/\b(\w+)\.\1\b/g, '$1') // Foo.Foo -> Foo
    .replace(/\s+/g, ' ')
    .trim()
}

function stripTrailingPunctuation(value: string) {
  return value.replace(/[\s.,;:!?]+$/, '')
}
