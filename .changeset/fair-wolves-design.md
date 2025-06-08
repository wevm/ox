---
"ox": minor
---

**Breaking(`Keystore`):** `Keystore.decrypt` function interface no longer requires an object as the second parameter, now it only requires the key itself.

```diff
import { Keystore } from 'ox'

const [key, opts] = Keystore.pbkdf2({ password: 'testpassword' })

const encrypted = await Keystore.encrypt(secret, key, opts)

+ const decrypted = await Keystore.decrypt(encrypted, key)
```