import { PoolId } from 'ox/tempo'
import { expect, test } from 'vp/test'

test('from', () => {
  const poolId = PoolId.from({
    userToken: '0x20c0000000000000000000000000000000000000',
    validatorToken: '0x20c0000000000000000000000000000000000001',
  })
  expect(poolId).toMatchInlineSnapshot(
    `"0x24fc92718dfd933b7f831893444e0dc6072ce0fff68198eaf48e86cb1f2ee2dc"`,
  )
})

test('order-independent', () => {
  const poolId1 = PoolId.from({
    userToken: '0x20c0000000000000000000000000000000000000',
    validatorToken: '0x20c0000000000000000000000000000000000001',
  })
  const poolId2 = PoolId.from({
    userToken: '0x20c0000000000000000000000000000000000001',
    validatorToken: '0x20c0000000000000000000000000000000000000',
  })
  expect(poolId2).toBe(poolId1)
})
