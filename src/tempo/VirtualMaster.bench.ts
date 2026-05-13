import { bench, describe } from 'vitest'
import * as TempoAddress from './TempoAddress.js'
import * as VirtualMaster from './VirtualMaster.js'

const address = '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266' as const
const tempoAddress = TempoAddress.format(address)
const saltHex =
  '0x00000000000000000000000000000000000000000000000000000000abf52baf' as const
const saltBigInt = 0xabf52bafn
const saltBytes = new Uint8Array(32)
saltBytes[28] = 0xab
saltBytes[29] = 0xf5
saltBytes[30] = 0x2b
saltBytes[31] = 0xaf

describe('VirtualMaster.getRegistrationHash', () => {
  bench('hex address, hex salt', () => {
    VirtualMaster.getRegistrationHash({ address, salt: saltHex })
  })

  bench('hex address, bigint salt', () => {
    VirtualMaster.getRegistrationHash({ address, salt: saltBigInt })
  })

  bench('hex address, bytes salt', () => {
    VirtualMaster.getRegistrationHash({ address, salt: saltBytes })
  })

  bench('tempo address, hex salt', () => {
    VirtualMaster.getRegistrationHash({
      address: tempoAddress,
      salt: saltHex,
    })
  })
})

describe('VirtualMaster.getMasterId', () => {
  bench('hex address, hex salt', () => {
    VirtualMaster.getMasterId({ address, salt: saltHex })
  })
})

describe('VirtualMaster.validateSalt', () => {
  bench('valid salt', () => {
    VirtualMaster.validateSalt({ address, salt: saltHex })
  })

  bench('invalid salt', () => {
    VirtualMaster.validateSalt({ address, salt: 0n })
  })
})
