import type { Address } from '../Address/types.js'
import type { Hex } from '../Hex/types.js'
import type { Log_Rpc } from '../Log/types.js'
import type { TransactionReceipt_Rpc } from '../TransactionReceipt/types.js'
import type { OneOf, PartialBy } from '../types.js'

/**
 * Union of all JSON-RPC Methods for EIP-4337.
 *
 * @example
 * ```ts twoslash
 * import { RpcSchema } from 'ox'
 *
 * type Schema = RpcSchema.Eip4337
 * //   ^?
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 * ```
 */
export type RpcSchema_Eip4337 = [
  /**
   * Estimate the gas values for a UserOperation.
   *
   * @see {@link https://eips.ethereum.org/EIPS/eip-4337#-eth_estimateuseroperationgas}
   */
  {
    Request: {
      method: 'eth_estimateUserOperationGas'
      params:
        | [userOperation: RpcSchema_UserOperation, entrypoint: Address]
        | [
            userOperation: RpcSchema_UserOperation,
            entrypoint: Address,
            // TODO
            // stateOverrideSet: RpcStateOverride,
          ]
    }
    ReturnType: RpcSchema_EstimateUserOperationGasReturnType
  },
  /**
   * Return a UserOperation based on a hash.
   *
   * @see {@link https://eips.ethereum.org/EIPS/eip-4337#-eth_getuseroperationbyhash}
   */
  {
    Request: {
      method: 'eth_getUserOperationByHash'
      params: [hash: Hex]
    }
    ReturnType: RpcSchema_GetUserOperationByHashReturnType | null
  },
  /**
   * @description Return a UserOperation receipt based on a hash.
   *
   * @link https://eips.ethereum.org/EIPS/eip-4337#-eth_getuseroperationreceipt
   *
   * @example
   * provider.request({
   *  method: 'eth_getUserOperationReceipt',
   *  params: ['0x...']
   * })
   * // => { ... }
   */
  {
    Request: {
      method: 'eth_getUserOperationReceipt'
      params: [hash: Hex]
    }
    ReturnType: RpcSchema_UserOperationReceipt | null
  },
  /**
   * Submits a User Operation object to the User Operation pool of the client.
   *
   * @see {@link https://eips.ethereum.org/EIPS/eip-4337#-eth_senduseroperation}
   */
  {
    Request: {
      method: 'eth_sendUserOperation'
      params: [userOperation: RpcSchema_UserOperation, entrypoint: Address]
    }
    ReturnType: Hex
  },
  /**
   * Return the list of supported entry points by the client.
   *
   * @see {@link https://eips.ethereum.org/EIPS/eip-4337#-eth_supportedentrypoints}
   */
  {
    Request: {
      method: 'eth_supportedEntryPoints'
      params?: undefined
    }
    ReturnType: readonly Address[]
  },
  /**
   * Clears the bundler mempool and reputation data of paymasters/accounts/factories/aggregators.
   *
   * @see {@link https://github.com/eth-infinitism/bundler-spec/blob/a247b5de59a702063ea5b09d6136f119a061642b/src/debug/debug.yaml#L1}
   */
  {
    Request: {
      method: 'debug_bundler_clearState'
      params?: undefined
    }
    ReturnType: undefined
  },
  /**
   * Returns the current mempool
   *
   * @see {@link https://github.com/eth-infinitism/bundler-spec/blob/a247b5de59a702063ea5b09d6136f119a061642b/src/debug/debug.yaml#L8
   */
  {
    Request: {
      method: 'debug_bundler_dumpMempool'
      params: [entryPoint: Address]
    }
    ReturnType: readonly { userOp: RpcSchema_UserOperation }[]
  },
  /**
   * Forces the bundler to execute the entire current mempool.
   *
   * @see {@link https://github.com/eth-infinitism/bundler-spec/blob/a247b5de59a702063ea5b09d6136f119a061642b/src/debug/debug.yaml#L19
   */
  {
    Request: {
      method: 'debug_bundler_sendBundleNow'
      params?: undefined
    }
    ReturnType: Hex
  },
  /**
   * Toggles bundling mode between 'auto' and 'manual'
   *
   * @see {@link https://github.com/eth-infinitism/bundler-spec/blob/a247b5de59a702063ea5b09d6136f119a061642b/src/debug/debug.yaml#L26
   */
  {
    Request: {
      method: 'debug_bundler_setBundlingMode'
      params: [mode: 'auto' | 'manual']
    }
    ReturnType: undefined
  },
  /**
   * Sets reputation of given addresses.
   *
   * @see {@link https://github.com/eth-infinitism/bundler-spec/blob/a247b5de59a702063ea5b09d6136f119a061642b/src/debug/debug.yaml#L37
   */
  {
    Request: {
      method: 'debug_bundler_setReputation'
      params: [
        reputations: readonly {
          address: Address
          opsSeen: Hex
          opsIncluded: Hex
        }[],
        entryPoint: Address,
      ]
    }
    ReturnType: undefined
  },
  /**
   * Returns the reputation data of all observed addresses.
   *
   * @see {@link https://github.com/eth-infinitism/bundler-spec/blob/a247b5de59a702063ea5b09d6136f119a061642b/src/debug/debug.yaml#L52
   */
  {
    Request: {
      method: 'debug_bundler_dumpReputation'
      params: [entryPoint: Address]
    }
    ReturnType: readonly {
      address: Address
      opsSeen: Hex
      opsIncluded: Hex
    }[]
  },
  /**
   * Add a bulk of UserOps into the mempool
   *
   * @see {@link https://github.com/eth-infinitism/bundler-spec/blob/a247b5de59a702063ea5b09d6136f119a061642b/src/debug/debug.yaml#L64
   */
  {
    Request: {
      method: 'debug_bundler_addUserOps'
      params: [userOps: readonly RpcSchema_UserOperation[], entryPoint: Address]
    }
    ReturnType: undefined
  },
  /**
   * Returns the chain ID associated with the current network
   *
   * @see {@link https://eips.ethereum.org/EIPS/eip-4337#-eth_chainid
   */
  {
    Request: {
      method: 'pm_getPaymasterStubData'
      params?: [
        userOperation: OneOf<
          | PartialBy<
              Pick<
                RpcSchema_UserOperation<'0.6'>,
                | 'callData'
                | 'callGasLimit'
                | 'initCode'
                | 'maxFeePerGas'
                | 'maxPriorityFeePerGas'
                | 'nonce'
                | 'sender'
                | 'preVerificationGas'
                | 'verificationGasLimit'
              >,
              | 'callGasLimit'
              | 'initCode'
              | 'maxFeePerGas'
              | 'maxPriorityFeePerGas'
              | 'preVerificationGas'
              | 'verificationGasLimit'
            >
          | PartialBy<
              Pick<
                RpcSchema_UserOperation<'0.7'>,
                | 'callData'
                | 'callGasLimit'
                | 'factory'
                | 'factoryData'
                | 'maxFeePerGas'
                | 'maxPriorityFeePerGas'
                | 'nonce'
                | 'sender'
                | 'preVerificationGas'
                | 'verificationGasLimit'
              >,
              | 'callGasLimit'
              | 'factory'
              | 'factoryData'
              | 'maxFeePerGas'
              | 'maxPriorityFeePerGas'
              | 'preVerificationGas'
              | 'verificationGasLimit'
            >
        >,
        entrypoint: Address,
        chainId: Hex,
        context: unknown,
      ]
    }
    ReturnType: OneOf<
      | { paymasterAndData: Hex }
      | {
          paymaster: Address
          paymasterData: Hex
          paymasterVerificationGasLimit: Hex
          paymasterPostOpGasLimit: Hex
        }
    > & {
      sponsor?: { name: string; icon?: string | undefined } | undefined
      isFinal?: boolean | undefined
    }
  },
  /**
   * Returns values to be used in paymaster-related fields of a signed user operation.
   *
   * @see {@link https://github.com/ethereum/ERCs/blob/master/ERCS/erc-7677.md#pm_getpaymasterdata
   */
  {
    Request: {
      method: 'pm_getPaymasterData'
      params?: [
        userOperation:
          | PartialBy<
              Pick<
                RpcSchema_UserOperation<'0.6'>,
                | 'callData'
                | 'callGasLimit'
                | 'initCode'
                | 'maxFeePerGas'
                | 'maxPriorityFeePerGas'
                | 'nonce'
                | 'sender'
                | 'preVerificationGas'
                | 'verificationGasLimit'
              >,
              | 'callGasLimit'
              | 'initCode'
              | 'maxFeePerGas'
              | 'maxPriorityFeePerGas'
              | 'preVerificationGas'
              | 'verificationGasLimit'
            >
          | PartialBy<
              Pick<
                RpcSchema_UserOperation<'0.7'>,
                | 'callData'
                | 'callGasLimit'
                | 'factory'
                | 'factoryData'
                | 'maxFeePerGas'
                | 'maxPriorityFeePerGas'
                | 'nonce'
                | 'sender'
                | 'preVerificationGas'
                | 'verificationGasLimit'
                | 'paymasterPostOpGasLimit'
                | 'paymasterVerificationGasLimit'
              >,
              | 'callGasLimit'
              | 'factory'
              | 'factoryData'
              | 'maxFeePerGas'
              | 'maxPriorityFeePerGas'
              | 'preVerificationGas'
              | 'verificationGasLimit'
            >,
        entrypoint: Address,
        chainId: Hex,
        context: unknown,
      ]
    }
    ReturnType: OneOf<
      | { paymasterAndData: Hex }
      | {
          paymaster: Address
          paymasterData: Hex
          paymasterVerificationGasLimit: Hex
          paymasterPostOpGasLimit: Hex
        }
    >
  },
][number]

/**
 * Union of all JSON-RPC Method Names for the `eth_` namespace.
 *
 * @example
 * ```ts twoslash
 * import { RpcSchema } from 'ox'
 *
 * type Name = RpcSchema.NameEth
 * //   ^?
 *
 *
 *
 *
 *
 *
 *
 *
 * ```
 */
export type RpcSchema_MethodNameEip4337 = RpcSchema_Eip4337['Request']['method']

/**
 * @see {@link https://github.com/eth-infinitism/account-abstraction/releases}
 * @internal
 */
export type RpcSchema_EntryPointVersion = '0.6' | '0.7'

/**
 * @see {@link https://eips.ethereum.org/EIPS/eip-4337#useroperation}
 * @internal
 */
export type RpcSchema_UserOperation<
  entryPointVersion extends
    RpcSchema_EntryPointVersion = RpcSchema_EntryPointVersion,
> = OneOf<
  | (entryPointVersion extends '0.7'
      ? {
          /** The data to pass to the `sender` during the main execution call. */
          callData: Hex
          /** The amount of gas to allocate the main execution call */
          callGasLimit: Hex
          /** Account factory. Only for new accounts. */
          factory?: Address | undefined
          /** Data for account factory. */
          factoryData?: Hex | undefined
          /** Maximum fee per gas. */
          maxFeePerGas: Hex
          /** Maximum priority fee per gas. */
          maxPriorityFeePerGas: Hex
          /** Anti-replay parameter. */
          nonce: Hex
          /** Address of paymaster contract. */
          paymaster?: Address | undefined
          /** Data for paymaster. */
          paymasterData?: Hex | undefined
          /** The amount of gas to allocate for the paymaster post-operation code. */
          paymasterPostOpGasLimit?: Hex | undefined
          /** The amount of gas to allocate for the paymaster validation code. */
          paymasterVerificationGasLimit?: Hex | undefined
          /** Extra gas to pay the Bundler. */
          preVerificationGas: Hex
          /** The account making the operation. */
          sender: Address
          /** Data passed into the account to verify authorization. */
          signature: Hex
          /** The amount of gas to allocate for the verification step. */
          verificationGasLimit: Hex
        }
      : never)
  | (entryPointVersion extends '0.6'
      ? {
          /** The data to pass to the `sender` during the main execution call. */
          callData: Hex
          /** The amount of gas to allocate the main execution call */
          callGasLimit: Hex
          /** Account init code. Only for new accounts. */
          initCode?: Hex | undefined
          /** Maximum fee per gas. */
          maxFeePerGas: Hex
          /** Maximum priority fee per gas. */
          maxPriorityFeePerGas: Hex
          /** Anti-replay parameter. */
          nonce: Hex
          /** Paymaster address with calldata. */
          paymasterAndData?: Hex | undefined
          /** Extra gas to pay the Bundler. */
          preVerificationGas: Hex
          /** The account making the operation. */
          sender: Address
          /** Data passed into the account to verify authorization. */
          signature: Hex
          /** The amount of gas to allocate for the verification step. */
          verificationGasLimit: Hex
        }
      : never)
>

/**
 * @see {@link https://eips.ethereum.org/EIPS/eip-4337#-eth_estimateuseroperationgas}
 * @internal
 */
export type RpcSchema_EstimateUserOperationGasReturnType<
  entryPointVersion extends
    RpcSchema_EntryPointVersion = RpcSchema_EntryPointVersion,
> = OneOf<
  | (entryPointVersion extends '0.7'
      ? {
          preVerificationGas: Hex
          verificationGasLimit: Hex
          callGasLimit: Hex
          paymasterVerificationGasLimit?: Hex | undefined
          paymasterPostOpGasLimit?: Hex | undefined
        }
      : never)
  | (entryPointVersion extends '0.6'
      ? {
          preVerificationGas: Hex
          verificationGasLimit: Hex
          callGasLimit: Hex
        }
      : never)
>

/**
 * @see {@link https://eips.ethereum.org/EIPS/eip-4337#-eth_getuseroperationbyhash}
 * @internal
 */
export type RpcSchema_GetUserOperationByHashReturnType<
  entryPointVersion extends
    RpcSchema_EntryPointVersion = RpcSchema_EntryPointVersion,
> = {
  blockHash: Hex
  blockNumber: Hex
  entryPoint: Address
  transactionHash: Hex
  userOperation: RpcSchema_UserOperation<entryPointVersion>
}

/**
 * @see {@link https://eips.ethereum.org/EIPS/eip-4337#-eth_getuseroperationreceipt}
 * @internal
 */
export type RpcSchema_UserOperationReceipt = {
  /** Actual gas cost. */
  actualGasCost: Hex
  /** Actual gas used. */
  actualGasUsed: Hex
  /** Entrypoint address. */
  entryPoint: Address
  /** Logs emitted during execution. */
  logs: Log_Rpc[]
  /** Anti-replay parameter. */
  nonce: Hex
  /** Paymaster for the user operation. */
  paymaster?: Address | undefined
  /** Revert reason, if unsuccessful. */
  reason?: string | undefined
  /** Transaction receipt of the user operation execution. */
  receipt: TransactionReceipt_Rpc
  sender: Address
  /** If the user operation execution was successful. */
  success: boolean
  /** Hash of the user operation. */
  userOpHash: Hex
}
