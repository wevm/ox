import { attest } from '@ark/attest'
import { Hex } from 'ox'
import { UserOperation } from 'ox/erc4337'
import { describe, test } from 'vp/test'

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

describe('v0.9', () => {
  test('RPC round-trip', () => {
    const rpc = {
      callData: '0xdeadbeef',
      callGasLimit: '0x0',
      eip7702Auth: {
        address: '0x1234567890123456789012345678901234567890',
        chainId: '0x1',
        nonce: '0x0',
        r: '0x0000000000000000000000000000000000000000000000000000000000000001',
        s: '0x0000000000000000000000000000000000000000000000000000000000000002',
        yParity: '0x0',
      },
      maxFeePerGas: '0x0',
      maxPriorityFeePerGas: '0x0',
      nonce: '0x0',
      paymasterSignature: '0xcafebabe',
      preVerificationGas: '0x0',
      sender: '0x1234567890123456789012345678901234567890',
      signature: '0x',
      verificationGasLimit: '0x0',
    } as const satisfies UserOperation.Rpc<'0.9'>

    const userOperation = UserOperation.fromRpc(rpc)
    const rpc_roundTrip = UserOperation.toRpc(userOperation)

    attest<UserOperation.UserOperation<'0.9', true>, typeof userOperation>()
    attest<UserOperation.Rpc<'0.9'>, typeof rpc_roundTrip>()
  })
})
