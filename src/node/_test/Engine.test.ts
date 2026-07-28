import { Engine as CoreEngine, Hash } from 'ox'
import { Engine } from 'ox/node'
import { describe, expect, test } from 'vp/test'

describe('create', () => {
  test('behavior: does not install', async () => {
    const engine = await Engine.create()

    expect(Object.keys(engine)).toMatchInlineSnapshot(`
      [
        "Ed25519",
        "Hash",
        "Keystore",
        "Mnemonic",
        "P256",
        "X25519",
      ]
    `)
    expect(CoreEngine.get()).toMatchInlineSnapshot('{}')
  })

  test('behavior: installs for the duration of a call', async () => {
    const node = await Engine.create()
    const digest = CoreEngine.with(node, () => Hash.sha256('0xdeadbeef'))

    expect(digest).toMatchInlineSnapshot(
      `"0x5f78c33274e43fa9de5659265c1d917e25c03722dcb0b8d27db8d5feaa813953"`,
    )
    expect(CoreEngine.get()).toMatchInlineSnapshot('{}')
  })
})

describe('load', () => {
  test('behavior: installs and returns what it installed', async () => {
    const engine = await Engine.load()

    expect(Object.keys(CoreEngine.get())).toEqual(Object.keys(engine))
    expect(
      Object.fromEntries(
        Object.entries(CoreEngine.get()).map(([slot, value]) => [
          slot,
          Object.keys(value ?? {}).sort(),
        ]),
      ),
    ).toMatchInlineSnapshot(`
        {
          "Ed25519": [
            "getPublicKey",
            "sign",
            "toMontgomerySecret",
          ],
          "Hash": [
            "hmacSha256",
            "ripemd160",
            "sha256",
          ],
          "Keystore": [
            "aesCtrDecrypt",
            "aesCtrEncrypt",
            "pbkdf2Sha256",
            "pbkdf2Sha256Async",
          ],
          "Mnemonic": [
            "toSeed",
          ],
          "P256": [
            "getPublicKey",
          ],
          "X25519": [
            "getPublicKey",
            "getSharedSecret",
          ],
        }
      `)
  })

  test('behavior: leaves unsupported primitives on the default', async () => {
    await Engine.load()

    expect(Hash.keccak256('0xdeadbeef')).toMatchInlineSnapshot(
      `"0xd4fd4e189132273036449fc9e11198c739161b4c0116a9a2dccdfa1c492006f1"`,
    )
  })

  test('behavior: merges with later engines', async () => {
    await Engine.load()
    CoreEngine.set({ Bls: { randomSecretKey: () => new Uint8Array(32) } })

    expect(Object.keys(CoreEngine.get()).sort()).toMatchInlineSnapshot(`
      [
        "Bls",
        "Ed25519",
        "Hash",
        "Keystore",
        "Mnemonic",
        "P256",
        "X25519",
      ]
    `)
  })
})
