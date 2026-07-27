import * as Caches from './Caches.js'
import * as Errors from './Errors.js'
import * as engine from './internal/engine.js'

export type {
  Bls,
  Ecdh,
  Ecdsa,
  Eddsa,
  Engine,
  Hash,
  Keystore,
  Mnemonic,
} from './internal/engine.js'

/**
 * Installs crypto implementations, replacing the `@noble/*` implementations ox
 * uses by default.
 *
 * Slots are named after ox modules, and both the slots and the functions within
 * them are optional -- anything you leave out keeps using the default. Calls
 * merge, so an engine can be installed wholesale and then have a single
 * primitive overridden.
 *
 * Call this once, during application startup, before any crypto call. ox
 * resolves the engine at call time, so values computed beforehand used whatever
 * implementation was installed then.
 *
 * :::warning
 * Installing an engine changes which implementation ox calls; it does not remove
 * the default implementation from your bundle. The `noble` export on each crypto
 * module (for example `Secp256k1.noble`) always refers to the bundled
 * `@noble/*` implementation and is never affected by `Engine.set`.
 * :::
 *
 * @example
 * ```ts twoslash
 * // @noErrors
 * import { Engine } from 'ox/wasm'
 *
 * await Engine.load()
 * ```
 *
 * @example
 * ### Overriding a Single Primitive
 *
 * ```ts twoslash
 * import { Engine, Hash } from 'ox'
 *
 * Engine.set({ Hash: { keccak256: (input) => input } })
 *
 * Hash.keccak256('0xdeadbeef', { as: 'Bytes' })
 * // @log: Uint8Array [222, 173, 190, 239]
 * ```
 *
 * @param value - Engine to install.
 */
export function set(value: engine.Engine): void {
  for (const slot of Object.keys(value))
    if (!(engine.slots as readonly string[]).includes(slot))
      throw new UnknownSlotError(slot)
  engine.merge(value)
  Caches.clear()
}

export declare namespace set {
  type ErrorType = UnknownSlotError | Errors.GlobalErrorType
}

/**
 * Returns the installed engine.
 *
 * Only overrides are returned -- slots left on ox's defaults are absent, so an
 * empty object means ox is entirely on its default implementations.
 *
 * @example
 * ```ts twoslash
 * import { Engine } from 'ox'
 *
 * Engine.get()
 * // @log: {}
 * ```
 *
 * @returns The installed engine.
 */
export function get(): engine.Engine {
  // Slots are copied too, not just the root: a shared slot lets a caller write
  // `get().Hash!.keccak256 = …` straight into the live registry, changing what
  // ox calls without going through `set` and so without clearing the caches
  // derived from it.
  const copy: Record<string, unknown> = {}
  for (const [name, slot] of Object.entries(engine.overrides))
    copy[name] = { ...slot }
  return copy as engine.Engine
}

export declare namespace get {
  type ErrorType = Errors.GlobalErrorType
}

/**
 * Restores ox's default implementations.
 *
 * @example
 * ```ts twoslash
 * import { Engine } from 'ox'
 *
 * Engine.reset('Hash')
 * Engine.reset()
 * ```
 *
 * @param slot - Slot to reset. Resets every slot when omitted.
 */
export function reset(slot?: keyof engine.Engine): void {
  engine.reset(slot)
  Caches.clear()
}

export declare namespace reset {
  type ErrorType = Errors.GlobalErrorType
}

/**
 * Runs a function with an engine installed, then restores the previous engine.
 *
 * Only safe for synchronous functions: the engine is process-wide for the
 * duration of the call, so concurrent asynchronous work would observe it too.
 * Passing a function that returns a promise throws
 * {@link ox#Engine.AsyncScopeError}.
 *
 * @example
 * ```ts twoslash
 * import { Engine, Hash } from 'ox'
 *
 * const hash = Engine.with(
 *   { Hash: { keccak256: () => new Uint8Array(32) } },
 *   () => Hash.keccak256('0xdeadbeef')
 * )
 * // @log: '0x0000000000000000000000000000000000000000000000000000000000000000'
 * ```
 *
 * @param value - Engine to install for the duration of the call.
 * @param fn - Synchronous function to run.
 * @returns The return value of `fn`.
 */
// Declared unexported and surfaced only through the alias below: exporting the
// backing name too would put an undocumented `Engine.with_` in the public
// surface, which is then breaking to take away.
function with_<returnType>(
  value: engine.Engine,
  fn: () => returnType,
): returnType {
  const previous = get()
  try {
    set(value)
    const result = fn()
    const thenable = result as
      | { then?: (ok: () => void, err: () => void) => void }
      | undefined
    if (typeof thenable?.then === 'function') {
      // Settle the promise we are about to discard. Otherwise its rejection is
      // never observed, and Node can take the process down over it after the
      // caller has already handled the `AsyncScopeError` thrown here.
      thenable.then(
        () => {},
        () => {},
      )
      throw new AsyncScopeError()
    }
    return result
  } finally {
    engine.reset()
    engine.merge(previous)
    Caches.clear()
  }
}

export { with_ as with }

declare namespace with_ {
  type ErrorType =
    | AsyncScopeError
    | set.ErrorType
    | get.ErrorType
    | Errors.GlobalErrorType
}

/** Thrown when an unrecognized engine slot is supplied. */
export class UnknownSlotError extends Errors.BaseError {
  override readonly name = 'Engine.UnknownSlotError'

  constructor(slot: string) {
    super(`\`${slot}\` is not a valid engine slot.`, {
      metaMessages: [`Valid slots: ${engine.slots.join(', ')}`],
    })
  }
}

/** Thrown when {@link ox#Engine.with} is given an asynchronous function. */
export class AsyncScopeError extends Errors.BaseError {
  override readonly name = 'Engine.AsyncScopeError'

  constructor() {
    super('`Engine.with` cannot be used with an asynchronous function.', {
      metaMessages: [
        'The engine is process-wide, so a scoped override cannot be held across an `await`.',
        'Use `Engine.set` instead.',
      ],
    })
  }
}
