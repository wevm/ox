import { scrypt as scrypt_noble } from '@noble/hashes/scrypt.js'
import { bench, describe } from 'vp/test'
import { engine as wasmEngine } from './Keystore.js'

// Run `pnpm bench --project core src/wasm/Keystore.bench.ts`. These cases expose
// the effect of block size, parallelization, and the public defaults.
const cases = [
  { N: 1024, dkLen: 32, p: 1, r: 1 },
  { N: 16_384, dkLen: 32, p: 1, r: 8 },
  { N: 262_144, dkLen: 32, p: 8, r: 1 },
] as const

const wasm = await wasmEngine()
const password = new Uint8Array(16).fill(0x5a)
const salt = new Uint8Array(32).fill(0xa5)

for (const options of cases)
  describe(`scrypt (N=${options.N}, r=${options.r}, p=${options.p})`, () => {
    bench('ox', () => {
      scrypt_noble(password, salt, options)
    })

    bench('ox/wasm', () => {
      wasm.scrypt(password, salt, options)
    })
  })
