import { bench, describe } from 'vp/test'
import * as Base58 from './Base58.js'
import * as Bytes from './Bytes.js'

const bytes32 = Bytes.fromHex(`0x00${'7f3a'.repeat(15)}c1`)
const bytes256 = Bytes.fromHex(`0x${'9e51'.repeat(128)}`)
const string32 = Base58.fromBytes(bytes32)
const string256 = Base58.fromBytes(bytes256)

describe('Base58.fromBytes', () => {
  bench('32 bytes', () => {
    Base58.fromBytes(bytes32)
  })

  bench('256 bytes', () => {
    Base58.fromBytes(bytes256)
  })
})

describe('Base58.toBytes', () => {
  bench('32 bytes', () => {
    Base58.toBytes(string32)
  })

  bench('256 bytes', () => {
    Base58.toBytes(string256)
  })
})
