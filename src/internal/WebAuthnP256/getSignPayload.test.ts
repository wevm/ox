import { P256, PublicKey, Signature, WebAuthnP256, WebCryptoP256 } from 'ox'
import { expect, test } from 'vitest'

test('default', () => {
  const payload = WebAuthnP256.getSignPayload({
    challenge:
      '0xf631058a3ba1116acce12396fad0a125b5041c43f8e15723709f81aa8d5f4ccf',
    origin: 'http://localhost:5173',
    rpId: 'localhost',
    extraClientData: {
      other_keys_can_be_added_here:
        'do not compare clientDataJSON against a template. See https://goo.gl/yabPex',
    },
  })
  expect(payload).toMatchInlineSnapshot(
    `
    {
      "metadata": {
        "authenticatorData": "0x49960de5880e8c687434170f6476605b8fe4aeb9a28632c7995cf3ba831d97630500000000",
        "challengeIndex": 23,
        "clientDataJSON": "{"type":"webauthn.get","challenge":"9jEFijuhEWrM4SOW-tChJbUEHEP44VcjcJ-Bqo1fTM8","origin":"http://localhost:5173","crossOrigin":false,"other_keys_can_be_added_here":"do not compare clientDataJSON against a template. See https://goo.gl/yabPex"}",
        "typeIndex": 1,
        "userVerificationRequired": true,
      },
      "payload": "0x49960de5880e8c687434170f6476605b8fe4aeb9a28632c7995cf3ba831d9763050000000045086dcb06a5f234db625bcdc94e657f86b76b6fd3eb9c30543eabc1e577a4b0",
    }
  `,
  )
})

test('behavior: P256.sign + WebAuthnP256.verify', async () => {
  const privateKey = P256.randomPrivateKey()
  const publicKey = P256.getPublicKey({ privateKey })

  const challenge =
    '0xf631058a3ba1116acce12396fad0a125b5041c43f8e15723709f81aa8d5f4ccf' as const

  const { metadata, payload } = WebAuthnP256.getSignPayload({
    challenge,
    origin: 'http://localhost:5173',
    rpId: 'localhost',
    extraClientData: {
      other_keys_can_be_added_here:
        'do not compare clientDataJSON against a template. See https://goo.gl/yabPex',
    },
  })

  const signature = P256.sign({
    hash: true,
    payload,
    privateKey,
  })

  expect(
    WebAuthnP256.verify({
      challenge,
      publicKey,
      signature,
      metadata,
    }),
  ).toBeTruthy()
})

test('behavior: WebCryptoP256.sign + WebAuthnP256.verify', async () => {
  const keyPair = await WebCryptoP256.createKeyPair()
  const { privateKey, publicKey } = keyPair

  const challenge =
    '0xf631058a3ba1116acce12396fad0a125b5041c43f8e15723709f81aa8d5f4ccf' as const

  const data = {
    challenge,
    origin: 'http://localhost:5173',
    rpId: 'localhost',
    extraClientData: {
      other_keys_can_be_added_here:
        'do not compare clientDataJSON against a template. See https://goo.gl/yabPex',
    },
  } as const

  const { metadata, payload } = WebAuthnP256.getSignPayload(data)

  const signature = await WebCryptoP256.sign({
    payload,
    privateKey,
  })

  expect(
    WebAuthnP256.verify({
      challenge,
      publicKey,
      signature,
      metadata,
    }),
  ).toBeTruthy()
})

test('behavior: WebAuthnP256.sign + P256.verify', () => {
  // Note: Public Key and Signature generated from WebAuthn Authenticator from examples/webauthn-p256.
  const publicKey = PublicKey.from({
    prefix: 4,
    x: 60047643624523853691583342123967083322395535713181616683944672258158697774181n,
    y: 49933766055617994255091849813611851260866104136309220262372066694430479376066n,
  })
  const signature = Signature.from({
    r: 51728839035173161960794416403819635570146754182185755610208554815692624617179n,
    s: 42284206126603545568097288331895750698887263268526215297009386324761546383756n,
  })

  const { payload } = WebAuthnP256.getSignPayload({
    challenge:
      '0xf631058a3ba1116acce12396fad0a125b5041c43f8e15723709f81aa8d5f4ccf',
    origin: 'http://localhost:5173',
    rpId: 'localhost',
    extraClientData: {
      other_keys_can_be_added_here:
        'do not compare clientDataJSON against a template. See https://goo.gl/yabPex',
    },
  })

  expect(
    P256.verify({
      hash: true,
      publicKey,
      payload,
      signature,
    }),
  ).toBeTruthy()
})

test('options: crossOrigin', () => {
  const payload = WebAuthnP256.getSignPayload({
    challenge:
      '0xf631058a3ba1116acce12396fad0a125b5041c43f8e15723709f81aa8d5f4ccf',
    origin: 'http://localhost:5173',
    rpId: 'foo',
    crossOrigin: true,
  })

  expect(payload).toMatchInlineSnapshot(
    `
    {
      "metadata": {
        "authenticatorData": "0x2c26b46b68ffc68ff99b453c1d30413413422d706483bfa0f98a5e886266e7ae0500000000",
        "challengeIndex": 23,
        "clientDataJSON": "{"type":"webauthn.get","challenge":"9jEFijuhEWrM4SOW-tChJbUEHEP44VcjcJ-Bqo1fTM8","origin":"http://localhost:5173","crossOrigin":true}",
        "typeIndex": 1,
        "userVerificationRequired": true,
      },
      "payload": "0x2c26b46b68ffc68ff99b453c1d30413413422d706483bfa0f98a5e886266e7ae05000000000b0ba56d14f4fe7d5eae0a9ec8c1a0605b83b7173722c0cc7fbd6ec2567407e5",
    }
  `,
  )
})

test('options: flag', () => {
  const payload = WebAuthnP256.getSignPayload({
    challenge:
      '0xf631058a3ba1116acce12396fad0a125b5041c43f8e15723709f81aa8d5f4ccf',
    origin: 'http://localhost:5173',
    rpId: 'foo',
    crossOrigin: true,
    flag: 4,
  })

  expect(payload).toMatchInlineSnapshot(
    `
    {
      "metadata": {
        "authenticatorData": "0x2c26b46b68ffc68ff99b453c1d30413413422d706483bfa0f98a5e886266e7ae0400000000",
        "challengeIndex": 23,
        "clientDataJSON": "{"type":"webauthn.get","challenge":"9jEFijuhEWrM4SOW-tChJbUEHEP44VcjcJ-Bqo1fTM8","origin":"http://localhost:5173","crossOrigin":true}",
        "typeIndex": 1,
        "userVerificationRequired": true,
      },
      "payload": "0x2c26b46b68ffc68ff99b453c1d30413413422d706483bfa0f98a5e886266e7ae04000000000b0ba56d14f4fe7d5eae0a9ec8c1a0605b83b7173722c0cc7fbd6ec2567407e5",
    }
  `,
  )
})

test('options: signCount', () => {
  const payload = WebAuthnP256.getSignPayload({
    challenge:
      '0xf631058a3ba1116acce12396fad0a125b5041c43f8e15723709f81aa8d5f4ccf',
    origin: 'http://localhost:5173',
    rpId: 'foo',
    crossOrigin: true,
    signCount: 69,
  })

  expect(payload).toMatchInlineSnapshot(
    `
    {
      "metadata": {
        "authenticatorData": "0x2c26b46b68ffc68ff99b453c1d30413413422d706483bfa0f98a5e886266e7ae0500000045",
        "challengeIndex": 23,
        "clientDataJSON": "{"type":"webauthn.get","challenge":"9jEFijuhEWrM4SOW-tChJbUEHEP44VcjcJ-Bqo1fTM8","origin":"http://localhost:5173","crossOrigin":true}",
        "typeIndex": 1,
        "userVerificationRequired": true,
      },
      "payload": "0x2c26b46b68ffc68ff99b453c1d30413413422d706483bfa0f98a5e886266e7ae05000000450b0ba56d14f4fe7d5eae0a9ec8c1a0605b83b7173722c0cc7fbd6ec2567407e5",
    }
  `,
  )
})
