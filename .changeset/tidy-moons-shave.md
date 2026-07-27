---
'ox': patch
---

Fixed `Base64.fromBytes` double-padding URL-safe output, and `Base64.toBytes` silently accepting characters above `U+00FF`.

`omitPadding` governs both alphabets, so padding was appended to an
already-padded `base64url` string on every runtime with
`Uint8Array.prototype.toBase64` — browsers and Bun, but not Node:

```ts
Base64.fromBytes(Bytes.from([0xfa]), { url: true, pad: true })
// before: '-g===='
// after:  '-g=='
```

Separately, the decoder's alphabet table only spans Latin-1, so a character
above it read as `undefined` and decoded as `A` rather than being refused:

```ts
Base64.toBytes('숰GVsbG8=')
// before: Uint8Array of "\u0000ello"
// after:  throws Base64.InvalidCharacterError
```
