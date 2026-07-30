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
  HashState,
  Keystore,
  Mnemonic,
} from './internal/engine.js'

/**
 * Resolves and installs crypto implementations.
 *
 * Slots resolve in parallel, then use {@link ox#Engine.set} merge semantics:
 * omitted slots and primitives preserve existing overrides. If a slot rejects
 * or validation fails, the installed engine is unchanged.
 *
 * @example
 * ```ts twoslash
 * import { Engine } from 'ox'
 * import { Hash } from 'ox/wasm'
 *
 * await Engine.install({
 *   Hash: Hash.engine()
 * })
 * ```
 *
 * @param value - Engine slots or promises for engine slots.
 * @returns The resolved engine that was installed.
 */
export async function install<value extends install.Value>(
  value: value & install.Exact<value>,
): Promise<install.ReturnType<value>> {
  const resolved = Object.fromEntries(
    await Promise.all(
      Object.entries(value).map(async ([slot, primitives]) => [
        slot,
        await primitives,
      ]),
    ),
  ) as install.ReturnType<value>
  set(resolved as engine.Engine)
  return resolved
}

export declare namespace install {
  /** Rejects slot and primitive names outside the engine contract. */
  type Exact<value extends Value> = {
    [key in keyof value]: key extends keyof engine.Engine
      ? [NonNullable<Awaited<value[key]>>] extends [never]
        ? unknown
        : Exclude<
              keyof NonNullable<Awaited<value[key]>>,
              keyof NonNullable<engine.Engine[key]>
            > extends never
          ? unknown
          : never
      : never
  }

  /** Engine whose slots can be resolved asynchronously. */
  type Value = {
    [key in keyof engine.Engine]?:
      | engine.Engine[key]
      | PromiseLike<engine.Engine[key]>
  }

  /** Resolves the supplied slots while preserving their precise shape. */
  type ReturnType<value extends Value> = {
    [key in keyof value]: Awaited<value[key]>
  }

  /** Error thrown while installing an engine. */
  type ErrorType = set.ErrorType | Errors.GlobalErrorType
}

/**
 * Installs crypto implementations, replacing the `@noble/*` implementations ox
 * uses by default.
 *
 * Slots and their functions are optional. Omissions preserve earlier
 * overrides, or use Ox's default when none exists. Calls merge, so a later
 * engine can override one primitive.
 *
 * Call this once, during application startup, before any crypto call. ox
 * resolves the engine at call time, so values computed beforehand used whatever
 * implementation was installed then.
 *
 * @example
 * ```ts twoslash
 * import { Engine, Hash } from 'ox'
 *
 * Engine.set({
 *   Hash: { keccak256: () => new Uint8Array(32) }
 * })
 *
 * Hash.keccak256('0xdeadbeef')
 * // @log: '0x0000000000000000000000000000000000000000000000000000000000000000'
 * ```
 *
 * @param value - Engine to install.
 */
export function set(value: engine.Engine): void {
  for (const [slot, primitives] of Object.entries(value)) {
    if (!(engine.slots as readonly string[]).includes(slot))
      throw new UnknownSlotError(slot)
    if (
      primitives !== undefined &&
      (typeof primitives !== 'object' ||
        primitives === null ||
        Array.isArray(primitives))
    )
      throw new InvalidSlotValueError(slot)
    const known = engine.primitives[slot as keyof engine.Engine]
    // `primitives` is undefined where the caller is clearing the slot.
    for (const primitive of Object.keys(primitives ?? {}))
      if (!(known as readonly string[]).includes(primitive))
        throw new UnknownPrimitiveError(slot, primitive)
  }
  engine.merge(value)
  Caches.clear()
}

export declare namespace set {
  type ErrorType =
    | InvalidSlotValueError
    | UnknownPrimitiveError
    | UnknownSlotError
    | Errors.GlobalErrorType
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
  // Deleting an unknown key succeeds silently, so without this a misspelled
  // slot reports nothing and leaves the override it was meant to remove
  // installed.
  if (slot !== undefined && !(engine.slots as readonly string[]).includes(slot))
    throw new UnknownSlotError(slot)
  engine.reset(slot)
  Caches.clear()
}

export declare namespace reset {
  type ErrorType = UnknownSlotError | Errors.GlobalErrorType
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

/** Thrown when an engine slot is not an object or `undefined`. */
export class InvalidSlotValueError extends Errors.BaseError {
  override readonly name = 'Engine.InvalidSlotValueError'

  constructor(slot: string) {
    super(`\`${slot}\` must be an object or \`undefined\`.`)
  }
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

/** Thrown when a slot is given an unrecognized primitive name. */
export class UnknownPrimitiveError extends Errors.BaseError {
  override readonly name = 'Engine.UnknownPrimitiveError'

  constructor(slot: string, primitive: string) {
    // The class is public, so `slot` is not necessarily one the table knows;
    // an error that throws while being constructed hides the real failure.
    const known: readonly string[] | undefined =
      engine.primitives[slot as keyof engine.Engine]
    super(
      `\`${primitive}\` is not a valid primitive for the \`${slot}\` slot.`,
      known ? { metaMessages: [`Valid primitives: ${known.join(', ')}`] } : {},
    )
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
