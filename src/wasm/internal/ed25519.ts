import type { Module } from './crypto25519.js'

const keySize = 32
const signatureSize = 64

/** Signs through the shared module and clears every staged byte. */
export function sign(
  module: Module,
  payload: Uint8Array,
  privateKey: Uint8Array,
): Uint8Array {
  const size = keySize + payload.length + signatureSize
  module.reserve(size)
  const privateKeyPtr = module.heapBase
  const payloadPtr = privateKeyPtr + keySize
  const signaturePtr = payloadPtr + payload.length
  try {
    const memory = module.view()
    memory.set(privateKey, privateKeyPtr)
    memory.set(payload, payloadPtr)
    module.exports.ed25519_sign(
      privateKeyPtr,
      payloadPtr,
      payload.length,
      signaturePtr,
    )
    return module.view().slice(signaturePtr, signaturePtr + signatureSize)
  } finally {
    module.exports.zero(privateKeyPtr, size)
  }
}
