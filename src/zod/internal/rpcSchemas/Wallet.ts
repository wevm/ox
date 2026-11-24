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
  chainId: /* @__PURE__ */ z.string(),
  chainName: /* @__PURE__ */ z.string(),
  nativeCurrency: /* @__PURE__ */ z.optional(
    /* @__PURE__ */ z.object({
      name: /* @__PURE__ */ z.string(),
      symbol: /* @__PURE__ */ z.string(),
      decimals: /* @__PURE__ */ z.number(),
    }),
  ),
  rpcUrls: /* @__PURE__ */ z.array(/* @__PURE__ */ z.string()),
  blockExplorerUrls: /* @__PURE__ */ z.optional(
    /* @__PURE__ */ z.array(/* @__PURE__ */ z.string()),
  ),
  iconUrls: /* @__PURE__ */ z.optional(
    /* @__PURE__ */ z.array(/* @__PURE__ */ z.string()),
  ),
})

const GetCallsStatusReturnType = z.object({
  atomic: /* @__PURE__ */ z.boolean(),
  capabilities: /* @__PURE__ */ z.optional(Capabilities),
  chainId: z_Hex.Hex,
  id: /* @__PURE__ */ z.string(),
  receipts: /* @__PURE__ */ z.optional(
    /* @__PURE__ */ z.array(
      /* @__PURE__ */ z.object({
        logs: /* @__PURE__ */ z.array(
          /* @__PURE__ */ z.object({
            address: z_Hex.Hex,
            data: z_Hex.Hex,
            topics: /* @__PURE__ */ z.array(z_Hex.Hex),
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
  status: /* @__PURE__ */ z.number(),
  version: /* @__PURE__ */ z.string(),
})

const Permission = z.object({
  caveats: /* @__PURE__ */ z.array(
    /* @__PURE__ */ z.object({
      type: /* @__PURE__ */ z.string(),
      value: /* @__PURE__ */ z.any(),
    }),
  ),
  date: /* @__PURE__ */ z.number(),
  id: /* @__PURE__ */ z.string(),
  invoker: /* @__PURE__ */ z.string(),
  parentCapability: /* @__PURE__ */ z.string(),
})

const PermissionRequest = z.object({
  eth_accounts: /* @__PURE__ */ z.record(
    /* @__PURE__ */ z.string(),
    /* @__PURE__ */ z.any(),
  ),
})

const GrantPermissionsParameters = z.object({
  signer: /* @__PURE__ */ z.optional(
    /* @__PURE__ */ z.object({
      type: /* @__PURE__ */ z.string(),
      data: /* @__PURE__ */ z.optional(/* @__PURE__ */ z.unknown()),
    }),
  ),
  permissions: /* @__PURE__ */ z.array(
    /* @__PURE__ */ z.object({
      data: /* @__PURE__ */ z.unknown(),
      policies: /* @__PURE__ */ z.array(
        /* @__PURE__ */ z.object({
          data: /* @__PURE__ */ z.unknown(),
          type: /* @__PURE__ */ z.string(),
        }),
      ),
      required: /* @__PURE__ */ z.optional(/* @__PURE__ */ z.boolean()),
      type: /* @__PURE__ */ z.string(),
    }),
  ),
  expiry: /* @__PURE__ */ z.number(),
})

const GrantPermissionsReturnType = z.object({
  expiry: /* @__PURE__ */ z.number(),
  factory: /* @__PURE__ */ z.optional(z_Hex.Hex),
  factoryData: /* @__PURE__ */ z.optional(/* @__PURE__ */ z.string()),
  grantedPermissions: /* @__PURE__ */ z.array(
    /* @__PURE__ */ z.object({
      data: /* @__PURE__ */ z.unknown(),
      policies: /* @__PURE__ */ z.array(
        /* @__PURE__ */ z.object({
          data: /* @__PURE__ */ z.unknown(),
          type: /* @__PURE__ */ z.string(),
        }),
      ),
      required: /* @__PURE__ */ z.optional(/* @__PURE__ */ z.boolean()),
      type: /* @__PURE__ */ z.string(),
    }),
  ),
  permissionsContext: /* @__PURE__ */ z.string(),
  signerData: /* @__PURE__ */ z.optional(
    /* @__PURE__ */ z.object({
      userOpBuilder: /* @__PURE__ */ z.optional(z_Hex.Hex),
      submitToAddress: /* @__PURE__ */ z.optional(z_Hex.Hex),
    }),
  ),
})

const SendCallsParameters = z.tuple([
  /* @__PURE__ */ z.object({
    atomicRequired: /* @__PURE__ */ z.boolean(),
    calls: /* @__PURE__ */ z.array(
      /* @__PURE__ */ z.object({
        capabilities: /* @__PURE__ */ z.optional(Capabilities),
        to: /* @__PURE__ */ z.optional(z_Address.Address),
        data: /* @__PURE__ */ z.optional(z_Hex.Hex),
        value: /* @__PURE__ */ z.optional(z_Hex.Hex),
      }),
    ),
    capabilities: /* @__PURE__ */ z.optional(Capabilities),
    chainId: /* @__PURE__ */ z.optional(z_Hex.Hex),
    id: /* @__PURE__ */ z.optional(/* @__PURE__ */ z.string()),
    from: /* @__PURE__ */ z.optional(z_Address.Address),
    version: /* @__PURE__ */ z.string(),
  }),
])

const SendCallsReturnType = z.object({
  capabilities: /* @__PURE__ */ z.optional(Capabilities),
  id: /* @__PURE__ */ z.string(),
})

const WatchAssetParameters = z.object({
  type: /* @__PURE__ */ z.literal('ERC20'),
  options: /* @__PURE__ */ z.object({
    address: /* @__PURE__ */ z.string(),
    symbol: /* @__PURE__ */ z.string(),
    decimals: /* @__PURE__ */ z.number(),
    image: /* @__PURE__ */ z.optional(/* @__PURE__ */ z.string()),
  }),
})

export const eth_requestAccounts = from({
  method: 'eth_requestAccounts',
  params: NoParams,
  returns: /* @__PURE__ */ z.array(z_Address.Address),
})

export const eth_sendRawTransaction = from({
  method: 'eth_sendRawTransaction',
  params: /* @__PURE__ */ z.tuple([z_Hex.Hex]),
  returns: z_Hex.Hex,
})

export const eth_sendRawTransactionSync = from({
  method: 'eth_sendRawTransactionSync',
  params: /* @__PURE__ */ z.union([
    /* @__PURE__ */ z.tuple([z_Hex.Hex]),
    /* @__PURE__ */ z.tuple([z_Hex.Hex, /* @__PURE__ */ z.number()]),
  ]),
  returns: z_TransactionReceipt.TransactionReceipt,
})

export const eth_sendTransaction = from({
  method: 'eth_sendTransaction',
  params: /* @__PURE__ */ z.tuple([z_TransactionRequest.TransactionRequest]),
  returns: z_Hex.Hex,
})

export const eth_signTransaction = from({
  method: 'eth_signTransaction',
  params: /* @__PURE__ */ z.tuple([z_TransactionRequest.TransactionRequest]),
  returns: z_Hex.Hex,
})

export const eth_signTypedData_v4 = from({
  method: 'eth_signTypedData_v4',
  params: /* @__PURE__ */ z.tuple([
    z_Address.Address,
    /* @__PURE__ */ z.string(),
  ]),
  returns: z_Hex.Hex,
})

export const personal_sign = from({
  method: 'personal_sign',
  params: /* @__PURE__ */ z.tuple([z_Hex.Hex, z_Address.Address]),
  returns: z_Hex.Hex,
})

export const wallet_addEthereumChain = from({
  method: 'wallet_addEthereumChain',
  params: /* @__PURE__ */ z.tuple([AddEthereumChainParameters]),
  returns: /* @__PURE__ */ z.null(),
})

export const wallet_getCallsStatus = from({
  method: 'wallet_getCallsStatus',
  params: /* @__PURE__ */ z.optional(
    /* @__PURE__ */ z.tuple([/* @__PURE__ */ z.string()]),
  ),
  returns: GetCallsStatusReturnType,
})

export const wallet_getCapabilities = from({
  method: 'wallet_getCapabilities',
  params: /* @__PURE__ */ z.optional(
    /* @__PURE__ */ z.union([
      /* @__PURE__ */ z.tuple([]),
      /* @__PURE__ */ z.tuple([/* @__PURE__ */ z.optional(z_Address.Address)]),
      /* @__PURE__ */ z.tuple([
        /* @__PURE__ */ z.optional(z_Address.Address),
        /* @__PURE__ */ z.optional(/* @__PURE__ */ z.array(z_Hex.Hex)),
      ]),
    ]),
  ),
  returns: CapabilitiesMap,
})

export const wallet_getPermissions = from({
  method: 'wallet_getPermissions',
  params: NoParams,
  returns: /* @__PURE__ */ z.array(Permission),
})

export const wallet_grantPermissions = from({
  method: 'wallet_grantPermissions',
  params: /* @__PURE__ */ z.optional(
    /* @__PURE__ */ z.tuple([GrantPermissionsParameters]),
  ),
  returns: GrantPermissionsReturnType,
})

export const wallet_requestPermissions = from({
  method: 'wallet_requestPermissions',
  params: /* @__PURE__ */ z.tuple([PermissionRequest]),
  returns: /* @__PURE__ */ z.array(Permission),
})

export const wallet_revokePermissions = from({
  method: 'wallet_revokePermissions',
  params: /* @__PURE__ */ z.tuple([PermissionRequest]),
  returns: /* @__PURE__ */ z.null(),
})

export const wallet_sendCalls = from({
  method: 'wallet_sendCalls',
  params: SendCallsParameters,
  returns: SendCallsReturnType,
})

export const wallet_showCallsStatus = from({
  method: 'wallet_showCallsStatus',
  params: /* @__PURE__ */ z.tuple([/* @__PURE__ */ z.string()]),
  returns: /* @__PURE__ */ z.undefined(),
})

export const wallet_switchEthereumChain = from({
  method: 'wallet_switchEthereumChain',
  params: /* @__PURE__ */ z.tuple([
    /* @__PURE__ */ z.object({ chainId: /* @__PURE__ */ z.string() }),
  ]),
  returns: /* @__PURE__ */ z.null(),
})

export const wallet_watchAsset = from({
  method: 'wallet_watchAsset',
  params: /* @__PURE__ */ z.tuple([WatchAssetParameters]),
  returns: /* @__PURE__ */ z.boolean(),
})
