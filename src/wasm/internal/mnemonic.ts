import type { Module } from './crypto25519.js'

const encoder = new TextEncoder()
const seedSize = 64
const wordCounts = [12, 15, 18, 21, 24]

/** Derives a BIP-39 seed and clears encoded and staged secret material. */
export function toSeed(
  module: Module,
  mnemonic: string,
  passphrase = '',
): Uint8Array {
  const password = encoder.encode(normalize(mnemonic))
  try {
    const salt = encoder.encode(normalizeSalt(passphrase))
    try {
      const size = password.length + salt.length + seedSize
      module.reserve(size)
      const passwordPtr = module.heapBase
      const saltPtr = passwordPtr + password.length
      const seedPtr = saltPtr + salt.length
      try {
        const memory = module.view()
        memory.set(password, passwordPtr)
        memory.set(salt, saltPtr)
        module.exports.mnemonic_to_seed(
          passwordPtr,
          password.length,
          saltPtr,
          salt.length,
          seedPtr,
        )
        return module.view().slice(seedPtr, seedPtr + seedSize)
      } finally {
        module.exports.zero(passwordPtr, size)
      }
    } finally {
      salt.fill(0)
    }
  } finally {
    password.fill(0)
  }
}

function normalize(mnemonic: string): string {
  if (typeof mnemonic !== 'string')
    throw new TypeError(`invalid mnemonic type: ${typeof mnemonic}`)
  const normalized = mnemonic.normalize('NFKD')
  if (!wordCounts.includes(normalized.split(' ').length))
    throw new Error('Invalid mnemonic')
  return normalized
}

function normalizeSalt(passphrase: string): string {
  return `mnemonic${passphrase}`.normalize('NFKD')
}
