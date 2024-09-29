import type { Address } from '../Address/types.js'
import type { Hex } from '../Hex/types.js'
import type { Compute } from '../types.js'

/** Set of all JSON-RPC Methods for the `wallet_` namespace. */
export type RpcNamespace_MethodsWallet = [
  /**
   * Requests that the user provides an Ethereum address to be identified by.
   *
   * @see {@link https://eips.ethereum.org/EIPS/eip-1102}
   */
  {
    method: 'eth_requestAccounts'
    params?: undefined
    returnType: readonly Address[]
  },
  /**
   * Calculates an Ethereum-specific signature in the form of `keccak256("\x19Ethereum Signed Message:\n" + len(message) + message))`
   *
   * @see {@link https://eips.ethereum.org/EIPS/eip-1474}
   */
  {
    method: 'personal_sign'
    params: [
      /** Data to sign */
      data: Hex,
      /** Address to use for signing */
      address: Address,
    ]
    returnType: Hex
  },
  /**
   * Add an Ethereum chain to the wallet.
   *
   * @see {@link https://eips.ethereum.org/EIPS/eip-3085}
   */
  {
    method: 'wallet_addEthereumChain'
    params: [chain: Compute<RpcNamespace_WalletAddEthereumChainParameters>]
    returnType: null
  },
  /**
   * Returns the status of a call batch that was sent via `wallet_sendCalls`.
   *
   * @see {@link https://eips.ethereum.org/EIPS/eip-5792}
   */
  {
    method: 'wallet_getCallsStatus'
    params?: [string]
    returnType: Compute<RpcNamespace_WalletGetCallsStatusReturnType>
  },
  /**
   * Gets the connected wallet's capabilities.
   *
   * @see {@link https://eips.ethereum.org/EIPS/eip-5792}
   */
  {
    method: 'wallet_getCapabilities'
    params?: [Address]
    returnType: Compute<RpcNamespace_WalletCapabilitiesMap>
  },
  /**
   * Gets the wallets current permissions.
   *
   * @see {@link https://eips.ethereum.org/EIPS/eip-2255}
   */
  {
    method: 'wallet_getPermissions'
    params?: undefined
    returnType: readonly Compute<RpcNamespace_WalletPermission>[]
  },
  /**
   * Requests permissions from a wallet.
   *
   * @see {@link https://eips.ethereum.org/EIPS/eip-7715}
   */
  {
    method: 'wallet_grantPermissions'
    params?: [RpcNamespace_WalletGrantPermissionsParameters]
    returnType: Compute<RpcNamespace_WalletGrantPermissionsReturnType>
  },
  /**
   * Requests the given permissions from the user.
   *
   * @see {@link https://eips.ethereum.org/EIPS/eip-2255}
   */
  {
    method: 'wallet_requestPermissions'
    params: [permissions: { eth_accounts: Record<string, any> }]
    returnType: readonly Compute<RpcNamespace_WalletPermission>[]
  },
  /**
   * Revokes the given permissions from the user.
   *
   * @see {@link https://github.com/MetaMask/metamask-improvement-proposals/blob/main/MIPs/mip-2.md}
   */
  {
    method: 'wallet_revokePermissions'
    params: [permissions: { eth_accounts: Record<string, any> }]
    returnType: null
  },
  /**
   * Requests the connected wallet to send a batch of calls.
   *
   * @see {@link https://eips.ethereum.org/EIPS/eip-5792}
   */
  {
    method: 'wallet_sendCalls'
    params?: Compute<RpcNamespace_WalletSendCallsParameters>
    returnType: string
  },
  /**
   * Requests for the wallet to show information about a call batch
   * that was sent via `wallet_sendCalls`.
   *
   * @see {@link https://eips.ethereum.org/EIPS/eip-5792}
   */
  {
    method: 'wallet_showCallsStatus'
    params?: [string]
    returnType: undefined
  },
  /**
   * Switch the wallet to the given Ethereum chain.
   *
   * @see {@link https://eips.ethereum.org/EIPS/eip-3326}
   */
  {
    method: 'wallet_switchEthereumChain'
    params: [chain: { chainId: string }]
    returnType: null
  },
  /**
   * Requests that the user tracks the token in their wallet. Returns a boolean indicating if the token was successfully added.
   *
   * @see {@link https://eips.ethereum.org/EIPS/eip-747}
   */
  {
    method: 'wallet_watchAsset'
    params: [Compute<RpcNamespace_WalletWatchAssetParameters>]
    returnType: boolean
  },
]

/** Union of all JSON-RPC Methods for the `wallet_` namespace. */
export type RpcNamespace_MethodWallet = RpcNamespace_MethodsWallet[number]

/** Union of all JSON-RPC Method Names for the `wallet_` namespace. */
export type RpcNamespace_MethodNameWallet = RpcNamespace_MethodWallet['method']

//////////////////////////////////////////////////////////////////
// Parameter & Return Types
//////////////////////////////////////////////////////////////////

/** Parameters for `wallet_addEthereumChain`. [See more](https://eips.ethereum.org/EIPS/eip-3085). */
export type RpcNamespace_WalletAddEthereumChainParameters = {
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

/** Receipt for a Call sent via `wallet_sendCalls`. [See more](https://eips.ethereum.org/EIPS/eip-5792#wallet_getcallsstatus). */
export type RpcNamespace_WalletCallReceipt<bigintType = Hex, status = Hex> = {
  logs: {
    address: Hex
    data: Hex
    topics: readonly Hex[]
  }[]
  status: status
  blockHash: Hex
  blockNumber: bigintType
  gasUsed: bigintType
  transactionHash: Hex
}

/** Capabilities of a wallet. [See more](https://eips.ethereum.org/EIPS/eip-5792#wallet_getcapabilities). */
export type RpcNamespace_WalletCapabilities = {
  [capability: string]: any
}

/** Capabilities of a wallet, mapped to chain IDs. [See more](https://eips.ethereum.org/EIPS/eip-5792#wallet_getcapabilities). */
export type RpcNamespace_WalletCapabilitiesMap<
  capabilities extends
    RpcNamespace_WalletCapabilities = RpcNamespace_WalletCapabilities,
  id extends string | number = Hex,
> = {
  [chainId in id]: capabilities
}

/** Return type for `wallet_getCallsStatus`. [See more](https://eips.ethereum.org/EIPS/eip-5792#wallet_getcallsstatus). */
export type RpcNamespace_WalletGetCallsStatusReturnType<
  bigintType = Hex,
  status = Hex,
> = {
  status: 'PENDING' | 'CONFIRMED'
  receipts?:
    | readonly RpcNamespace_WalletCallReceipt<bigintType, status>[]
    | undefined
}

/** Caveat for a wallet permission. [See more](https://eips.ethereum.org/EIPS/eip-2255). */
export type RpcNamespace_WalletPermissionCaveat = {
  type: string
  value: any
}

/** A wallet permission. [See more](https://eips.ethereum.org/EIPS/eip-2255). */
export type RpcNamespace_WalletPermission = {
  caveats: readonly RpcNamespace_WalletPermissionCaveat[]
  date: number
  id: string
  invoker: `http://${string}` | `https://${string}`
  parentCapability: 'eth_accounts' | string
}

/** Parameters for `wallet_grantPermissions`. [See more](https://eips.ethereum.org/EIPS/eip-7715). */
export type RpcNamespace_WalletGrantPermissionsParameters = {
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

/** Return type for `wallet_grantPermissions`. [See more](https://eips.ethereum.org/EIPS/eip-7715). */
export type RpcNamespace_WalletGrantPermissionsReturnType = {
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

/** Parameters for `wallet_sendCalls`. [See more](https://eips.ethereum.org/EIPS/eip-5792). */
export type RpcNamespace_WalletSendCallsParameters<
  capabilities extends
    RpcNamespace_WalletCapabilities = RpcNamespace_WalletCapabilities,
  chainId extends Hex | number = Hex,
  bigintType extends Hex | bigint = Hex,
> = [
  {
    calls: readonly {
      to?: Address | undefined
      data?: Hex | undefined
      value?: bigintType | undefined
    }[]
    capabilities?: capabilities | undefined
    chainId?: chainId | undefined
    from: Address
    version: string
  },
]

/** Parameters for `wallet_watchAsset`. [See more](https://eips.ethereum.org/EIPS/eip-747). */
export type RpcNamespace_WalletWatchAssetParameters = {
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
