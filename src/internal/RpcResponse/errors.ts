import type { RpcResponse_ErrorObject } from './types.js'

export type RpcResponse_ErrorType = RpcResponse_Error & { name: 'JsonRpcError' }
export class RpcResponse_Error extends Error {
  override name = 'JsonRpcError'

  readonly code: number
  readonly data?: unknown | undefined

  constructor(errorObject: RpcResponse_ErrorObject) {
    const { code, message, data } = errorObject
    super(message)
    this.code = code
    this.data = data
  }
}

export class RpcResponse_InvalidInputError extends RpcResponse_Error {
  static readonly code = -32000
  override readonly code = -32000
  override readonly name = 'JsonRpcInvalidInputError'
}

export class RpcResponse_ResourceNotFoundError extends RpcResponse_Error {
  static readonly code = -32001
  override readonly code = -32001
  override readonly name = 'JsonRpcResourceNotFoundError'
}

export class RpcResponse_ResourceUnavailableError extends RpcResponse_Error {
  static readonly code = -32002
  override readonly code = -32002
  override readonly name = 'JsonRpcResourceUnavailableError'
}

export class RpcResponse_TransactionRejectedError extends RpcResponse_Error {
  static readonly code = -32003
  override readonly code = -32003
  override readonly name = 'JsonRpcTransactionRejectedError'
}

export class RpcResponse_MethodNotSupportedError extends RpcResponse_Error {
  static readonly code = -32004
  override readonly code = -32004
  override readonly name = 'JsonRpcMethodNotSupportedError'
}

export class RpcResponse_LimitExceededError extends RpcResponse_Error {
  static readonly code = -32005
  override readonly code = -32005
  override readonly name = 'JsonRpcLimitExceededError'
}

export class RpcResponse_VersionNotSupportedError extends RpcResponse_Error {
  static readonly code = -32006
  override readonly code = -32006
  override readonly name = 'JsonRpcVersionNotSupportedError'
}

export class RpcResponse_InvalidRequestError extends RpcResponse_Error {
  static readonly code = -32600
  override readonly code = -32600
  override readonly name = 'JsonRpcInvalidRequestError'
}

export class RpcResponse_MethodNotFoundError extends RpcResponse_Error {
  static readonly code = -32601
  override readonly code = -32601
  override readonly name = 'JsonRpcMethodNotFoundError'
}

export class RpcResponse_InvalidParamsError extends RpcResponse_Error {
  static readonly code = -32602
  override readonly code = -32602
  override readonly name = 'JsonRpcInvalidParamsError'
}

export class RpcResponse_InternalError extends RpcResponse_Error {
  static readonly code = -32603
  override readonly code = -32603
  override readonly name = 'JsonRpcInternalErrorError'
}

export class RpcResponse_ParseError extends RpcResponse_Error {
  static readonly code = -32700
  override readonly code = -32700
  override readonly name = 'JsonRpcParseError'
}
