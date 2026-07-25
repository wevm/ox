import * as Errors from '../../core/Errors.js'

/** The exported surface of the compiled EVM engine. */
export type Engine = {
  memory: WebAssembly.Memory
  evm_new(memoryCap: number): number
  evm_code_ptr(vm: number): number
  evm_input_ptr(vm: number): number
  evm_output_ptr(vm: number): number
  evm_output_len(vm: number): number
  evm_gas_left(vm: number): bigint
  evm_stack_size(vm: number): number
  evm_stack_peek(vm: number, index: number): number
  evm_memory_size(vm: number): number
  evm_max_code(): number
  evm_max_input(): number
  evm_set_code(vm: number, codeLength: number): number
  evm_run(vm: number, inputLength: number, gas: bigint): number
}

let engine: Engine | undefined

/**
 * Loads the EVM engine, instantiating it at most once per process.
 *
 * Phase 6 will try a native N-API addon here first and fall back to WASM; today
 * there is only the WASM path.
 *
 * @internal
 */
export async function load(): Promise<Engine> {
  if (engine) return engine
  const { wasmBase64 } = await import('./evm.wasm.js')
  const binary =
    typeof Buffer !== 'undefined'
      ? Uint8Array.from(Buffer.from(wasmBase64, 'base64'))
      : Uint8Array.from(atob(wasmBase64), (c) => c.charCodeAt(0))
  const { instance } = await WebAssembly.instantiate(binary, {})
  engine = instance.exports as unknown as Engine
  return engine
}

/**
 * Returns the already-loaded engine, or `undefined` if {@link load} has not
 * resolved yet.
 *
 * @internal
 */
export function loaded(): Engine | undefined {
  return engine
}

/**
 * A view over the engine's linear memory.
 *
 * Must be re-derived after any call that can grow memory — `memory.grow`
 * detaches every existing `ArrayBuffer` view.
 *
 * @internal
 */
export function view(engine: Engine): Uint8Array {
  return new Uint8Array(engine.memory.buffer)
}

/**
 * Thrown when the EVM engine could not be instantiated.
 */
export class LoadError extends Errors.BaseError<Error> {
  override readonly name = 'Evm.LoadError'

  constructor({ cause }: { cause?: Error | undefined } = {}) {
    super('Failed to instantiate the EVM engine.', {
      cause,
      metaMessages: ['The environment must support `WebAssembly.instantiate`.'],
    })
  }
}
