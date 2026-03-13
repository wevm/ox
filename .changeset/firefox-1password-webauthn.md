---
"ox": patch
---

Fixed `Registration.create` and `Authentication.sign` throwing "Permission denied to access object" in Firefox with the 1Password extension. Replaced `.bind()` defaults on `navigator.credentials.create`/`.get` with arrow functions, eagerly read credential response properties (`attestationObject`, `clientDataJSON`, `authenticatorData`, `signature`, `id`) before subsequent access is blocked by the cross-compartment proxy, and passed the already-read `attestationObject` to `parseCredentialPublicKey` so the 1Password fallback path no longer re-accesses the proxy.
