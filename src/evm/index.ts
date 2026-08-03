/** @entrypointCategory EVM */
// biome-ignore lint/complexity/noUselessEmptyExport: tsdoc

/**
 * A pure-TypeScript EVM interpreter.
 *
 * @category EVM
 */
export * as Evm from './Evm.js'

/**
 * Hardfork names, ordering, and gas schedules for EVM execution.
 *
 * @category EVM
 */
export * as Hardfork from './Hardfork.js'

/**
 * Opcode tables and bytecode disassembly.
 *
 * @category EVM
 */
export * as Opcode from './Opcode.js'

/**
 * Pluggable state sources for EVM execution.
 *
 * @category EVM
 */
export * as State from './State.js'

/**
 * Transaction handler pipelines for EVM execution.
 *
 * @category EVM
 */
export * as Transaction from './Transaction.js'
