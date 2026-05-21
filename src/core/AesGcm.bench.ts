import { bench, describe } from 'vp/test'
import * as AesGcm from './AesGcm.js'
import * as Bytes from './Bytes.js'

const key = await AesGcm.getKey({ password: 'bench-password' })

const sizes = [32, 1024, 65536] as const

for (const size of sizes) {
  const value = Bytes.random(size)

  describe(`AesGcm.encrypt (${size} bytes)`, () => {
    bench('encrypt', async () => {
      await AesGcm.encrypt(value, key)
    })
  })

  const encrypted = await AesGcm.encrypt(value, key)

  describe(`AesGcm.decrypt (${size} bytes)`, () => {
    bench('decrypt', async () => {
      await AesGcm.decrypt(encrypted, key)
    })
  })
}
