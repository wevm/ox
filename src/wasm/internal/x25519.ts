import type { Module } from './crypto25519.js'

const keySize = 32

/** Derives a shared secret and clears both keys and the staged result. */
export function getSharedSecret(
  module: Module,
  privateKey: Uint8Array,
  publicKey: Uint8Array,
): Uint8Array {
  module.reserve(keySize * 3)
  const privateKeyPtr = module.heapBase
  const publicKeyPtr = privateKeyPtr + keySize
  const sharedSecretPtr = publicKeyPtr + keySize
  try {
    const memory = module.view()
    memory.set(privateKey, privateKeyPtr)
    memory.set(publicKey, publicKeyPtr)
    const valid = module.exports.x25519_get_shared_secret(
      privateKeyPtr,
      publicKeyPtr,
      sharedSecretPtr,
    )
    if (valid !== 1) throw new Error('invalid private or public key received')
    return module.view().slice(sharedSecretPtr, sharedSecretPtr + keySize)
  } finally {
    module.exports.zero(privateKeyPtr, keySize * 3)
  }
}
