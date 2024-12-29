import { Hex, Signature } from 'ox'
import { UserOperation } from 'ox/erc4337'
import { describe, expect, test } from 'vitest'

describe('from', () => {
  test('default', () => {
    const input = {
      callData: '0xdeadbeef',
      callGasLimit: 0n,
      maxFeePerGas: 0n,
      maxPriorityFeePerGas: 0n,
      nonce: 0n,
      preVerificationGas: 0n,
      sender: Hex.random(20),
      verificationGasLimit: 0n,
    } as const satisfies UserOperation.UserOperation
    const userOperation = UserOperation.from(input)
    expect(userOperation).toEqual(input)
  })

  test('options: signature', () => {
    const input = {
      callData: '0xdeadbeef',
      callGasLimit: 0n,
      maxFeePerGas: 0n,
      maxPriorityFeePerGas: 0n,
      nonce: 0n,
      preVerificationGas: 0n,
      sender: Hex.random(20),
      verificationGasLimit: 0n,
    } as const satisfies UserOperation.UserOperation
    const signature = Signature.from({
      r: 49782753348462494199823712700004552394425719014458918871452329774910450607807n,
      s: 33726695977844476214676913201140481102225469284307016937915595756355928419768n,
      yParity: 1,
    })
    const userOperation = UserOperation.from(input, { signature })
    expect(userOperation).toEqual({
      ...input,
      signature: Signature.toHex(signature),
    })
  })

  test('options: signature (hex)', () => {
    const input = {
      callData: '0xdeadbeef',
      callGasLimit: 0n,
      maxFeePerGas: 0n,
      maxPriorityFeePerGas: 0n,
      nonce: 0n,
      preVerificationGas: 0n,
      sender: Hex.random(20),
      verificationGasLimit: 0n,
    } as const satisfies UserOperation.UserOperation
    const signature = Hex.random(64)
    const userOperation = UserOperation.from(input, { signature })
    expect(userOperation).toEqual({ ...input, signature })
  })
})

describe('fromRpc', () => {
  test('default', () => {
    expect(
      UserOperation.fromRpc({
        callData: '0xdeadbeef',
        callGasLimit: '0x69420',
        maxFeePerGas: '0x2ca6ae494',
        maxPriorityFeePerGas: '0x2ca6ae494',
        nonce: '0x0',
        preVerificationGas: '0x69420',
        signature: '0x',
        sender: '0x1234567890123456789012345678901234567890',
        verificationGasLimit: '0x69420',
      }),
    ).toMatchInlineSnapshot(`
      {
        "callData": "0xdeadbeef",
        "callGasLimit": 431136n,
        "maxFeePerGas": 11985937556n,
        "maxPriorityFeePerGas": 11985937556n,
        "nonce": 0n,
        "preVerificationGas": 431136n,
        "sender": "0x1234567890123456789012345678901234567890",
        "signature": "0x",
        "verificationGasLimit": 431136n,
      }
    `)

    expect(
      UserOperation.fromRpc({
        callData: '0xdeadbeef',
        callGasLimit: '0x69420',
        maxFeePerGas: '0x2ca6ae494',
        maxPriorityFeePerGas: '0x2ca6ae494',
        nonce: '0x0',
        preVerificationGas: '0x69420',
        signature: '0x',
        sender: '0x1234567890123456789012345678901234567890',
        verificationGasLimit: '0x69420',
        paymasterPostOpGasLimit: '0x69420',
        paymasterVerificationGasLimit: '0x69420',
      }),
    ).toMatchInlineSnapshot(`
      {
        "callData": "0xdeadbeef",
        "callGasLimit": 431136n,
        "maxFeePerGas": 11985937556n,
        "maxPriorityFeePerGas": 11985937556n,
        "nonce": 0n,
        "paymasterPostOpGasLimit": 431136n,
        "paymasterVerificationGasLimit": 431136n,
        "preVerificationGas": 431136n,
        "sender": "0x1234567890123456789012345678901234567890",
        "signature": "0x",
        "verificationGasLimit": 431136n,
      }
    `)
  })
})

describe('getSignPayload', () => {
  test('default', () => {
    expect(
      UserOperation.getSignPayload(
        {
          callData: '0xdeadbeef',
          callGasLimit: 0n,
          maxFeePerGas: 0n,
          maxPriorityFeePerGas: 0n,
          nonce: 0n,
          preVerificationGas: 0n,
          sender: '0x0000000000000000000000000000000000000000',
          verificationGasLimit: 0n,
        },
        {
          chainId: 1,
          entryPointAddress: '0x1234567890123456789012345678901234567890',
          entryPointVersion: '0.7',
        },
      ),
    ).toMatchInlineSnapshot(
      `"0xf22cfb24d100997764c478f19c3a007dd972c5e82645a44cf9965c78dbad6ef0"`,
    )
  })
})

describe('hash', () => {
  describe('v0.7', () => {
    test('default', () => {
      const hash = UserOperation.hash(
        {
          callData: '0x',
          callGasLimit: 6942069n,
          maxFeePerGas: 69420n,
          maxPriorityFeePerGas: 69n,
          nonce: 0n,
          preVerificationGas: 6942069n,
          sender: '0x1234567890123456789012345678901234567890',
          signature: '0x',
          verificationGasLimit: 6942069n,
        },
        {
          chainId: 1,
          entryPointAddress: '0x1234567890123456789012345678901234567890',
          entryPointVersion: '0.7',
        },
      )
      expect(hash).toEqual(
        '0x1903d62bb5dc75af6fed866aa46d8e80063d9e288aa7f2caad0ff1fcae22e40d',
      )
    })

    test('args: factory + factoryData', () => {
      expect(
        UserOperation.hash(
          {
            callData: '0x',
            callGasLimit: 6942069n,
            maxFeePerGas: 69420n,
            maxPriorityFeePerGas: 69n,
            nonce: 0n,
            preVerificationGas: 6942069n,
            sender: '0x1234567890123456789012345678901234567890',
            signature: '0x',
            verificationGasLimit: 6942069n,
            factory: '0x1234567890123456789012345678901234567890',
            factoryData: '0xdeadbeef',
          },
          {
            chainId: 1,
            entryPointAddress: '0x1234567890123456789012345678901234567890',
            entryPointVersion: '0.7',
          },
        ),
      ).toMatchInlineSnapshot(
        `"0x46c1d51e831d50c1a93135f026a7d3f1921ed66e9c81da723dd3817a49f01bc1"`,
      )
    })

    test('args: paymaster', () => {
      expect(
        UserOperation.hash(
          {
            callData: '0x',
            callGasLimit: 6942069n,
            maxFeePerGas: 69420n,
            maxPriorityFeePerGas: 69n,
            nonce: 0n,
            preVerificationGas: 6942069n,
            sender: '0x1234567890123456789012345678901234567890',
            signature: '0x',
            verificationGasLimit: 6942069n,
            paymaster: '0x1234567890123456789012345678901234567890',
          },
          {
            chainId: 1,
            entryPointAddress: '0x1234567890123456789012345678901234567890',
            entryPointVersion: '0.7',
          },
        ),
      ).toMatchInlineSnapshot(
        `"0x1f2cf8638ead0fc621c6fb1562b8222c06539efcec09be156191f72418ebb109"`,
      )
    })

    test('args: paymasterVerificationGasLimit', () => {
      expect(
        UserOperation.hash(
          {
            callData: '0x',
            callGasLimit: 6942069n,
            maxFeePerGas: 69420n,
            maxPriorityFeePerGas: 69n,
            nonce: 0n,
            preVerificationGas: 6942069n,
            sender: '0x1234567890123456789012345678901234567890',
            signature: '0x',
            verificationGasLimit: 6942069n,
            paymaster: '0x1234567890123456789012345678901234567890',
            paymasterVerificationGasLimit: 6942069n,
          },
          {
            chainId: 1,
            entryPointAddress: '0x1234567890123456789012345678901234567890',
            entryPointVersion: '0.7',
          },
        ),
      ).toMatchInlineSnapshot(
        `"0x950763d3ef84eb05b6cd1d95f3b736bb02988d643c6e11a76bf8beddc611cc95"`,
      )
    })

    test('args: paymasterPostOpGasLimit', () => {
      expect(
        UserOperation.hash(
          {
            callData: '0x',
            callGasLimit: 6942069n,
            maxFeePerGas: 69420n,
            maxPriorityFeePerGas: 69n,
            nonce: 0n,
            preVerificationGas: 6942069n,
            sender: '0x1234567890123456789012345678901234567890',
            signature: '0x',
            verificationGasLimit: 6942069n,
            paymaster: '0x1234567890123456789012345678901234567890',
            paymasterVerificationGasLimit: 6942069n,
            paymasterPostOpGasLimit: 6942069n,
          },
          {
            chainId: 1,
            entryPointAddress: '0x1234567890123456789012345678901234567890',
            entryPointVersion: '0.7',
          },
        ),
      ).toMatchInlineSnapshot(
        `"0xd6efc63c28df53b49dd6fa10cec0a92ac61f8c70e9a45265e39c955f9bf821ed"`,
      )
    })

    test('args: paymasterData', () => {
      expect(
        UserOperation.hash(
          {
            callData: '0x',
            callGasLimit: 6942069n,
            maxFeePerGas: 69420n,
            maxPriorityFeePerGas: 69n,
            nonce: 0n,
            preVerificationGas: 6942069n,
            sender: '0x1234567890123456789012345678901234567890',
            signature: '0x',
            verificationGasLimit: 6942069n,
            paymaster: '0x1234567890123456789012345678901234567890',
            paymasterVerificationGasLimit: 6942069n,
            paymasterPostOpGasLimit: 6942069n,
            paymasterData: '0xdeadbeef',
          },
          {
            chainId: 1,
            entryPointAddress: '0x1234567890123456789012345678901234567890',
            entryPointVersion: '0.7',
          },
        ),
      ).toMatchInlineSnapshot(
        `"0x265fc1350b3fc016d493f9533354cf1a758c0fb9ddbbfd8b19c987d4e8935eed"`,
      )
    })
  })

  describe('v0.6', () => {
    test('default', () => {
      expect(
        UserOperation.hash(
          {
            callData: '0x',
            callGasLimit: 6942069n,
            maxFeePerGas: 69420n,
            maxPriorityFeePerGas: 69n,
            nonce: 0n,
            preVerificationGas: 6942069n,
            sender: '0x1234567890123456789012345678901234567890',
            signature: '0x',
            verificationGasLimit: 6942069n,
          },
          {
            chainId: 1,
            entryPointAddress: '0x1234567890123456789012345678901234567890',
            entryPointVersion: '0.6',
          },
        ),
      ).toMatchInlineSnapshot(
        `"0xe331591ab320e956b5e93f04e1dcf706bc128bc7b510602d2e0553f8be25fcba"`,
      )
    })

    test('args: initCode', () => {
      expect(
        UserOperation.hash(
          {
            callData: '0x',
            callGasLimit: 6942069n,
            maxFeePerGas: 69420n,
            maxPriorityFeePerGas: 69n,
            nonce: 0n,
            preVerificationGas: 6942069n,
            sender: '0x1234567890123456789012345678901234567890',
            signature: '0x',
            verificationGasLimit: 6942069n,
            initCode: '0x1234567890123456789012345678901234567890deadbeef',
          },
          {
            chainId: 1,
            entryPointAddress: '0x1234567890123456789012345678901234567890',
            entryPointVersion: '0.6',
          },
        ),
      ).toMatchInlineSnapshot(
        `"0xaa4a4fa863b3018e0e23291ca82a8747d06c6a92548eb9198f54f4a63540d06e"`,
      )
    })

    test('args: paymasterAndData', () => {
      expect(
        UserOperation.hash(
          {
            callData: '0x',
            callGasLimit: 6942069n,
            maxFeePerGas: 69420n,
            maxPriorityFeePerGas: 69n,
            nonce: 0n,
            preVerificationGas: 6942069n,
            sender: '0x1234567890123456789012345678901234567890',
            signature: '0x',
            verificationGasLimit: 6942069n,
            paymasterAndData: '0x1234567890123456789012345678901234567890',
          },
          {
            chainId: 1,
            entryPointAddress: '0x1234567890123456789012345678901234567890',
            entryPointVersion: '0.6',
          },
        ),
      ).toMatchInlineSnapshot(
        `"0x72bb2d82af9e9da2079fab165bc219c967c6ca0a63dfa55f382c5914ba2f77c5"`,
      )
    })
  })
})

describe('toPacked', () => {
  test('default', () => {
    expect(
      UserOperation.toPacked({
        callData: '0xdeadbeef',
        callGasLimit: 300_000n,
        maxFeePerGas: 100_000n,
        maxPriorityFeePerGas: 100_000n,
        nonce: 0n,
        preVerificationGas: 100_000n,
        sender: '0x1234567890123456789012345678901234567890',
        signature: '0x',
        verificationGasLimit: 100_000n,
      }),
    ).toMatchInlineSnapshot(`
      {
        "accountGasLimits": "0x000000000000000000000000000186a0000000000000000000000000000493e0",
        "callData": "0xdeadbeef",
        "gasFees": "0x000000000000000000000000000186a0000000000000000000000000000186a0",
        "initCode": "0x",
        "nonce": 0n,
        "paymasterAndData": "0x",
        "preVerificationGas": 100000n,
        "sender": "0x1234567890123456789012345678901234567890",
        "signature": "0x",
      }
    `)
  })

  test('args: factory + factoryData', () => {
    expect(
      UserOperation.toPacked({
        callData: '0xdeadbeef',
        callGasLimit: 300_000n,
        factory: '0x1234567890123456789012345678901234567890',
        factoryData: '0xdeadbeef',
        maxFeePerGas: 100_000n,
        maxPriorityFeePerGas: 100_000n,
        nonce: 0n,
        preVerificationGas: 100_000n,
        sender: '0x1234567890123456789012345678901234567890',
        signature: '0x',
        verificationGasLimit: 100_000n,
      }),
    ).toMatchInlineSnapshot(`
      {
        "accountGasLimits": "0x000000000000000000000000000186a0000000000000000000000000000493e0",
        "callData": "0xdeadbeef",
        "gasFees": "0x000000000000000000000000000186a0000000000000000000000000000186a0",
        "initCode": "0x1234567890123456789012345678901234567890deadbeef",
        "nonce": 0n,
        "paymasterAndData": "0x",
        "preVerificationGas": 100000n,
        "sender": "0x1234567890123456789012345678901234567890",
        "signature": "0x",
      }
    `)
  })

  test('args: paymaster', () => {
    expect(
      UserOperation.toPacked({
        callData: '0xdeadbeef',
        callGasLimit: 300_000n,
        factory: '0x1234567890123456789012345678901234567890',
        factoryData: '0xdeadbeef',
        maxFeePerGas: 100_000n,
        maxPriorityFeePerGas: 100_000n,
        paymaster: '0x1234567890123456789012345678901234567890',
        nonce: 0n,
        preVerificationGas: 100_000n,
        sender: '0x1234567890123456789012345678901234567890',
        signature: '0x',
        verificationGasLimit: 100_000n,
      }),
    ).toMatchInlineSnapshot(`
      {
        "accountGasLimits": "0x000000000000000000000000000186a0000000000000000000000000000493e0",
        "callData": "0xdeadbeef",
        "gasFees": "0x000000000000000000000000000186a0000000000000000000000000000186a0",
        "initCode": "0x1234567890123456789012345678901234567890deadbeef",
        "nonce": 0n,
        "paymasterAndData": "0x12345678901234567890123456789012345678900000000000000000000000000000000000000000000000000000000000000000",
        "preVerificationGas": 100000n,
        "sender": "0x1234567890123456789012345678901234567890",
        "signature": "0x",
      }
    `)
  })

  test('args: paymaster, paymasterData', () => {
    expect(
      UserOperation.toPacked({
        callData: '0xdeadbeef',
        callGasLimit: 300_000n,
        factory: '0x1234567890123456789012345678901234567890',
        factoryData: '0xdeadbeef',
        maxFeePerGas: 100_000n,
        maxPriorityFeePerGas: 100_000n,
        paymaster: '0x1234567890123456789012345678901234567890',
        paymasterData: '0xdeadbeef',
        nonce: 0n,
        preVerificationGas: 100_000n,
        sender: '0x1234567890123456789012345678901234567890',
        signature: '0x',
        verificationGasLimit: 100_000n,
      }),
    ).toMatchInlineSnapshot(`
      {
        "accountGasLimits": "0x000000000000000000000000000186a0000000000000000000000000000493e0",
        "callData": "0xdeadbeef",
        "gasFees": "0x000000000000000000000000000186a0000000000000000000000000000186a0",
        "initCode": "0x1234567890123456789012345678901234567890deadbeef",
        "nonce": 0n,
        "paymasterAndData": "0x12345678901234567890123456789012345678900000000000000000000000000000000000000000000000000000000000000000deadbeef",
        "preVerificationGas": 100000n,
        "sender": "0x1234567890123456789012345678901234567890",
        "signature": "0x",
      }
    `)
  })
})

describe('toRpc', () => {
  test('default', () => {
    expect(
      UserOperation.toRpc({
        callData: '0xdeadbeef',
        callGasLimit: 300_000n,
        maxFeePerGas: 100_000n,
        maxPriorityFeePerGas: 100_000n,
        nonce: 0n,
        preVerificationGas: 100_000n,
        sender: '0x1234567890123456789012345678901234567890',
        signature: '0x',
        verificationGasLimit: 100_000n,
      }),
    ).toMatchInlineSnapshot(`
      {
        "callData": "0xdeadbeef",
        "callGasLimit": "0x493e0",
        "maxFeePerGas": "0x186a0",
        "maxPriorityFeePerGas": "0x186a0",
        "nonce": "0x0",
        "preVerificationGas": "0x186a0",
        "sender": "0x1234567890123456789012345678901234567890",
        "signature": "0x",
        "verificationGasLimit": "0x186a0",
      }
    `)

    expect(
      UserOperation.toRpc({
        callData: '0xdeadbeef',
        callGasLimit: 300_000n,
        factory: '0x1234567890123456789012345678901234567890',
        factoryData: '0xdeadbeef',
        maxFeePerGas: 100_000n,
        maxPriorityFeePerGas: 100_000n,
        nonce: 0n,
        paymaster: '0x1234567890123456789012345678901234567890',
        paymasterData: '0xdeadbeef',
        paymasterPostOpGasLimit: 100_000n,
        paymasterVerificationGasLimit: 100_000n,
        preVerificationGas: 100_000n,
        sender: '0x1234567890123456789012345678901234567890',
        signature: '0x',
        verificationGasLimit: 100_000n,
      }),
    ).toMatchInlineSnapshot(`
      {
        "callData": "0xdeadbeef",
        "callGasLimit": "0x493e0",
        "factory": "0x1234567890123456789012345678901234567890",
        "factoryData": "0xdeadbeef",
        "maxFeePerGas": "0x186a0",
        "maxPriorityFeePerGas": "0x186a0",
        "nonce": "0x0",
        "paymaster": "0x1234567890123456789012345678901234567890",
        "paymasterData": "0xdeadbeef",
        "paymasterPostOpGasLimit": "0x186a0",
        "paymasterVerificationGasLimit": "0x186a0",
        "preVerificationGas": "0x186a0",
        "sender": "0x1234567890123456789012345678901234567890",
        "signature": "0x",
        "verificationGasLimit": "0x186a0",
      }
    `)
  })
})
