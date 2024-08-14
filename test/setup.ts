import { Errors } from 'ox'
import { afterAll, beforeAll, vi } from 'vitest'

beforeAll(() => {
  Errors.setErrorConfig({
    getDocsUrl({ docsBaseUrl, docsPath }) {
      return docsPath
        ? `${docsBaseUrl ?? 'https://oxlib.sh'}${docsPath}`
        : undefined
    },
    version: 'ox@x.y.z',
  })
})

afterAll(() => {
  vi.restoreAllMocks()
})
