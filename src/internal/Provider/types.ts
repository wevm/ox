import type { EventEmitter } from 'eventemitter3'
import type { Address } from '../Address/types.js'
import type {
  RpcRequest_ExtractMethodParameters,
  RpcRequest_ExtractMethodReturnType,
  RpcRequest_MethodGeneric,
  RpcRequest_MethodNameGeneric,
} from '../RpcRequest/types.js'
import type { Compute } from '../types.js'

export type Provider_Options = {
  includeEvents: boolean
}

export type Provider_OptionsDefault = {
  includeEvents: true
}

export type Provider<
  options extends Provider_Options = Provider_OptionsDefault,
> = Compute<
  {
    request: Provider_RequestFn
  } & (options['includeEvents'] extends true
    ? {
        on: Provider_EventListenerFn
        removeListener: Provider_EventListenerFn
      }
    : {})
>

export type Provider_Emitter = Compute<EventEmitter<Provider_EventMap>>

export type Provider_RequestFn = <
  method extends RpcRequest_MethodGeneric | RpcRequest_MethodNameGeneric,
>(
  method: RpcRequest_ExtractMethodParameters<method>,
) => Promise<RpcRequest_ExtractMethodReturnType<method>>

export type Provider_EventListenerFn = <event extends keyof Provider_EventMap>(
  event: event,
  listener: Provider_EventMap[event],
) => void

////////////////////////////////////////////////////////////
// Events
////////////////////////////////////////////////////////////

export type Provider_ConnectInfo = {
  chainId: string
}

export type Provider_Message = {
  type: string
  data: unknown
}

export class ProviderRpcError extends Error {
  override readonly name = 'ProviderRpcError'

  code: number
  details: string

  constructor(code: number, message: string) {
    super(message)
    this.code = code
    this.details = message
  }
}

export type Provider_EventMap = {
  accountsChanged: (accounts: Address[]) => void
  chainChanged: (chainId: string) => void
  connect: (connectInfo: Provider_ConnectInfo) => void
  disconnect: (error: ProviderRpcError) => void
  message: (message: Provider_Message) => void
}
