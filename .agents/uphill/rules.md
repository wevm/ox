# Rules

Uphill writes these rules from each metric's `description`. Write code that meets them. `uphill` scores each metric against its target, and `uphill --compare HEAD --compact` lists what a change made worse.

## Footprint

- Keep the gzipped bundle small for a consumer that imports one export. Do not pull unrelated modules or packages into an export. At most 10 kB. `*:*.*Error`: at most 1 kB. `ox/trusted-setups*`: at most 410 kB. `ox/wasm`: at most 260 kB. `ox`: at most 215 kB. `ox/node`: at most 120 kB. `ox/zod`: at most 125 kB. `ox/zod:z`: at most 125 kB. `ox/tempo`: at most 65 kB. `ox/wasm:*`: at most 130 kB. `ox/zod:z.RpcSchema`: at most 26 kB. `ox/zod:z.RpcSchema.Default`: at most 26 kB. `ox/zod:z.RpcSchema.Eth`: at most 26 kB. `ox/zod:z.RpcSchema.Wallet`: at most 26 kB. `ox/zod:z.RpcSchema.*`: at most 4 kB. `*:Mnemonic`: at most 100 kB. `ox/zod*`: at most 60 kB. `*:Bls*`: at most 28 kB. `*:Mnemonic.*`: at most 26 kB. `*:HdKey*`: at most 26 kB. `*:*fromMnemonic`: at most 26 kB. `ox/webauthn*`: at most 28 kB. `*:WebAuthn*`: at most 22 kB. `*:TransactionRequest*`: at most 40 kB. `ox/tempo*`: at most 40 kB. `*:Secp256k1*`: at most 22 kB. `*:P256*`: at most 20 kB. `*:Ed25519*`: at most 20 kB. `*:X25519*`: at most 20 kB. `*:MlDsa44*`: at most 20 kB. `*:Signature*`: at most 22 kB. `*:TransactionEnvelope*`: at most 22 kB. `*:TxEnvelope*`: at most 22 kB. `*:Transaction*`: at most 22 kB. `*:Ens*`: at most 18 kB. `ox/erc*`: at most 22 kB.
- Make each entry point bundle to nothing when unused. Annotate top-level calls with `/*#__PURE__*/`, and avoid runtime TypeScript namespaces and static class fields.

## Speed

- Keep each public function fast per call, with cold and warm caches. At most 20 µs. `ox:Keystore.pbkdf2*`: at most 500 ms. `ox:AesGcm.getKey`: at most 180 ms. `ox:Keystore.toKey*`: at most 50 ms. `*:*fromMnemonic`: at most 16 ms. `*:Mnemonic.to*`: at most 16 ms. `ox:Keystore.scrypt*`: at most 5 ms. `*:Bls.*`: at most 45 ms. `*:BlsPoint.*`: at most 1.5 ms. `*:MlDsa44.*`: at most 8 ms. `ox/tempo:SignatureEnvelope.sortApprovals`: at most 7 ms. `ox/tempo:AccountOperation.selectApprovals`: at most 7 ms. `*:*.recover*`: at most 3.5 ms. `*:*.verify`: at most 3.5 ms. `*:*.getSharedSecret`: at most 3.5 ms. `ox/tempo:SignatureEnvelope.extractPublicKey`: at most 2.5 ms. `ox/erc8010:SignatureErc8010.wrap`: at most 2 ms. `*:HdKey.*`: at most 1.1 ms. `*:X25519.*`: at most 1.1 ms. `*:*.sign`: at most 500 µs. `*:*.getPublicKey`: at most 500 µs. `*:*.createKeyPair`: at most 500 µs. `*:Mnemonic.*`: at most 350 µs. `ox:Blobs.*`: at most 400 µs. `ox:BinaryStateTree.*`: at most 400 µs.
- Keep the heap bytes that each call of a public function allocates small. At most 20 kB. `ox:Keystore.pbkdf2*`: at most 350 MB. `ox:Keystore.toKey*`: at most 5 MB. `*:*fromMnemonic`: at most 13 MB. `*:Mnemonic.to*`: at most 13 MB. `*:Bls.*`: at most 36 MB. `*:BlsPoint.*`: at most 1.5 MB. `*:MlDsa44.*`: at most 4 MB. `ox/tempo:SignatureEnvelope.sortApprovals`: at most 4.5 MB. `ox/tempo:AccountOperation.selectApprovals`: at most 4.5 MB. `*:*.recover*`: at most 2.3 MB. `*:*.verify`: at most 2.3 MB. `*:*.getSharedSecret`: at most 2.6 MB. `ox/tempo:SignatureEnvelope.extractPublicKey`: at most 1.5 MB. `ox/erc8010:SignatureErc8010.wrap`: at most 1.5 MB. `*:HdKey.*`: at most 1 MB. `*:X25519.*`: at most 1 MB. `*:*.sign`: at most 600 kB. `*:*.getPublicKey`: at most 600 kB. `*:*.createKeyPair`: at most 600 kB. `ox:Keystore.scrypt*`: at most 20 MB. `ox:AesGcm.*`: at most 200 kB. `ox:Blobs.*`: at most 2 MB.
- Keep each entry point fast to import. Avoid work at module scope. At most 60 ms. `ox/zod*`: at most 350 ms. `ox`: at most 230 ms. `ox/tempo*`: at most 120 ms. `ox/wasm*`: at most 150 ms. `ox/node*`: at most 150 ms.
- Keep the heap that each entry point holds once imported small. At most 3.5 MB. `ox/zod*`: at most 25 MB. `ox`: at most 8 MB. `ox/tempo*`: at most 6 MB. `ox/wasm*`: at most 6 MB. `ox/node*`: at most 6 MB.

## Coverage

- Call each public function in the tests with arguments that rebuild in another process, such as plain data. Make sure the call returns or resolves.

## Types

- Keep each public export cheap to type-check. Avoid types that need many instantiations to resolve. At most 1000. `ox/zod:*`: at most 2500. `ox:Abi*`: at most 5000. `ox:TypedData*`: at most 5000. `ox/erc4337:UserOperation.toTypedData`: at most 5000.
- Keep each public export fast to type-check. At most 5 ms. `ox/zod:*`: at most 15 ms. `ox:Abi*`: at most 25 ms. `ox:TypedData*`: at most 25 ms. `ox/erc4337:UserOperation.toTypedData`: at most 25 ms.
- Keep the heap bytes that type-checking each public export allocates small. At most 2 MB. `ox/zod:*`: at most 10 MB. `ox:Abi*`: at most 25 MB. `ox:TypedData*`: at most 25 MB. `ox/erc4337:UserOperation.toTypedData`: at most 25 MB.

## Call types

- Keep each public function cheap to type-check at the call sites that the tests write. At most 1000. `ox:TypedData.hashType`: at most 1000. `ox:TypedData.encodeType`: at most 1000. `ox:TypedData.hashStruct`: at most 1000. `ox:TypedData.*`: at most 5000. `ox:Abi*`: at most 5000. `ox/erc4337:UserOperation.*`: at most 5000. `ox/zod:*`: at most 10000.

## Type coverage

- Call each public function in the runtime or type tests. Make sure the imports and fixtures of that call resolve.

## Fuzz

- Make sure each public function has a fuzz harness that runs.
- Handle every input that keeps the declared types. Throw no undocumented TypeError, RangeError, or SyntaxError, and avoid stack overflows, hangs, and runaway memory. Keep each property in .agents/uphill/fuzz-properties.ts true.
- Make every line of a public function's own source reachable by fuzzing. At least 90.

## Correctness

- Fix every type error. Run the project's `tsc` or `tsgo` to check.
- Set `strict`, `exactOptionalPropertyTypes`, `noUncheckedIndexedAccess`, and `verbatimModuleSyntax` in tsconfig.json. Treat them as design constraints.
- Avoid `any`. Use a precise type, validation, or narrowing (oxlint `typescript/no-explicit-any`).
- Fix every report of the project's linter with its own configuration.
- Use `crypto.getRandomValues()`, not `Math.random()` (oxlint `eslint/no-restricted-properties`).
- Do not log through `console` in files under `src/` (oxlint `eslint/no-console`).

## Style

- Format each TypeScript file with the project's formatter and its own configuration.
- Avoid enums. Use unions or `as const` objects.
- Declare shapes with `type`, not `interface` (oxlint `typescript/consistent-type-definitions`).
- Annotate arrays as `readonly T[]`. Keep an array mutable only where code mutates the binding or a function's result.
- Name the file extension in each import, so the source stays valid under NodeNext (oxlint `import/extensions`).
- Use `import type` and `export type` for type-only imports and exports.
- Name module constants in camelCase, not UPPER_CASE.
- Default option bags in the signature (`options: fn.Options = {}`), not with `options?`.
- Name option bags `options`, not `args`, `opts`, or `params`.
- Give each function at most two positional parameters, a receiver and then an options bag (oxlint `eslint/max-params`).
- Do not destructure parameters in the signature. Take each parameter whole and destructure it in the body.
- Avoid nested ternaries. Use an IIFE with early returns (oxlint `eslint/no-nested-ternary`).
- Do not annotate local variables with inline object types. Name the type above the use.
- Put a function's types in its namespace (`create.Options`), not beside it (`CreateOptions`).
- Return values directly. Do not bind a value only to return it on the next line.
- Derive a fallible value in an IIFE, not in a `let` assigned across `try` and `catch`.
- Do not write section-divider comments, such as `// ----`.
- Leave no trailing whitespace, blank lines at the end, or conflict markers in a tracked text file (`git diff --check`).
- Start each GitHub workflow with `name` and `on`, then list its other top-level keys in alphabetical order.

## Architecture

- Avoid import cycles. No module may import itself through other modules (oxlint `import/no-cycle`).
- Import module-shaped files, such as `./Store.js`, as namespaces (`import * as Store`). Types and components may use named imports.
- Import Node built-ins as namespaces (`import * as fs from 'node:fs'`).
- Re-export modules as namespaces (`export * as Store`). Do not flatten them into a barrel with `export *` or `export { … } from`.
- Use static imports. Use a dynamic import only at a real runtime or bundle boundary.
- Do not import modules for their side effects, such as `import './register.js'` (oxlint `import/no-unassigned-import`).
- Use functions and plain data. Limit classes to errors and framework entrypoints.
- Set a namespaced `name` on each error class, such as `'Config.InvalidError'`.
- Use `this` only in classes. Make factories close over their state.
- Keep only constants at module scope. Do not use a module-scope `let` or an empty `Map` or `Set` cache.

## Documentation

- Start each TypeScript file with a TSDoc `@module` comment that describes its responsibility.
- Document every export with TSDoc. Overloads share the comment on the first signature.
- Document every property of an exported type with TSDoc.

## Testing

- Test with real implementations. Do not use `vi.mock`, `vi.fn`, fake timers, stubbed globals, or mocking packages (oxlint restricted-method and restricted-import rules).
- Assert with inline snapshots in TypeScript tests, not with `toBe` or `toEqual`.
- Keep snapshots inline. Do not commit snapshot files.
- Wait for observable conditions in tests, not with `setTimeout` or `Bun.sleep` (oxlint restricted-global and restricted-property rules).
- Write one test file per module. Do not split it into `Module.context.test.ts` files.

## Configuration

- Write source files in TypeScript, not JavaScript. Configuration files are exempt.
- Declare `sideEffects` as a boolean or a file-pattern list in each named, non-private package.
- Reference dependency versions with `catalog:` in each package.json of a pnpm workspace.
- Run TypeScript scripts directly, not through `tsx` or `ts-node`.
- Keep the dependencies and scripts of each package.json in alphabetical order.

## Commits

- Start each commit header with a conventional type, such as `feat:` or `fix:`, and a subject (commitlint `type-enum`, `type-case`, `type-empty`, and `subject-empty`).
- Start each subject in lowercase (commitlint `subject-case`).
- End each subject without a period (commitlint `subject-full-stop`).
- Keep each commit header to 100 characters or fewer (commitlint `header-max-length`).
- Put a blank line before the body and the footer, and wrap them at 100 characters (commitlint `body-leading-blank`, `body-max-line-length`, and the matching footer rules).
- State the change in the subject, not the reason. Leave out "because", "so that", and "in order to".
- Open each subject with a verb in its base form, such as "add", not "adds" or "added".
- Add or edit a test source file in each `fix:` commit.
- Write each changeset as one sentence that opens with a past-tense verb, such as "Added".
- Do not commit build output, installed packages, or `.env` files.
