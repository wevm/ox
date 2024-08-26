import { assertType, describe, expect, test } from 'vitest'

import type { TransactionEnvelopeLegacy } from '../../index.js'
import type { Hex } from '../hex/types.js'
import { TransactionEnvelope_getType } from './getType.js'
import type { TransactionEnvelope_Type } from './types.js'

describe('type', () => {
  test('eip1559', () => {
    {
      const type = TransactionEnvelope_getType({ chainId: 1, type: 'eip1559' })
      assertType<'eip1559'>(type)
      expect(type).toEqual('eip1559')
    }

    {
      const type = TransactionEnvelope_getType('0x02abc')
      assertType<'eip1559'>(type)
      expect(type).toEqual('eip1559')
    }
  })

  test('eip2930', () => {
    {
      const type = TransactionEnvelope_getType({ chainId: 1, type: 'eip2930' })
      assertType<'eip2930'>(type)
      expect(type).toEqual('eip2930')
    }

    {
      const type = TransactionEnvelope_getType('0x01abc')
      assertType<'eip2930'>(type)
      expect(type).toEqual('eip2930')
    }
  })

  test('eip4844', () => {
    {
      const type = TransactionEnvelope_getType({ chainId: 1, type: 'eip4844' })
      assertType<'eip4844'>(type)
      expect(type).toEqual('eip4844')
    }

    {
      const type = TransactionEnvelope_getType('0x03abc')
      assertType<'eip4844'>(type)
      expect(type).toEqual('eip4844')
    }
  })

  test('eip7702', () => {
    {
      const type = TransactionEnvelope_getType({ chainId: 1, type: 'eip7702' })
      assertType<'eip7702'>(type)
      expect(type).toEqual('eip7702')
    }

    {
      const type = TransactionEnvelope_getType('0x04abc')
      assertType<'eip7702'>(type)
      expect(type).toEqual('eip7702')
    }
  })

  test('legacy', () => {
    {
      const type = TransactionEnvelope_getType({ type: 'legacy' })
      assertType<'legacy'>(type)
      expect(type).toEqual('legacy')
    }

    {
      const type = TransactionEnvelope_getType(
        '0xc7c' as TransactionEnvelopeLegacy.Serialized,
      )
      assertType<'legacy'>(type)
      expect(type).toEqual('legacy')
    }
  })

  test('other', () => {
    {
      const type = TransactionEnvelope_getType({ type: '0x7e' })
      assertType<'0x7e'>(type)
      expect(type).toEqual('0x7e')
    }

    {
      const type = TransactionEnvelope_getType('0xc7c' as Hex)
      assertType<TransactionEnvelope_Type>(type)
      expect(type).toEqual('legacy')
    }
  })
})

describe('attributes', () => {
  test('eip1559', () => {
    const type = TransactionEnvelope_getType({
      chainId: 1,
      maxFeePerGas: 1n,
    })
    assertType<'eip1559'>(type)
    expect(type).toEqual('eip1559')
  })

  test('eip1559 with gasPrice undefined', () => {
    const type = TransactionEnvelope_getType({
      chainId: 1,
      maxFeePerGas: 1n,
      gasPrice: undefined,
    })
    assertType<'eip1559'>(type)
    expect(type).toEqual('eip1559')
  })

  test('eip2930', () => {
    const type = TransactionEnvelope_getType({
      chainId: 1,
      gasPrice: 1n,
      accessList: [],
    })
    assertType<'eip2930'>(type)
    expect(type).toEqual('eip2930')
  })

  test('eip2930 with eip1559 properties undefined', () => {
    const type = TransactionEnvelope_getType({
      chainId: 1,
      gasPrice: 1n,
      maxFeePerGas: undefined,
      maxPriorityFeePerGas: undefined,
      accessList: [],
    })
    assertType<'eip2930'>(type)
    expect(type).toEqual('eip2930')
  })

  test('eip4844', () => {
    const type = TransactionEnvelope_getType({
      blobVersionedHashes: ['0x'],
      chainId: 1,
    })
    assertType<'eip4844'>(type)
    expect(type).toEqual('eip4844')
  })

  test('eip4844 with eip1559 properties', () => {
    const type = TransactionEnvelope_getType({
      blobVersionedHashes: ['0x'],
      maxFeePerGas: 1n,
      chainId: 1,
    })
    assertType<'eip4844'>(type)
    expect(type).toEqual('eip4844')
  })

  test('eip7702', () => {
    const type = TransactionEnvelope_getType({
      authorizationList: [],
      chainId: 1,
    })
    assertType<'eip7702'>(type)
    expect(type).toEqual('eip7702')
  })

  test('eip7702 with eip1559 properties', () => {
    const type = TransactionEnvelope_getType({
      authorizationList: [],
      maxFeePerGas: 1n,
      chainId: 1,
    })
    assertType<'eip7702'>(type)
    expect(type).toEqual('eip7702')
  })

  test('legacy', () => {
    const type = TransactionEnvelope_getType({ gasPrice: 1n })
    assertType<'legacy'>(type)
    expect(type).toEqual('legacy')
  })

  test('legacy with eip1559 properties undefined', () => {
    const type = TransactionEnvelope_getType({
      gasPrice: 1n,
      maxFeePerGas: undefined,
      maxPriorityFeePerGas: undefined,
    })
    assertType<'legacy'>(type)
    expect(type).toEqual('legacy')
  })
})

test('invalid', () => {
  expect(() =>
    TransactionEnvelope_getType({ chainId: 1 }),
  ).toThrowErrorMatchingInlineSnapshot(`
    [CannotInferTransactionTypeError: Cannot infer a transaction type from provided transaction.

    Provided Transaction:
    {
      chainId:  1
    }

    To infer the type, either provide:
    - a \`type\` to the Transaction, or
    - an EIP-1559 Transaction with \`maxFeePerGas\`, or
    - an EIP-2930 Transaction with \`gasPrice\` & \`accessList\`, or
    - an EIP-4844 Transaction with \`blobs\`, \`blobVersionedHashes\`, \`sidecars\`, or
    - an EIP-7702 Transaction with \`authorizationList\`, or
    - a Legacy Transaction with \`gasPrice\`]
  `)

  expect(() =>
    TransactionEnvelope_getType('0x69abc'),
  ).toThrowErrorMatchingInlineSnapshot(
    '[TransactionTypeNotImplementedError: The provided transaction type `0x69` is not implemented.]',
  )
})
