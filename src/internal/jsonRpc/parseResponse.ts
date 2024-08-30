import type { GlobalErrorType } from '../errors/error.js'
import {
  JsonRpc_Error,
  type JsonRpc_ErrorType,
  JsonRpc_InternalError,
  JsonRpc_InvalidInputError,
  JsonRpc_InvalidParamsError,
  JsonRpc_InvalidRequestError,
  JsonRpc_LimitExceededError,
  JsonRpc_MethodNotFoundError,
  JsonRpc_MethodNotSupportedError,
  JsonRpc_ParseError,
  JsonRpc_ResourceNotFoundError,
  JsonRpc_ResourceUnavailableError,
  JsonRpc_TransactionRejectedError,
  JsonRpc_VersionNotSupportedError,
} from './errors.js'
import type {
  JsonRpc_ExtractMethodReturnType,
  JsonRpc_MethodGeneric,
  JsonRpc_MethodNameGeneric,
  JsonRpc_Response,
} from './types.js'

/**
 * A type-safe interface to parse a JSON-RPC response object as per the [JSON-RPC 2.0 specification](https://www.jsonrpc.org/specification#response_object), and extract the result.
 *
 * @example
 * ```ts twoslash
 * import { JsonRpc } from 'ox'
 *
 * // 1. Create a request store.
 * const store = JsonRpc.createRequestStore()
 *
 * // 2. Get a request object.
 * const request = store.getRequest({
 *   method: 'eth_getBlockByNumber',
 *   params: ['0x1', false],
 * })
 *
 * // 3. Send the JSON-RPC request via HTTP.
 * const block = await fetch('https://cloudflare-eth.com', {
 *   body: JSON.stringify(request),
 *   headers: {
 *     'Content-Type': 'application/json',
 *   },
 *   method: 'POST',
 * })
 *  .then((res) => res.json())
 *  // 4. Parse the JSON-RPC response into a type-safe result. // [!code focus]
 *  .then((res) => JsonRpc.parseResponse(res, { method: 'eth_getBlockByNumber' })) // [!code focus]
 *
 * block // [!code focus]
 * // ^?
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 * ```
 *
 * :::tip
 *
 * If you don't need the return type, you can omit the options entirely.
 *
 * ```ts twoslash
 * import { JsonRpc } from 'ox'
 *
 * const block = await fetch('https://cloudflare-eth.com', {})
 *  .then((res) => res.json())
 *  .then((res) => JsonRpc.parseResponse(res, { method: 'eth_getBlockByNumber' })) // [!code --]
 *  .then(JsonRpc.parseResponse) // [!code ++]
 * ```
 * :::
 *
 * @example
 * ### Type-safe Custom Methods
 *
 * It is possible to parse a custom {@link JsonRpc#Method}.
 *
 * ```ts twoslash
 * import { JsonRpc } from 'ox'
 *
 * type Method = JsonRpc.DefineMethod<{ // [!code focus]
 *   method: 'eth_foobar' // [!code focus]
 *   params: [number] // [!code focus]
 *   returnType: string // [!code focus]
 * }> // [!code focus]
 *
 * const response = JsonRpc.parseResponse<Method>({}) // [!code focus]
 * //    ^?
 *
 * ```
 *
 * @example
 * ### Safe Mode
 *
 * If `safe` is `true`, the response will be returned as an object with `result` and `error` properties instead of returning the `result` directly and throwing errors.
 *
 * ```ts twoslash
 * import { JsonRpc } from 'ox'
 *
 * const response = JsonRpc.parseResponse({}, {
 *   method: 'eth_blockNumber',
 *   safe: true, // [!code hl]
 * })
 *
 * response.result
 * //       ^?
 *
 *
 * response.error
 * //       ^?
 *
 *
 * ```
 *
 * @param response - Opaque JSON-RPC response object.
 * @param options - Parsing options.
 * @returns Typed JSON-RPC result, or response object (if `safe` is `true`).
 */
export function JsonRpc_parseResponse<
  method extends JsonRpc_MethodGeneric | JsonRpc_MethodNameGeneric,
  safe extends boolean = false,
>(
  response: unknown,
  options: JsonRpc_parseResponse.Options<method, safe> = {},
): JsonRpc_parseResponse.ReturnType<method, safe> {
  const { safe = false } = options
  const response_ = response as JsonRpc_Response
  if (safe) return response as never
  if (response_.error) {
    const { code } = response_.error
    const JsonRpcError = (() => {
      if (code === JsonRpc_InternalError.code) return JsonRpc_InternalError
      if (code === JsonRpc_InvalidInputError.code)
        return JsonRpc_InvalidInputError
      if (code === JsonRpc_InvalidParamsError.code)
        return JsonRpc_InvalidParamsError
      if (code === JsonRpc_InvalidRequestError.code)
        return JsonRpc_InvalidRequestError
      if (code === JsonRpc_LimitExceededError.code)
        return JsonRpc_LimitExceededError
      if (code === JsonRpc_MethodNotFoundError.code)
        return JsonRpc_MethodNotFoundError
      if (code === JsonRpc_MethodNotSupportedError.code)
        return JsonRpc_MethodNotSupportedError
      if (code === JsonRpc_ParseError.code) return JsonRpc_ParseError
      if (code === JsonRpc_ResourceNotFoundError.code)
        return JsonRpc_ResourceNotFoundError
      if (code === JsonRpc_ResourceUnavailableError.code)
        return JsonRpc_ResourceUnavailableError
      if (code === JsonRpc_TransactionRejectedError.code)
        return JsonRpc_TransactionRejectedError
      if (code === JsonRpc_VersionNotSupportedError.code)
        return JsonRpc_VersionNotSupportedError
      return JsonRpc_Error
    })()
    throw new JsonRpcError(response_.error)
  }
  return response_.result as never
}

export declare namespace JsonRpc_parseResponse {
  type Options<
    method extends JsonRpc_MethodGeneric | JsonRpc_MethodNameGeneric,
    safe extends boolean = false,
  > = {
    /**
     * JSON-RPC Method that was used to make the request. Used for typing the response.
     */
    method?:
      | method
      | JsonRpc_MethodGeneric
      | JsonRpc_MethodNameGeneric
      | undefined
    /**
     * Enables safe mode – responses will return an object with `result` and `error` properties instead of returning the `result` directly and throwing errors.
     *
     * - `true`: a JSON-RPC response object will be returned with `result` and `error` properties.
     * - `false`: the JSON-RPC response object's `result` property will be returned directly, and JSON-RPC Errors will be thrown.
     *
     * @default false
     */
    safe?: safe | boolean | undefined
  }

  type ReturnType<
    method extends JsonRpc_MethodGeneric | JsonRpc_MethodNameGeneric,
    safe extends boolean = false,
  > = safe extends true
    ? JsonRpc_Response<JsonRpc_ExtractMethodReturnType<method>>
    : JsonRpc_ExtractMethodReturnType<method>

  type ErrorType =
    | JsonRpc_ParseError
    | JsonRpc_InvalidInputError
    | JsonRpc_ResourceNotFoundError
    | JsonRpc_ResourceUnavailableError
    | JsonRpc_TransactionRejectedError
    | JsonRpc_MethodNotSupportedError
    | JsonRpc_LimitExceededError
    | JsonRpc_VersionNotSupportedError
    | JsonRpc_InvalidRequestError
    | JsonRpc_MethodNotFoundError
    | JsonRpc_InvalidParamsError
    | JsonRpc_InternalError
    | JsonRpc_ErrorType
    | GlobalErrorType
}

JsonRpc_parseResponse.parseError = (error: unknown) =>
  /* v8 ignore next */
  error as JsonRpc_parseResponse.ErrorType
