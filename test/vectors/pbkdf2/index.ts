import * as Bytes from '../../../src/core/Bytes.js'

/** RFC 7914 section 11 PBKDF2-HMAC-SHA256 vectors. */
export const vectors = [
  {
    iterations: 1,
    key: Bytes.fromHex(
      '0x55ac046e56e3089fec1691c22544b605f94185216dde0465e68b9d57c20dacbc49ca9cccf179b645991664b39d77ef317c71b845b1e30bd509112041d3a19783',
    ),
    password: Bytes.fromString('passwd'),
    salt: Bytes.fromString('salt'),
  },
  {
    iterations: 80_000,
    key: Bytes.fromHex(
      '0x4ddcd8f60b98be21830cee5ef22701f9641a4418d04c0414aeff08876b34ab56a1d425a1225833549adb841b51c9b3176a272bdebba1d078478f62b397f33c8d',
    ),
    password: Bytes.fromString('Password'),
    salt: Bytes.fromString('NaCl'),
  },
] as const
