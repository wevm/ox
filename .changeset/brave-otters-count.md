---
'ox': patch
---

Fixed `Hex.toBytes` silently accepting characters above `U+00FF`, and sped up decoding of short values and encoding on runtimes without `Uint8Array.prototype.toHex`.

`Buffer.from(…, 'hex')` masks each UTF-16 code unit to 8 bits, so a character
above `U+00FF` could alias a hex digit rather than being rejected:

```ts
Hex.toBytes('0x숰0')
// before: Uint8Array [0]  (U+C230 masked to the digit `0`)
// after:  throws Hex.InvalidHexValueError
```
