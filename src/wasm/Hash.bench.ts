import { hmac } from '@noble/hashes/hmac.js'
import { ripemd160 as noble_ripemd160 } from '@noble/hashes/legacy.js'
import { sha256 as noble_sha256 } from '@noble/hashes/sha2.js'
import { keccak_256 as noble_keccak256 } from '@noble/hashes/sha3.js'
import { bench, describe } from 'vp/test'
import * as Bytes from '../core/Bytes.js'
import { create } from './Hash.js'

// Sizes bracket the crossover: WASM pays a fixed marshalling cost per call, so
// short inputs favor the JavaScript implementation and long ones favor WASM.
//
// For a native ceiling alongside these two, run `pnpm bench:hash`, which drives
// the same primitives through `bench/native`. Vitest cannot run native code, so
// it cannot be a column here.
const sizes = [32, 64, 256, 1024, 4096, 65_536, 1_048_576] as const

const engine = await create()
const wasm = engine.Hash
const key = Bytes.random(32)

for (const size of sizes) {
  const bytes = Bytes.random(size)

  describe(`keccak256 (${size} bytes input)`, () => {
    bench('@noble/hashes', () => {
      noble_keccak256(bytes)
    })

    bench('ox/wasm', () => {
      wasm.keccak256(bytes)
    })
  })

  describe(`sha256 (${size} bytes input)`, () => {
    bench('@noble/hashes', () => {
      noble_sha256(bytes)
    })

    bench('ox/wasm', () => {
      wasm.sha256(bytes)
    })
  })

  describe(`ripemd160 (${size} bytes input)`, () => {
    bench('@noble/hashes', () => {
      noble_ripemd160(bytes)
    })

    bench('ox/wasm', () => {
      wasm.ripemd160(bytes)
    })
  })

  describe(`hmacSha256 (${size} bytes input)`, () => {
    bench('@noble/hashes', () => {
      hmac(noble_sha256, key, bytes)
    })

    bench('ox/wasm', () => {
      wasm.hmacSha256(key, bytes)
    })
  })
}
