import { setTimeout } from 'node:timers/promises'
import { describe, expect, test } from 'vitest'

import { createHttpServer } from '../../test/http.js'
import { withTimeout } from './promise.js'

describe('withTimeout', () => {
  test('default', async () => {
    await expect(() =>
      withTimeout(() => setTimeout(2000), {
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
      withTimeout(
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
})
