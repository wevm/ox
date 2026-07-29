import { wasmBase64 } from './secp256k1.wasm.js'
import {
  instantiate,
  memoize,
  type Module as WasmModule,
} from './instantiate.js'

export type Exports = {
  secp256k1_get_public_key(privateKey: number, publicKey: number): number
  secp256k1_get_shared_secret(
    privateKey: number,
    publicKey: number,
    publicKeySize: number,
    sharedSecret: number,
  ): number
  secp256k1_init(): number
  secp256k1_randomize(seed: number): number
  secp256k1_recover_public_key(
    signature: number,
    message: number,
    messageSize: number,
    publicKey: number,
  ): number
  secp256k1_sign(
    message: number,
    messageSize: number,
    privateKey: number,
    entropy: number,
    entropySize: number,
    prehash: number,
    signature: number,
  ): number
  secp256k1_verify(
    signature: number,
    message: number,
    messageSize: number,
    publicKey: number,
    publicKeySize: number,
    prehash: number,
  ): number
  zero(pointer: number, length: number): void
}

/** Instantiated secp256k1 module. */
export type Module = WasmModule<Exports>

/** Instantiates and initializes the secp256k1 module once. */
export const load = memoize(async () => {
  const module = await instantiate<Exports>(wasmBase64)
  if (module.exports.secp256k1_init() !== 1)
    throw new Error('WASM secp256k1 context could not be initialized.')
  const seed = crypto.getRandomValues(new Uint8Array(32))
  module.reserve(seed.length)
  try {
    module.view().set(seed, module.heapBase)
    if (module.exports.secp256k1_randomize(module.heapBase) !== 1)
      throw new Error('WASM secp256k1 context could not be randomized.')
  } finally {
    module.exports.zero(module.heapBase, seed.length)
  }
  return module
})
