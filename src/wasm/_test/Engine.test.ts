import { Engine as CoreEngine, Hash } from 'ox'
import { Engine } from 'ox/wasm'
import { describe, expect, test } from 'vp/test'

describe('create', () => {
  test('behavior: does not install', async () => {
    const engine = await Engine.create()
    expect(Object.keys(engine)).toMatchInlineSnapshot(`
      [
        "Hash",
      ]
    `)
    // The whole point of `create` over `load`: benches, differential tests and
    // composition all need the implementation without touching global state.
    expect(CoreEngine.get()).toMatchInlineSnapshot('{}')
  })

  test('behavior: composes with other engines before installing', async () => {
    CoreEngine.set({
      ...(await Engine.create()),
      Mnemonic: { toSeed: () => new Uint8Array(64) },
    })
    expect(Object.keys(CoreEngine.get()).sort()).toMatchInlineSnapshot(`
      [
        "Hash",
        "Mnemonic",
      ]
    `)
  })
})

describe('load', () => {
  test('behavior: installs, and returns what it installed', async () => {
    const before = Hash.keccak256('0xdeadbeef')

    const engine = await Engine.load()

    expect(Object.keys(CoreEngine.get())).toEqual(Object.keys(engine))
    // Installing changes which implementation runs, never the answer.
    expect(Hash.keccak256('0xdeadbeef')).toEqual(before)
  })

  test('behavior: routes every slot it reports', async () => {
    await Engine.load()
    expect(Object.keys(CoreEngine.get().Hash ?? {}).sort()).toMatchInlineSnapshot(`
      [
        "hmacSha256",
        "keccak256",
        "ripemd160",
        "sha256",
      ]
    `)
  })
})
