import type { JsonRpc_ErrorObject } from './types.js'

export type JsonRpc_ErrorType = JsonRpc_Error & { name: 'JsonRpcError' }
export class JsonRpc_Error extends Error {
  override name = 'JsonRpcError'

  readonly code: number
  readonly data?: unknown | undefined

  constructor(errorObject: JsonRpc_ErrorObject) {
    const { code, message, data } = errorObject
    super(message)
    this.code = code
    this.data = data
  }
}

export class JsonRpc_InvalidInputError extends JsonRpc_Error {
  static readonly code = -32000
  override readonly code = -32000
  override readonly name = 'JsonRpcInvalidInputError'
}

export class JsonRpc_ResourceNotFoundError extends JsonRpc_Error {
  static readonly code = -32001
  override readonly code = -32001
  override readonly name = 'JsonRpcResourceNotFoundError'
}

export class JsonRpc_ResourceUnavailableError extends JsonRpc_Error {
  static readonly code = -32002
  override readonly code = -32002
  override readonly name = 'JsonRpcResourceUnavailableError'
}

export class JsonRpc_TransactionRejectedError extends JsonRpc_Error {
  static readonly code = -32003
  override readonly code = -32003
  override readonly name = 'JsonRpcTransactionRejectedError'
}

export class JsonRpc_MethodNotSupportedError extends JsonRpc_Error {
  static readonly code = -32004
  override readonly code = -32004
  override readonly name = 'JsonRpcMethodNotSupportedError'
}

export class JsonRpc_LimitExceededError extends JsonRpc_Error {
  static readonly code = -32005
  override readonly code = -32005
  override readonly name = 'JsonRpcLimitExceededError'
}

export class JsonRpc_VersionNotSupportedError extends JsonRpc_Error {
  static readonly code = -32006
  override readonly code = -32006
  override readonly name = 'JsonRpcVersionNotSupportedError'
}

export class JsonRpc_InvalidRequestError extends JsonRpc_Error {
  static readonly code = -32600
  override readonly code = -32600
  override readonly name = 'JsonRpcInvalidRequestError'
}

export class JsonRpc_MethodNotFoundError extends JsonRpc_Error {
  static readonly code = -32601
  override readonly code = -32601
  override readonly name = 'JsonRpcMethodNotFoundError'
}

export class JsonRpc_InvalidParamsError extends JsonRpc_Error {
  static readonly code = -32602
  override readonly code = -32602
  override readonly name = 'JsonRpcInvalidParamsError'
}

export class JsonRpc_InternalError extends JsonRpc_Error {
  static readonly code = -32603
  override readonly code = -32603
  override readonly name = 'JsonRpcInternalErrorError'
}

export class JsonRpc_ParseError extends JsonRpc_Error {
  static readonly code = -32700
  override readonly code = -32700
  override readonly name = 'JsonRpcParseError'
}
