/* eslint-disable jsdoc-js/require-jsdoc, jsdoc-js/require-description, jsdoc-js/require-example */
import * as z_Address from '../../Address.js'
import * as z_Hex from '../../Hex.js'
import * as z_TransactionReceipt from '../../TransactionReceipt.js'
import * as z_TransactionRequest from '../../TransactionRequest.js'
import * as z from 'zod/mini'
import { from } from './from.js'

const NoParams = z.optional(z.tuple([]))

const Capabilities = z.record(z.string(), z.any())
const CapabilitiesMap = z.record(z_Hex.Hex, Capabilities)

const AddEthereumChainParameters = z.object({
  chainId: z.string(),
  chainName: z.string(),
  nativeCurrency: z.optional(
    z.object({
      name: z.string(),
      symbol: z.string(),
      decimals: z.number(),
    }),
  ),
  rpcUrls: z.array(z.string()),
  blockExplorerUrls: z.optional(z.array(z.string())),
  iconUrls: z.optional(z.array(z.string())),
})

const GetCallsStatusReturnType = z.object({
  atomic: z.boolean(),
  capabilities: z.optional(Capabilities),
  chainId: z_Hex.Hex,
  id: z.string(),
  receipts: z.optional(
    z.array(
      z.object({
        logs: z.array(
          z.object({
            address: z_Hex.Hex,
            data: z_Hex.Hex,
            topics: z.array(z_Hex.Hex),
          }),
        ),
        status: z_Hex.Hex,
        blockHash: z_Hex.Hex,
        blockNumber: z_Hex.Hex,
        gasUsed: z_Hex.Hex,
        transactionHash: z_Hex.Hex,
      }),
    ),
  ),
  status: z.number(),
  version: z.string(),
})

const Permission = z.object({
  caveats: z.array(z.object({ type: z.string(), value: z.any() })),
  date: z.number(),
  id: z.string(),
  invoker: z.string(),
  parentCapability: z.string(),
})

const PermissionRequest = z.object({
  eth_accounts: z.record(z.string(), z.any()),
})

const GrantPermissionsParameters = z.object({
  signer: z.optional(
    z.object({ type: z.string(), data: z.optional(z.unknown()) }),
  ),
  permissions: z.array(
    z.object({
      data: z.unknown(),
      policies: z.array(z.object({ data: z.unknown(), type: z.string() })),
      required: z.optional(z.boolean()),
      type: z.string(),
    }),
  ),
  expiry: z.number(),
})

const GrantPermissionsReturnType = z.object({
  expiry: z.number(),
  factory: z.optional(z_Hex.Hex),
  factoryData: z.optional(z.string()),
  grantedPermissions: z.array(
    z.object({
      data: z.unknown(),
      policies: z.array(z.object({ data: z.unknown(), type: z.string() })),
      required: z.optional(z.boolean()),
      type: z.string(),
    }),
  ),
  permissionsContext: z.string(),
  signerData: z.optional(
    z.object({
      userOpBuilder: z.optional(z_Hex.Hex),
      submitToAddress: z.optional(z_Hex.Hex),
    }),
  ),
})

const SendCallsParameters = z.tuple([
  z.object({
    atomicRequired: z.boolean(),
    calls: z.array(
      z.object({
        capabilities: z.optional(Capabilities),
        to: z.optional(z_Address.Address),
        data: z.optional(z_Hex.Hex),
        value: z.optional(z_Hex.Hex),
      }),
    ),
    capabilities: z.optional(Capabilities),
    chainId: z.optional(z_Hex.Hex),
    id: z.optional(z.string()),
    from: z.optional(z_Address.Address),
    version: z.string(),
  }),
])

const SendCallsReturnType = z.object({
  capabilities: z.optional(Capabilities),
  id: z.string(),
})

const WatchAssetParameters = z.object({
  type: z.literal('ERC20'),
  options: z.object({
    address: z.string(),
    symbol: z.string(),
    decimals: z.number(),
    image: z.optional(z.string()),
  }),
})

export const eth_requestAccounts = from({
  method: 'eth_requestAccounts',
  params: NoParams,
  returns: z.array(z_Address.Address),
})

export const eth_sendRawTransaction = from({
  method: 'eth_sendRawTransaction',
  params: z.tuple([z_Hex.Hex]),
  returns: z_Hex.Hex,
})

export const eth_sendRawTransactionSync = from({
  method: 'eth_sendRawTransactionSync',
  params: z.union([z.tuple([z_Hex.Hex]), z.tuple([z_Hex.Hex, z.number()])]),
  returns: z_TransactionReceipt.TransactionReceipt,
})

export const eth_sendTransaction = from({
  method: 'eth_sendTransaction',
  params: z.tuple([z_TransactionRequest.TransactionRequest]),
  returns: z_Hex.Hex,
})

export const eth_signTransaction = from({
  method: 'eth_signTransaction',
  params: z.tuple([z_TransactionRequest.TransactionRequest]),
  returns: z_Hex.Hex,
})

export const eth_signTypedData_v4 = from({
  method: 'eth_signTypedData_v4',
  params: z.tuple([z_Address.Address, z.string()]),
  returns: z_Hex.Hex,
})

export const personal_sign = from({
  method: 'personal_sign',
  params: z.tuple([z_Hex.Hex, z_Address.Address]),
  returns: z_Hex.Hex,
})

export const wallet_addEthereumChain = from({
  method: 'wallet_addEthereumChain',
  params: z.tuple([AddEthereumChainParameters]),
  returns: z.null(),
})

export const wallet_getCallsStatus = from({
  method: 'wallet_getCallsStatus',
  params: z.optional(z.tuple([z.string()])),
  returns: GetCallsStatusReturnType,
})

export const wallet_getCapabilities = from({
  method: 'wallet_getCapabilities',
  params: z.optional(
    z.union([
      z.tuple([]),
      z.tuple([z.optional(z_Address.Address)]),
      z.tuple([z.optional(z_Address.Address), z.optional(z.array(z_Hex.Hex))]),
    ]),
  ),
  returns: CapabilitiesMap,
})

export const wallet_getPermissions = from({
  method: 'wallet_getPermissions',
  params: NoParams,
  returns: z.array(Permission),
})

export const wallet_grantPermissions = from({
  method: 'wallet_grantPermissions',
  params: z.optional(z.tuple([GrantPermissionsParameters])),
  returns: GrantPermissionsReturnType,
})

export const wallet_requestPermissions = from({
  method: 'wallet_requestPermissions',
  params: z.tuple([PermissionRequest]),
  returns: z.array(Permission),
})

export const wallet_revokePermissions = from({
  method: 'wallet_revokePermissions',
  params: z.tuple([PermissionRequest]),
  returns: z.null(),
})

export const wallet_sendCalls = from({
  method: 'wallet_sendCalls',
  params: SendCallsParameters,
  returns: SendCallsReturnType,
})

export const wallet_showCallsStatus = from({
  method: 'wallet_showCallsStatus',
  params: z.tuple([z.string()]),
  returns: z.undefined(),
})

export const wallet_switchEthereumChain = from({
  method: 'wallet_switchEthereumChain',
  params: z.tuple([z.object({ chainId: z.string() })]),
  returns: z.null(),
})

export const wallet_watchAsset = from({
  method: 'wallet_watchAsset',
  params: z.tuple([WatchAssetParameters]),
  returns: z.boolean(),
})
