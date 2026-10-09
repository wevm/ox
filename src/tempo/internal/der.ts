// A minimal reader for the DER subset of ICAO EF.SOD files and X.509 certificates: single-byte
// tags, definite lengths, and no trailing bytes. Elements keep their offsets into the input, so
// callers can slice the exact bytes that were signed. Long-form lengths need not be minimal:
// some issuers' SODs use them, and nothing here is re-encoded.

/** A decoded TLV element. */
export type Element = {
  /** The input the element was read from. */
  bytes: Uint8Array
  /** Offset of the element's first content byte. */
  contentStart: number
  /** Offset just past the element's last content byte. */
  end: number
  /** Offset of the element's tag byte. */
  start: number
  /** The tag byte. */
  tag: number
}

/** Thrown when bytes are not well-formed DER. */
export class DecodeError extends Error {
  override readonly name = 'Der.DecodeError'
}

/**
 * Reads the single element that spans `bytes`.
 *
 * @internal
 */
export function decode(bytes: Uint8Array, tag?: number): Element {
  const element = read(bytes, 0, bytes.length)
  if (element.end !== bytes.length) throw new DecodeError('trailing bytes')
  if (tag !== undefined) expect(element, tag)
  return element
}

/**
 * Reads the children of a constructed element, optionally checking their tags.
 *
 * @internal
 */
export function children(
  element: Element,
  tags?: readonly (number | undefined)[],
): Element[] {
  if ((element.tag & 0x20) === 0)
    throw new DecodeError(`tag 0x${hex(element.tag)} is not constructed`)
  const result: Element[] = []
  let offset = element.contentStart
  while (offset < element.end) {
    const child = read(element.bytes, offset, element.end)
    result.push(child)
    offset = child.end
  }
  if (tags) {
    if (result.length < tags.length)
      throw new DecodeError(
        `expected at least ${tags.length} elements, got ${result.length}`,
      )
    tags.forEach((tag, i) => {
      if (tag !== undefined) expect(result[i]!, tag)
    })
  }
  return result
}

/**
 * Returns an element's content bytes.
 *
 * @internal
 */
export function content(element: Element): Uint8Array {
  return element.bytes.subarray(element.contentStart, element.end)
}

/**
 * Returns an element's full encoding, tag and length included.
 *
 * @internal
 */
export function encoded(element: Element): Uint8Array {
  return element.bytes.subarray(element.start, element.end)
}

/**
 * Throws unless an element has the expected tag.
 *
 * @internal
 */
export function expect(element: Element, tag: number): void {
  if (element.tag !== tag)
    throw new DecodeError(
      `expected tag 0x${hex(tag)}, got 0x${hex(element.tag)}`,
    )
}

/**
 * Reads an INTEGER as an unsigned big-endian magnitude, without its sign byte.
 *
 * @internal
 */
export function unsigned(element: Element): Uint8Array {
  expect(element, 0x02)
  const value = content(element)
  if (value.length === 0) throw new DecodeError('empty integer')
  if (value[0]! & 0x80) throw new DecodeError('negative integer')
  if (value.length > 1 && value[0] === 0 && (value[1]! & 0x80) === 0)
    throw new DecodeError('non-minimal integer')
  return value[0] === 0 && value.length > 1 ? value.subarray(1) : value
}

/**
 * Reads a small non-negative INTEGER.
 *
 * @internal
 */
export function integer(element: Element): number {
  const value = unsigned(element)
  if (value.length > 4) throw new DecodeError('integer is too large')
  return value.reduce((acc, byte) => acc * 256 + byte, 0)
}

/**
 * Reads an OBJECT IDENTIFIER in dotted form.
 *
 * @internal
 */
export function oid(element: Element): string {
  expect(element, 0x06)
  const value = content(element)
  if (value.length === 0 || (value[value.length - 1]! & 0x80) !== 0)
    throw new DecodeError('malformed object identifier')
  const arcs: bigint[] = []
  let arc = 0n
  for (let i = 0; i < value.length; i++) {
    const byte = value[i]!
    if (arc === 0n && byte === 0x80)
      throw new DecodeError('non-minimal object identifier')
    arc = (arc << 7n) | BigInt(byte & 0x7f)
    if ((byte & 0x80) === 0) {
      arcs.push(arc)
      arc = 0n
    }
  }
  const first = arcs[0]!
  const head = first < 80n ? [first / 40n, first % 40n] : [2n, first - 80n]
  return [...head, ...arcs.slice(1)].join('.')
}

/**
 * Reads an AlgorithmIdentifier's OID. Parameters are ignored: the OIDs callers accept take
 * none, or NULL.
 *
 * @internal
 */
export function algorithm(element: Element): string {
  expect(element, 0x30)
  const [id, , ...rest] = children(element, [0x06])
  if (rest.length > 0) throw new DecodeError('malformed algorithm identifier')
  return oid(id!)
}

function read(bytes: Uint8Array, offset: number, limit: number): Element {
  if (offset + 2 > limit) throw new DecodeError('truncated element')
  const tag = bytes[offset]!
  if ((tag & 0x1f) === 0x1f) throw new DecodeError('multi-byte tag')
  let length = bytes[offset + 1]!
  let contentStart = offset + 2
  if (length & 0x80) {
    const size = length & 0x7f
    if (size === 0) throw new DecodeError('indefinite length')
    if (size > 3) throw new DecodeError('length is too large')
    if (contentStart + size > limit) throw new DecodeError('truncated length')
    length = 0
    for (let i = 0; i < size; i++)
      length = length * 256 + bytes[contentStart + i]!
    contentStart += size
  }
  const end = contentStart + length
  if (end > limit) throw new DecodeError('truncated element')
  return { bytes, contentStart, end, start: offset, tag }
}

function hex(value: number): string {
  return value.toString(16).padStart(2, '0')
}
