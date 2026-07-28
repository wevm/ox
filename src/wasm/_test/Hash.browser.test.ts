import { blake3 } from '@noble/hashes/blake3.js'
import { keccak_256 } from '@noble/hashes/sha3.js'
import { describe, expect, test, vi } from 'vp/test'
import * as Engine from '../../core/Engine.js'
import * as Hash from '../../core/Hash.js'
import * as WasmHash from '../Hash.js'

describe('engine', () => {
  test('behavior: instantiates asynchronously', async () => {
    // Chrome refuses to compile modules above a few kilobytes synchronously on
    // the main thread, so `new WebAssembly.Module` must never be reached. A spy
    // is the only way to assert that, since the artifact happens to be small
    // enough today that a synchronous compile would succeed.
    const Module = vi.spyOn(globalThis.WebAssembly, 'Module')
    const Instance = vi.spyOn(globalThis.WebAssembly, 'Instance')
    try {
      const engine = await WasmHash.engine()
      expect(Module).not.toHaveBeenCalled()
      expect(Instance).not.toHaveBeenCalled()

      const input = new Uint8Array(32).fill(1)
      expect(engine.keccak256(input)).toEqual(keccak_256(input))
      expect(engine.blake3(input)).toEqual(blake3(input))
    } finally {
      Module.mockRestore()
      Instance.mockRestore()
    }
  })

  test('behavior: grows memory in a real browser, then hashes a small input', async () => {
    const engine = await WasmHash.engine()

    const large = new Uint8Array(3 * 1024 * 1024).fill(7)
    expect(engine.keccak256(large)).toEqual(keccak_256(large))
    expect(engine.blake3(large)).toEqual(blake3(large))

    // `memory.grow` detached the previous `ArrayBuffer`; a retained view would
    // now read zero bytes.
    const small = new Uint8Array(32).fill(1)
    expect(engine.keccak256(small)).toEqual(keccak_256(small))
    expect(engine.blake3(small)).toEqual(blake3(small))
  })

  test('behavior: ox uses the WASM implementation once installed', async () => {
    await Engine.install({ Hash: WasmHash.engine() })
    try {
      expect(Hash.blake3('0xdeadbeef')).toBe(
        '0x53147f3ce49ed4f60dfa5b9654c36ba6103c11f5737df3dabd4cbd296c4161bd',
      )
      expect(Hash.keccak256('0xdeadbeef')).toBe(
        '0xd4fd4e189132273036449fc9e11198c739161b4c0116a9a2dccdfa1c492006f1',
      )
    } finally {
      Engine.reset()
    }
  })
})
