import { beforeAll } from 'vp/test'
import { cdp } from 'vp/test/browser'

beforeAll(async () => {
  const session = cdp()
  await session.send('WebAuthn.enable')
  const result = await session.send('WebAuthn.addVirtualAuthenticator', {
    options: {
      protocol: 'ctap2',
      transport: 'usb',
      hasUserVerification: true,
      isUserVerified: true,
      hasResidentKey: true,
    },
  })
  const authenticatorId = result.authenticatorId

  return async () => {
    await session.send('WebAuthn.removeVirtualAuthenticator', {
      authenticatorId,
    })
  }
})
