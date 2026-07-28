import { Engine as CoreEngine, Hash } from 'ox'
import { Engine } from 'ox/wasm'
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
        "X25519",
      ]
    `)
    // The whole point of `create` over `load`: benches, differential tests and
    // composition all need the implementation without touching global state.
    expect(CoreEngine.get()).toMatchInlineSnapshot('{}')
  })

  test('behavior: installs for the duration of a call', async () => {
    // `with` is the case that genuinely needs a value: there is nothing
    // installed for `set` to merge into.
    const wasm = await Engine.create()
    const inside = CoreEngine.with(wasm, () => Hash.keccak256('0xdeadbeef'))
    expect(inside).toEqual(Hash.keccak256('0xdeadbeef'))
    expect(CoreEngine.get()).toMatchInlineSnapshot('{}')
  })
})

describe('load', () => {
  test('behavior: merges with a later set, rather than being replaced', async () => {
    await Engine.load()
    CoreEngine.set({ Bls: { randomSecretKey: () => new Uint8Array(32) } })
    expect(Object.keys(CoreEngine.get()).sort()).toMatchInlineSnapshot(`
      [
        "Bls",
        "Ed25519",
        "Hash",
        "Keystore",
        "Mnemonic",
        "X25519",
      ]
    `)
  })

  test('behavior: installs, and returns what it installed', async () => {
    const before = Hash.keccak256('0xdeadbeef')

    const engine = await Engine.load()

    expect(Object.keys(CoreEngine.get())).toEqual(Object.keys(engine))
    // Installing changes which implementation runs, never the answer.
    expect(Hash.keccak256('0xdeadbeef')).toEqual(before)
  })

  test('behavior: routes every slot it reports', async () => {
    await Engine.load()
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
            "verify",
          ],
          "Hash": [
            "blake3",
            "hmacSha256",
            "keccak256",
            "ripemd160",
            "sha256",
          ],
          "Keystore": [
            "pbkdf2Sha256",
          ],
          "Mnemonic": [
            "toSeed",
          ],
          "X25519": [
            "getPublicKey",
            "getSharedSecret",
          ],
        }
      `)
  })
})
