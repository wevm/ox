import { expect, test } from 'vitest'
import { Credential, Registration } from '../index.js'

const rpId = 'localhost'
const rpName = 'Ox Test'

test('create + verify: full ceremony', async () => {
  const challenge = crypto.getRandomValues(new Uint8Array(32))

  const credential = await Registration.create({
    name: 'testuser',
    challenge,
    rp: { id: rpId, name: rpName },
  })

  expect(credential.id).toBeTypeOf('string')
  expect(credential.publicKey.x).toBeTypeOf('bigint')
  expect(credential.publicKey.y).toBeTypeOf('bigint')
  expect(credential.raw).toBeDefined()

  const result = Registration.verify({
    credential,
    challenge,
    origin,
    rpId,
  })

  expect(result.credential.id).toBe(credential.id)
  expect(result.counter).toBeTypeOf('number')
})

test('create + verify: server → client → server w/ serialize/deserialize', async () => {
  // 1. Server: generate options and serialize for transport
  const challenge = crypto.getRandomValues(new Uint8Array(32))
  const options = Registration.getOptions({
    name: 'testuser',
    challenge,
    rp: { id: rpId, name: rpName },
  })
  const serializedOptions = Registration.serializeOptions(options)
  const json_options = JSON.stringify(serializedOptions)

  // 2. Client: deserialize options, create credential, serialize for transport
  const deserializedOptions = Registration.deserializeOptions(
    JSON.parse(json_options),
  )
  const credential = await Registration.create({
    ...deserializedOptions.publicKey!,
    name: 'testuser',
  })
  const serializedCredential = Credential.serialize(credential)
  const json_credential = JSON.stringify(serializedCredential)

  // 3. Server: deserialize credential and verify
  const deserializedCredential = Credential.deserialize(
    JSON.parse(json_credential),
  )
  const result = Registration.verify({
    credential: deserializedCredential,
    challenge,
    origin,
    rpId,
  })

  expect(result.credential.id).toBe(credential.id)
  expect(result.credential.publicKey.x).toBe(credential.publicKey.x)
  expect(result.credential.publicKey.y).toBe(credential.publicKey.y)
  expect(result.counter).toBeTypeOf('number')
})

test('error: rejects wrong rpId', async () => {
  const challenge = crypto.getRandomValues(new Uint8Array(32))

  const credential = await Registration.create({
    name: 'testuser',
    challenge,
    rp: { id: rpId, name: rpName },
  })

  expect(() =>
    Registration.verify({
      credential,
      challenge,
      origin,
      rpId: 'evil.com',
    }),
  ).toThrow('rpId hash mismatch')
})

test('error: rejects wrong challenge', async () => {
  const challenge = crypto.getRandomValues(new Uint8Array(32))

  const credential = await Registration.create({
    name: 'testuser',
    challenge,
    rp: { id: rpId, name: rpName },
  })

  expect(() =>
    Registration.verify({
      credential,
      challenge: new Uint8Array(32),
      origin,
      rpId,
    }),
  ).toThrow('Challenge mismatch')
})
