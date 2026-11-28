/**
 * Shared `TextEncoder` / `TextDecoder` singletons used by primitive and codec
 * modules. Centralizing them avoids constructing redundant instances per
 * module and lets engines hoist them to module init time.
 *
 * @internal
 */
export const encoder = /*#__PURE__*/ new TextEncoder()

/**
 * Keeps a leading U+FEFF, which is part of the decoded string rather than a
 * byte order mark.
 *
 * @internal
 */
export const decoder = /*#__PURE__*/ new TextDecoder('utf-8', {
  ignoreBOM: true,
})

const scratch = /*#__PURE__*/ new Uint8Array(/*#__PURE__*/ new ArrayBuffer(64))
/** Views of the first `n` bytes of `scratch`, by `n`. */
const scratchViews: Uint8Array[] = []

/**
 * Decodes UTF-8 bytes as `decoder.decode` does. V8 keeps typed arrays of up to
 * 64 bytes on its heap, and `TextDecoder` would first move one to an
 * `ArrayBuffer` of its own, which costs more than the decoding; a short value
 * is copied to `scratch`, which has one, and decoded from there.
 *
 * @internal
 */
export function decode(bytes: Uint8Array): string {
  if (!(bytes instanceof Uint8Array) || bytes.length > 64)
    return decoder.decode(bytes)
  scratch.set(bytes)
  return decoder.decode(
    (scratchViews[bytes.length] ??= scratch.subarray(0, bytes.length)),
  )
}

/**
 * Encodes a string as UTF-8, as `encoder.encode` does (a lone surrogate
 * becomes U+FFFD). A short string is encoded in a loop, which is several times
 * faster than a call to `TextEncoder`.
 *
 * @internal
 */
export function encode(value: string): Uint8Array {
  // `TextEncoder` also takes what is not a string, such as `undefined`.
  if (typeof value !== 'string' || value.length > 64)
    return encoder.encode(value)
  const length = value.length

  let size = length
  for (let i = 0; i < length; i++) {
    const code = value.charCodeAt(i)
    if (code < 0x80) continue
    size += code < 0x800 ? 1 : 2
    // A surrogate pair is two characters and four bytes.
    if (
      (code & 0xfc00) === 0xd800 &&
      (value.charCodeAt(i + 1) & 0xfc00) === 0xdc00
    )
      i++
  }

  const bytes = new Uint8Array(size)
  for (let i = 0, j = 0; i < length; i++) {
    let code = value.charCodeAt(i)
    if (code < 0x80) bytes[j++] = code
    else if (code < 0x800) {
      bytes[j++] = 0xc0 | (code >> 6)
      bytes[j++] = 0x80 | (code & 0x3f)
    } else {
      if ((code & 0xf800) === 0xd800) {
        const low = value.charCodeAt(i + 1)
        if (code < 0xdc00 && (low & 0xfc00) === 0xdc00) {
          code = 0x10000 + ((code & 0x3ff) << 10) + (low & 0x3ff)
          i++
          bytes[j++] = 0xf0 | (code >> 18)
          bytes[j++] = 0x80 | ((code >> 12) & 0x3f)
        } else code = 0xfffd
      }
      if (code < 0x10000) bytes[j++] = 0xe0 | (code >> 12)
      bytes[j++] = 0x80 | ((code >> 6) & 0x3f)
      bytes[j++] = 0x80 | (code & 0x3f)
    }
  }
  return bytes
}
