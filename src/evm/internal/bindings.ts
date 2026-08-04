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
  const instance = await WebAssembly.instantiate(compiled, host.imports)
  const exports = instance.exports as Exports
  host.attach(exports.memory)

  const abi = exports.ox_abi_version()
  if (abi !== codec.version) throw new VersionError({ actual: abi })

  return {
    call(request) {
      if (request.length > codec.maxRequest)
        throw new RequestTooLargeError({ length: request.length })

      const pointer = exports.ox_alloc(request.length)
      if (pointer === 0) throw new ReentrancyError()
      new Uint8Array(exports.memory.buffer).set(request, pointer)

      const response = exports.ox_call(request.length)
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
