import * as Base64 from '../core/Base64.js'
import * as Bytes from '../core/Bytes.js'
import * as Errors from '../core/Errors.js'
import * as Hash from '../core/Hash.js'

/** A parsed Content-Digest value. */
export type ContentDigest = {
  /** Hash algorithm (e.g. `"sha-256"`). */
  algorithm: string
  /** Base64-encoded digest. */
  digest: string
}

/**
 * Computes an RFC 9530 `Content-Digest` header value from a request body.
 *
 * @example
 * ```ts twoslash
 * import { ContentDigest } from 'ox/erc8128'
 *
 * const header = ContentDigest.compute('hello')
 * // @log: 'sha-256=:LPJNul+wow4m6DsqxbninhsWHlwfp0JecwQzYpOLmCQ=:'
 * ```
 *
 * @param body - The request body.
 * @returns The `Content-Digest` header value.
 */
export function compute(body: string | Uint8Array): string {
  const bytes = typeof body === 'string' ? Bytes.fromString(body) : body
  const hash = Hash.sha256(bytes, { as: 'Bytes' })
  const encoded = Base64.fromBytes(hash)
  return `sha-256=:${encoded}:`
}

export declare namespace compute {
  type ErrorType =
    | Hash.sha256.ErrorType
    | Base64.fromBytes.ErrorType
    | Errors.GlobalErrorType
}

/**
 * Serializes a {@link ContentDigest} into an RFC 9530 header value.
 *
 * @example
 * ```ts twoslash
 * import { ContentDigest } from 'ox/erc8128'
 *
 * const header = ContentDigest.serialize({
 *   algorithm: 'sha-256',
 *   digest: 'LPJNul+wow4m6DsqxbninhsWHlwfp0JecwQzYpOLmCQ=',
 * })
 * // @log: 'sha-256=:LPJNul+wow4m6DsqxbninhsWHlwfp0JecwQzYpOLmCQ=:'
 * ```
 *
 * @param value - The content digest to serialize.
 * @returns The header value string.
 */
export function serialize(value: ContentDigest): string {
  return `${value.algorithm}=:${value.digest}:`
}

export declare namespace serialize {
  type ErrorType = Errors.GlobalErrorType
}

/**
 * Deserializes an RFC 9530 `Content-Digest` header value.
 *
 * @example
 * ```ts twoslash
 * import { ContentDigest } from 'ox/erc8128'
 *
 * const { algorithm, digest } = ContentDigest.deserialize(
 *   'sha-256=:LPJNul+wow4m6DsqxbninhsWHlwfp0JecwQzYpOLmCQ=:',
 * )
 * // @log: { algorithm: 'sha-256', digest: 'LPJNul+wow4m6DsqxbninhsWHlwfp0JecwQzYpOLmCQ=' }
 * ```
 *
 * @param header - The `Content-Digest` header value.
 * @returns The parsed content digest.
 */
export function deserialize(header: string): ContentDigest {
  const match = header.match(/^([A-Za-z0-9_-]+)=:([A-Za-z0-9+/]+={0,2}):$/)
  if (!match) throw new InvalidContentDigestError(header)
  return { algorithm: match[1]!.toLowerCase(), digest: match[2]! }
}

export declare namespace deserialize {
  type ErrorType = InvalidContentDigestError | Errors.GlobalErrorType
}

/**
 * Verifies that a `Content-Digest` header matches the actual body content.
 *
 * @example
 * ```ts twoslash
 * import { ContentDigest } from 'ox/erc8128'
 *
 * const valid = ContentDigest.verify({
 *   body: new TextEncoder().encode('hello'),
 *   header: 'sha-256=:LPJNul+wow4m6DsqxbninhsWHlwfp0JecwQzYpOLmCQ=:',
 * })
 * // @log: true
 * ```
 *
 * @param options - Body and header to verify.
 * @returns `true` if the digest matches, `false` otherwise.
 */
export function verify(options: verify.Options): boolean {
  const { body, header } = options
  const parsed = deserialize(header)
  if (parsed.algorithm !== 'sha-256') return false
  const expected = compute(body)
  const expectedParsed = deserialize(expected)
  return parsed.digest === expectedParsed.digest
}

export declare namespace verify {
  type Options = {
    /** The request body. */
    body: string | Uint8Array
    /** The `Content-Digest` header value. */
    header: string
  }

  type ErrorType =
    | compute.ErrorType
    | deserialize.ErrorType
    | Errors.GlobalErrorType
}

/** Thrown when a `Content-Digest` header value is malformed. */
export class InvalidContentDigestError extends Errors.BaseError {
  override readonly name = 'ContentDigest.InvalidContentDigestError'
  constructor(header: string) {
    super(`Invalid Content-Digest header value: "${header}".`)
  }
}
