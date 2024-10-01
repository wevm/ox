import type { EventEmitter } from 'eventemitter3'
import type { Address } from '../Address/types.js'
import type {
  RpcSchema_ExtractRequest,
  RpcSchema_ExtractReturnType,
  RpcSchema_Generic,
  RpcSchema_MethodNameGeneric,
} from '../RpcSchema/types.js'
import type { Compute } from '../types.js'

/** Options for a {@link ox#Provider.Provider}. */
export type Provider_Options = {
  includeEvents: boolean
}

/** Default options for a {@link ox#Provider.Provider}. */
export type Provider_OptionsDefault = {
  includeEvents: true
}

/** Root type for an EIP-1193 Provider. */
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

/** Type for an EIP-1193 Provider's event emitter. */
export type Provider_Emitter = Compute<EventEmitter<Provider_EventMap>>

/** EIP-1193 Provider's `request` function. */
export type Provider_RequestFn = <
  schema extends RpcSchema_Generic | RpcSchema_MethodNameGeneric,
>(
  parameters: RpcSchema_ExtractRequest<schema>,
) => Promise<RpcSchema_ExtractReturnType<schema>>

/** Type for an EIP-1193 Provider's event listener functions (`on`, `removeListener`, etc). */
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
