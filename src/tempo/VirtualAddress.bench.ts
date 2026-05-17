import { bench, describe } from 'vitest'
import * as VirtualAddress from './VirtualAddress.js'

const virtualHex = '0x58e21090fdfdfdfdfdfdfdfdfdfd010203040506' as const

describe('VirtualAddress.from', () => {
  bench('hex parts', () => {
    VirtualAddress.from({
      masterId: '0x58e21090',
      userTag: '0x010203040506',
    })
  })

  bench('numeric parts', () => {
    VirtualAddress.from({
      masterId: 0x58e21090,
      userTag: 0x010203040506n,
    })
  })

  bench('mixed bytes parts', () => {
    VirtualAddress.from({
      masterId: new Uint8Array([0x58, 0xe2, 0x10, 0x90]),
      userTag: new Uint8Array([0x01, 0x02, 0x03, 0x04, 0x05, 0x06]),
    })
  })
})

describe('VirtualAddress.parse', () => {
  bench('hex address', () => {
    VirtualAddress.parse(virtualHex)
  })
})

describe('VirtualAddress.isVirtual', () => {
  bench('positive', () => {
    VirtualAddress.isVirtual(virtualHex)
  })

  bench('negative', () => {
    VirtualAddress.isVirtual('0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266')
  })
})
