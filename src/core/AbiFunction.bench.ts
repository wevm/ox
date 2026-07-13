import { bench, describe } from 'vp/test'
import * as Abi from './Abi.js'
import * as AbiFunction from './AbiFunction.js'

const erc20Abi = Abi.from([
  'function name() view returns (string)',
  'function symbol() view returns (string)',
  'function decimals() view returns (uint8)',
  'function totalSupply() view returns (uint256)',
  'function balanceOf(address owner) view returns (uint256)',
  'function transfer(address to, uint256 amount) returns (bool)',
  'function transferFrom(address from, address to, uint256 amount) returns (bool)',
  'function approve(address spender, uint256 amount) returns (bool)',
  'function allowance(address owner, address spender) view returns (uint256)',
])

const transferFn = AbiFunction.fromAbi(erc20Abi, 'transfer')
const transferArgs = [
  '0x1234567890123456789012345678901234567890' as `0x${string}`,
  1000000000000000000n,
] as const

const transferEncoded = AbiFunction.encodeData(transferFn, transferArgs)

const transferFromFn = AbiFunction.fromAbi(erc20Abi, 'transferFrom')
const transferFromArgs = [
  '0x1234567890123456789012345678901234567890' as `0x${string}`,
  '0x9876543210987654321098765432109876543210' as `0x${string}`,
  500000000000000000n,
] as const
const transferFromEncoded = AbiFunction.encodeData(
  transferFromFn,
  transferFromArgs,
)

describe('AbiFunction.encodeData', () => {
  bench('erc20.transfer', () => {
    AbiFunction.encodeData(transferFn, transferArgs)
  })

  bench('erc20.transferFrom', () => {
    AbiFunction.encodeData(transferFromFn, transferFromArgs)
  })
})

describe('AbiFunction.decodeData', () => {
  bench('erc20.transfer', () => {
    AbiFunction.decodeData(transferFn, transferEncoded)
  })

  bench('erc20.transferFrom', () => {
    AbiFunction.decodeData(transferFromFn, transferFromEncoded)
  })
})
