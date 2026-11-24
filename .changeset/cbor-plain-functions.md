---
"ox": patch
---

Made `ox/Cbor` tree-shakable: its internal encoders and decoders are plain functions instead of members of TypeScript namespaces, which compiled to top-level IIFEs that every bundle importing `Cbor` kept.
