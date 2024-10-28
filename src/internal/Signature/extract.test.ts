import { Signature, TransactionEnvelopeEip1559 } from 'ox'
import { expect, test } from 'vitest'

test('default', () => {
  const signature = Signature.from({
    r: BigInt(
      '0x73b39769ff4a36515c8fca546550a3fdafebbf37fa9e22be2d92b44653ade7bf',
    ),
    s: BigInt(
      '0x354c756a1aa3346e9b3ea5423ac99acfc005e9cce2cd698e14d792f43fa15a23',
    ),
    yParity: 0,
  })
  const envelope = TransactionEnvelopeEip1559.from({
    chainId: 1,
    gas: 69420n,
    ...signature,
  })
  expect(Signature.extract(envelope)).toEqual(signature)
})

test('behavior: rpc', () => {
  const signature = {
    r: '0x73b39769ff4a36515c8fca546550a3fdafebbf37fa9e22be2d92b44653ade7bf',
    s: '0x354c756a1aa3346e9b3ea5423ac99acfc005e9cce2cd698e14d792f43fa15a23',
    yParity: '0x0',
  } as const
  const envelope = TransactionEnvelopeEip1559.from({
    chainId: 1,
    gas: 69420n,
  })
  expect(Signature.extract({ ...envelope, ...signature })).toEqual(
    Signature.from(signature),
  )
})
