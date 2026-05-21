import { setTimeout } from 'node:timers/promises'
import { describe, expect, test } from 'vp/test'

import { createHttpServer } from '../../../../test/http.js'
import { withTimeout } from '../../internal/promise.js'

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

    await server.close()
  })

  test('behavior: does not double-reject on inner error', async () => {
    // Regression: the catch path used to call reject() twice when fn threw
    // a non-AbortError. The unhandled rejection would crash the process.
    const innerError = new Error('inner failure')
    let unhandled: unknown
    const onUnhandled = (reason: unknown) => {
      unhandled = reason
    }
    process.on('unhandledRejection', onUnhandled)
    try {
      await expect(() =>
        withTimeout(
          async () => {
            throw innerError
          },
          { timeout: 1000 },
        ),
      ).rejects.toBe(innerError)
      // Allow microtasks to flush so a stray reject would surface.
      await new Promise((resolve) => setImmediate(resolve))
      expect(unhandled).toBe(undefined)
    } finally {
      process.off('unhandledRejection', onUnhandled)
    }
  })
})
