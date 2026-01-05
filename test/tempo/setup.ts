import { setTimeout } from 'node:timers/promises'
import { Actions } from 'viem/tempo'
import { afterAll, beforeAll } from 'vitest'
import { accounts } from '../constants/accounts.js'
import { client, mintFeeTokenLiquidity, nodeEnv } from './config.js'
import { rpcUrl } from './prool.js'

beforeAll(async () => {
  if (nodeEnv === 'localnet') {
    await mintFeeTokenLiquidity(client)
    return
  }

  await Actions.faucet.fundSync(client, {
    account: accounts[0].address,
  })
  // TODO: remove once testnet load balancing is fixed.
  await setTimeout(2000)
})

afterAll(async () => {
  if (nodeEnv !== 'localnet') return
  await fetch(`${rpcUrl}/stop`)
})
