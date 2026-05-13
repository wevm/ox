import { Provider } from 'ox'
import { describe, expect, test } from 'vitest'

describe('Provider.announce / Provider.discover', () => {
  test('discovers an announced provider', async () => {
    const detail: Provider.EIP6963ProviderDetail = {
      info: {
        uuid: 'eef39d31-8a1f-4f02-9c01-9bdf8b4c6b48',
        name: 'Example Wallet',
        icon: 'data:image/svg+xml;base64,',
        rdns: 'sh.oxlib.example',
      },
      provider: {
        request: async () => '0x1' as never,
      } as Provider.Provider,
    }

    const seen: Provider.EIP6963ProviderDetail[] = []
    const handle = Provider.discover({
      onAnnounce(d) {
        seen.push(d)
      },
    })
    Provider.announce(detail)
    handle.unsubscribe()

    expect(seen).toHaveLength(1)
    expect(seen[0]?.info).toEqual(detail.info)
    expect(seen[0]?.provider).toBe(detail.provider)
  })

  test('deduplicates announcements by uuid', async () => {
    const detail: Provider.EIP6963ProviderDetail = {
      info: {
        uuid: '5fe0228c-30b3-4f2e-9be1-9eaa2f8a8a1b',
        name: 'Example Wallet',
        icon: 'data:image/svg+xml;base64,',
        rdns: 'sh.oxlib.example',
      },
      provider: { request: async () => '0x1' as never } as Provider.Provider,
    }

    const seen: Provider.EIP6963ProviderDetail[] = []
    const handle = Provider.discover({
      onAnnounce(d) {
        seen.push(d)
      },
    })
    Provider.announce(detail)
    Provider.announce(detail)
    Provider.announce(detail)
    handle.unsubscribe()

    expect(seen).toHaveLength(1)
  })

  test('unsubscribe stops receiving announcements', async () => {
    const seen: Provider.EIP6963ProviderDetail[] = []
    const handle = Provider.discover({
      onAnnounce(d) {
        seen.push(d)
      },
    })
    handle.unsubscribe()

    Provider.announce({
      info: {
        uuid: 'a16f5dac-69b6-4f9d-bd7a-f06b69cf2f3d',
        name: 'Example Wallet',
        icon: 'data:image/svg+xml;base64,',
        rdns: 'sh.oxlib.example',
      },
      provider: { request: async () => '0x1' as never } as Provider.Provider,
    })

    expect(seen).toHaveLength(0)
  })

  test('discover triggers eip6963:requestProvider for re-announcement', async () => {
    let announcementsRequested = 0
    const handler = () => {
      announcementsRequested++
    }
    window.addEventListener('eip6963:requestProvider', handler)

    const handle = Provider.discover({ onAnnounce() {} })
    handle.unsubscribe()
    window.removeEventListener('eip6963:requestProvider', handler)

    expect(announcementsRequested).toBe(1)
  })
})
