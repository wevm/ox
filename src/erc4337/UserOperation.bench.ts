import { bench, describe } from 'vp/test'
import * as UserOperation from './UserOperation.js'

const v06 = {
  callData: '0x',
  callGasLimit: 6_942_069n,
  initCode: '0x1234567890123456789012345678901234567890deadbeef',
  maxFeePerGas: 69_420n,
  maxPriorityFeePerGas: 69n,
  nonce: 0n,
  paymasterAndData: '0x1234567890123456789012345678901234567890',
  preVerificationGas: 6_942_069n,
  sender: '0x1234567890123456789012345678901234567890',
  signature: '0x',
  verificationGasLimit: 6_942_069n,
} as const

const v07 = {
  callData: '0x',
  callGasLimit: 6_942_069n,
  factory: '0x1234567890123456789012345678901234567890',
  factoryData: '0xdeadbeef',
  maxFeePerGas: 69_420n,
  maxPriorityFeePerGas: 69n,
  nonce: 0n,
  paymaster: '0x1234567890123456789012345678901234567890',
  paymasterData: '0xdeadbeef',
  paymasterPostOpGasLimit: 6_942_069n,
  paymasterVerificationGasLimit: 6_942_069n,
  preVerificationGas: 6_942_069n,
  sender: '0x1234567890123456789012345678901234567890',
  signature: '0x',
  verificationGasLimit: 6_942_069n,
} as const

const v08 = v07

const optionsV06 = {
  chainId: 1,
  entryPointAddress:
    '0x1234567890123456789012345678901234567890' as `0x${string}`,
  entryPointVersion: '0.6' as const,
}

const optionsV07 = {
  chainId: 1,
  entryPointAddress:
    '0x1234567890123456789012345678901234567890' as `0x${string}`,
  entryPointVersion: '0.7' as const,
}

const optionsV08 = {
  chainId: 1,
  entryPointAddress:
    '0x4337084D9E255Ff0702461CF8895CE9E3b5Ff108' as `0x${string}`,
  entryPointVersion: '0.8' as const,
}

describe('UserOperation.hash', () => {
  bench('v0.6', () => {
    UserOperation.hash(v06, optionsV06)
  })

  bench('v0.7', () => {
    UserOperation.hash(v07, optionsV07)
  })

  bench('v0.8', () => {
    UserOperation.hash(v08, optionsV08)
  })
})

describe('UserOperation.toPacked', () => {
  bench('default', () => {
    UserOperation.toPacked(v07)
  })

  bench('with paymaster', () => {
    UserOperation.toPacked({
      ...v07,
      paymaster: '0x1234567890123456789012345678901234567890',
      paymasterData: '0xdeadbeef',
      paymasterPostOpGasLimit: 6_942_069n,
      paymasterVerificationGasLimit: 6_942_069n,
    })
  })
})
