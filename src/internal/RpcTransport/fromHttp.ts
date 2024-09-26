import type { GlobalErrorType } from '../Errors/error.js'
import { Promise_withTimeout } from '../Promise/withTimeout.js'
import type {
  RpcTransport_Options,
  RpcTransport_Http,
  RpcTransport_HttpOptions,
} from './types.js'
import {
  RpcTransport_HttpError,
  RpcTransport_MalformedResponseError,
} from './errors.js'
import { RpcTransport_create } from './create.js'

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
 * @param url - URL to perform the JSON-RPC requests to.
 * @param options - Transport options.
 * @returns HTTP JSON-RPC Transport.
 */
export function RpcTransport_fromHttp<safe extends boolean = false>(
  url: string,
  options: RpcTransport_fromHttp.Options<safe> = {},
): RpcTransport_Http<safe> {
  return RpcTransport_create<RpcTransport_HttpOptions>(
    {
      async request(body_, options_) {
        const {
          fetchFn = options.fetchFn ?? fetch,
          fetchOptions: fetchOptions_ = options.fetchOptions,
          timeout = options.timeout ?? 10_000,
        } = options_

        const body = JSON.stringify(body_)

        const fetchOptions =
          typeof fetchOptions_ === 'function'
            ? await fetchOptions_(body_)
            : fetchOptions_

        const response = await Promise_withTimeout(
          ({ signal }) => {
            const init: RequestInit = {
              ...fetchOptions,
              body,
              headers: {
                'Content-Type': 'application/json',
                ...fetchOptions?.headers,
              },
              method: fetchOptions?.method ?? 'POST',
              signal: fetchOptions?.signal ?? (timeout > 0 ? signal : null),
            }
            const request = new Request(url, init)
            return fetchFn(request)
          },
          {
            timeout,
            signal: true,
          },
        )

        const data = await (async () => {
          if (
            response.headers.get('Content-Type')?.startsWith('application/json')
          )
            return response.json()
          return response.text().then((data) => {
            try {
              return JSON.parse(data || '{}')
            } catch (err) {
              if (response.ok)
                throw new RpcTransport_MalformedResponseError({
                  response: data,
                })
              return { error: data }
            }
          })
        })()

        if (!response.ok)
          throw new RpcTransport_HttpError({
            body,
            details: JSON.stringify(data.error) ?? response.statusText,
            response,
            url,
          })

        return data as never
      },
    },
    { safe: options.safe },
  )
}

export declare namespace RpcTransport_fromHttp {
  type Options<safe extends boolean = false> = RpcTransport_Options<
    safe,
    RpcTransport_HttpOptions
  >

  type ErrorType =
    | Promise_withTimeout.ErrorType
    | RpcTransport_HttpError
    | GlobalErrorType
}

RpcTransport_fromHttp.parseError = (error: unknown) =>
  /* v8 ignore next */
  error as RpcTransport_fromHttp.ErrorType
