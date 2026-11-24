---
"ox": patch
---

Made `Errors.BaseError` set its fields in its constructor instead of declaring them as class fields, which the ES2021 build compiled to an `Object.defineProperty` call each. Bundles that include an error shrink by about 30 bytes (gzip); errors keep the same properties in the same order.
