import type * as Address from '../core/Address.js'
import * as Base64 from '../core/Base64.js'
import * as Bytes from '../core/Bytes.js'
import * as Errors from '../core/Errors.js'
import * as Hex from '../core/Hex.js'
import * as PersonalMessage from '../core/PersonalMessage.js'
import * as ContentDigest from './ContentDigest.js'
import * as HttpSignatureInput from './internal/HttpSignatureInput.js'
import * as KeyId from './internal/KeyId.js'

/** An HTTP request to sign. */
export type Request = {
  /** Host and optional port (e.g. `"api.example.com"`). */
  authority: string
  /** Raw request body. */
  body?: string | Uint8Array | undefined
  /** HTTP headers (lowercase keys). */
  headers?: Record<string, string> | undefined
  /** HTTP method (e.g. `"GET"`, `"POST"`). */
  method: string
  /** URL path (e.g. `"/foo"`). */
  path: string
  /** Query string including leading `"?"` (e.g. `"?a=1&b=two"`). */
  query?: string | undefined
}

/** Known RFC 9421 derived components and ERC-8128 header fields. */
export type Component =
  | '@authority'
  | '@method'
  | '@path'
  | '@query'
  | '@scheme'
  | '@target-uri'
  | 'content-digest'
  | (string & {})

/** Signature parameters for an ERC-8128 HTTP signature. */
export type SignatureParams = {
  /** Ethereum address of the signer. */
  address: Address.Address
  /** Chain ID for the signing account. */
  chainId: number
  /** Covered components to include in the signature. @default `['@authority', '@method', '@path']` + `@query` and `content-digest` when applicable */
  components?: readonly Component[] | undefined
  /** Unix timestamp (seconds) when the signature was created. @default `Math.floor(Date.now() / 1000)` */
  created?: number | undefined
  /** Unix timestamp (seconds) when the signature expires. @default `created + 60` */
  expires?: number | undefined
  /** Signature label. @default `"eth"` */
  label?: string | undefined
  /** Unique nonce for replay protection. @default random 32 bytes (base64url-encoded) */
  nonce?: string | undefined
}

/**
 * Computes the sign payload for an [ERC-8128](https://github.com/slice-so/ERCs/blob/9f6cf39b52b94d405dcc4e521916a0ab00f03e2a/ERCS/erc-8128.md) HTTP signature.
 *
 * Constructs the RFC 9421 signature base from the request and parameters,
 * then returns the ERC-191 hash ready for signing with `Secp256k1.sign`.
 *
 * Accepts either a plain {@link Request} object or a Fetch API
 * [`Request`](https://developer.mozilla.org/en-US/docs/Web/API/Request).
 *
 * @example
 * ### Plain Request
 *
 * ```ts twoslash
 * import { Secp256k1 } from 'ox'
 * import { HttpSignature } from 'ox/erc8128'
 *
 * const { payload, signatureInput } = await HttpSignature.getSignPayload({
 *   request: {
 *     method: 'POST',
 *     authority: 'api.example.com',
 *     path: '/foo',
 *     query: '?a=1&b=two',
 *     body: new TextEncoder().encode('{"hello":"world"}'),
 *   },
 *   chainId: 1,
 *   address: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045',
 * })
 *
 * const signature = Secp256k1.sign({ payload, privateKey: '0x...' })
 * ```
 *
 * @example
 * ### Fetch API Request
 *
 * ```ts twoslash
 * import { Secp256k1 } from 'ox'
 * import { HttpSignature } from 'ox/erc8128'
 *
 * const request = new Request('https://api.example.com/foo?a=1', {
 *   method: 'POST',
 *   body: JSON.stringify({ hello: 'world' }),
 * })
 *
 * const { payload, signatureInput } = await HttpSignature.getSignPayload({
 *   request,
 *   chainId: 1,
 *   address: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045',
 * })
 *
 * const signature = Secp256k1.sign({ payload, privateKey: '0x...' })
 * ```
 *
 * @param options - Request and signature parameters.
 * @returns The ERC-191 sign payload and serialized `Signature-Input` header value.
 */
export async function getSignPayload(
  options: getSignPayload.Options,
): Promise<getSignPayload.ReturnType> {
  const { chainId, address, label = 'eth' } = options

  const created = options.created ?? Math.floor(Date.now() / 1000)
  const expires = options.expires ?? created + 60
  const nonce =
    options.nonce ??
    Base64.fromBytes(Bytes.random(32), { pad: false, url: true })

  const request = isFetchRequest(options.request)
    ? await fromFetchRequest(options.request)
    : options.request

  const keyid = KeyId.serialize({ chainId, address })

  // Compute covered components.
  const coveredComponents = options.components ?? components(request)

  // Ensure content-digest header exists if body is present.
  const headers = { ...request.headers }
  if (request.body && request.body.length > 0 && !headers['content-digest']) {
    headers['content-digest'] = ContentDigest.compute(request.body)
  }

  // Serialize Signature-Input value.
  const params = {
    created,
    expires,
    nonce,
    keyid,
  } satisfies HttpSignatureInput.Params

  const signatureInput = HttpSignatureInput.serialize(
    label,
    coveredComponents,
    params,
  )

  // Build signature base per RFC 9421.
  const signatureBase = createSignatureBase(
    { ...request, headers },
    coveredComponents,
    params,
  )

  // ERC-191 hash of signature base.
  const payload = PersonalMessage.getSignPayload(Hex.fromString(signatureBase))

  return { payload, signatureInput }
}

export declare namespace getSignPayload {
  type Options = SignatureParams & {
    /** The HTTP request to sign. Accepts a plain {@link Request} or a Fetch API `Request`. */
    request: Request | globalThis.Request
  }

  type ReturnType = {
    /** The ERC-191 payload to sign with `Secp256k1.sign`. */
    payload: Hex.Hex
    /** The serialized `Signature-Input` header value to attach to the request. */
    signatureInput: string
  }

  type ErrorType =
    | PersonalMessage.getSignPayload.ErrorType
    | Hex.fromString.ErrorType
    | Errors.GlobalErrorType
}

/**
 * Serializes a signature into the `Signature` HTTP header value.
 *
 * @example
 * ```ts twoslash
 * import { Secp256k1 } from 'ox'
 * import { HttpSignature } from 'ox/erc8128'
 *
 * const signature = Secp256k1.sign({ payload: '0x...', privateKey: '0x...' })
 * const header = HttpSignature.serialize({ signature })
 * // @log: 'eth=:base64bytes:'
 * ```
 *
 * @param options - Signature and optional label.
 * @returns The `Signature` header value.
 */
export function serialize(options: serialize.Options): string {
  const { label = 'eth', signature } = options
  const sigBytes = Hex.toBytes(signature)
  const sigB64 = Base64.fromBytes(sigBytes)
  return `${label}=:${sigB64}:`
}

export declare namespace serialize {
  type Options = {
    /** Signature label. @default `"eth"` */
    label?: string | undefined
    /** The signature as hex. */
    signature: Hex.Hex
  }

  type ErrorType =
    | Hex.toBytes.ErrorType
    | Base64.fromBytes.ErrorType
    | Errors.GlobalErrorType
}

/**
 * Attaches `Signature-Input` and `Signature` headers to a Fetch API `Request`.
 *
 * @example
 * ```ts twoslash
 * import { Secp256k1 } from 'ox'
 * import { HttpSignature } from 'ox/erc8128'
 *
 * const request = new Request('https://api.example.com/foo', { method: 'GET' })
 *
 * const { payload, signatureInput } = await HttpSignature.getSignPayload({
 *   request,
 *   chainId: 1,
 *   address: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045',
 * })
 *
 * const signature = Secp256k1.sign({ payload, privateKey: '0x...' })
 *
 * const signedRequest = HttpSignature.toRequest({
 *   request,
 *   signature,
 *   signatureInput,
 * })
 * ```
 *
 * @param options - Request, signature, and signature input.
 * @returns A new `Request` with signature headers attached.
 */
export function toRequest(options: toRequest.Options): globalThis.Request {
  const { request, signatureInput, label } = options
  const signatureHeader = serialize({ label, signature: options.signature })
  const signed = new globalThis.Request(request, {
    headers: new Headers(request.headers),
  })
  signed.headers.set('signature-input', signatureInput)
  signed.headers.set('signature', signatureHeader)
  return signed
}

export declare namespace toRequest {
  type Options = {
    /** Signature label. @default `"eth"` */
    label?: string | undefined
    /** The Fetch API `Request` to attach headers to. */
    request: globalThis.Request
    /** The signature as hex. */
    signature: Hex.Hex
    /** The serialized `Signature-Input` header value from `getSignPayload`. */
    signatureInput: string
  }

  type ErrorType = serialize.ErrorType | Errors.GlobalErrorType
}

/**
 * Extracts the signature and signature input from a signed Fetch API `Request`.
 *
 * @example
 * ```ts twoslash
 * import { HttpSignature } from 'ox/erc8128'
 *
 * const request = new Request('https://api.example.com/foo', { method: 'GET' })
 * // ... attach signature headers ...
 *
 * const { signature, signatureInput } = HttpSignature.fromRequest(request)
 * ```
 *
 * @param request - The signed Fetch API `Request`.
 * @param options - Options.
 * @returns The parsed signature and raw signature input header value.
 */
export function fromRequest(
  request: globalThis.Request,
  options: fromRequest.Options = {},
): fromRequest.ReturnType {
  const { label = 'eth' } = options

  const signatureInput = request.headers.get('signature-input')
  if (!signatureInput) throw new MissingHeaderError('Signature-Input')

  const signatureHeader = request.headers.get('signature')
  if (!signatureHeader) throw new MissingHeaderError('Signature')

  // Parse `label=:base64:` from the Signature header.
  const prefix = `${label}=:`
  if (!signatureHeader.startsWith(prefix) || !signatureHeader.endsWith(':'))
    throw new InvalidSignatureHeaderError(signatureHeader)

  const sigB64 = signatureHeader.slice(prefix.length, -1)
  const sigBytes = Base64.toBytes(sigB64)
  const signature = Hex.fromBytes(sigBytes)

  return { signature, signatureInput }
}

export declare namespace fromRequest {
  type Options = {
    /** Signature label to look for. @default `"eth"` */
    label?: string | undefined
  }

  type ReturnType = {
    /** The signature as hex. */
    signature: Hex.Hex
    /** The raw `Signature-Input` header value. */
    signatureInput: string
  }

  type ErrorType =
    | MissingHeaderError
    | InvalidSignatureHeaderError
    | Hex.fromBytes.ErrorType
    | Errors.GlobalErrorType
}

/** Thrown when a required HTTP signature header is missing. */
export class MissingHeaderError extends Errors.BaseError {
  override readonly name = 'HttpSignature.MissingHeaderError'
  constructor(header: string) {
    super(`Missing required header: "${header}".`)
  }
}

/** Thrown when the `Signature` header value is malformed. */
export class InvalidSignatureHeaderError extends Errors.BaseError {
  override readonly name = 'HttpSignature.InvalidSignatureHeaderError'
  constructor(value: string) {
    super(`Invalid Signature header value: "${value}".`)
  }
}

/** @internal Checks whether a value is a Fetch API `Request`. */
function isFetchRequest(
  value: Request | globalThis.Request,
): value is globalThis.Request {
  return (
    typeof globalThis.Request !== 'undefined' &&
    value instanceof globalThis.Request
  )
}

/** @internal Converts a Fetch API `Request` to a plain {@link Request}. */
async function fromFetchRequest(request: globalThis.Request): Promise<Request> {
  const url = new URL(request.url)

  // Normalize authority: omit default ports (80 for http, 443 for https).
  const isDefaultPort =
    (url.protocol === 'http:' && url.port === '80') ||
    (url.protocol === 'https:' && url.port === '443')
  const authority = isDefaultPort ? url.hostname : url.host

  const headers: Record<string, string> = {}
  request.headers.forEach((value, key) => {
    headers[key] = value
  })

  let body: Uint8Array | undefined
  if (request.body !== null) {
    body = new Uint8Array(await request.clone().arrayBuffer())
  }

  return {
    authority,
    method: request.method,
    path: url.pathname,
    ...(url.search ? { query: url.search } : {}),
    ...(body ? { body } : {}),
    ...(Object.keys(headers).length > 0 ? { headers } : {}),
  }
}

/** @internal Returns the list of covered components for a request per ERC-8128 §3.1.1. */
function components(request: Request): string[] {
  const c = ['@authority', '@method', '@path']
  if (request.query) c.push('@query')
  if (request.body && request.body.length > 0) c.push('content-digest')
  return c
}

/**
 * @internal
 * Constructs the RFC 9421 signature base from request components.
 *
 * Each covered component is serialized as `"<component>": <value>\n`,
 * followed by `"@signature-params": <params>`.
 */
function createSignatureBase(
  request: Request & { headers?: Record<string, string> },
  components: readonly string[],
  params: HttpSignatureInput.Params,
): string {
  const lines: string[] = []

  for (const component of components) {
    let value: string
    switch (component) {
      case '@method':
        value = request.method.toUpperCase()
        break
      case '@authority':
        value = request.authority
        break
      case '@path':
        value = request.path
        break
      case '@query':
        value = request.query ?? '?'
        break
      default:
        // HTTP header field (e.g. "content-digest").
        // Canonicalize per RFC 9421: trim and collapse whitespace.
        value = (request.headers?.[component] ?? '')
          .trim()
          .replace(/[ \t]+/g, ' ')
        break
    }
    lines.push(`${HttpSignatureInput.quoteSfString(component)}: ${value}`)
  }

  // Build @signature-params line.
  const inner = components
    .map((c) => HttpSignatureInput.quoteSfString(c))
    .join(' ')
  const paramParts: string[] = []
  for (const [key, value] of Object.entries(params)) {
    if (typeof value === 'number') paramParts.push(`${key}=${value}`)
    else paramParts.push(`${key}=${HttpSignatureInput.quoteSfString(value)}`)
  }
  lines.push(`"@signature-params": (${inner});${paramParts.join(';')}`)

  return lines.join('\n')
}
