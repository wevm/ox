import type * as Bytes from '../../core/Bytes.js'
import * as Errors from '../../core/Errors.js'
import * as bindings from './bindings.js'
import * as codec from './codec.js'
import type * as Database from './database.js'

/**
 * evm2 engine handle.
 *
 * One handle owns one evm2 `Evm`: its specification, block environment,
 * accepted state overlay, and database. Creation is asynchronous because
 * WebAssembly compilation is; execution is synchronous, as it is in evm2.
 *
 * @internal
 */

/** A created engine. */
export type Engine = {
  /**
   * Executes a transaction for its result and discards its state changes.
   *
   * This is evm2's `call_tx`: the result-only path, with no pending state to
   * resolve.
   */
  callTx(options: codec.encodeCallTx.Options): codec.TxResult
  /** Drops the engine and its accepted state. */
  destroy(): void
  /** Replaces the block environment and the selected specification. */
  setBlock(options: codec.encodeCreate.Options): void
}

/** Creates an engine over `database`. */
export async function create(options: create.Options): Promise<Engine> {
  const { database, ...config } = options
  const instance = await bindings.instantiateWith(database)
  resolve(instance, codec.encodeCreate(config))

  return {
    callTx(options) {
      return codec.decodeResult(resolve(instance, codec.encodeCallTx(options)))
    },
    destroy() {
      resolve(instance, codec.encodeDestroy())
      instance.reset()
    },
    setBlock(options) {
      resolve(instance, codec.encodeSetBlock(options))
    },
  }
}

export declare namespace create {
  type Options = codec.encodeCreate.Options & {
    /** Synchronous state reads the engine calls back into. */
    database: Database.Database
  }
}

/** Sends a request and returns its payload, throwing on any failure status. */
function resolve(instance: bindings.Instance, request: Bytes.Bytes) {
  const { payload, status } = instance.call(request)
  if (status === codec.status.ok) return payload
  if (status === codec.status.handler)
    throw new HandlerError(codec.decodeHandler(payload))
  if (status === codec.status.database)
    throw new DatabaseError(codec.decodeMessage(payload))
  if (status === codec.status.abi)
    throw new AbiError(codec.decodeMessage(payload))
  if (status === codec.status.engineMissing) throw new MissingError()
  if (status === codec.status.engineBusy) throw new bindings.ReentrancyError()
  throw new codec.DecodeError(`unknown response status ${status}`)
}

/** Thrown when evm2 rejected or aborted the transaction. */
export class HandlerError extends Errors.BaseError {
  /** Variant discriminant, matching `wasm/evm2/src/error.rs`. */
  readonly kind: number
  override readonly name = 'Evm.HandlerError'
  /** The variant's numeric fields, in evm2's declaration order. */
  readonly words: readonly bigint[]

  constructor({ kind, message, words }: codec.Handler) {
    super(message, { metaMessages: [`evm2 handler error ${kind}`] })
    this.kind = kind
    this.words = words
  }
}

/** Thrown when a state read failed. Carries the source's own message. */
export class DatabaseError extends Errors.BaseError {
  override readonly name = 'Evm.DatabaseError'

  constructor(message: string) {
    super('A state read the engine needed could not be served.', {
      metaMessages: [message],
    })
  }
}

/** Thrown when the adapter rejected a request this codec produced. */
export class AbiError extends Errors.BaseError {
  override readonly name = 'Evm.AbiError'

  constructor(reason: string) {
    super('The evm2 adapter rejected the request.', { metaMessages: [reason] })
  }
}

/** Thrown when an operation runs against a destroyed engine. */
export class MissingError extends Errors.BaseError {
  override readonly name = 'Evm.MissingError'

  constructor() {
    super('The evm2 engine was destroyed.', {
      metaMessages: ['Create a new engine to execute another transaction.'],
    })
  }
}
