import { describe, expect, test } from 'vp/test'
import * as Bytes from '../../core/Bytes.js'
import * as Secp256k1 from '../../core/Secp256k1.js'
import * as WebAuthn from '../../core/WebAuthn.js'

const rpId = 'localhost'
const rpName = 'Ox Test'

describe('createCredential + getCredential', () => {
  test('derives a stable private key', async () => {
    const credential = await WebAuthn.createCredential({
      name: `prf-${Date.now()}`,
      prf: true,
      rp: {
        id: rpId,
        name: rpName,
      },
    })
    const next = await WebAuthn.getCredential({
      credentialId: credential.id,
      prf: true,
      rpId,
    })

    expect(Bytes.isEqual(credential.prf, next.prf)).toBe(true)
    expect(Secp256k1.fromPrf(credential.prf)).toBe(Secp256k1.fromPrf(next.prf))
  })
})
