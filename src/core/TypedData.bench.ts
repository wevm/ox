import { bench, describe } from 'vp/test'
import * as TypedData from './TypedData.js'

const typedData = {
  domain: {
    chainId: 1,
    name: 'Ether Mail',
    verifyingContract: '0x0000000000000000000000000000000000000000',
    version: '1',
  },
  message: {
    contents: 'Hello, Bob!',
    from: {
      name: 'Cow',
      wallet: '0xCD2a3d9F938E13CD947Ec05AbC7FE734Df8DD826',
    },
    to: {
      name: 'Bob',
      wallet: '0xbBbBBBBbbBBBbbbBbbBbbbbBBbBbbbbBbBbbBBbB',
    },
  },
  primaryType: 'Mail',
  types: {
    Mail: [
      { name: 'from', type: 'Person' },
      { name: 'to', type: 'Person' },
      { name: 'contents', type: 'string' },
    ],
    Person: [
      { name: 'name', type: 'string' },
      { name: 'wallet', type: 'address' },
    ],
  },
} as const

describe('TypedData.getSignPayload', () => {
  bench('Mail', () => {
    TypedData.getSignPayload(typedData)
  })
})

describe('TypedData.hashStruct', () => {
  bench('Person', () => {
    TypedData.hashStruct({
      data: typedData.message.from,
      primaryType: 'Person',
      types: typedData.types,
    })
  })
})
