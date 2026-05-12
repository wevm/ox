---
"ox": patch
---

Tightened `Value.from` input validation to reject malformed numeric strings (`''`, `'.'`, `'-'`, `'-.'`) and to reject non-integer or negative `decimals`, and replaced `Number`/`Math.round` rounding with string-carry rounding so very long fractions no longer lose precision.
