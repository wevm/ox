/**
 * Shared `TextEncoder` / `TextDecoder` singletons used by primitive and codec
 * modules. Centralizing them avoids constructing redundant instances per
 * module and lets engines hoist them to module init time.
 *
 * @internal
 */
export const encoder = /*#__PURE__*/ new TextEncoder()

/** @internal */
export const decoder = /*#__PURE__*/ new TextDecoder()
