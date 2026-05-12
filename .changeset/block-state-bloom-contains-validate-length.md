---
"ox": patch
---

Made `Bloom.contains` validate the bloom argument length and throw `Bloom.InvalidBloomError` instead of silently returning `false` for malformed bloom inputs.
