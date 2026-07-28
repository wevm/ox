---
'ox': patch
---

Expanded Node and WASM engines, renamed provider factories to `engine`, and added atomic `Engine.install` for selecting and installing modules in parallel.

```diff
 import { Engine as CoreEngine } from 'ox'
 import { Engine, Hash } from 'ox/wasm'

-await Engine.load()
+await Engine.install()
+Hash.sha256('0xdeadbeef')

-const wasm = await Engine.create()
+const wasm = await Engine.engine()

-CoreEngine.set(await Hash.create())
+await CoreEngine.install({ Hash: Hash.engine() })
```
