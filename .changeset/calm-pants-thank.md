---
"ox": minor
---

Overhauled WebAuthn support with a dedicated `ox/webauthn` entrypoint for server-side registration & authentication ceremonies, credential management, and authenticator data parsing.

- `Registration` – Full registration ceremony: `create`, `getOptions`, `verify`, with `serializeOptions`/`deserializeOptions` for server↔client transport
- `Authentication` – Full authentication ceremony: `sign`, `getOptions`, `verify`, with `serializeOptions`/`deserializeOptions` for server↔client transport
- `Credential` – `serialize`/`deserialize` for persisting and transporting WebAuthn credentials as JSON
- `Authenticator` – Low-level utilities for constructing/parsing authenticator data, attestation objects, and client data JSON