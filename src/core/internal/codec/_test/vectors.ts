/**
 * Published codec vectors, transcribed verbatim rather than regenerated, so a
 * change to ox cannot quietly move the expected values.
 *
 * Two sources:
 *
 * - RFC 4648, which specifies Base16 and Base64 and gives the `""` through
 *   `"foobar"` progression for each in section 10. Base16 is defined as
 *   case-insensitive on decode; ox emits lowercase.
 *   https://www.rfc-editor.org/rfc/rfc4648#section-10
 * - test262, the ECMAScript conformance suite, for `Uint8Array.fromHex` /
 *   `toHex` and `fromBase64` / `toBase64`. These pin the behavior of the native
 *   codecs ox delegates to, including which characters must be rejected.
 *   https://github.com/tc39/test262/tree/main/test/built-ins/Uint8Array
 *
 * @internal
 */

/** The RFC 4648 section 10 inputs, as bytes. */
const foobar = ['', 'f', 'fo', 'foo', 'foob', 'fooba', 'foobar'].map((value) =>
  Uint8Array.from(value, (c) => c.charCodeAt(0)),
)

const hexEncoded = [
  '',
  '66',
  '666f',
  '666f6f',
  '666f6f62',
  '666f6f6261',
  '666f6f626172',
]

const base64Encoded = [
  '',
  'Zg==',
  'Zm8=',
  'Zm9v',
  'Zm9vYg==',
  'Zm9vYmE=',
  'Zm9vYmFy',
]

/** @internal */
export const hex = {
  /**
   * Bytes and their lowercase hex, from RFC 4648 section 10 and test262
   * `fromHex/results.js` / `toHex/results.js`. The two agree except on case:
   * the RFC writes uppercase, the ECMAScript methods emit lowercase.
   */
  roundTrip: foobar.map((bytes, i) => ({ bytes, encoded: hexEncoded[i]! })),

  /**
   * Uppercase and mixed-case bodies that must decode to the same bytes as their
   * lowercase form, from test262 `fromHex/results.js` and the uppercase
   * spellings RFC 4648 section 10 uses.
   */
  decodeCaseInsensitive: [
    { bytes: Uint8Array.of(102, 111), encoded: '666F' },
    { bytes: Uint8Array.of(102, 111, 111), encoded: '666F6f' },
    { bytes: foobar[6]!, encoded: '666F6F626172' },
  ],

  /**
   * Characters a decoder must reject, from test262
   * `fromHex/illegal-characters.js`: punctuation, every flavor of ASCII
   * whitespace, and three non-ASCII spaces.
   *
   * The last two sit above the Latin-1 lookup table ox decodes through, so a
   * table read for them yields `undefined` rather than the invalid sentinel --
   * the exact shape of the bug this suite exists to catch.
   */
  illegalCharacters: [
    '.',
    '^',
    ' ',
    '\t',
    '\u000a', // line feed
    '\u000c', // form feed
    '\u000d', // carriage return
    '\u00a0', // no-break space -- inside the Latin-1 table
    '\u2009', // thin space -- above it
    '\u2028', // line separator -- above it
  ],

  /**
   * Bodies that Node's `Buffer` hex decoder accepted, wrongly, before ox
   * guarded against it: it masks each UTF-16 code unit to 8 bits, so a
   * character above U+00FF can alias a hex digit. U+C230 masks to `0x30`, the
   * digit `0`, and the surrogate pair for U+1D330 masks to `40`.
   */
  maskedNonAscii: [
    { body: '\uc2300', note: 'U+C230 masks to the digit 0' },
    { body: '\u{1d330}', note: 'surrogate pair masks to 4 and 0' },
  ],
} as const

/** @internal */
export const base64 = {
  /** Bytes and their Base64, from RFC 4648 section 10. */
  roundTrip: foobar.map((bytes, i) => ({ bytes, encoded: base64Encoded[i]! })),

  /**
   * Strings a decoder must reject, from test262
   * `fromBase64/illegal-characters.js`.
   *
   * U+2212 and U+FF0B are the interesting ones: they are homoglyphs for `-` and
   * `+`, both of which *are* Base64 alphabet characters, and U+FF0B sits above
   * the Latin-1 table. Before the guard it decoded silently as `A` rather than
   * being refused.
   */
  illegal: [
    'Zm.9v',
    'Zm9v^',
    'Zg==&',
    'Z\u2212==', // minus sign, homoglyph for '-'
    'Z\uff0b==', // fullwidth plus sign, homoglyph for '+'
    'Zg\u00a0==', // no-break space
    'Zg\u2009==', // thin space
    'Zg\u2028==', // line separator
  ],
} as const
