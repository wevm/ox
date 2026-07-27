import { hmac } from '@noble/hashes/hmac.js'
import { ripemd160 as noble_ripemd160 } from '@noble/hashes/legacy.js'
import { sha256 as noble_sha256 } from '@noble/hashes/sha2.js'
import { keccak_256 as noble_keccak256 } from '@noble/hashes/sha3.js'
import { bench, describe } from 'vp/test'
import { create as createWasm } from './Hash.js'

// Sizes expose fixed boundary overhead and sustained throughput. Crossovers
// vary by primitive, runtime, and processor.
//
// Run `pnpm bench:hash` for the full four-provider comparison. Vitest cannot
// run Rust, and this portable benchmark must remain browser-compatible.
const sizes = [32, 64, 256, 1024, 4096, 65_536, 1_048_576] as const

const wasm = (await createWasm()).Hash
const key = Uint8Array.from({ length: 32 }, (_, index) => index % 97)

for (const size of sizes) {
  const bytes = Uint8Array.from({ length: size }, (_, index) => index % 251)

  describe(`keccak256 (${size} bytes input)`, () => {
    bench('ox', () => {
      noble_keccak256(bytes)
    })

    bench('ox/wasm', () => {
      wasm.keccak256(bytes)
    })
  })

  describe(`sha256 (${size} bytes input)`, () => {
    bench('ox', () => {
      noble_sha256(bytes)
    })

    bench('ox/wasm', () => {
      wasm.sha256(bytes)
    })
  })

  describe(`ripemd160 (${size} bytes input)`, () => {
    bench('ox', () => {
      noble_ripemd160(bytes)
    })

    bench('ox/wasm', () => {
      wasm.ripemd160(bytes)
    })
  })

  describe(`hmacSha256 (${size} bytes input)`, () => {
    bench('ox', () => {
      hmac(noble_sha256, key, bytes)
    })

    bench('ox/wasm', () => {
      wasm.hmacSha256(key, bytes)
    })
  })
}
