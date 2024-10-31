import type { EventEmitter } from 'eventemitter3'
import type * as RpcSchema from '../../RpcSchema.js'
import type { Address } from '../Address/types.js'
import type { Compute } from '../types.js'

/** Options for a {@link ox#Provider.Provider}. */
export type Provider_Options = {
  /**
   * Whether to include event functions (`on`, `removeListener`) on the Provider.
   *
   * @default true
   */
  includeEvents?: boolean | undefined
  /**
   * RPC Schema to use for the Provider's `request` function.
   * See {@link ox#RpcSchema.(from:function)} for more.
   *
   * @default `RpcSchema.Generic`
   */
  schema?: RpcSchema.Generic | undefined
}

/** Root type for an EIP-1193 Provider. */
export type Provider<
  options extends Provider_Options | undefined = undefined,
  ///
  _schema extends RpcSchema.Generic = options extends {
    schema: infer schema extends RpcSchema.Generic
  }
    ? schema
    : RpcSchema.All,
> = Compute<
  {
    request: Provider_RequestFn<_schema>
  } & (options extends { includeEvents: true } | undefined
    ? {
        on: Provider_EventListenerFn
        removeListener: Provider_EventListenerFn
      }
    : {})
>

/** Type for an EIP-1193 Provider's event emitter. */
export type Provider_Emitter = Compute<EventEmitter<Provider_EventMap>>

/** EIP-1193 Provider's `request` function. */
export type Provider_RequestFn<
  schema extends RpcSchema.Generic = RpcSchema.Generic,
> = <
  methodName extends
    | RpcSchema.Generic
    | RpcSchema.MethodNameGeneric = RpcSchema.MethodNameGeneric,
>(
  parameters: RpcSchema.ExtractRequest<methodName, schema>,
) => Promise<RpcSchema.ExtractReturnType<methodName, schema>>

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
