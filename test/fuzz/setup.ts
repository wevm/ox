import { fc } from '@fast-check/vitest'

// With only `maxLength` set, fast-check 4 keeps an arbitrary's size at
// `'small'`, so `fc.uint8Array({ maxLength: 100 })` never gives more than
// about 10 elements. Let such arbitraries reach their maximum, so properties
// cover the long inputs they name (such as UTF-8 past the 64-byte scratch
// buffer, or CBOR strings of 24 bytes and more).
fc.configureGlobal({
  ...fc.readConfigureGlobal(),
  defaultSizeToMaxWhenMaxSpecified: true,
})
