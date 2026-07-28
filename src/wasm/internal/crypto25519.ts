import { wasmBase64 } from './crypto25519.wasm.js'
import {
  instantiate,
  memoize,
  type Module as WasmModule,
} from './instantiate.js'

export type Exports = {
  ed25519_get_public_key(seed: number, publicKey: number): void
  ed25519_sign(
    seed: number,
    message: number,
    messageSize: number,
    signature: number,
  ): void
  ed25519_to_montgomery_secret(seed: number, secretKey: number): void
  ed25519_verify(
    signature: number,
    message: number,
    messageSize: number,
    publicKey: number,
  ): number
  mnemonic_to_seed(
    password: number,
    passwordSize: number,
    salt: number,
    saltSize: number,
    seed: number,
  ): void
  x25519_get_public_key(privateKey: number, publicKey: number): void
  x25519_get_shared_secret(
    privateKey: number,
    publicKey: number,
    sharedSecret: number,
  ): number
  zero(pointer: number, length: number): void
}

/** Instantiated shared cryptographic module. */
export type Module = WasmModule<Exports>

/** Instantiates the shared Ed25519, X25519, and mnemonic module once. */
export const load = memoize(() => instantiate<Exports>(wasmBase64))
