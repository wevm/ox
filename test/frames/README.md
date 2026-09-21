# Nethermind test instance

Run the frame transaction test project with Docker running:

```sh
pnpm test --project frames --run
```

`prool.ts` defines a Nethermind instance using Prool's `Instance.define` and Testcontainers. Global setup starts a Prool server, and each test file gets a separate instance through its numeric RPC URL. File setup starts that instance; teardown destroys it. The global server stops any remaining instances when the project finishes.

Use Ox's existing RPC transport in tests:

```ts
import { RpcTransport } from 'ox'
import { rpcUrl } from './prool.js'

const rpc = RpcTransport.fromHttp(rpcUrl)
```

Prool's `/start`, `/stop`, `/restart`, `/destroy`, and `/messages` endpoints are available under each instance URL. Restarting creates a fresh container with genesis state.

The proxy defaults to port 3001. Set `VITE_FRAMES_PORT` to change it or `VITE_FRAMES_LOG=1` to print client logs. Prool assigns each container an available host port. The pinned image supports Linux AMD64 and ARM64; no registry credentials or local client build are needed. Docker must run locally for these port mappings.

## Development chain

`chainspec.json` uses Nethermind's `NethDev` consensus and the image's `spaceneth` runtime configuration, with chain ID 8141 and base EIP-8141 enabled. Networking and synchronization are disabled. The unsecured development wallet is disabled, and only `Eth`, `Net`, and `Web3` RPC modules are exposed.

The first two accounts from `test/constants/accounts.ts` each have 1,000 ETH at genesis. The canonical expiry verifier is installed at `0x8141`. EIP-8250 keyed nonces and EIP-8272 references are not enabled.

The configuration follows [Nethermind's Spaceneth chain](https://github.com/wevm/nethermind/blob/db50104a5b66652768b0f877d293fc784ea8c44f/src/Nethermind/Chains/spaceneth.json). The image is pinned by manifest digest in `prool.ts`, built from [commit `db50104a`](https://github.com/wevm/nethermind/commit/db50104a5b66652768b0f877d293fc784ea8c44f).

Blob pooling remains disabled by the Spaceneth configuration. Blob integration tests will require additional pool/KZG configuration.

This PR provides the reusable test instance and lifecycle smoke tests. Frame transaction construction, signing, and execution tests belong with the envelope implementation.
