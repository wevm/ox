import type * as Bytes from '../../core/Bytes.js'
import * as Errors from '../../core/Errors.js'
import * as instantiate from '../../wasm/internal/instantiate.js'
import { wasmBase64 } from '../../wasm/internal/evm2.wasm.js'
import * as codec from './codec.js'
import * as Database from './database.js'

/**
 * Loader and raw call boundary for the evm2 WASM adapter.
 *
 * Compilation is memoized per realm and instantiation is per engine, matching
 * evm2's owned `Evm`. No view over linear memory outlives a call: growing
 * memory detaches the previous `ArrayBuffer`.
 *
 * @internal
 */

/** Exports the adapter publishes. */
type Exports = {
  memory: WebAssembly.Memory
  ox_abi_version(): number
  ox_alloc(length: number): number
  ox_call(length: number): number
  ox_reset(): void
}

/**
 * One instantiated adapter, holding one evm2 engine.
 *
 * A trap is unrecoverable: the adapter panics only on its own bugs, and its
 * handler traps rather than unwinding. Discard the instance and create another.
 */
export type Instance = {
  /**
   * Sends `request` and returns the response status with a copy of its payload.
   *
   * @throws {@link ReentrancyError} when a host read reentered the engine.
   * @throws the failure a host read recorded, once execution has unwound.
   */
  call(request: Bytes.Bytes): { payload: Bytes.Bytes; status: number }
  /** Releases the request and response buffers. */
  reset(): void
  /**
   * Runs `send` with `handler` receiving each record the adapter streams.
   *
   * @throws the failure `handler` raised, after evm2 has discarded.
   */
  withSink<result>(
    handler: (record: codec.Change) => void,
    send: () => result,
  ): result
}

/** Compiles the adapter once per realm. */
export const compile = /*#__PURE__*/ instantiate.memoize(() =>
  instantiate.compile(wasmBase64),
)

/**
 * Instantiates the adapter over `database`.
 *
 * @throws {@link VersionError} when the artifact implements another ABI version.
 */
export async function instantiateWith(
  database: Database.Database,
): Promise<Instance> {
  const host = Database.host(database)
  const compiled = await compile()

  // The sink shares the database's import namespace: both are host callbacks the
  // adapter reaches during one operation.
  let sink: ((record: codec.Change) => void) | undefined
  let failure: Error | undefined
  const imports = {
    ...host.imports,
    ox_evm2: {
      ...(host.imports.ox_evm2 as WebAssembly.ModuleImports),
      sink_record(pointer: number, length: number) {
        try {
          if (!sink) throw new UnexpectedSinkError()
          const bytes = new Uint8Array(exports.memory.buffer, pointer, length)
          sink(codec.decodeRecord(bytes.slice()))
          return 0
        } catch (error) {
          // Reporting failure makes evm2 discard the transaction, and the error
          // is rethrown afterwards so the caller sees its own throw.
          failure ??= error as Error
          return 1
        }
      },
    },
  }

  const instance = await WebAssembly.instantiate(compiled, imports)
  const exports = instance.exports as Exports
  host.attach(exports.memory)

  const abi = exports.ox_abi_version()
  if (abi !== codec.version) throw new VersionError({ actual: abi })

  let trapped: TrapError | undefined

  return {
    /** Runs `send` with `handler` receiving each streamed record. */
    withSink(handler, send) {
      sink = handler
      failure = undefined
      try {
        const result = send()
        if (failure) throw failure
        return result
      } catch (error) {
        // A sink that threw already made the adapter discard, so the caller's own
        // error is the useful one; the sink status is derived from it.
        throw failure ?? error
      } finally {
        sink = undefined
        failure = undefined
      }
    },
    call(request) {
      if (trapped) throw trapped
      if (request.length > codec.maxRequest)
        throw new RequestTooLargeError({ length: request.length })

      const pointer = exports.ox_alloc(request.length)
      if (pointer === 0) throw new ReentrancyError()
      new Uint8Array(exports.memory.buffer).set(request, pointer)

      // A trap leaves the adapter's running flag set and its heap suspect, so
      // the instance is remembered as dead rather than misreported as reentrant
      // on the next call.
      const response = (() => {
        try {
          return exports.ox_call(request.length)
        } catch (error) {
          trapped = new TrapError({ cause: error as Error })
          throw trapped
        }
      })()
      const { payload, status } = read(exports.memory, response)

      // A recorded host failure is the real cause, so it wins over the status
      // evm2 produced while unwinding.
      const failure = host.takeFailure()
      if (failure) throw failure

      return { payload, status }
    },
    reset() {
      exports.ox_reset()
    },
  }
}

/** Reads a response header and copies its payload out of linear memory. */
function read(memory: WebAssembly.Memory, pointer: number) {
  const bytes = new Uint8Array(memory.buffer)
  if (pointer <= 0 || pointer + codec.headerSize > bytes.length)
    throw new codec.DecodeError(
      `response header at ${pointer} is outside the engine's ${bytes.length} bytes of memory`,
    )

  const header = new DataView(memory.buffer, pointer, codec.headerSize)
  if (header.getUint32(0, true) !== codec.magic)
    throw new codec.DecodeError('response is missing the ABI magic bytes')
  const abi = header.getUint16(4, true)
  if (abi !== codec.version) throw new VersionError({ actual: abi })

  const status = header.getUint16(6, true)
  const length = header.getUint32(12, true)
  const start = pointer + codec.headerSize
  if (start + length > bytes.length)
    throw new codec.DecodeError(
      `response declared ${length} payload bytes at ${start}, past the engine's ${bytes.length} bytes of memory`,
    )

  // Copied, not viewed: the next call can grow memory and detach the buffer.
  return { payload: bytes.slice(start, start + length), status }
}

/** Thrown when the compiled artifact implements a different ABI version. */
export class VersionError extends Errors.BaseError {
  override readonly name = 'Evm.VersionError'

  constructor({ actual }: { actual: number }) {
    super('The evm2 adapter implements a different ABI version.', {
      metaMessages: [`Expected: ${codec.version}`, `Received: ${actual}`],
    })
  }
}

/** Thrown when a request exceeds what the adapter accepts. */
export class RequestTooLargeError extends Errors.BaseError {
  override readonly name = 'Evm.RequestTooLargeError'

  constructor({ length }: { length: number }) {
    super('The request is larger than the evm2 adapter accepts.', {
      metaMessages: [
        `Requested: ${length} bytes`,
        `Maximum: ${codec.maxRequest} bytes`,
      ],
    })
  }
}

/**
 * Thrown when the engine trapped.
 *
 * A trap is unrecoverable: the panic aborted mid-operation, so the instance is
 * dead and every later call fails with the same error. Create a new EVM.
 */
export class TrapError extends Errors.BaseError<Error> {
  override readonly name = 'Evm.TrapError'

  constructor(options: { cause: Error }) {
    super('The evm2 engine trapped and this EVM is no longer usable.', {
      cause: options.cause,
      metaMessages: ['Create a new EVM; this instance cannot recover.'],
    })
  }
}

/** Thrown when the adapter streamed a record with no sink registered. */
export class UnexpectedSinkError extends Errors.BaseError {
  override readonly name = 'Evm.UnexpectedSinkError'

  constructor() {
    super('The engine streamed a state change with no sink registered.')
  }
}

/** Thrown when a host read reenters the engine that is calling it. */
export class ReentrancyError extends Errors.BaseError {
  override readonly name = 'Evm.ReentrancyError'

  constructor() {
    super('The evm2 engine is already executing.', {
      metaMessages: [
        'A state read cannot execute a transaction on the engine that is reading it.',
      ],
    })
  }
}
