# Fuzz testing

Property-based / fuzz harnesses for `ox`, built on
[`fast-check`](https://fast-check.dev) +
[`@fast-check/vitest`](https://www.npmjs.com/package/@fast-check/vitest).

## Layout

```
test/fuzz/arbitraries/   # Shared, ox-specific fast-check arbitraries.
src/**/_test/*.fuzz.ts   # Co-located fuzz harnesses.
```

Harnesses live alongside existing unit tests under `src/**/_test/`
and use the `*.fuzz.ts` extension so they don't get picked up by the
default Vitest `core` project (which globs `src/**/*.test.ts`).

## Running

```bash
# Local loop, default fast-check budget (100 runs/property).
pnpm test:fuzz

# CI-style: bounded run count, bail on first failure (200 runs).
pnpm test:fuzz:ci

# Run a single harness.
pnpm test:fuzz src/core/_test/AbiParameters.fuzz.ts

# Increase the budget locally.
FC_NUM_RUNS=5000 pnpm test:fuzz
```

The `fuzz` Vitest project is gated behind `FUZZ=true` so the default
`pnpm test` invocation does not pick up stochastic property tests.

## Reproducibility

When a property fails, `fast-check` prints the seed, path, and shrunk
counterexample. Replay the exact case via:

```bash
FC_SEED=<seed> FC_PATH=<path> pnpm test:fuzz <file>
```

> **Fuzzing finds the bug; deterministic tests keep it fixed.**

When a property fails:

1. Reproduce locally with the printed seed.
2. Let `fast-check`'s shrinker minimize the counterexample (automatic).
3. Commit the minimized case as a regular `*.test.ts` (or vector
   fixture) so the regression is enforced deterministically forever
   after.

Do not rely on the seed alone -- seeds are not stable across
`fast-check` upgrades.

## Design rules

- **Cap recursion.** Parser libraries blow up on unbounded structures.
  Every recursive arbitrary must declare explicit `maxDepth` /
  `maxLeaves`.
- **Generate semantic values, not strings.** Avoid "stringify then
  parse" arbitraries -- they destroy shrink quality.
- **Whitelist expected error names.** Don't accept "any throw" as
  success. Adversarial-input properties should assert that thrown
  errors are in a known set
  (e.g. `Cursor.PositionOutOfBoundsError`,
  `AbiParameters.DataSizeTooSmallError`).
- **Avoid filter-heavy arbitraries.** Prefer compositional generators
  over `.filter(...)`; rejection-sampling wastes runs and skews
  distribution.
- **Keep PR runs bounded.** Default `numRuns` should keep the `Fuzz`
  CI job under ~10 minutes. Heavier runs belong in nightly schedules.
