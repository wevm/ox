# ox -- Agent Guidelines

> **Update after learnings or mistakes** -- when a correction, new convention, or hard-won lesson emerges during development, append it to the relevant section of this file immediately. AGENTS.md is the source of truth for project conventions and should grow as the project does.

## TypeScript Conventions

- **Exact optional properties** -- `exactOptionalPropertyTypes` is enabled in tsconfig. Optional properties must include `| undefined` in their type if they can be assigned `undefined` (e.g. `foo?: string | undefined`, not `foo?: string`).
- **No unchecked indexed reads** -- `noUncheckedIndexedAccess` is enabled. Narrow indexed reads before use, or make the invariant obvious with the smallest possible assertion.
- **`readonly` arrays** -- use `readonly T[]` for array types in type definitions.
- **Existing `readonly` properties are fine** -- ox has DOM-shaped WebAuthn types, type snapshots, and inference-heavy literals that intentionally preserve `readonly` properties. Do not churn them just to satisfy a style preference.
- **`type` over `interface` by default** -- use `type` for project-owned shapes. Ambient declarations and DOM-shaped compatibility types may use `interface`.
- **`.js` extensions** -- all relative source imports include `.js` for ESM compatibility.
- **Follow local import style** -- ox uses both namespace imports and named internal imports. Match the surrounding file instead of mass-converting import lists.
- **Zod import aliases** -- import `zod/mini` as `z`, and import zod module namespaces as `z_<Module>` (for example, `import * as z_Hex from '../Hex.js'`).
- **Classes for errors only** -- all other APIs use functions and plain data.
- **Errors live next to the code that throws them** -- module-specific failure classes live inside the module that owns the failure mode. Place each error class near the bottom of the module so the public functions and types are what the reader sees first. Set `name` to the namespaced form (`'Hex.InvalidHexValueError'`, `'SignatureEnvelope.VerificationError'`, etc.).
- **No enums** -- use union types or `as const` objects for fixed sets.
- **camelCase constants** -- prefer `camelCase` for local constants unless the surrounding file already uses protocol-style uppercase names for numeric constants.
- **`const` generic modifier** -- use to preserve literal types for full inference.
- **Options default `= {}`** -- use `options: Options = {}` not `options?: Options`.
- **Namespace params and return types** -- place function parameter, return, and error types in a `declare namespace` matching the function name (e.g. `from.Options`, `serialize.ErrorType`). Do not lift the params type to a sibling export unless the surrounding module already has a shared type.
- **`options` over `args`** -- use `options` for typed option bags. Use domain nouns only when the parameter is not an options bag.
- **Minimal variable names** -- prefer short, obvious names. Use `options` not `serializeOptions`, `fn` not `callbackFunction`, etc. Context makes meaning clear.
- **No redundant type annotations** -- if the return type of a function already covers it, do not annotate intermediate variables. Let the return type do the work.
- **No inline object types on locals** -- when a local variable needs an explicit object-type annotation, declare a named `type` on the line directly above and reference it.
- **Return directly** -- do not declare a variable just to return it. Use `return { ... }` unless the variable is needed for reuse or readability.
- **IIFE expressions for fallible local derivations** -- when a local needs `try`/`catch` to parse or normalize a value, prefer an IIFE expression over `let value: T` followed by assignment inside `try`.
- **Skip braces for single-statement blocks** -- omit `{}` for single-statement `if`, `for`, etc., when the surrounding file follows that style.
- **No section separator comments** -- do not use `// ---` or `// ===` divider comments. Let JSDoc and whitespace provide structure.
- **Static imports by default** -- use static `import` declarations. Dynamic imports are reserved for real runtime boundaries already present in ox, such as worker or WASM loading.
- **Minimize `as any`** -- avoid new `as any` where a safer assertion is practical, but do not mass-rewrite existing crypto, tuple, and inference glue that already relies on it.
- **Destructure when accessing multiple properties** -- prefer `const { a, b } = options` over repeated `options.a`, `options.b`.
- **Read from `options.x` when normalizing a single field** -- when transforming exactly one option into a local of the same name, read it directly from `options` instead of destructuring and inventing a second name.
- **Hex helpers over ad hoc conversion** -- use ox helpers like `Hex.fromNumber`, `Hex.toBytes`, `Bytes.fromHex`, `Value.fromGwei`, etc. instead of open-coded conversions.
- **Use ox branded types** -- prefer existing ox types such as `Hex.Hex`, `Bytes.Bytes`, and `Address.Address` over raw template literal types when the branded module type exists.
- **Keep property order readable** -- preserve the local ordering style. Do not alphabetize arrays, RLP tuples, ABI parameters, transaction fields, or other order-sensitive wire shapes.

## Type Inference Conventions

- **Preserve literals** -- use `const` generics and narrow helper signatures when an API should preserve literal inputs.
- **Type tests in `.test-d.ts`** -- use Vitest's `expectTypeOf` in colocated `.test-d.ts` files to assert generic inference works. Type tests are first-class; write them alongside implementation.
- **Snapshot inferred public types** -- use `.snap-d.ts` when the repo's existing type snapshot pattern fits the change.
- **No `any` leakage** -- user-facing callback, return, and option types should not leak `any` unless the surrounding API already intentionally does.
- **Type inference after every feature** -- after implementing any feature, check if new types can be narrowed. Add or update type tests alongside behavioral tests when public inference changes.

## API Conventions

- **Stateless module APIs** -- public APIs are module namespaces full of functions and types. Do not introduce stateful classes for normal library behavior.
- **Public entrypoint docs** -- when adding a public module or export, update `src/index.ts` with the module export and TSDoc block.
- **Package exports are generated** -- run `pnpm exports:update` only when intentionally adding, removing, or renaming public subpath exports.
- **Keep public APIs lean** -- avoid exposing options for values the library can derive from existing inputs.
- **Wire formats stay explicit** -- serialization, RPC, RLP, ABI, and transaction-envelope code should keep wire-order and field-shape decisions visible at the call site.
- **Internal helpers stay internal** -- keep helper modules under `internal/` unless they are part of the public API.

## Documentation Conventions

- **TSDoc on public exports** -- every exported public function, type, and constant gets a TSDoc comment. Type properties get TSDoc when they are part of the public surface.
- **Doc-driven API changes** -- write or update the TSDoc before or alongside the implementation, not as an afterthought.
- **Examples should be small** -- public examples should show the minimum useful shape and avoid unrelated setup.
- **Source docs first** -- public API documentation usually belongs in TSDoc near the exported source.
- **Site pages** -- human guides live under `site/src/pages/`.
- **Generated docs** -- `site/src/pages/api`, `site/src/pages/ercs`, `site/src/pages/tempo`, `site/src/pages/webauthn`, `site/src/pages/glossary`, and `site/src/pages.gen.ts` are generated outputs. Do not edit them by hand unless explicitly requested.
- **Check TSDoc when touching docs** -- run `pnpm check:tsdoc` after changing public comments or examples.
- **SEO descriptions are auto-derived** -- every generated docs page emits a `description` frontmatter (used for `<meta name="description">` and OG images), targeting 5-15 words. It is derived from the TSDoc summary (markdown stripped, first paragraph, clamped). Add an optional `@description` TSDoc block tag to a function/namespace/schema to override the auto-derived text with hand-written SEO copy. Hand-written site pages should set their own `description` frontmatter (or a `# Title [description]` heading).

## Type Conventions

- **No eager type definitions** -- do not extract a named type until it is used in more than one place or makes a difficult local shape easier to read.
- **Shared domain types live near their module** -- keep reusable public types in the module that owns the domain concept.
- **Error unions live in namespaces** -- exported function error unions should live in that function's namespace as `ErrorType`.

## Abstraction Conventions

- **Prefer duplication over the wrong abstraction** -- duplicated code with a clear bug-fix burden is better than a bad abstraction that is scary to change.
- **Do not abstract until the commonalities scream** -- wait for 3+ concrete use cases where the right abstraction becomes obvious. Do not abstract for 1-2 instances.
- **Optimize for change** -- code that is easy to change beats code that is cleverly DRY. We do not know future requirements.
- **No flags or mode parameters** -- if an abstraction needs `if` branches or boolean params to handle different call sites, it is usually the wrong abstraction. Inline it.
- **Start concrete, extract later** -- begin inline. Extract only when a clear pattern emerges across multiple real usages.

## Testing Conventions

- **Use `pnpm test` for tests** -- run tests through package scripts, not `vitest` directly.
- **Target the relevant project** -- prefer `pnpm test --project core --bail=1`, `pnpm test --project browser --bail=1`, or `pnpm test --project tempo-unit --project tempo --bail=1` over the full matrix while iterating.
- **Colocate tests** -- unit tests live beside their modules in `src/**/_test/*.test.ts`.
- **Wrap function exports in `describe`** -- every test file targets one or more exported functions; each function gets its own `describe('functionName', () => { ... })` block.
- **Inline snapshots over direct assertions** -- prefer `toMatchInlineSnapshot()` over `.toBe()`, `.toEqual()`, etc. for stable return values. Use `toThrowErrorMatchingInlineSnapshot()` for error assertions.
- **Snapshot whole objects, omit nondeterministic properties** -- destructure out nondeterministic fields and snapshot the rest, rather than cherry-picking individual fields to assert.
- **Browser tests use browser suffixes** -- browser-specific behavior uses `*.browser.test.ts` and the `browser` Vitest project.
- **Fuzz tests stay gated** -- fuzz harnesses use `*.fuzz.ts` and run through `pnpm test:fuzz` or `pnpm test:fuzz:ci`; default `pnpm test` should not pick them up.
- **Fuzz regressions become deterministic** -- when a property fails, add the minimized case as a regular `*.test.ts` or vector fixture.
- **Vectors use Bun** -- run vector tests with `pnpm vectors`.
- **Unit and type tests as you go** -- write unit tests and `.test-d.ts` type tests alongside implementation for each public behavior change.

## Workflow Conventions

- **Use targeted commands** -- prefer the smallest command that covers the touched behavior.
- **Types** -- run `pnpm check:types` after TypeScript changes.
- **TSDoc** -- run `pnpm check:tsdoc` after public documentation changes.
- **Repo checks** -- run `pnpm check:repo` when package metadata or workspace shape changes.
- **Docs dev server** -- use `pnpm docs:dev` for documentation UI work.
- **`pnpm check` mutates** -- it runs `biome check . --fix --unsafe`. Use it only when intentionally applying lint/format fixes.
- **`pnpm format` mutates** -- it runs `biome format --write`.
- **`pnpm exports:update` mutates** -- it rewrites `package.json#exports`.
- **`pnpm docs:gen` and `pnpm docs:build` mutate generated docs output** -- run only when docs generation is part of the task.
- **`pnpm contracts:build` mutates generated contract artifacts** -- it runs Forge and `contracts/scripts/generate-typed-artifacts.ts`.
- **Install hooks can mutate** -- `pnpm install` runs `postinstall`, which initializes submodules, builds contracts, and runs `pnpm dev`.

## Changeset Conventions

- **Changesets only for public behavior** -- add or update a changeset when a change affects public API or existing behavior.
- **Update existing changesets first** -- if the branch already has a changeset for the same area, update it instead of adding a duplicate.
- **One sentence, past tense** -- changeset entries are a single sentence written in past tense.
- **Breaking changes include migration shape** -- major changes include a `diff` fence showing the before/after migration shape.

## Git Conventions

- **Conventional commits** -- use `feat:`, `fix:`, `refactor:`, `docs:`, `test:`, `chore:` prefixes. Scope is optional (e.g. `feat(abi): add tuple formatter`).
- **Preserve dirty work** -- do not revert, clean, or overwrite existing local changes unless explicitly asked.

## Learned Workspace Facts

- **Source layout** -- source lives in `src/`; tests live under `src/**/_test`; docs live in `site`; shared test utilities live in `test`; vectors live in `vectors`; contracts live in `contracts`.
- **Node and pnpm** -- the repo expects Node.js `>=22` and `pnpm@11.0.8`.
- **Generated exports** -- `scripts/exports:update.ts` derives `package.json#exports` from `src/`. It flattens `src/core/<Name>.ts` to root package subpaths and ignores test/bench/snapshot files.
- **Generated site pages** -- API/reference pages under `site/src/pages/api`, `site/src/pages/ercs`, `site/src/pages/tempo`, `site/src/pages/webauthn`, and `site/src/pages/glossary` are generated.
- **Contracts submodule** -- `contracts/lib/forge-std` is a submodule path. Treat submodule status changes as user work unless the task is specifically about contracts setup.
- **Secrets are local** -- `.env` is local. Do not print, rewrite, or commit secrets.
- **Docgen export comments** -- `extractNamespaceDocComments` should read the nearest JSDoc on an export declaration. ts-morph can include earlier file-level JSDoc descendants on the first export.
- **Type snapshot config** -- `@ark/attest` 0.16 does not follow root project references. Point `ATTEST_CONFIG.tsconfig` at `test/tsconfig.json`.
- **Node local storage** -- Node 24+ needs a valid `--localstorage-file` for the `@typescript/vfs` dependency used by attest.
