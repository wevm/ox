import { bench, describe } from 'vp/test'
import * as Bytes from './Bytes.js'
import * as Hash from './Hash.js'
import * as Hex from './Hex.js'

const sizes = [32, 256, 4096] as const

for (const size of sizes) {
  const bytes = Bytes.random(size)
  const hex = Hex.fromBytes(bytes)

  describe(`Hash.sha256 (${size} bytes input)`, () => {
    bench('Bytes.Bytes input', () => {
      Hash.sha256(bytes)
    })

    bench('Hex.Hex input', () => {
      Hash.sha256(hex)
    })
  })

  describe(`Hash.keccak256 (${size} bytes input)`, () => {
    bench('Bytes.Bytes input', () => {
      Hash.keccak256(bytes)
    })

    bench('Hex.Hex input', () => {
      Hash.keccak256(hex)
    })
  })
}
