import { attest } from '@ark/attest'
import { Abi, AbiError, AbiItem } from 'ox'
import { test } from 'vitest'

import { seaportContractConfig } from '../../../test/constants/abis.js'

test('default', () => {
  const item = AbiError.fromAbi(seaportContractConfig.abi, {
    name: 'BadSignatureV',
  })
  attest(item).type.toString.snap(`{
  readonly inputs: readonly [
    { readonly name: "v"; readonly type: "uint8" }
  ]
  readonly name: "BadSignatureV"
  readonly type: "error"
}`)
})

test('behavior: unknown abi', () => {
  const item = AbiError.fromAbi(
    seaportContractConfig.abi as readonly unknown[],
    {
      name: 'BadSignatureV',
    },
  )
  attest(item).type.toString.snap('AbiError')
})

test('behavior: data', () => {
  const item = AbiError.fromAbi(seaportContractConfig.abi, {
    name: 'BadSignatureV',
  })
  const selector = AbiItem.getSelector(item)
  const item_2 = AbiError.fromAbi(seaportContractConfig.abi, {
    name: selector,
  })
  attest(item_2.name).type.toString.snap(`  | "Error"
  | "Panic"
  | "InvalidSignature"
  | "BadSignatureV"
  | "BadContractSignature"
  | "BadFraction"
  | "BadReturnValueFromERC20OnTransfer"
  | "ConsiderationCriteriaResolverOutOfRange"
  | "ConsiderationNotMet"
  | "CriteriaNotEnabledForItem"
  | "ERC1155BatchTransferGenericFailure"
  | "EtherTransferGenericFailure"
  | "InexactFraction"
  | "InsufficientEtherSupplied"
  | "Invalid1155BatchTransferEncoding"
  | "InvalidBasicOrderParameterEncoding"
  | "InvalidCallToConduit"
  | "InvalidCanceller"
  | "InvalidConduit"
  | "InvalidERC721TransferAmount"
  | "InvalidFulfillmentComponentData"
  | "InvalidMsgValue"
  | "InvalidNativeOfferItem"
  | "InvalidProof"
  | "InvalidRestrictedOrder"
  | "InvalidSigner"
  | "InvalidTime"
  | "MismatchedFulfillmentOfferAndConsiderationComponents"
  | "MissingFulfillmentComponentOnAggregation"
  | "MissingItemAmount"
  | "MissingOriginalConsiderationItems"
  | "NoContract"
  | "NoReentrantCalls"
  | "NoSpecifiedOrdersAvailable"
  | "OfferAndConsiderationRequiredOnFulfillment"
  | "OfferCriteriaResolverOutOfRange"
  | "OrderAlreadyFilled"
  | "OrderCriteriaResolverOutOfRange"
  | "OrderIsCancelled"
  | "OrderPartiallyFilled"
  | "PartialFillsNotEnabledForOrder"
  | "TokenTransferGenericFailure"
  | "UnresolvedConsiderationCriteria"
  | "UnresolvedOfferCriteria"
  | "UnusedItemParameters"`)
})

test('behavior: able to extract solidity Error', () => {
  const abi = Abi.from(['error Bar()', 'error Foo()', 'error Foo(uint256)'])
  const item = AbiError.fromAbi(abi, {
    name: 'Error',
  })
  attest(item).type.toString.snap(`{
  readonly inputs: readonly [
    { readonly name: "message"; readonly type: "string" }
  ]
  readonly name: "Error"
  readonly type: "error"
}`)
})

test('behavior: able to extract solidity Panic', () => {
  const abi = Abi.from(['error Bar()', 'error Foo()', 'error Foo(uint256)'])
  const item = AbiError.fromAbi(abi, {
    name: 'Panic',
  })
  attest(item).type.toString.snap(`{
  readonly inputs: readonly [
    { readonly name: "reason"; readonly type: "uint256" }
  ]
  readonly name: "Panic"
  readonly type: "error"
}`)
})

test('behavior: overloads', () => {
  const abi = Abi.from(['error Bar()', 'error Foo()', 'error Foo(uint256)'])
  const item = AbiError.fromAbi(abi, {
    name: 'Foo',
  })
  attest(item).type.toString.snap(`{
  readonly name: "Foo"
  readonly type: "error"
  readonly inputs: readonly []
}`)
})

test('behavior: overloads with args', () => {
  const abi = Abi.from(['error Bar()', 'error Foo()', 'error Foo(uint256)'])
  const item = AbiError.fromAbi(abi, {
    name: 'Foo',
    args: [1n],
  })
  attest(item).type.toString.snap(`{
  readonly name: "Foo"
  readonly type: "error"
  readonly inputs: readonly [{ readonly type: "uint256" }]
}`)
})

test('behavior: overloads: no inputs or args', () => {
  const abi = Abi.from([
    'error Bar()',
    'error Foo(bytes)',
    'error Foo(uint256)',
  ])
  const item = AbiError.fromAbi(abi, {
    name: 'Foo',
  })
  attest(item).type.toString.snap(`{
  readonly name: "Foo"
  readonly type: "error"
  readonly inputs: readonly [{ readonly type: "bytes" }]
  readonly overloads: [
    {
      readonly name: "Foo"
      readonly type: "error"
      readonly inputs: readonly [
        { readonly type: "uint256" }
      ]
    }
  ]
}`)
})

test('behavior: widened name', () => {
  const abi = Abi.from(seaportContractConfig.abi)
  const abiItem = AbiError.fromAbi(abi, {
    name: 'BadContractSignature' as AbiError.Name<typeof abi>,
  })
  attest(abiItem.name).type.toString.snap(`  | "Error"
  | "Panic"
  | "InvalidSignature"
  | "BadSignatureV"
  | "BadContractSignature"
  | "BadFraction"
  | "BadReturnValueFromERC20OnTransfer"
  | "ConsiderationCriteriaResolverOutOfRange"
  | "ConsiderationNotMet"
  | "CriteriaNotEnabledForItem"
  | "ERC1155BatchTransferGenericFailure"
  | "EtherTransferGenericFailure"
  | "InexactFraction"
  | "InsufficientEtherSupplied"
  | "Invalid1155BatchTransferEncoding"
  | "InvalidBasicOrderParameterEncoding"
  | "InvalidCallToConduit"
  | "InvalidCanceller"
  | "InvalidConduit"
  | "InvalidERC721TransferAmount"
  | "InvalidFulfillmentComponentData"
  | "InvalidMsgValue"
  | "InvalidNativeOfferItem"
  | "InvalidProof"
  | "InvalidRestrictedOrder"
  | "InvalidSigner"
  | "InvalidTime"
  | "MismatchedFulfillmentOfferAndConsiderationComponents"
  | "MissingFulfillmentComponentOnAggregation"
  | "MissingItemAmount"
  | "MissingOriginalConsiderationItems"
  | "NoContract"
  | "NoReentrantCalls"
  | "NoSpecifiedOrdersAvailable"
  | "OfferAndConsiderationRequiredOnFulfillment"
  | "OfferCriteriaResolverOutOfRange"
  | "OrderAlreadyFilled"
  | "OrderCriteriaResolverOutOfRange"
  | "OrderIsCancelled"
  | "OrderPartiallyFilled"
  | "PartialFillsNotEnabledForOrder"
  | "TokenTransferGenericFailure"
  | "UnresolvedConsiderationCriteria"
  | "UnresolvedOfferCriteria"
  | "UnusedItemParameters"`)
})
