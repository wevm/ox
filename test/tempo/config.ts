// TODO: remove `tempo.ts` once upstreamed into viem.
import { tempoLocal, tempoTestnet } from 'tempo.ts/chains'
import { Actions } from 'tempo.ts/viem'
import {
  type Address,
  type Chain,
  type Client,
  createClient,
  type HttpTransportConfig,
  http,
  parseUnits,
  type Transport,
} from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { accounts } from '../constants/accounts.js'
import { rpcUrl } from './prool.js'

export const nodeEnv = import.meta.env.VITE_TEMPO_ENV || 'localnet'

export const chain = (() => {
  if (nodeEnv === 'testnet') return tempoTestnet()
  return tempoLocal()
})()

export const client = createClient({
  chain,
  pollingInterval: 100,
  transport: http(rpcUrl, {
    ...debugOptions({ rpcUrl }),
  }),
})

export function debugOptions({
  rpcUrl,
}: {
  rpcUrl: string
}): HttpTransportConfig | undefined {
  if (import.meta.env.VITE_TEMPO_HTTP_LOG !== 'true') return undefined
  return {
    async onFetchRequest(_, init) {
      console.log(`curl \\
${rpcUrl} \\
-X POST \\
-H "Content-Type: application/json" \\
-d '${JSON.stringify(JSON.parse(init.body as string))}'`)
    },
    async onFetchResponse(response) {
      console.log(`> ${JSON.stringify(await response.clone().json())}`)
    },
  }
}

export async function fundAddress(
  client: Client<Transport, Chain>,
  parameters: fundAddress.Parameters,
) {
  const { address } = parameters
  const account = accounts.at(0)!
  if (account.address === address) return
  await Actions.token.transferSync(client, {
    account: privateKeyToAccount(account.privateKey!),
    amount: parseUnits('10000', 6),
    feeToken: 1n,
    to: address,
    token: 1n,
  })
}

export declare namespace fundAddress {
  export type Parameters = {
    /** Account to fund. */
    address: Address
  }
}
