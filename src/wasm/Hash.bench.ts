import { sha256 as noble_sha256 } from '@noble/hashes/sha2.js'
import { keccak_256 as noble_keccak256 } from '@noble/hashes/sha3.js'
import { bench, describe } from 'vp/test'
import * as Bytes from '../core/Bytes.js'
import type * as Engine from '../core/Engine.js'
import { load } from './Hash.js'

// Sizes bracket the crossover: WASM pays a fixed marshalling cost per call, so
// short inputs favor the JavaScript implementation and long ones favor WASM.
const sizes = [32, 64, 256, 1024, 4096, 65_536, 1_048_576] as const

const engine: Engine.Engine = await load()
const wasm = engine.Hash!

for (const size of sizes) {
  const bytes = Bytes.random(size)

  describe(`keccak256 (${size} bytes input)`, () => {
    bench('@noble/hashes', () => {
      noble_keccak256(bytes)
    })

    bench('ox/wasm', () => {
      wasm.keccak256!(bytes)
    })
  })

  describe(`sha256 (${size} bytes input)`, () => {
    bench('@noble/hashes', () => {
      noble_sha256(bytes)
    })

    bench('ox/wasm', () => {
      wasm.sha256!(bytes)
    })
  })
}
