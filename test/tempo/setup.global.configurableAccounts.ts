import { readFileSync } from 'node:fs'
import { factory, port, tag } from './configurableAccounts.js'
import { createServer } from './prool.js'

// Genesis derives from Tempo sha-83f3ccd dev.json, retaining funded tokens and native precompiles,
// with T14 activated for configurable accounts.
// The test-only recovery factory enables configurable-account registration.
export default async function () {
  const genesis = JSON.parse(
    readFileSync(
      new URL('./configurableAccounts.genesis.json', import.meta.url),
      'utf8',
    ),
  )
  const server = await createServer({
    port,
    tag,
    chain: JSON.stringify({
      ...genesis,
      config: {
        ...genesis.config,
        configurableAccountRecoveryFactory: factory,
      },
    }),
  })
  return server.start()
}
