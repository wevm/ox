import { attest } from '@ark/attest'
import { describe, test } from 'vitest'
import { UserOperation } from 'ox/erc4337'
import { Hex } from 'ox'

describe('from', () => {
  test('default', () => {
    const userOperation = UserOperation.from({
      callData: '0xdeadbeef',
      callGasLimit: 0n,
      maxFeePerGas: 0n,
      maxPriorityFeePerGas: 0n,
      nonce: 0n,
      preVerificationGas: 0n,
      sender: Hex.random(20),
      verificationGasLimit: 0n,
    })
    attest(userOperation).type.toString.snap(`{
  readonly callData: "0xdeadbeef"
  readonly callGasLimit: 0n
  readonly maxFeePerGas: 0n
  readonly maxPriorityFeePerGas: 0n
  readonly nonce: 0n
  readonly preVerificationGas: 0n
  readonly sender: \`0x\${string}\`
  readonly verificationGasLimit: 0n
}`)
  })

  test('options: signature', () => {
    const userOperation = UserOperation.from(
      {
        callData: '0xdeadbeef',
        callGasLimit: 0n,
        maxFeePerGas: 0n,
        maxPriorityFeePerGas: 0n,
        nonce: 0n,
        preVerificationGas: 0n,
        sender: Hex.random(20),
        verificationGasLimit: 0n,
      },
      { signature: Hex.random(64) },
    )
    attest(userOperation).type.toString.snap(`{
  readonly callData: "0xdeadbeef"
  readonly callGasLimit: 0n
  readonly maxFeePerGas: 0n
  readonly maxPriorityFeePerGas: 0n
  readonly nonce: 0n
  readonly preVerificationGas: 0n
  readonly sender: \`0x\${string}\`
  readonly verificationGasLimit: 0n
  readonly signature: \`0x\${string}\`
}`)
  })
})
