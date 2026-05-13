import type {
  EIP6963AnnounceProviderEvent,
  EIP6963RequestProviderEvent,
  Provider,
} from '../core/Provider.js'

declare global {
  interface Window {
    ethereum?: Provider | undefined
  }

  interface WindowEventMap {
    'eip6963:announceProvider': EIP6963AnnounceProviderEvent
    'eip6963:requestProvider': EIP6963RequestProviderEvent
  }
}
