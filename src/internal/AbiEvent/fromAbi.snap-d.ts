import { attest } from '@ark/attest'
import { Abi, AbiEvent } from 'ox'
import { test } from 'vitest'

import { wagmiContractConfig } from '../../../test/constants/abis.js'

test('default', () => {
  const item = AbiEvent.fromAbi(wagmiContractConfig.abi, 'Approval')
  attest(item).type.toString.snap(`{
  readonly anonymous: false
  readonly inputs: readonly [
    {
      readonly indexed: true
      readonly name: "owner"
      readonly type: "address"
    },
    {
      readonly indexed: true
      readonly name: "approved"
      readonly type: "address"
    },
    {
      readonly indexed: true
      readonly name: "tokenId"
      readonly type: "uint256"
    }
  ]
  readonly name: "Approval"
  readonly type: "event"
}`)
})

test('behavior: unknown abi', () => {
  const item = AbiEvent.fromAbi(
    wagmiContractConfig.abi as readonly unknown[],
    'Approval',
  )
  attest(item).type.toString.snap('AbiEvent')
})

test('behavior: name', () => {
  const item = AbiEvent.fromAbi(wagmiContractConfig.abi, 'Approval')
  const item_2 = AbiEvent.fromAbi(
    wagmiContractConfig.abi,
    AbiEvent.getSelector(item),
  )
  attest(item_2).type.toString.snap(`  | {
      readonly anonymous: false
      readonly inputs: readonly [
        {
          readonly indexed: true
          readonly name: "owner"
          readonly type: "address"
        },
        {
          readonly indexed: true
          readonly name: "approved"
          readonly type: "address"
        },
        {
          readonly indexed: true
          readonly name: "tokenId"
          readonly type: "uint256"
        }
      ]
      readonly name: "Approval"
      readonly type: "event"
    }
  | {
      readonly anonymous: false
      readonly inputs: readonly [
        {
          readonly indexed: true
          readonly name: "owner"
          readonly type: "address"
        },
        {
          readonly indexed: true
          readonly name: "operator"
          readonly type: "address"
        },
        {
          readonly indexed: false
          readonly name: "approved"
          readonly type: "bool"
        }
      ]
      readonly name: "ApprovalForAll"
      readonly type: "event"
    }
  | {
      readonly anonymous: false
      readonly inputs: readonly [
        {
          readonly indexed: true
          readonly name: "from"
          readonly type: "address"
        },
        {
          readonly indexed: true
          readonly name: "to"
          readonly type: "address"
        },
        {
          readonly indexed: true
          readonly name: "tokenId"
          readonly type: "uint256"
        }
      ]
      readonly name: "Transfer"
      readonly type: "event"
    }`)
})

test('behavior: overloads', () => {
  const abi = Abi.from(['event Bar()', 'event Foo()', 'event Foo(uint256)'])
  const item = AbiEvent.fromAbi(abi, 'Foo')
  attest(item).type.toString.snap(`{
  readonly name: "Foo"
  readonly type: "event"
  readonly inputs: readonly []
}`)
})

test('behavior: overloads: no inputs or args', () => {
  const abi = Abi.from([
    'event Bar()',
    'event Foo(bytes)',
    'event Foo(uint256)',
  ])
  const item = AbiEvent.fromAbi(abi, 'Foo')
  attest(item).type.toString.snap(`{
  readonly name: "Foo"
  readonly type: "event"
  readonly inputs: readonly [{ readonly type: "bytes" }]
  readonly overloads: [
    {
      readonly name: "Foo"
      readonly type: "event"
      readonly inputs: readonly [
        { readonly type: "uint256" }
      ]
    }
  ]
}`)
})

test('behavior: widened name', () => {
  const abi = Abi.from(wagmiContractConfig.abi)
  const abiItem = AbiEvent.fromAbi(abi, 'Approval' as AbiEvent.Name<typeof abi>)
  attest(abiItem.name).type.toString.snap(
    '"Transfer" | "Approval" | "ApprovalForAll"',
  )
})
