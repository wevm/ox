import { TransactionEnvelope } from 'ox'
import { expectTypeOf, test } from 'vitest'
import type {
  TransactionEnvelope_Eip1559,
  TransactionEnvelope_Eip2930,
  TransactionEnvelope_Eip4844,
  TransactionEnvelope_Eip7702,
  TransactionEnvelope_Legacy,
} from './types.js'

test('legacy', () => {
  {
    const envelope = {} as TransactionEnvelope_Legacy
    expectTypeOf(envelope.type).toEqualTypeOf<'legacy'>()
    expectTypeOf(envelope).toMatchTypeOf<TransactionEnvelope_Legacy>()
  }

  {
    const envelope = TransactionEnvelope.from({
      type: 'legacy',
    })
    expectTypeOf(envelope).toMatchTypeOf<TransactionEnvelope_Legacy>()
  }

  {
    const envelope = TransactionEnvelope.fromLegacy({})
    expectTypeOf(envelope).toMatchTypeOf<TransactionEnvelope_Legacy>()
  }

  {
    const envelope = TransactionEnvelope.from('0xabc')
    expectTypeOf(envelope).toMatchTypeOf<TransactionEnvelope_Legacy>()
  }
})

test('eip1559', () => {
  {
    const envelope = {} as TransactionEnvelope_Eip1559
    expectTypeOf(envelope.type).toEqualTypeOf<'eip1559'>()
    expectTypeOf(envelope).toMatchTypeOf<TransactionEnvelope_Eip1559>()
  }

  {
    const envelope = TransactionEnvelope.from({
      chainId: 1,
      type: 'eip1559',
    })
    expectTypeOf(envelope).toMatchTypeOf<TransactionEnvelope_Eip1559>()
  }

  {
    const envelope = TransactionEnvelope.fromEip1559({
      chainId: 1,
    })
    expectTypeOf(envelope).toMatchTypeOf<TransactionEnvelope_Eip1559>()
  }

  {
    const envelope = TransactionEnvelope.from('0x02abc')
    expectTypeOf(envelope).toMatchTypeOf<TransactionEnvelope_Eip1559>()
  }
})

test('eip2930', () => {
  {
    const envelope = {} as TransactionEnvelope_Eip2930
    expectTypeOf(envelope.type).toEqualTypeOf<'eip2930'>()
    expectTypeOf(envelope).toMatchTypeOf<TransactionEnvelope_Eip2930>()
  }

  {
    const envelope = TransactionEnvelope.from({
      accessList: [],
      chainId: 1,
      type: 'eip2930',
    })
    expectTypeOf(envelope).toMatchTypeOf<TransactionEnvelope_Eip2930>()
  }

  {
    const envelope = TransactionEnvelope.fromEip2930({
      chainId: 1,
    })
    expectTypeOf(envelope).toMatchTypeOf<TransactionEnvelope_Eip2930>()
  }

  {
    const envelope = TransactionEnvelope.from('0x01abc')
    expectTypeOf(envelope).toMatchTypeOf<TransactionEnvelope_Eip2930>()
  }
})

test('eip4844', () => {
  {
    const envelope = {} as TransactionEnvelope_Eip4844
    expectTypeOf(envelope.type).toEqualTypeOf<'eip4844'>()
    expectTypeOf(envelope).toMatchTypeOf<TransactionEnvelope_Eip4844>()
  }

  {
    const envelope = TransactionEnvelope.from({
      blobVersionedHashes: [],
      chainId: 1,
      type: 'eip4844',
    })
    expectTypeOf(envelope).toMatchTypeOf<TransactionEnvelope_Eip4844>()
  }

  {
    const envelope = TransactionEnvelope.fromEip4844({
      blobVersionedHashes: [],
      chainId: 1,
      type: 'eip4844',
    })
    expectTypeOf(envelope).toMatchTypeOf<TransactionEnvelope_Eip4844>()
  }

  {
    const envelope = TransactionEnvelope.from('0x03abc')
    expectTypeOf(envelope).toMatchTypeOf<TransactionEnvelope_Eip4844>()
  }
})

test('eip7702', () => {
  {
    const envelope = {} as TransactionEnvelope_Eip7702
    expectTypeOf(envelope.type).toEqualTypeOf<'eip7702'>()
    expectTypeOf(envelope).toMatchTypeOf<TransactionEnvelope_Eip7702>()
  }

  {
    const envelope = TransactionEnvelope.from({
      authorizationList: [],
      chainId: 1,
      type: 'eip7702',
    })
    expectTypeOf(envelope).toMatchTypeOf<TransactionEnvelope_Eip7702>()
  }

  {
    const envelope = TransactionEnvelope.fromEip7702({
      authorizationList: [],
      chainId: 1,
      type: 'eip7702',
    })
    expectTypeOf(envelope).toMatchTypeOf<TransactionEnvelope_Eip7702>()
  }

  {
    const envelope = TransactionEnvelope.from('0x04abc')
    expectTypeOf(envelope).toMatchTypeOf<TransactionEnvelope_Eip7702>()
  }
})

test('cannot infer transaction type', () => {
  const envelope = TransactionEnvelope.from({ chainId: 1 })
  expectTypeOf(envelope).toEqualTypeOf<never>()
})
