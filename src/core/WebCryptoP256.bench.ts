import { bench, describe } from 'vitest'
import * as Bytes from './Bytes.js'
import * as PublicKey from './PublicKey.js'
import * as WebCryptoP256 from './WebCryptoP256.js'

const { privateKey, publicKey } = await WebCryptoP256.createKeyPair()
const payload = Bytes.random(32)
const signature = await WebCryptoP256.sign({ payload, privateKey })

// Pre-import the verifying key once; this models a hypothetical
// `verifyPrepared` fast path that would skip `subtle.importKey` per call.
const preparedVerifyKey = await globalThis.crypto.subtle.importKey(
  'raw',
  PublicKey.toBytes(publicKey),
  { name: 'ECDSA', namedCurve: 'P-256' },
  true,
  ['verify'],
)

const signatureBytes = Bytes.concat(
  Bytes.fromHex(signature.r, { size: 32 }),
  Bytes.fromHex(signature.s, { size: 32 }),
)

describe('WebCryptoP256.verify', () => {
  bench('verify (importKey per call)', async () => {
    await WebCryptoP256.verify({ payload, publicKey, signature })
  })

  bench('verify (prepared key reused)', async () => {
    await globalThis.crypto.subtle.verify(
      { name: 'ECDSA', hash: 'SHA-256' },
      preparedVerifyKey,
      signatureBytes,
      payload,
    )
  })
})
