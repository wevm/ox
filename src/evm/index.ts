/** @entrypointCategory EVM */
// biome-ignore lint/complexity/noUselessEmptyExport: tsdoc

/**
 * Executes EVM bytecode.
 *
 * The engine is a freestanding C interpreter compiled to WebAssembly, loaded
 * lazily on first use so importing `ox` never pulls it in.
 *
 * @example
 * ```ts twoslash
 * import { Evm } from 'ox/evm'
 *
 * const result = await Evm.run({ bytecode: '0x60016002015f5260205ff3' })
 * // @log: { status: 'success', data: '0x...03', gasUsed: 22n, gasLeft: 29999978n }
 * ```
 *
 * @category EVM
 */
export * as Evm from './Evm.js'

/**
 * Opcode tables and bytecode disassembly.
 *
 * @example
 * ```ts twoslash
 * import { Opcode } from 'ox/evm'
 *
 * Opcode.toName(0x01)
 * // @log: 'ADD'
 * ```
 *
 * @category EVM
 */
export * as Opcode from './Opcode.js'
