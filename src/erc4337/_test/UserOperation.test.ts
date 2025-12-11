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
      r: '0x635dc2033e60185bb36709c29c75d64ea51dfbd91c32ef4be198e4ceb169fb4d',
      s: '0x50c2667ac4c771072746acfdcf1f1483336dcca8bd2df47cd83175dbe60f0540',
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

  test('behavior: packed user operation', () => {
    const packed = {
      accountGasLimits:
        '0x000000000000000000000000000186a0000000000000000000000000000493e0',
      callData: '0xdeadbeef',
      gasFees:
        '0x000000000000000000000000000186a0000000000000000000000000000186a0',
      initCode: '0x1234567890123456789012345678901234567890deadbeef',
      nonce: 42n,
      paymasterAndData:
        '0x12345678901234567890123456789012345678900000000000000000000000000000000000000000000000000000000000000000deadbeef',
      preVerificationGas: 100_000n,
      sender: '0x1234567890123456789012345678901234567890',
      signature: '0xabcdef',
    } as const satisfies UserOperation.Packed

    const userOperation = UserOperation.from(packed)

    expect(userOperation).toEqual({
      callData: '0xdeadbeef',
      callGasLimit: 300_000n,
      factory: '0x1234567890123456789012345678901234567890',
      factoryData: '0xdeadbeef',
      maxFeePerGas: 100_000n,
      maxPriorityFeePerGas: 100_000n,
      nonce: 42n,
      paymaster: '0x1234567890123456789012345678901234567890',
      paymasterData: '0xdeadbeef',
      paymasterPostOpGasLimit: 0n,
      paymasterVerificationGasLimit: 0n,
      preVerificationGas: 100_000n,
      sender: '0x1234567890123456789012345678901234567890',
      signature: '0xabcdef',
      verificationGasLimit: 100_000n,
    })
  })

  test('behavior: packed user operation with signature override', () => {
    const packed = {
      accountGasLimits:
        '0x000000000000000000000000000186a0000000000000000000000000000493e0',
      callData: '0xdeadbeef',
      gasFees:
        '0x000000000000000000000000000186a0000000000000000000000000000186a0',
      initCode: '0x',
      nonce: 42n,
      paymasterAndData: '0x',
      preVerificationGas: 100_000n,
      sender: '0x1234567890123456789012345678901234567890',
      signature: '0xdeadbeef',
    } as const satisfies UserOperation.Packed

    const newSignature = '0xcafebabe'
    const userOperation = UserOperation.from(packed, {
      signature: newSignature,
    })

    expect(userOperation).toEqual({
      callData: '0xdeadbeef',
      callGasLimit: 300_000n,
      maxFeePerGas: 100_000n,
      maxPriorityFeePerGas: 100_000n,
      nonce: 42n,
      preVerificationGas: 100_000n,
      sender: '0x1234567890123456789012345678901234567890',
      signature: newSignature,
      verificationGasLimit: 100_000n,
    })
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
  describe('v0.8', () => {
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
            entryPointAddress: '0x4337084D9E255Ff0702461CF8895CE9E3b5Ff108',
            entryPointVersion: '0.8',
          },
        ),
      ).toMatchInlineSnapshot(
        `"0xa2224e732a1d4e2f923c7c05d586a0aa6cbc42172ec02f31d35fa9a2b8ba9208"`,
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
            entryPointAddress: '0x4337084D9E255Ff0702461CF8895CE9E3b5Ff108',
            entryPointVersion: '0.8',
          },
        ),
      ).toMatchInlineSnapshot(
        `"0x3146c70a9ef7538e9b9aca8b00ad4b127ca7eef7817a557f1801acbf8d68c206"`,
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
            entryPointAddress: '0x4337084D9E255Ff0702461CF8895CE9E3b5Ff108',
            entryPointVersion: '0.8',
          },
        ),
      ).toMatchInlineSnapshot(
        `"0x364bff8f9104a3854dce4f61f8479ce3019a3bd23e1c8db4da0d7c22850835b9"`,
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
            entryPointAddress: '0x4337084D9E255Ff0702461CF8895CE9E3b5Ff108',
            entryPointVersion: '0.8',
          },
        ),
      ).toMatchInlineSnapshot(
        `"0x9cb735eb4278caf0a9f53ad81e5f592e965c9d034f6e2780befa4cd09a990b04"`,
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
            entryPointAddress: '0x4337084D9E255Ff0702461CF8895CE9E3b5Ff108',
            entryPointVersion: '0.8',
          },
        ),
      ).toMatchInlineSnapshot(
        `"0x745602113988c3a6f18215d96eecc85775998dcb190e374a0955e637d40fe018"`,
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
            entryPointAddress: '0x4337084D9E255Ff0702461CF8895CE9E3b5Ff108',
            entryPointVersion: '0.8',
          },
        ),
      ).toMatchInlineSnapshot(
        `"0xf10ef9afcf27a4fd17e477cd19f37e588e3ff7d48eade07ab5b7eb8caf75667f"`,
      )
    })

    test('args: authorization', () => {
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
            factory: '0x7702',
            factoryData: '0xdeadbeef',
            authorization: {
              address: '0x1234567890123456789012345678901234567890',
              chainId: 1,
              nonce: 0n,
              yParity: 0,
              r: '0x',
              s: '0x',
            },
          },
          {
            chainId: 1,
            entryPointAddress: '0x4337084D9E255Ff0702461CF8895CE9E3b5Ff108',
            entryPointVersion: '0.8',
          },
        ),
      ).toMatchInlineSnapshot(
        `"0xd96232eb5d02f483166b9b23dca3ec2b963d70f09b961fce348c51d306278462"`,
      )

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
            factory: '0x7702',
            authorization: {
              address: '0x1234567890123456789012345678901234567890',
              chainId: 1,
              nonce: 0n,
              yParity: 0,
              r: '0x',
              s: '0x',
            },
          },
          {
            chainId: 1,
            entryPointAddress: '0x4337084D9E255Ff0702461CF8895CE9E3b5Ff108',
            entryPointVersion: '0.8',
          },
        ),
      ).toMatchInlineSnapshot(
        `"0x66fe6eaaaf1d6727d404384354a720cb24694c697bfbab77b3d02345c2d6e1da"`,
      )
    })
  })

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

describe('toInitCode', () => {
  test('behavior: no factory', () => {
    expect(
      UserOperation.toInitCode({
        factory: undefined,
        factoryData: undefined,
        authorization: undefined,
      }),
    ).toBe('0x')
  })

  test('behavior: regular factory without factoryData', () => {
    expect(
      UserOperation.toInitCode({
        factory: '0x1234567890123456789012345678901234567890',
        factoryData: undefined,
        authorization: undefined,
      }),
    ).toBe('0x1234567890123456789012345678901234567890')
  })

  test('behavior: regular factory with factoryData', () => {
    expect(
      UserOperation.toInitCode({
        factory: '0x1234567890123456789012345678901234567890',
        factoryData: '0xdeadbeef',
        authorization: undefined,
      }),
    ).toBe('0x1234567890123456789012345678901234567890deadbeef')
  })

  test('behavior: EIP-7702 factory (short form) without authorization', () => {
    expect(
      UserOperation.toInitCode({
        factory: '0x7702',
        factoryData: undefined,
        authorization: undefined,
      }),
    ).toBe('0x7702000000000000000000000000000000000000')
  })

  test('behavior: EIP-7702 factory (full form) without authorization', () => {
    expect(
      UserOperation.toInitCode({
        factory: '0x7702000000000000000000000000000000000000',
        factoryData: undefined,
        authorization: undefined,
      }),
    ).toBe('0x7702000000000000000000000000000000000000')
  })

  test('behavior: EIP-7702 factory with authorization and no factoryData', () => {
    expect(
      UserOperation.toInitCode({
        factory: '0x7702',
        factoryData: undefined,
        authorization: {
          address: '0x9f1fdab6458c5fc642fa0f4c5af7473c46837357',
          chainId: 1,
          nonce: 69n,
          yParity: 0,
          r: '0x0000000000000000000000000000000000000000000000000000000000000001',
          s: '0x0000000000000000000000000000000000000000000000000000000000000002',
        },
      }),
    ).toBe('0x9f1fdab6458c5fc642fa0f4c5af7473c46837357')
  })

  test('behavior: EIP-7702 factory with authorization and factoryData', () => {
    expect(
      UserOperation.toInitCode({
        factory: '0x7702',
        factoryData: '0xdeadbeef',
        authorization: {
          address: '0x9f1fdab6458c5fc642fa0f4c5af7473c46837357',
          chainId: 1,
          nonce: 69n,
          yParity: 0,
          r: '0x0000000000000000000000000000000000000000000000000000000000000001',
          s: '0x0000000000000000000000000000000000000000000000000000000000000002',
        },
      }),
    ).toBe('0x9f1fdab6458c5fc642fa0f4c5af7473c46837357deadbeef')
  })

  test('behavior: EIP-7702 factory (full form) with authorization and factoryData', () => {
    expect(
      UserOperation.toInitCode({
        factory: '0x7702000000000000000000000000000000000000',
        factoryData: '0xcafebabe',
        authorization: {
          address: '0x1234567890123456789012345678901234567890',
          chainId: 1,
          nonce: 42n,
          yParity: 1,
          r: '0x635dc2033e60185bb36709c29c75d64ea51dfbd91c32ef4be198e4ceb169fb4d',
          s: '0x50c2667ac4c771072746acfdcf1f1483336dcca8bd2df47cd83175dbe60f0540',
        },
      }),
    ).toBe('0x1234567890123456789012345678901234567890cafebabe')
  })
})

describe('fromPacked', () => {
  test('default', () => {
    const packed = {
      accountGasLimits:
        '0x000000000000000000000000000186a0000000000000000000000000000493e0',
      callData: '0xdeadbeef',
      gasFees:
        '0x000000000000000000000000000186a0000000000000000000000000000186a0',
      initCode: '0x',
      nonce: 0n,
      paymasterAndData: '0x',
      preVerificationGas: 100000n,
      sender: '0x1234567890123456789012345678901234567890',
      signature: '0x',
    } as const satisfies UserOperation.Packed

    expect(UserOperation.fromPacked(packed)).toMatchInlineSnapshot(`
      {
        "callData": "0xdeadbeef",
        "callGasLimit": 300000n,
        "maxFeePerGas": 100000n,
        "maxPriorityFeePerGas": 100000n,
        "nonce": 0n,
        "preVerificationGas": 100000n,
        "sender": "0x1234567890123456789012345678901234567890",
        "signature": "0x",
        "verificationGasLimit": 100000n,
      }
    `)
  })

  test('args: factory + factoryData', () => {
    const packed = {
      accountGasLimits:
        '0x000000000000000000000000000186a0000000000000000000000000000493e0',
      callData: '0xdeadbeef',
      gasFees:
        '0x000000000000000000000000000186a0000000000000000000000000000186a0',
      initCode: '0x1234567890123456789012345678901234567890deadbeef',
      nonce: 0n,
      paymasterAndData: '0x',
      preVerificationGas: 100000n,
      sender: '0x1234567890123456789012345678901234567890',
      signature: '0x',
    } as const satisfies UserOperation.Packed

    expect(UserOperation.fromPacked(packed)).toMatchInlineSnapshot(`
      {
        "callData": "0xdeadbeef",
        "callGasLimit": 300000n,
        "factory": "0x1234567890123456789012345678901234567890",
        "factoryData": "0xdeadbeef",
        "maxFeePerGas": 100000n,
        "maxPriorityFeePerGas": 100000n,
        "nonce": 0n,
        "preVerificationGas": 100000n,
        "sender": "0x1234567890123456789012345678901234567890",
        "signature": "0x",
        "verificationGasLimit": 100000n,
      }
    `)
  })

  test('args: paymaster', () => {
    const packed = {
      accountGasLimits:
        '0x000000000000000000000000000186a0000000000000000000000000000493e0',
      callData: '0xdeadbeef',
      gasFees:
        '0x000000000000000000000000000186a0000000000000000000000000000186a0',
      initCode: '0x1234567890123456789012345678901234567890deadbeef',
      nonce: 0n,
      paymasterAndData:
        '0x12345678901234567890123456789012345678900000000000000000000000000000000000000000000000000000000000000000',
      preVerificationGas: 100000n,
      sender: '0x1234567890123456789012345678901234567890',
      signature: '0x',
    } as const satisfies UserOperation.Packed

    expect(UserOperation.fromPacked(packed)).toMatchInlineSnapshot(`
      {
        "callData": "0xdeadbeef",
        "callGasLimit": 300000n,
        "factory": "0x1234567890123456789012345678901234567890",
        "factoryData": "0xdeadbeef",
        "maxFeePerGas": 100000n,
        "maxPriorityFeePerGas": 100000n,
        "nonce": 0n,
        "paymaster": "0x1234567890123456789012345678901234567890",
        "paymasterPostOpGasLimit": 0n,
        "paymasterVerificationGasLimit": 0n,
        "preVerificationGas": 100000n,
        "sender": "0x1234567890123456789012345678901234567890",
        "signature": "0x",
        "verificationGasLimit": 100000n,
      }
    `)
  })

  test('args: paymaster, paymasterData', () => {
    const packed = {
      accountGasLimits:
        '0x000000000000000000000000000186a0000000000000000000000000000493e0',
      callData: '0xdeadbeef',
      gasFees:
        '0x000000000000000000000000000186a0000000000000000000000000000186a0',
      initCode: '0x1234567890123456789012345678901234567890deadbeef',
      nonce: 0n,
      paymasterAndData:
        '0x12345678901234567890123456789012345678900000000000000000000000000000000000000000000000000000000000000000deadbeef',
      preVerificationGas: 100000n,
      sender: '0x1234567890123456789012345678901234567890',
      signature: '0x',
    } as const satisfies UserOperation.Packed

    expect(UserOperation.fromPacked(packed)).toMatchInlineSnapshot(`
      {
        "callData": "0xdeadbeef",
        "callGasLimit": 300000n,
        "factory": "0x1234567890123456789012345678901234567890",
        "factoryData": "0xdeadbeef",
        "maxFeePerGas": 100000n,
        "maxPriorityFeePerGas": 100000n,
        "nonce": 0n,
        "paymaster": "0x1234567890123456789012345678901234567890",
        "paymasterData": "0xdeadbeef",
        "paymasterPostOpGasLimit": 0n,
        "paymasterVerificationGasLimit": 0n,
        "preVerificationGas": 100000n,
        "sender": "0x1234567890123456789012345678901234567890",
        "signature": "0x",
        "verificationGasLimit": 100000n,
      }
    `)
  })

  test('behavior: round-trip: fromPacked(toPacked(userOperation)) === userOperation', () => {
    const userOperation = {
      callData: '0xdeadbeef',
      callGasLimit: 300_000n,
      factory: '0x1234567890123456789012345678901234567890',
      factoryData: '0xdeadbeef',
      maxFeePerGas: 100_000n,
      maxPriorityFeePerGas: 50_000n,
      nonce: 42n,
      paymaster: '0x9876543210987654321098765432109876543210',
      paymasterData: '0xcafebabe',
      paymasterPostOpGasLimit: 150_000n,
      paymasterVerificationGasLimit: 200_000n,
      preVerificationGas: 100_000n,
      sender: '0x1234567890123456789012345678901234567890',
      signature: '0xabcdef',
      verificationGasLimit: 250_000n,
    } as const satisfies UserOperation.UserOperation<'0.7', true>

    const packed = UserOperation.toPacked(userOperation)
    const unpacked = UserOperation.fromPacked(packed)

    expect(unpacked).toEqual(userOperation)
  })

  test('behavior: round-trip: minimal userOperation', () => {
    const userOperation = {
      callData: '0x',
      callGasLimit: 0n,
      maxFeePerGas: 0n,
      maxPriorityFeePerGas: 0n,
      nonce: 0n,
      preVerificationGas: 0n,
      sender: '0x0000000000000000000000000000000000000000',
      signature: '0x',
      verificationGasLimit: 0n,
    } as const satisfies UserOperation.UserOperation<'0.7', true>

    const packed = UserOperation.toPacked(userOperation)
    const unpacked = UserOperation.fromPacked(packed)

    expect(unpacked).toEqual(userOperation)
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

describe('toTypedData', () => {
  describe('v0.8', () => {
    test('default', () => {
      expect(
        UserOperation.toTypedData(
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
            entryPointAddress: '0x4337084D9E255Ff0702461CF8895CE9E3b5Ff108',
          },
        ),
      ).toMatchInlineSnapshot(
        `
        {
          "domain": {
            "chainId": 1,
            "name": "ERC4337",
            "verifyingContract": "0x4337084D9E255Ff0702461CF8895CE9E3b5Ff108",
            "version": "1",
          },
          "message": {
            "accountGasLimits": "0x0000000000000000000000000069ed750000000000000000000000000069ed75",
            "callData": "0x",
            "gasFees": "0x0000000000000000000000000000004500000000000000000000000000010f2c",
            "initCode": "0x",
            "nonce": 0n,
            "paymasterAndData": "0x",
            "preVerificationGas": 6942069n,
            "sender": "0x1234567890123456789012345678901234567890",
            "signature": "0x",
          },
          "primaryType": "PackedUserOperation",
          "types": {
            "PackedUserOperation": [
              {
                "name": "sender",
                "type": "address",
              },
              {
                "name": "nonce",
                "type": "uint256",
              },
              {
                "name": "initCode",
                "type": "bytes",
              },
              {
                "name": "callData",
                "type": "bytes",
              },
              {
                "name": "accountGasLimits",
                "type": "bytes32",
              },
              {
                "name": "preVerificationGas",
                "type": "uint256",
              },
              {
                "name": "gasFees",
                "type": "bytes32",
              },
              {
                "name": "paymasterAndData",
                "type": "bytes",
              },
            ],
          },
        }
      `,
      )
    })

    test('args: authorization', () => {
      expect(
        UserOperation.toTypedData(
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
            factory: '0x7702',
            factoryData: '0xdeadbeef',
            authorization: {
              address: '0x1234567890123456789012345678901234567890',
              chainId: 1,
              nonce: 0n,
              yParity: 0,
              r: '0x0000000000000000000000000000000000000000000000000000000000000001',
              s: '0x0000000000000000000000000000000000000000000000000000000000000002',
            },
          },
          {
            chainId: 1,
            entryPointAddress: '0x4337084D9E255Ff0702461CF8895CE9E3b5Ff108',
          },
        ),
      ).toMatchInlineSnapshot(
        `
        {
          "domain": {
            "chainId": 1,
            "name": "ERC4337",
            "verifyingContract": "0x4337084D9E255Ff0702461CF8895CE9E3b5Ff108",
            "version": "1",
          },
          "message": {
            "accountGasLimits": "0x0000000000000000000000000069ed750000000000000000000000000069ed75",
            "callData": "0x",
            "gasFees": "0x0000000000000000000000000000004500000000000000000000000000010f2c",
            "initCode": "0x1234567890123456789012345678901234567890deadbeef",
            "nonce": 0n,
            "paymasterAndData": "0x12345678901234567890123456789012345678900000000000000000000000000069ed750000000000000000000000000069ed75deadbeef",
            "preVerificationGas": 6942069n,
            "sender": "0x1234567890123456789012345678901234567890",
            "signature": "0x",
          },
          "primaryType": "PackedUserOperation",
          "types": {
            "PackedUserOperation": [
              {
                "name": "sender",
                "type": "address",
              },
              {
                "name": "nonce",
                "type": "uint256",
              },
              {
                "name": "initCode",
                "type": "bytes",
              },
              {
                "name": "callData",
                "type": "bytes",
              },
              {
                "name": "accountGasLimits",
                "type": "bytes32",
              },
              {
                "name": "preVerificationGas",
                "type": "uint256",
              },
              {
                "name": "gasFees",
                "type": "bytes32",
              },
              {
                "name": "paymasterAndData",
                "type": "bytes",
              },
            ],
          },
        }
      `,
      )

      expect(
        UserOperation.toTypedData(
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
            factory: '0x7702',
            authorization: {
              address: '0x1234567890123456789012345678901234567890',
              chainId: 1,
              nonce: 0n,
              yParity: 0,
              r: '0x0000000000000000000000000000000000000000000000000000000000000001',
              s: '0x0000000000000000000000000000000000000000000000000000000000000002',
            },
          },
          {
            chainId: 1,
            entryPointAddress: '0x4337084D9E255Ff0702461CF8895CE9E3b5Ff108',
          },
        ),
      ).toMatchInlineSnapshot(
        `
        {
          "domain": {
            "chainId": 1,
            "name": "ERC4337",
            "verifyingContract": "0x4337084D9E255Ff0702461CF8895CE9E3b5Ff108",
            "version": "1",
          },
          "message": {
            "accountGasLimits": "0x0000000000000000000000000069ed750000000000000000000000000069ed75",
            "callData": "0x",
            "gasFees": "0x0000000000000000000000000000004500000000000000000000000000010f2c",
            "initCode": "0x1234567890123456789012345678901234567890",
            "nonce": 0n,
            "paymasterAndData": "0x12345678901234567890123456789012345678900000000000000000000000000069ed750000000000000000000000000069ed75deadbeef",
            "preVerificationGas": 6942069n,
            "sender": "0x1234567890123456789012345678901234567890",
            "signature": "0x",
          },
          "primaryType": "PackedUserOperation",
          "types": {
            "PackedUserOperation": [
              {
                "name": "sender",
                "type": "address",
              },
              {
                "name": "nonce",
                "type": "uint256",
              },
              {
                "name": "initCode",
                "type": "bytes",
              },
              {
                "name": "callData",
                "type": "bytes",
              },
              {
                "name": "accountGasLimits",
                "type": "bytes32",
              },
              {
                "name": "preVerificationGas",
                "type": "uint256",
              },
              {
                "name": "gasFees",
                "type": "bytes32",
              },
              {
                "name": "paymasterAndData",
                "type": "bytes",
              },
            ],
          },
        }
      `,
      )
    })
  })
})
