import type * as codec from './internal/codec.js'

/**
 * State a block's transactions changed, gathered across all of them.
 *
 * Each entry spans the block rather than a transaction: `original` is the value
 * before the block, `current` the value after its last transaction touched it.
 * Every collection enumerates deterministically.
 */
export type BlockState = codec.BlockState

/**
 * Identifies an accumulator being gathered.
 *
 * evm2 accumulates in Rust, so the accumulator itself cannot cross the boundary
 * and this stands in for it. Hold it from
 * {@link ox#Evm.(startBlockState:function)} until
 * {@link ox#Evm.(takeBlockState:function)}, which consumes it.
 */
export type Token = {
  /** @internal */
  readonly '~engine': unknown
  /** @internal */
  readonly '~id': bigint
}
