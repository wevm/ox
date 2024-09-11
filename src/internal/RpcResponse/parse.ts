import type { GlobalErrorType } from '../Errors/error.js'
import type { RpcRequest } from '../RpcRequest/types.js'
import type { Compute } from '../types.js'
import {
  RpcResponse_Error,
  type RpcResponse_ErrorType,
  RpcResponse_InternalError,
  RpcResponse_InvalidInputError,
  RpcResponse_InvalidParamsError,
  RpcResponse_InvalidRequestError,
  RpcResponse_LimitExceededError,
  RpcResponse_MethodNotFoundError,
  RpcResponse_MethodNotSupportedError,
  RpcResponse_ParseError,
  RpcResponse_ResourceNotFoundError,
  RpcResponse_ResourceUnavailableError,
  RpcResponse_TransactionRejectedError,
  RpcResponse_VersionNotSupportedError,
} from './errors.js'
import type { RpcResponse } from './types.js'

/**
 * A type-safe interface to parse a JSON-RPC response object as per the [JSON-RPC 2.0 specification](https://www.jsonrpc.org/specification#response_object), and extract the result.
 *
 * @example
 * ```ts twoslash
 * import { RpcRequest, RpcResponse } from 'ox'
 *
 * // 1. Create a request store.
 * const store = RpcRequest.createStore()
 *
 * // 2. Get a request object.
 * const request = store.prepare({
 *   method: 'eth_getBlockByNumber',
 *   params: ['0x1', false],
 * })
 *
 * // 3. Send the JSON-RPC request via HTTP.
 * const block = await fetch('https://1.rpc.thirdweb.com', {
 *   body: JSON.stringify(request),
 *   headers: {
 *     'Content-Type': 'application/json',
 *   },
 *   method: 'POST',
 * })
 *  .then((response) => response.json())
 *  // 4. Parse the JSON-RPC response into a type-safe result. // [!code focus]
 *  .then((response) => RpcResponse.parse(response, { request })) // [!code focus]
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
 * // @noErrors
 * import { RpcResponse } from 'ox'
 *
 * const block = await fetch('https://1.rpc.thirdweb.com', {})
 *  .then((response) => response.json())
 *  .then((response) => RpcResponse.parse(response, { request })) // [!code --]
 *  .then(RpcResponse.parse) // [!code ++]
 * ```
 * :::
 *
 * @example
 * ### Safe Mode
 *
 * If `safe` is `true`, the response will be returned as an object with `result` and `error` properties instead of returning the `result` directly and throwing errors.
 *
 * ```ts twoslash
 * import { RpcRequest, RpcResponse } from 'ox'
 *
 * const store = RpcRequest.createStore()
 *
 * const request = store.prepare({
 *   method: 'eth_blockNumber',
 * })
 *
 * const response = RpcResponse.parse({}, {
 *   request,
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
export function RpcResponse_parse<returnType, safe extends boolean = false>(
  response: unknown,
  options: RpcResponse_parse.Options<returnType, safe> = {},
): RpcResponse_parse.ReturnType<returnType, safe> {
  const { safe = false } = options
  const response_ = response as RpcResponse
  if (safe) return response as never
  if (response_.error) {
    const { code } = response_.error
    const JsonRpcError = (() => {
      if (code === RpcResponse_InternalError.code)
        return RpcResponse_InternalError
      if (code === RpcResponse_InvalidInputError.code)
        return RpcResponse_InvalidInputError
      if (code === RpcResponse_InvalidParamsError.code)
        return RpcResponse_InvalidParamsError
      if (code === RpcResponse_InvalidRequestError.code)
        return RpcResponse_InvalidRequestError
      if (code === RpcResponse_LimitExceededError.code)
        return RpcResponse_LimitExceededError
      if (code === RpcResponse_MethodNotFoundError.code)
        return RpcResponse_MethodNotFoundError
      if (code === RpcResponse_MethodNotSupportedError.code)
        return RpcResponse_MethodNotSupportedError
      if (code === RpcResponse_ParseError.code) return RpcResponse_ParseError
      if (code === RpcResponse_ResourceNotFoundError.code)
        return RpcResponse_ResourceNotFoundError
      if (code === RpcResponse_ResourceUnavailableError.code)
        return RpcResponse_ResourceUnavailableError
      if (code === RpcResponse_TransactionRejectedError.code)
        return RpcResponse_TransactionRejectedError
      if (code === RpcResponse_VersionNotSupportedError.code)
        return RpcResponse_VersionNotSupportedError
      return RpcResponse_Error
    })()
    throw new JsonRpcError(response_.error)
  }
  return response_.result as never
}

export declare namespace RpcResponse_parse {
  type Options<returnType, safe extends boolean = false> = {
    /**
     * JSON-RPC Method that was used to make the request. Used for typing the response.
     */
    request?:
      | {
          _returnType: returnType
        }
      | RpcRequest
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

  type ReturnType<returnType, safe extends boolean = false> = Compute<
    safe extends true ? RpcResponse<returnType> : returnType
  >

  type ErrorType =
    | RpcResponse_ParseError
    | RpcResponse_InvalidInputError
    | RpcResponse_ResourceNotFoundError
    | RpcResponse_ResourceUnavailableError
    | RpcResponse_TransactionRejectedError
    | RpcResponse_MethodNotSupportedError
    | RpcResponse_LimitExceededError
    | RpcResponse_VersionNotSupportedError
    | RpcResponse_InvalidRequestError
    | RpcResponse_MethodNotFoundError
    | RpcResponse_InvalidParamsError
    | RpcResponse_InternalError
    | RpcResponse_ErrorType
    | GlobalErrorType
}

RpcResponse_parse.parseError = (error: unknown) =>
  /* v8 ignore next */
  error as RpcResponse_parse.ErrorType
