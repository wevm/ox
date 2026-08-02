import type * as Bytes from '../Bytes.js'

/**
 * Attaches a `Symbol.dispose` handler to `bytes` that zero-fills its contents,
 * so callers can bind the value with a `using` declaration (or invoke the
 * handler manually) to release secret material deterministically.
 *
 * The well-known symbol is resolved on each call so a `Symbol.dispose`
 * polyfill installed after module initialization is still honored. The
 * handler is non-enumerable to keep the array's observable shape unchanged.
 *
 * @internal
 */
export function toDisposableBytes(
  bytes: Bytes.Bytes,
): Bytes.Bytes & Disposable {
  Object.defineProperty(bytes, Symbol.dispose ?? Symbol.for('Symbol.dispose'), {
    configurable: true,
    enumerable: false,
    value: () => bytes.fill(0),
    writable: true,
  })
  return bytes as never
}
