import { PoolId } from 'ox/tempo'
import { expect, test } from 'vitest'

test('from', () => {
  // Test with bigint token IDs
  const poolId1 = PoolId.from({
    userToken: 0n,
    validatorToken: 1n,
  })
  expect(poolId1).toMatchInlineSnapshot(
    `"0x24fc92718dfd933b7f831893444e0dc6072ce0fff68198eaf48e86cb1f2ee2dc"`,
  )

  // Test with address token IDs
  const poolId2 = PoolId.from({
    userToken: '0x20c0000000000000000000000000000000000000',
    validatorToken: '0x20c0000000000000000000000000000000000001',
  })
  expect(poolId2).toBe(poolId1)

  // Test with mixed types
  const poolId3 = PoolId.from({
    userToken: 0n,
    validatorToken: '0x20c0000000000000000000000000000000000001',
  })
  expect(poolId3).toBe(poolId1)

  const poolId4 = PoolId.from({
    userToken: '0x20c0000000000000000000000000000000000000',
    validatorToken: 1n,
  })
  expect(poolId4).toBe(poolId1)
})
