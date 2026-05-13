import * as Errors from './Errors.js'
import { getUrl } from './internal/errors.js'
import * as promise from './internal/promise.js'
import type * as RpcSchema_internal from './internal/rpcSchema.js'
import * as internal from './internal/rpcTransport.js'
import type { Compute } from './internal/types.js'
import * as RpcResponse from './RpcResponse.js'
import type * as RpcSchema from './RpcSchema.js'

/** Root type for an RPC Transport. */
export type RpcTransport<
  raw extends boolean = false,
  options extends Record<string, unknown> = {},
  schema extends RpcSchema.Generic = RpcSchema.Default,
> = Compute<{
  request: RequestFn<raw, options, schema>
}>

/** HTTP-based RPC Transport. */
export type Http<
  raw extends boolean = false,
  schema extends RpcSchema.Generic = RpcSchema.Default,
> = Compute<
  RpcTransport<raw, HttpOptions, schema> & {
    /**
     * Sends a JSON-RPC request and returns the full {@link ox#RpcResponse.RpcResponse} envelope
     * (instead of unwrapping `result` and throwing on `error`).
     */
    requestRaw: RequestRawFn<HttpOptions, schema>
    /**
     * Sends a JSON-RPC batch request, returning an array of envelopes (one per request, in order).
     *
     * Always HTTP-only. Empty input is rejected.
     */
    batch: BatchFn<HttpOptions, schema>
  }
>

export type HttpOptions = {
  /** Request configuration to pass to `fetch`. */
  fetchOptions?:
    | Omit<RequestInit, 'body'>
    | ((
        method: RpcSchema.Generic['Request'],
      ) => Omit<RequestInit, 'body'> | Promise<Omit<RequestInit, 'body'>>)
    | undefined
  /** Function to use to make the request. @default fetch */
  fetchFn?: typeof fetch | undefined
  /** Timeout for the request in milliseconds. @default 10_000 */
  timeout?: number | undefined
  /**
   * Number of times to retry the request on failure. Set to `0` to disable.
   *
   * Retries are scoped to HTTP-level failures and only fire when `shouldRetry`
   * returns `true`. Wallet methods (`wallet_*`) and state-changing methods (`eth_sendTransaction`,
   * `eth_sendRawTransaction`, `eth_signTransaction`, `personal_sign`, `eth_sign*`) are skipped by
   * the default predicate to avoid double-submitting writes.
   *
   * @default 0
   */
  retryCount?: number | undefined
  /**
   * Delay in milliseconds between retry attempts. May be a static number or a function called with
   * the retry attempt number (1-indexed) and the originating error. Defaults to exponential
   * backoff starting at 150ms.
   */
  retryDelay?:
    | number
    | ((parameters: RetryDelayParameters) => number)
    | undefined
  /**
   * Predicate controlling whether a failed request should be retried. Receives the originating
   * error and the next attempt number (1-indexed). Defaults to skipping wallet / state-changing
   * methods and retrying on network errors, timeouts, and 5xx / 408 / 429 statuses.
   */
  shouldRetry?: ((parameters: ShouldRetryParameters) => boolean) | undefined
}

/** @internal */
export type RetryDelayParameters = {
  /** The 1-indexed retry attempt number. */
  count: number
  /** The error that triggered the retry. */
  error: Error
}

/** @internal */
export type ShouldRetryParameters = {
  /** The 1-indexed retry attempt number. */
  count: number
  /** The error that triggered the retry. */
  error: Error
  /** The originating JSON-RPC request method. */
  method: string
}

export type RequestFn<
  raw extends boolean = false,
  options extends Record<string, unknown> = {},
  schema extends RpcSchema.Generic = RpcSchema.Default,
> = <
  methodName extends RpcSchema.MethodNameGeneric,
  raw_override extends boolean | undefined = undefined,
>(
  parameters: Compute<
    RpcSchema_internal.ExtractRequestOpaque<schema, methodName>
  >,
  options?: internal.Options<raw_override, options, schema> | undefined,
) => Promise<
  raw_override extends boolean
    ? raw_override extends true
      ? RpcResponse.RpcResponse<RpcSchema.ExtractReturnType<schema, methodName>>
      : RpcSchema.ExtractReturnType<schema, methodName>
    : raw extends true
      ? RpcResponse.RpcResponse<RpcSchema.ExtractReturnType<schema, methodName>>
      : RpcSchema.ExtractReturnType<schema, methodName>
>

export type RequestRawFn<
  options extends Record<string, unknown> = {},
  schema extends RpcSchema.Generic = RpcSchema.Default,
> = <methodName extends RpcSchema.MethodNameGeneric>(
  parameters: Compute<
    RpcSchema_internal.ExtractRequestOpaque<schema, methodName>
  >,
  options?: internal.Options<true, options, schema> | undefined,
) => Promise<
  RpcResponse.RpcResponse<RpcSchema.ExtractReturnType<schema, methodName>>
>

export type BatchFn<
  options extends Record<string, unknown> = {},
  schema extends RpcSchema.Generic = RpcSchema.Default,
> = <methodName extends RpcSchema.MethodNameGeneric>(
  requests: ReadonlyArray<
    Compute<RpcSchema_internal.ExtractRequestOpaque<schema, methodName>>
  >,
  options?: internal.Options<true, options, schema> | undefined,
) => Promise<
  ReadonlyArray<
    RpcResponse.RpcResponse<RpcSchema.ExtractReturnType<schema, methodName>>
  >
>

const defaultRetryableMethodPredicate = (method: string) => {
  // Skip methods with side-effects to avoid double-submitting state changes.
  if (method.startsWith('wallet_')) return false
  if (method.startsWith('personal_sign')) return false
  if (method.startsWith('eth_sign')) return false
  if (method === 'eth_sendTransaction') return false
  if (method === 'eth_sendRawTransaction') return false
  return true
}

const defaultShouldRetry = ({ error, method }: ShouldRetryParameters) => {
  if (!defaultRetryableMethodPredicate(method)) return false
  // Retry on transport-level failures.
  if (error instanceof MalformedResponseError) return true
  if (error instanceof promise.TimeoutError) return true
  if (error instanceof HttpError) {
    const status = error.status ?? 0
    // Retry server errors and the canonical transient client errors.
    if (status === 408 || status === 429) return true
    if (status >= 500) return true
    return false
  }
  // Network-level fetch errors typically surface as TypeError.
  if (error?.name === 'TypeError') return true
  if (error?.name === 'AbortError') return true
  return false
}

const defaultRetryDelay = ({ count }: RetryDelayParameters) =>
  150 * 2 ** (count - 1)

const wait = (ms: number) =>
  new Promise<void>((resolve) => {
    setTimeout(resolve, ms)
  })

/**
 * Creates a HTTP JSON-RPC Transport from a URL.
 *
 * @example
 * ```ts twoslash
 * import { RpcTransport } from 'ox'
 *
 * const transport = RpcTransport.fromHttp('https://1.rpc.thirdweb.com')
 *
 * const blockNumber = await transport.request({ method: 'eth_blockNumber' })
 * // @log: '0x1a2b3c'
 * ```
 *
 * @example
 * ### Generic Schema Inference
 *
 * Pass a custom {@link ox#RpcSchema.Generic} as the type parameter to type both
 * `request` and `requestRaw` without a runtime schema tag.
 *
 * ```ts twoslash
 * import { RpcSchema, RpcTransport } from 'ox'
 *
 * type Schema = RpcSchema.From<{
 *   Request: { method: 'abe_foo'; params: [number] }
 *   ReturnType: string
 * }>
 *
 * const transport = RpcTransport.fromHttp<false, Schema>(
 *   'https://1.rpc.thirdweb.com',
 * )
 * ```
 *
 * @example
 * ### Retry on Failure
 *
 * Opt in to retries by setting `retryCount > 0`. Wallet/state-changing methods are skipped by the
 * default predicate. Override `shouldRetry` to customize the policy and `retryDelay` to control
 * backoff timing.
 *
 * ```ts twoslash
 * import { RpcTransport } from 'ox'
 *
 * const transport = RpcTransport.fromHttp('https://1.rpc.thirdweb.com', {
 *   retryCount: 3,
 *   retryDelay: ({ count }) => 100 * count,
 *   shouldRetry: ({ error }) => error.name !== 'AbortError',
 * })
 * ```
 *
 * @example
 * ### Raw Envelopes & Batch
 *
 * Use `requestRaw` to receive the full JSON-RPC envelope, or `batch` to send several requests in a
 * single HTTP round-trip (HTTP-only).
 *
 * ```ts twoslash
 * import { RpcTransport } from 'ox'
 *
 * const transport = RpcTransport.fromHttp('https://1.rpc.thirdweb.com')
 *
 * const envelope = await transport.requestRaw({ method: 'eth_blockNumber' })
 * // @log: { id: 0, jsonrpc: '2.0', result: '0x...' }
 *
 * const [blockNumber, chainId] = await transport.batch([
 *   { method: 'eth_blockNumber' },
 *   { method: 'eth_chainId' },
 * ])
 * ```
 *
 * @param url - URL to perform the JSON-RPC requests to.
 * @param options - Transport options.
 * @returns HTTP JSON-RPC Transport.
 */
// Existing overload: `RpcTransport.fromHttp<raw, schema>(url, options)`.
export function fromHttp<
  raw extends boolean = false,
  schema extends RpcSchema.Generic = RpcSchema.Default,
>(url: string, options?: fromHttp.Options<raw, schema>): Http<raw, schema>
// Schema-first overload: `RpcTransport.fromHttp<MySchema>(url)`.
// eslint-disable-next-line jsdoc/require-jsdoc
export function fromHttp<schema extends RpcSchema.Generic>(
  url: string,
  options?: fromHttp.Options<false, schema>,
): Http<false, schema>
// eslint-disable-next-line jsdoc/require-jsdoc
export function fromHttp<
  raw extends boolean = false,
  schema extends RpcSchema.Generic = RpcSchema.Default,
>(url: string, options: fromHttp.Options<raw, schema> = {}): Http<raw, schema> {
  let nextBatchId = 0

  async function performHttp(
    body: unknown,
    options_: HttpOptions,
  ): Promise<unknown> {
    const {
      fetchFn = options.fetchFn ?? fetch,
      fetchOptions: fetchOptions_ = options.fetchOptions,
      timeout = options.timeout ?? 10_000,
    } = options_

    const serializedBody = JSON.stringify(body)

    const fetchOptions =
      typeof fetchOptions_ === 'function'
        ? await fetchOptions_(body as RpcSchema.Generic['Request'])
        : fetchOptions_

    const response = await promise.withTimeout(
      ({ signal }) => {
        const externalSignal = fetchOptions?.signal
        const timeoutSignal = timeout > 0 ? signal : null
        const signals = [externalSignal, timeoutSignal].filter(
          (s): s is AbortSignal => Boolean(s),
        )
        const composedSignal =
          signals.length === 0
            ? null
            : signals.length === 1
              ? signals[0]!
              : AbortSignal.any(signals)
        const init: RequestInit = {
          ...fetchOptions,
          body: serializedBody,
          headers: {
            'Content-Type': 'application/json',
            ...fetchOptions?.headers,
          },
          method: fetchOptions?.method ?? 'POST',
          signal: composedSignal,
        }
        return fetchFn(url, init)
      },
      {
        timeout,
        signal: true,
      },
    )

    const data = await (async () => {
      if (response.headers.get('Content-Type')?.startsWith('application/json'))
        return response.json()
      return response.text().then((data) => {
        if (data === '') {
          if (response.ok) throw new MalformedResponseError({ response: data })
          return { error: undefined }
        }
        try {
          return JSON.parse(data)
        } catch (_err) {
          if (response.ok)
            throw new MalformedResponseError({
              response: data,
            })
          return { error: data }
        }
      })
    })()

    if (!response.ok) {
      const error = (data as { error?: unknown })?.error
      throw new HttpError({
        body: serializedBody,
        details:
          typeof error === 'string'
            ? error
            : error
              ? JSON.stringify(error)
              : response.statusText,
        response,
        url,
      })
    }

    return data
  }

  async function performWithRetry(
    body: unknown,
    options_: HttpOptions,
    method: string,
  ): Promise<unknown> {
    const retryCount = options_.retryCount ?? options.retryCount ?? 0
    const retryDelayOption =
      options_.retryDelay ?? options.retryDelay ?? defaultRetryDelay
    const shouldRetry =
      options_.shouldRetry ?? options.shouldRetry ?? defaultShouldRetry

    let attempt = 0
    while (true) {
      try {
        return await performHttp(body, options_)
      } catch (err) {
        const error = err as Error
        attempt++
        if (attempt > retryCount) throw error
        if (!shouldRetry({ count: attempt, error, method })) throw error
        const delay =
          typeof retryDelayOption === 'function'
            ? retryDelayOption({ count: attempt, error })
            : retryDelayOption
        if (delay > 0) await wait(delay)
      }
    }
  }

  const transport = internal.create<HttpOptions, schema, raw>(
    {
      async request(body_, options_) {
        const method = (body_ as { method?: string }).method ?? ''
        return (await performWithRetry(body_, options_, method)) as never
      },
    },
    { raw: options.raw },
  )

  const requestRaw: RequestRawFn<HttpOptions, schema> = (
    parameters: any,
    rawOptions: any = {},
  ) => transport.request(parameters, { ...rawOptions, raw: true } as any) as any

  const batch: BatchFn<HttpOptions, schema> = (async (
    requests: ReadonlyArray<{ method: string }>,
    batchOptions: HttpOptions = {},
  ) => {
    if (!Array.isArray(requests) || requests.length === 0)
      throw new EmptyBatchError()

    const body = requests.map((request) => ({
      id: nextBatchId++,
      ...request,
      jsonrpc: '2.0',
    }))
    const methods = requests.map((r) => r.method ?? '').join(',')
    const data = (await performWithRetry(body, batchOptions, methods)) as
      | RpcResponse.RpcResponse[]
      | RpcResponse.RpcResponse

    if (!Array.isArray(data))
      throw new MalformedBatchResponseError({
        details: 'Expected an array of JSON-RPC responses.',
      })

    if (data.length !== body.length)
      throw new MalformedBatchResponseError({
        details: `Expected ${body.length} responses, got ${data.length}.`,
      })

    // Re-order responses to match the request order via `id`.
    const byId = new Map<number, RpcResponse.RpcResponse>()
    for (const response of data) byId.set(response.id, response)
    return body.map((req) => {
      const response = byId.get(req.id)
      if (!response)
        throw new MalformedBatchResponseError({
          details: `Missing response for id ${req.id}.`,
        })
      // Validate as JSON-RPC envelope without unwrapping.
      return RpcResponse.parse(response, { raw: true }) as never
    })
  }) as never

  return {
    ...transport,
    requestRaw,
    batch,
  }
}

export declare namespace fromHttp {
  type Options<
    raw extends boolean = false,
    schema extends RpcSchema.Generic = RpcSchema.Default,
  > = internal.Options<raw, HttpOptions, schema>

  type ErrorType =
    | promise.withTimeout.ErrorType
    | HttpError
    | EmptyBatchError
    | MalformedBatchResponseError
    | Errors.GlobalErrorType
}

/** Thrown when a HTTP request fails. */
export class HttpError extends Errors.BaseError {
  override readonly name = 'RpcTransport.HttpError'

  /** Response status code, if available. */
  readonly status: number | undefined

  constructor({
    body,
    details,
    response,
    url,
  }: { body: unknown; details: string; response: Response; url: string }) {
    super('HTTP request failed.', {
      details,
      metaMessages: [
        `Status: ${response.status}`,
        `URL: ${getUrl(url)}`,
        body ? `Body: ${JSON.stringify(body)}` : undefined,
      ],
    })
    this.status = response.status
  }
}

/** Thrown when a HTTP response is malformed. */
export class MalformedResponseError extends Errors.BaseError {
  override readonly name = 'RpcTransport.MalformedResponseError'

  constructor({ response }: { response: string }) {
    super('HTTP Response could not be parsed as JSON.', {
      metaMessages: [`Response: ${response}`],
    })
  }
}

/** Thrown when {@link ox#RpcTransport.fromHttp}'s `batch` is called with an empty array. */
export class EmptyBatchError extends Errors.BaseError {
  override readonly name = 'RpcTransport.EmptyBatchError'

  constructor() {
    super('A JSON-RPC batch must contain at least one request.')
  }
}

/** Thrown when a JSON-RPC batch response cannot be matched against the request batch. */
export class MalformedBatchResponseError extends Errors.BaseError {
  override readonly name = 'RpcTransport.MalformedBatchResponseError'

  constructor({ details }: { details: string }) {
    super('JSON-RPC batch response is malformed.', { details })
  }
}
