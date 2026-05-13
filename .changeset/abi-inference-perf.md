---
"ox": minor
---

Capped `AbiItem.fromAbi` overload-narrowing recursion depth at 16 to bound TS inference cost on large ABIs, replaced the 50+ arm `MangledReturns` template-literal enumeration with a single in-order predicate, and folded `AbiParameters.decode` return-type resolution into a single conditional that distributes on `as` so the parameter walk only happens once per branch.
