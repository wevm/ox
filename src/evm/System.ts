import type * as Address from '../core/Address.js'

/**
 * Addresses and limits for protocol system calls.
 *
 * A system call runs a top-level call against one of these contracts, bypassing
 * transaction validation, nonce updates, fees, refunds, and beneficiary rewards.
 * The contract's code must already be in state: nothing here deploys it.
 */

/**
 * Caller a system call originates from.
 *
 * The default for {@link ox#Evm.(systemCall:function)}, and the only caller the
 * protocol's own system contracts accept.
 */
export const address = '0xfffffffffffffffffffffffffffffffffffffffe' as const

/** Gas a system call is given. */
export const gasLimit = 30_000_000n

/**
 * New storage slots a system call may write.
 *
 * EIP-8037 sizes the call's state-gas reservoir for this many.
 */
export const maxSstores = 16n

/** EIP-4788 beacon block root storage. */
export const beaconRoots = '0x000f3df6d732807ef1319fb7b8bb8522d0beac02' as const

/** EIP-2935 historical block hash storage. */
export const historyStorage =
  '0x0000f90827f1c53a10cb7a02335b175320002935' as const

/** EIP-7002 withdrawal request queue. */
export const withdrawalRequest =
  '0x00000961ef480eb55e80d19ad83579a64c007002' as const

/** EIP-7251 consolidation request queue. */
export const consolidationRequest =
  '0x0000bbddc7ce488642fb579f8b00f3a590007251' as const

/** Builder deposit request queue. */
export const builderDepositRequest =
  '0x0000bff46984e3725691fa540a8c7589300d8282' as const

/** Builder exit request queue. */
export const builderExitRequest =
  '0x000064d678505ad48f8ccb093bc65613800e8282' as const

/** Every system contract address, so a caller can seed or check them all. */
export const addresses: readonly Address.Address[] = [
  beaconRoots,
  builderDepositRequest,
  builderExitRequest,
  consolidationRequest,
  historyStorage,
  withdrawalRequest,
]
