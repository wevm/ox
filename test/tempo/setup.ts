import { setTimeout } from 'node:timers/promises'
// TODO: remove `tempo.ts` once upstreamed into viem.
import { Actions } from 'tempo.ts/viem'
import { afterAll, beforeAll } from 'vitest'
import { accounts } from '../constants/accounts.js'
import { client, nodeEnv } from './config.js'
import { rpcUrl } from './prool.js'

beforeAll(async () => {
  if (nodeEnv === 'localnet') return
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
