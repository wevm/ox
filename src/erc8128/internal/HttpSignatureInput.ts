/** Signature parameters for serialization. */
export type Params = Record<string, string | number>

/** Deserialized signature input. */
export type Deserialized = {
  components: string[]
  label: string
  params: {
    created?: number | undefined
    expires?: number | undefined
    keyid?: string | undefined
    nonce?: string | undefined
    [key: string]: string | number | undefined
  }
}

/**
 * Serializes the `Signature-Input` header value per RFC 9421 Structured Fields.
 *
 * @example
 * ```ts
 * import * as HttpSignatureInput from './HttpSignatureInput.js'
 * HttpSignatureInput.serialize('eth', ['@method', '@authority'], { created: 1700000000 })
 * // 'eth=("@method" "@authority");created=1700000000'
 * ```
 */
export function serialize(
  label: string,
  components: readonly string[],
  params: Params,
): string {
  const inner = components.map((c) => quoteSfString(c)).join(' ')
  const paramParts: string[] = []
  for (const [key, value] of Object.entries(params)) {
    if (typeof value === 'number') paramParts.push(`${key}=${value}`)
    else paramParts.push(`${key}=${quoteSfString(value)}`)
  }
  return `${label}=(${inner});${paramParts.join(';')}`
}

/**
 * Deserializes a `Signature-Input` header value.
 *
 * Parses `label=("@method" "@authority" ...);created=123;keyid="erc8128:1:0x..."`.
 *
 * @example
 * ```ts
 * import * as HttpSignatureInput from './HttpSignatureInput.js'
 * HttpSignatureInput.deserialize('eth=("@method" "@authority");created=1700000000;keyid="erc8128:1:0xabc"')
 * ```
 */
export function deserialize(input: string): Deserialized {
  // Split label from the rest: `eth=(...);...`
  const eqIdx = input.indexOf('=')
  if (eqIdx === -1) throw new InvalidSignatureInputError(input)

  const label = input.slice(0, eqIdx)
  const rest = input.slice(eqIdx + 1)

  // Parse components from `(...)`.
  const openParen = rest.indexOf('(')
  const closeParen = rest.indexOf(')')
  if (openParen === -1 || closeParen === -1)
    throw new InvalidSignatureInputError(input)

  const componentsStr = rest.slice(openParen + 1, closeParen)
  const components = componentsStr
    .split(' ')
    .map((c) => c.replace(/"/g, ''))
    .filter(Boolean)

  // Parse params after `)`.
  const paramsStr = rest.slice(closeParen + 1)
  const params: Deserialized['params'] = {}

  if (paramsStr.startsWith(';')) {
    // Split on `;` but respect quoted values.
    const entries = paramsStr.slice(1).split(';')
    for (const entry of entries) {
      const kvIdx = entry.indexOf('=')
      if (kvIdx === -1) continue
      const key = entry.slice(0, kvIdx)
      let value: string | number = entry.slice(kvIdx + 1)
      // Remove surrounding quotes for string values.
      if (value.startsWith('"') && value.endsWith('"'))
        value = value.slice(1, -1)
      else if (/^\d+$/.test(value)) value = Number(value)
      params[key] = value
    }
  }

  return { label, components, params }
}

/**
 * Quotes a string per RFC 8941 (Structured Fields) sf-string rules.
 * Escapes `\` → `\\` and `"` → `\"`, wraps in double quotes.
 */
export function quoteSfString(value: string): string {
  return `"${value.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`
}

export class InvalidSignatureInputError extends Error {
  override readonly name = 'HttpSignature.InvalidSignatureInputError'
  constructor(input: string) {
    super(`Invalid Signature-Input header value: "${input}".`)
  }
}
