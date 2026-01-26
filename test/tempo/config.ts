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
import { tempoLocalnet, tempoModerato } from 'viem/chains'
import { Actions } from 'viem/tempo'
import { accounts } from '../constants/accounts.js'
import { rpcUrl } from './prool.js'

export const nodeEnv = import.meta.env.VITE_TEMPO_ENV || 'localnet'

export const chain = (() => {
  if (nodeEnv === 'testnet') return tempoModerato
  return tempoLocalnet
})()

export const client = createClient({
  chain,
  pollingInterval: 100,
  transport: http(rpcUrl, {
    ...debugOptions({ rpcUrl }),
    ...(nodeEnv === 'devnet'
      ? {
          fetchOptions: {
            headers: {
              Authorization: `Basic ${btoa(import.meta.env.VITE_TEMPO_CREDENTIALS ?? '')}`,
            },
          },
        }
      : {}),
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

export async function mintFeeTokenLiquidity(client: Client<Transport, Chain>) {
  await Promise.all(
    [1n, 2n, 3n].map((id) =>
      Actions.amm.mintSync(client, {
        account: privateKeyToAccount(accounts[0].privateKey!),
        feeToken: 0n,
        nonceKey: 'random',
        userTokenAddress: id,
        validatorTokenAddress: 0n,
        validatorTokenAmount: parseUnits('1000', 6),
        to: accounts[0].address,
      }),
    ),
  )
}
