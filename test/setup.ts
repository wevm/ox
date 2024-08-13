import { afterAll, beforeAll, vi } from 'vitest'

beforeAll(() => {
  vi.stubGlobal('window', {
    location: {
      hostname: 'https://example.com',
    },
    document: {
      title: 'My Website',
    },
  })
})

afterAll(() => {
  vi.restoreAllMocks()
})
