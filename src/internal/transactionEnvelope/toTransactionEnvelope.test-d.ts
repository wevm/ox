import { TransactionEnvelope } from 'ox'
import { expectTypeOf, test } from 'vitest'
import type {
  TransactionEnvelopeEip1559,
  TransactionEnvelopeEip2930,
  TransactionEnvelopeEip4844,
  TransactionEnvelopeEip7702,
  TransactionEnvelopeLegacy,
} from '../types/transactionEnvelope.js'

test('legacy', () => {
  {
    const envelope = {} as TransactionEnvelopeLegacy
    expectTypeOf(envelope.type).toEqualTypeOf<'legacy'>()
    expectTypeOf(envelope).toMatchTypeOf<TransactionEnvelopeLegacy>()
  }

  {
    const envelope = TransactionEnvelope.from({
      type: 'legacy',
    })
    expectTypeOf(envelope).toMatchTypeOf<TransactionEnvelopeLegacy>()
  }

  {
    const envelope = TransactionEnvelope.fromLegacy({})
    expectTypeOf(envelope).toMatchTypeOf<TransactionEnvelopeLegacy>()
  }

  {
    const envelope = TransactionEnvelope.from('0xabc')
    expectTypeOf(envelope).toMatchTypeOf<TransactionEnvelopeLegacy>()
  }
})

test('eip1559', () => {
  {
    const envelope = {} as TransactionEnvelopeEip1559
    expectTypeOf(envelope.type).toEqualTypeOf<'eip1559'>()
    expectTypeOf(envelope).toMatchTypeOf<TransactionEnvelopeEip1559>()
  }

  {
    const envelope = TransactionEnvelope.from({
      chainId: 1,
      type: 'eip1559',
    })
    expectTypeOf(envelope).toMatchTypeOf<TransactionEnvelopeEip1559>()
  }

  {
    const envelope = TransactionEnvelope.fromEip1559({
      chainId: 1,
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
    const envelope = {} as TransactionEnvelopeEip2930
    expectTypeOf(envelope.type).toEqualTypeOf<'eip2930'>()
    expectTypeOf(envelope).toMatchTypeOf<TransactionEnvelopeEip2930>()
  }

  {
    const envelope = TransactionEnvelope.from({
      accessList: [],
      chainId: 1,
      type: 'eip2930',
    })
    expectTypeOf(envelope).toMatchTypeOf<TransactionEnvelopeEip2930>()
  }

  {
    const envelope = TransactionEnvelope.fromEip2930({
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
    const envelope = {} as TransactionEnvelopeEip4844
    expectTypeOf(envelope.type).toEqualTypeOf<'eip4844'>()
    expectTypeOf(envelope).toMatchTypeOf<TransactionEnvelopeEip4844>()
  }

  {
    const envelope = TransactionEnvelope.from({
      blobVersionedHashes: [],
      chainId: 1,
      type: 'eip4844',
    })
    expectTypeOf(envelope).toMatchTypeOf<TransactionEnvelopeEip4844>()
  }

  {
    const envelope = TransactionEnvelope.fromEip4844({
      blobVersionedHashes: [],
      chainId: 1,
      type: 'eip4844',
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
    const envelope = {} as TransactionEnvelopeEip7702
    expectTypeOf(envelope.type).toEqualTypeOf<'eip7702'>()
    expectTypeOf(envelope).toMatchTypeOf<TransactionEnvelopeEip7702>()
  }

  {
    const envelope = TransactionEnvelope.from({
      authorizationList: [],
      chainId: 1,
      type: 'eip7702',
    })
    expectTypeOf(envelope).toMatchTypeOf<TransactionEnvelopeEip7702>()
  }

  {
    const envelope = TransactionEnvelope.fromEip7702({
      authorizationList: [],
      chainId: 1,
      type: 'eip7702',
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
