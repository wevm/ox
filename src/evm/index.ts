/** @entrypointCategory EVM */
// biome-ignore lint/complexity/noUselessEmptyExport: tsdoc

/**
 * An EVM, backed by [`alloy-rs/evm2`](https://github.com/alloy-rs/evm2)
 * compiled to WebAssembly.
 *
 * Execution, gas accounting, transaction validation, precompiles, and fork
 * behavior are evm2's. Ox supplies the TypeScript representation of its API and
 * the runtime packaging.
 *
 * Creation is asynchronous because WebAssembly must be compiled asynchronously.
 * Execution is synchronous, as it is in evm2.
 *
 * @example
 * ```ts twoslash
 * // @noErrors
 * import { Database, Evm, TxResult } from 'ox/evm'
 *
 * const evm = await Evm.create({
 *   database: Database.fromMemory({
 *     accounts: {
 *       '0x0000000000000000000000000000000000000001': {
 *         balance: 1n
 *       }
 *     }
 *   })
 * })
 *
 * const result = Evm.callTx(evm, { envelope, signer })
 * TxResult.txGasUsed(result)
 * ```
 *
 * @category Execution
 */
export * as Evm from './Evm.js'

/**
 * State an EVM reads through.
 *
 * @category Execution
 */
export * as Database from './Database.js'

/**
 * Executed transactions awaiting a decision on their state.
 *
 * @category Execution
 */
export * as ExecutedTx from './ExecutedTx.js'

/**
 * A transaction's state changes, owned by the caller.
 *
 * @category Execution
 */
export * as PendingState from './PendingState.js'

/**
 * Streaming a transaction's state changes.
 *
 * @category Execution
 */
export * as StateChange from './StateChange.js'

/**
 * Ethereum transaction handlers and envelope types.
 *
 * @category Execution
 */
export * as Ethereum from './Ethereum.js'

/**
 * Ethereum specification identifiers.
 *
 * @category Execution
 */
export * as SpecId from './SpecId.js'

/**
 * Transaction results, stop reasons, and the gas each reports.
 *
 * @category Execution
 */
export * as TxResult from './TxResult.js'
