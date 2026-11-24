// The `fc` that `test.prop` runs on: in a browser, `@fast-check/vitest` is
// pre-bundled, and a bare `fast-check` import could be another copy.
import { fc } from '@fast-check/vitest'

// An arbitrary given only a `maxLength` (or `maxKeys`, `max…`) still defaults
// to size `'small'`, which stops at about 10 elements: `fc.uint8Array({
// maxLength: 100 })` would never reach the long-input branches (RLP strings past
// 55 bytes, CBOR lengths of 24 and up). Size to the stated maximum instead.
fc.configureGlobal({
  ...fc.readConfigureGlobal(),
  defaultSizeToMaxWhenMaxSpecified: true,
})
