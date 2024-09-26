import { expect, test } from 'vitest'
import { setTimeout } from 'node:timers/promises'

import { createHttpServer } from '../../../test/http.js'
import { Promise_withTimeout } from './withTimeout.js'

test('default', async () => {
  await expect(() =>
    Promise_withTimeout(() => setTimeout(2000), {
      errorInstance: new Error('timed out'),
      timeout: 500,
    }),
  ).rejects.toThrowError('timed out')
})

test('behavior: signal', async () => {
  const server = await createHttpServer(async (_req, res) => {
    await setTimeout(5000)
    res.end('wagmi')
  })

  await expect(() =>
    Promise_withTimeout(
      async ({ signal }) => {
        await fetch(server.url, { signal })
      },
      {
        errorInstance: new Error('timed out'),
        timeout: 500,
        signal: true,
      },
    ),
  ).rejects.toThrowError('timed out')

  server.close()
})
