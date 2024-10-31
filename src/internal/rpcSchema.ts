import type * as Address from '../Address.js'
import type * as Hex from '../Hex.js'

/**
 * Parameters for `wallet_addEthereumChain`. [See more](https://eips.ethereum.org/EIPS/eip-3085).
 * @internal
 */
export type WalletAddEthereumChainParameters = {
  /** A 0x-prefixed hexadecimal string */
  chainId: string
  /** The chain name. */
  chainName: string
  /** Native currency for the chain. */
  nativeCurrency?:
    | {
        name: string
        symbol: string
        decimals: number
      }
    | undefined
  rpcUrls: readonly string[]
  blockExplorerUrls?: readonly string[] | undefined
  iconUrls?: readonly string[] | undefined
}

/**
 * Capabilities of a wallet. [See more](https://eips.ethereum.org/EIPS/eip-5792#wallet_getcapabilities).
 * @internal
 */
export type WalletCapabilities = {
  [capability: string]: any
}

/**
 * Capabilities of a wallet, mapped to chain IDs. [See more](https://eips.ethereum.org/EIPS/eip-5792#wallet_getcapabilities).
 * @internal
 */
export type WalletCapabilitiesMap = {
  [chainId: Hex.Hex]: WalletCapabilities
}

/**
 * Return type for `wallet_getCallsStatus`. [See more](https://eips.ethereum.org/EIPS/eip-5792#wallet_getcallsstatus).
 * @internal
 */
export type WalletGetCallsStatusReturnType = {
  status: 'PENDING' | 'CONFIRMED'
  receipts?:
    | readonly {
        logs: {
          address: Hex.Hex
          data: Hex.Hex
          topics: readonly Hex.Hex[]
        }[]
        status: Hex.Hex
        blockHash: Hex.Hex
        blockNumber: Hex.Hex
        gasUsed: Hex.Hex
        transactionHash: Hex.Hex
      }[]
    | undefined
}

/**
 * Caveat for a wallet permission. [See more](https://eips.ethereum.org/EIPS/eip-2255).
 * @internal
 */
export type WalletPermissionCaveat = {
  type: string
  value: any
}

/**
 * A wallet permission. [See more](https://eips.ethereum.org/EIPS/eip-2255).
 * @internal
 */
export type WalletPermission = {
  caveats: readonly WalletPermissionCaveat[]
  date: number
  id: string
  invoker: `http://${string}` | `https://${string}`
  parentCapability: 'eth_accounts' | string
}

/**
 * Parameters for `wallet_grantPermissions`. [See more](https://eips.ethereum.org/EIPS/eip-7715).
 * @internal
 */
export type WalletGrantPermissionsParameters = {
  signer?:
    | {
        type: string
        data?: unknown | undefined
      }
    | undefined
  permissions: readonly {
    data: unknown
    policies: readonly {
      data: unknown
      type: string
    }[]
    required?: boolean | undefined
    type: string
  }[]
  expiry: number
}

/**
 * Return type for `wallet_grantPermissions`. [See more](https://eips.ethereum.org/EIPS/eip-7715).
 * @internal
 */
export type WalletGrantPermissionsReturnType = {
  expiry: number
  factory?: `0x${string}` | undefined
  factoryData?: string | undefined
  grantedPermissions: readonly {
    data: unknown
    policies: readonly {
      data: unknown
      type: string
    }[]
    required?: boolean | undefined
    type: string
  }[]
  permissionsContext: string
  signerData?:
    | {
        userOpBuilder?: `0x${string}` | undefined
        submitToAddress?: `0x${string}` | undefined
      }
    | undefined
}

/**
 * Parameters for `wallet_sendCalls`. [See more](https://eips.ethereum.org/EIPS/eip-5792).
 * @internal
 */
export type WalletSendCallsParameters = [
  {
    calls: readonly {
      to?: Address.Address | undefined
      data?: Hex.Hex | undefined
      value?: Hex.Hex | undefined
    }[]
    capabilities?: WalletCapabilities | undefined
    chainId?: Hex.Hex | undefined
    from: Address.Address
    version: string
  },
]

/**
 * Parameters for `wallet_watchAsset`. [See more](https://eips.ethereum.org/EIPS/eip-747).
 * @internal
 */
export type WalletWatchAssetParameters = {
  /** Token type. */
  type: 'ERC20'
  options: {
    /** The address of the token contract */
    address: string
    /** A ticker symbol or shorthand, up to 11 characters */
    symbol: string
    /** The number of token decimals */
    decimals: number
    /** A string url of the token logo */
    image?: string | undefined
  }
}
