import type * as Engine from '../../core/Engine.js'
import * as hashes from './hashes.js'
import * as pbkdf2 from './pbkdf2.js'

/** Compiles the aggregate engine's synchronous PBKDF2 implementation. */
export async function engine(): Promise<engine.ReturnType> {
  const module = await hashes.load()
  return {
    pbkdf2Sha256: (password, salt, options) =>
      pbkdf2.pbkdf2Sha256(module, password, salt, options),
  }
}

export declare namespace engine {
  /** The aggregate WASM engine's `Keystore` primitives. */
  type ReturnType = {
    pbkdf2Sha256: NonNullable<Engine.Keystore['pbkdf2Sha256']>
  }
}
