import { TransactionEnvelope, Value } from 'ox'
import { expectTypeOf, test } from 'vitest'
import type * as TransactionEnvelopeLegacy from '../../../TransactionEnvelopeLegacy.js'
import type { TransactionEnvelopeEip1559 } from '../eip1559/types.js'
import type { TransactionEnvelopeEip2930 } from '../eip2930/types.js'
import type { TransactionEnvelopeEip4844 } from '../eip4844/types.js'
import type { TransactionEnvelopeEip7702 } from '../eip7702/types.js'

test('legacy', () => {
  {
    const envelope = TransactionEnvelope.from({
      gasPrice: 1n,
    })
    expectTypeOf(
      envelope,
    ).toMatchTypeOf<TransactionEnvelopeLegacy.TransactionEnvelope>()
  }

  {
    const envelope = TransactionEnvelope.from(
      '0xabc' as TransactionEnvelopeLegacy.Serialized,
    )
    expectTypeOf(
      envelope,
    ).toMatchTypeOf<TransactionEnvelopeLegacy.TransactionEnvelope>()
  }

  {
    const envelope = TransactionEnvelope.from({
      type: 'legacy',
    })
    expectTypeOf(
      envelope,
    ).toMatchTypeOf<TransactionEnvelopeLegacy.TransactionEnvelope>()
  }
})

test('eip1559', () => {
  {
    const envelope = TransactionEnvelope.from({
      chainId: 1,
      maxFeePerGas: Value.fromGwei('2'),
    })
    expectTypeOf(envelope).toMatchTypeOf<TransactionEnvelopeEip1559>()
  }

  {
    const envelope = TransactionEnvelope.from('0x02abc')
    expectTypeOf(envelope).toMatchTypeOf<TransactionEnvelopeEip1559>()
  }
})

test('eip2930', () => {
  {
    const envelope = TransactionEnvelope.from({
      accessList: [],
      chainId: 1,
    })
    expectTypeOf(envelope).toMatchTypeOf<TransactionEnvelopeEip2930>()
  }

  {
    const envelope = TransactionEnvelope.from('0x01abc')
    expectTypeOf(envelope).toMatchTypeOf<TransactionEnvelopeEip2930>()
  }
})

test('eip4844', () => {
  {
    const envelope = TransactionEnvelope.from({
      blobVersionedHashes: [],
      chainId: 1,
    })
    expectTypeOf(envelope).toMatchTypeOf<TransactionEnvelopeEip4844>()
  }

  {
    const envelope = TransactionEnvelope.from('0x03abc')
    expectTypeOf(envelope).toMatchTypeOf<TransactionEnvelopeEip4844>()
  }
})

test('eip7702', () => {
  {
    const envelope = TransactionEnvelope.from({
      authorizationList: [],
      chainId: 1,
    })
    expectTypeOf(envelope).toMatchTypeOf<TransactionEnvelopeEip7702>()
  }

  {
    const envelope = TransactionEnvelope.from('0x04abc')
    expectTypeOf(envelope).toMatchTypeOf<TransactionEnvelopeEip7702>()
  }
})

test('cannot infer transaction type', () => {
  const envelope = TransactionEnvelope.from({ chainId: 1 })
  expectTypeOf(envelope).toEqualTypeOf<never>()
})
