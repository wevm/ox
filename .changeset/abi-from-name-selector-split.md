---
"ox": major
---

Split polymorphic `from` and `fromAbi` on `Abi*` modules into shape-specific helpers and defaulted `Abi.from` to precompute signature `hash`es.

```diff
- AbiFunction.from('function approve(address,uint256)')
+ AbiFunction.fromHumanReadable('function approve(address,uint256)')

- AbiFunction.from({ type: 'function', name: 'approve', /* ... */ })
+ AbiFunction.fromJson({ type: 'function', name: 'approve', /* ... */ })

- AbiFunction.fromAbi(abi, 'approve')
+ AbiFunction.fromAbiName(abi, 'approve')

- AbiFunction.fromAbi(abi, '0x095ea7b3')
+ AbiFunction.fromAbiSelector(abi, '0x095ea7b3')

- Abi.from(abi)                       // no `hash` precomputed
+ Abi.from(abi)                       // `hash` precomputed by default
+ Abi.from(abi, { prepare: false })   // opt out of `hash` precomputation
```
