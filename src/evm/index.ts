/** @entrypointCategory EVM */
// biome-ignore lint/complexity/noUselessEmptyExport: tsdoc

/**
 * An EVM, backed by [`alloy-rs/evm2`](https://github.com/alloy-rs/evm2)
 * compiled to WebAssembly.
 *
 * Execution, gas accounting, transaction validation, precompiles, and fork
 * behavior come from the engine. Ox supplies the TypeScript representation of
 * its API and the runtime packaging.
 *
 * Creation is asynchronous because WebAssembly must be compiled asynchronously.
 * Execution is synchronous, as it is natively.
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
 * const result = Evm.callTx(evm, {
 *   from: '0x0000000000000000000000000000000000000001',
 *   gas: 100_000n,
 *   to: '0x0000000000000000000000000000000000000002',
 *   value: 1n
 * })
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
 * Block access lists.
 *
 * @category Execution
 */
export * as Bal from './Bal.js'

/**
 * Recorded executions.
 *
 * @category Execution
 */
export * as Inspector from './Inspector.js'

/**
 * State a block's transactions changed.
 *
 * @category Execution
 */
export * as BlockState from './BlockState.js'

/**
 * Protocol system-call addresses and limits.
 *
 * @category Execution
 */
export * as System from './System.js'

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
 * Transaction input shapes.
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
