---
"ox": major
---

**`Attribution.toData` Migration**
```diff ts twoslash
Attribution.toData({
    codes: ['baseapp', 'morpho'],
-   registryAddress: '0xcccccccccccccccccccccccccccccccccccccccc',
+   codeRegistry: {
+       address: '0xcccccccccccccccccccccccccccccccccccccccc`
+       chainId: 8453,
+   }
})
```

**`Attribution.fromData` Migration**
``` diff ts twoslash
const attribution = Attribution.fromData(
    '0xddddddddcccccccccccccccccccccccccccccccccccccccc210502626173656170702C6D6F7270686F0E0180218021802180218021802180218021'
)


{
    codes: ['baseapp', 'morpho'],
- registryAddress: 0xcccccccccccccccccccccccccccccccccccccccc
+   registry: {
+       address: '0xcccccccccccccccccccccccccccccccccccccccc`
+       chainId: 8453,
+   }
    id: 1
}

```

Aligned ERC‑8021 Schema 1 serialization, deserialization with EIP‑8021 (variable‑length chainId)

* Updates `Attribution.fromData` to deserialize the variable length registry section from schema 1
* Updates `Attribution.toDataSuffix` to serialize the variable length registry section when schema 1
j