import {
  instantiate,
  memoize,
  type Module as WasmModule,
} from './instantiate.js'
import { wasmBase64 } from './mldsa44.wasm.js'

export type Exports = {
  mldsa44_get_public_key(seed: number, publicKey: number): number
  mldsa44_sign(
    seed: number,
    message: number,
    messageSize: number,
    context: number,
    contextSize: number,
    random: number,
    signature: number,
  ): number
  mldsa44_verify(
    signature: number,
    message: number,
    messageSize: number,
    context: number,
    contextSize: number,
    publicKey: number,
  ): number
  zero(pointer: number, length: number): void
}

/** Instantiated ML-DSA-44 module. */
export type Module = WasmModule<Exports>

/** Instantiates the ML-DSA-44 module once. */
export const load = memoize(() => instantiate<Exports>(wasmBase64))
