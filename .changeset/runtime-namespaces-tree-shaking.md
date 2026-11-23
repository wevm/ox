---
"ox": patch
---

Made `AbiParameters` and `Cbor` tree-shakeable by replacing their runtime namespaces with plain functions, so importing one of their errors or utilities no longer bundles packed encoding or the whole CBOR codec (`AbiParameters.encodePacked.encode`, an undocumented helper, is no longer exported).
