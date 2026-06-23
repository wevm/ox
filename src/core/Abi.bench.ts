import { bench, describe } from 'vp/test'
import * as Abi from './Abi.js'

const signatures = [
  'function name() view returns (string)',
  'function symbol() view returns (string)',
  'function decimals() view returns (uint8)',
  'function totalSupply() view returns (uint256)',
  'function balanceOf(address owner) view returns (uint256)',
  'function transfer(address to, uint256 amount) returns (bool)',
  'function transferFrom(address from, address to, uint256 amount) returns (bool)',
  'function approve(address spender, uint256 amount) returns (bool)',
  'function allowance(address owner, address spender) view returns (uint256)',
  'event Transfer(address indexed from, address indexed to, uint256 amount)',
  'event Approval(address indexed owner, address indexed spender, uint256 amount)',
] as const

const abi = Abi.from(signatures)

describe('Abi.from', () => {
  bench('erc20 human-readable ABI', () => {
    Abi.from(signatures)
  })
})

describe('Abi.format', () => {
  bench('erc20 JSON ABI', () => {
    Abi.format(abi)
  })
})
