# Bench results: webauthn

_`src/webauthn/*`, CoseKey, WebCryptoP256, WebAuthnP256._

See [tasks/bench/README.md](../tasks/bench/README.md) for the convention.

Baseline: `94d3e4bc`. PR: `8e907a32` (track-b/webauthn).

| bench | baseline | PR | delta | SHA |
| ----- | -------- | -- | ----- | --- |
| `Authentication.bench.ts::Authentication.sign (mock)::default` | 444,389 | 516,057 | +16.1% | `8e907a32` |
| `Authentication.bench.ts::Authentication.verify::default` | 691.51 | 825.25 | +19.3% | `8e907a32` |
| `Authenticator.bench.ts::getAuthenticatorData (no credential)::hex output` | 541,646 | 646,294 | +19.3% | `8e907a32` |
| `Authenticator.bench.ts::getAuthenticatorData (no credential)::bytes output` | n/a (new API) | 1,317,423 | +143.2% vs baseline-hex | `8e907a32` |
| `Authenticator.bench.ts::getAuthenticatorData (with credential)::hex output` | 156,125 | 193,553 | +24.0% | `8e907a32` |
| `Authenticator.bench.ts::getAuthenticatorData (with credential)::bytes output` | n/a (new API) | 189,208 | +21.2% vs baseline-hex | `8e907a32` |
| `Authenticator.bench.ts::getSignCount::from hex` | 1,124,365 | 1,550,874 | +37.9% | `8e907a32` |
| `Authenticator.bench.ts::getSignCount::from bytes` | n/a (new API) | 42,920,355 | +3717.3% vs baseline-hex | `8e907a32` |
| `Registration.bench.ts::Registration.verify (packed)::default` | 629.62 | 782.30 | +24.2% | `8e907a32` |
| `Registration.bench.ts::Registration.verify (none)::default` | 33,542 | 57,800 | +72.3% | `8e907a32` |

Notes:
- `Authentication.sign` is benched against a mocked `getFn` returning the signed fixture; it isolates the host-side parsing and metadata construction work that this phase touched.
- `Authentication.verify` and `Registration.verify (packed)` are bottlenecked by P-256 signature verification; the measured deltas reflect the savings from the bytes-first authenticator-data parsing and (for `Registration.verify`) the single COSE decode.
- `Registration.verify (none)` skips the attestation signature verification, isolating the COSE decode and authData parsing wins.
- `getAuthenticatorData` and `getSignCount` `bytes` rows are new API surface (not present on baseline); compared against the baseline `hex` row for context.
