import type { Provider } from '../Provider.js'

declare global {
  interface Window {
    ethereum?: Provider | undefined
  }
}
