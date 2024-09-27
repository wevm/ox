import type { RpcResponse_ErrorObject } from './types.js'

/** Thrown when a JSON-RPC error has occurred. */
export type RpcResponse_ErrorType = RpcResponse_Error & { name: 'JsonRpcError' }
export class RpcResponse_Error extends Error {
  override name = 'RpcResponse_Error'

  readonly code: number
  readonly data?: unknown | undefined

  constructor(errorObject: RpcResponse_ErrorObject) {
    const { code, message, data } = errorObject
    super(message)
    this.code = code
    this.data = data
  }
}

/** Thrown when the input to a JSON-RPC method is invalid. */
export class RpcResponse_InvalidInputError extends RpcResponse_Error {
  static readonly code = -32000
  override readonly code = -32000
  override readonly name = 'RpcResponse.InvalidInputError'
}

/** Thrown when a JSON-RPC resource is not found. */
export class RpcResponse_ResourceNotFoundError extends RpcResponse_Error {
  static readonly code = -32001
  override readonly code = -32001
  override readonly name = 'RpcResponse.ResourceNotFoundError'
}

/** Thrown when a JSON-RPC resource is unavailable. */
export class RpcResponse_ResourceUnavailableError extends RpcResponse_Error {
  static readonly code = -32002
  override readonly code = -32002
  override readonly name = 'RpcResponse.ResourceUnavailableError'
}

/** Thrown when a JSON-RPC transaction is rejected. */
export class RpcResponse_TransactionRejectedError extends RpcResponse_Error {
  static readonly code = -32003
  override readonly code = -32003
  override readonly name = 'RpcResponse.TransactionRejectedError'
}

/** Thrown when a JSON-RPC method is not supported. */
export class RpcResponse_MethodNotSupportedError extends RpcResponse_Error {
  static readonly code = -32004
  override readonly code = -32004
  override readonly name = 'RpcResponse.MethodNotSupportedError'
}

/** Thrown when a rate-limit is exceeded. */
export class RpcResponse_LimitExceededError extends RpcResponse_Error {
  static readonly code = -32005
  override readonly code = -32005
  override readonly name = 'RpcResponse.LimitExceededError'
}

/** Thrown when a JSON-RPC version is not supported. */
export class RpcResponse_VersionNotSupportedError extends RpcResponse_Error {
  static readonly code = -32006
  override readonly code = -32006
  override readonly name = 'RpcResponse.VersionNotSupportedError'
}

/** Thrown when a JSON-RPC request is invalid. */
export class RpcResponse_InvalidRequestError extends RpcResponse_Error {
  static readonly code = -32600
  override readonly code = -32600
  override readonly name = 'RpcResponse.InvalidRequestError'
}

/** Thrown when a JSON-RPC method is not found. */
export class RpcResponse_MethodNotFoundError extends RpcResponse_Error {
  static readonly code = -32601
  override readonly code = -32601
  override readonly name = 'RpcResponse.MethodNotFoundError'
}

/** Thrown when the parameters to a JSON-RPC method are invalid. */
export class RpcResponse_InvalidParamsError extends RpcResponse_Error {
  static readonly code = -32602
  override readonly code = -32602
  override readonly name = 'RpcResponse.InvalidParamsError'
}

/** Thrown when an internal JSON-RPC error has occurred. */
export class RpcResponse_InternalError extends RpcResponse_Error {
  static readonly code = -32603
  override readonly code = -32603
  override readonly name = 'RpcResponse.InternalErrorError'
}

/** Thrown when a JSON-RPC response is invalid. */
export class RpcResponse_ParseError extends RpcResponse_Error {
  static readonly code = -32700
  override readonly code = -32700
  override readonly name = 'RpcResponse.ParseError'
}
