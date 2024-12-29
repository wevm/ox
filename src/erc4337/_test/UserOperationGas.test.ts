import { UserOperationGas } from 'ox/erc4337'
import { describe, expect, test } from 'vitest'

describe('fromRpc', () => {
  test('default', () => {
    expect(
      UserOperationGas.fromRpc({
        callGasLimit: '0x493e0',
        preVerificationGas: '0x186a0',
        verificationGasLimit: '0x186a0',
      }),
    ).toMatchInlineSnapshot(`
      {
        "callGasLimit": 300000n,
        "preVerificationGas": 100000n,
        "verificationGasLimit": 100000n,
      }
    `)

    expect(
      UserOperationGas.fromRpc({
        callGasLimit: '0x493e0',
        preVerificationGas: '0x186a0',
        verificationGasLimit: '0x186a0',
        paymasterVerificationGasLimit: '0x186a0',
        paymasterPostOpGasLimit: '0x186a0',
      }),
    ).toMatchInlineSnapshot(`
      {
        "callGasLimit": 300000n,
        "paymasterPostOpGasLimit": 100000n,
        "paymasterVerificationGasLimit": 100000n,
        "preVerificationGas": 100000n,
        "verificationGasLimit": 100000n,
      }
    `)
  })
})

describe('toRpc', () => {
  test('default', () => {
    expect(
      UserOperationGas.toRpc({
        callGasLimit: 300_000n,
        preVerificationGas: 100_000n,
        verificationGasLimit: 100_000n,
      }),
    ).toMatchInlineSnapshot(`
      {
        "callGasLimit": "0x493e0",
        "preVerificationGas": "0x186a0",
        "verificationGasLimit": "0x186a0",
      }
    `)

    expect(
      UserOperationGas.toRpc({
        callGasLimit: 300_000n,
        preVerificationGas: 100_000n,
        verificationGasLimit: 100_000n,
        paymasterVerificationGasLimit: 100_000n,
        paymasterPostOpGasLimit: 100_000n,
      }),
    ).toMatchInlineSnapshot(`
      {
        "callGasLimit": "0x493e0",
        "paymasterPostOpGasLimit": "0x186a0",
        "paymasterVerificationGasLimit": "0x186a0",
        "preVerificationGas": "0x186a0",
        "verificationGasLimit": "0x186a0",
      }
    `)
  })
})
