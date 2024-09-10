import type { Provider } from '../internal/Provider/types.js'

declare global {
  interface Window {
    ethereum?: Provider | undefined
  }
}
