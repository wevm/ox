import type { Provider } from '../internal/Provider/types.js'

// TODO add this
type EIP1193Provider = any

declare global {
  interface Window {
    ethereum?: Provider | undefined
  }
  interface WindowEventMap {
    'eip6963:requestProvider': Event & {type: 'eip6963:requestProvider'}
    'eip6963:announceProvider': CustomEvent<{
      info:   {
        icon: `data:image/${string}`
        name: string
        rdns: string
        uuid: string
      }
      provider: EIP1193Provider
    }> & {type: 'eip6963:announceProvider'}
  }
}
