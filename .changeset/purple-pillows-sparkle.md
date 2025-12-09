---
"ox": minor
---

**Breaking:** Aligned to latest ERC-8021 specification. Modified `Attribution.toDataSuffix` parameters to include `codeRegistry` instead of `registryAddress`.

```diff ts twoslash
Attribution.toDataSuffix({
    codes: ['baseapp', 'morpho'],
-   registryAddress: '0xcccccccccccccccccccccccccccccccccccccccc',
+   codeRegistry: {
+       address: '0xcccccccccccccccccccccccccccccccccccccccc`
+       chainId: 8453,
+   }
})
```
