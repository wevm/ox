# Frame transaction tests

Run the EIP-8141 integration project with Docker running:

```sh
pnpm test --project frames --run
```

The fixture starts a fresh Nethermind container for each test, assigns an available host port, waits for the expected chain ID, and stops the container during teardown. Tests require no fork RPC, credentials, or locally built client. The pinned image supports Linux AMD64 and ARM64.

Import `test` from `./fixture.js` and use the `rpc` fixture when adding tests. Use the `frames` project for these tests; the core and browser projects do not collect them. Startup and test failures are fatal, and retries are disabled.

## Chain configuration

`chainspec.json` uses Nethermind's `NethDev` consensus and the image's `spaceneth` runtime configuration, with a custom chain ID of 8141. Networking and synchronization are disabled. Only `Eth`, `Net`, and `Web3` RPC modules are exposed, and the unsecured development wallet is disabled.

The chain enables base EIP-8141, including its state-gas and transfer-log dependencies. EIP-8250 keyed nonces and EIP-8272 references are not enabled. The sender is funded at genesis, and the recipient starts with one wei so the transfer needs no account-creation state gas. The canonical expiry verifier is installed at `0x8141`.

The consensus configuration follows [Nethermind's Spaceneth chain](https://github.com/wevm/nethermind/blob/db50104a5b66652768b0f877d293fc784ea8c44f/src/Nethermind/Chains/spaceneth.json). The runtime image is pinned by manifest digest in `fixture.ts`, built from [commit `db50104a`](https://github.com/wevm/nethermind/commit/db50104a5b66652768b0f877d293fc784ea8c44f).

Blob transaction pooling is disabled by the Spaceneth configuration. This harness verifies non-blob frame transactions; live blob interoperability remains unverified and requires additional pool/KZG configuration before blob tests are added.

## Independent transaction fixture

`fixtures/transfer.json` is generated with ethers, without Ox's transaction encoding or signing functions. Its wire layout follows [EIP-8141 at revision `b75cbe61`](https://github.com/ethereum/EIPs/blob/b75cbe61150f09a44c38843be916417283d5b7bf/EIPS/eip-8141.md). Regenerate it with:

```sh
node --import tsx test/frames/fixtures/generate.ts
```

The generator uses public test private key `1`, chain ID 8141, and nonce zero. Never fund this key on a public network. It constructs two frames:

1. A `VERIFY` frame targeting the sender with approval flags `3`, authorizing execution and payment through default validation.
2. A `SENDER` frame transferring one wei to `0x0000000000000000000000000000000000001234`.

Each frame has an execution limit of 50,000 and a state limit of zero. The signature entry uses secp256k1, an implicit sender, and an empty message. The generator hashes the unsigned payload and inserts the signature as `yParity || r || s`.

The fixed transaction hash is `0x2cafa024dc5d102fd3a2764a6b5f65bfc52e4547ffce235b78229ff711a0de85`. The test checks that it mines in block one, the sender is the payer, both frame statuses are successful, the recipient balance becomes two wei, and the sender nonce becomes one. Frame execution charges are 100 gas for the warm sender and 2,600 for the cold recipient, with no state gas. The transfer emits the EIP-7708 log.

Future envelope tests should construct and sign transactions with Ox and submit them through this same fixture. Typed frame RPC and receipt conversions can be added when their implementation PR lands.
