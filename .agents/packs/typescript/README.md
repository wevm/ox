# TypeScript

Measures conventions in tracked TypeScript files, including declarations and `.cts` and `.mts` modules. A source archive without Git uses the same file patterns. oxlint checks lint rules, oxc-parser reads syntax, and the TypeScript checker resolves bindings for exports, assertions, and array writes.

Its convention metrics go into the shared categories `correctness`, `style`, `architecture`, `documentation`, `testing`, and `configuration`. Each merges with the category of its name in the project and its other packs.

## Library Metrics

A published library also gets what it costs the projects that use it, measured from the build and the entry points of package.json `exports`. Each public export, function, and entry point is an item, such as `lib:Math.add`. Without an ES module entry point, these metrics skip.

| Category | Metrics |
| --- | --- |
| `footprint` | Gzipped bundle size of each export, and whether each module tree-shakes away |
| `speed` | CPU time and heap bytes of each call, replayed from the project's vitest tests, and of each import |
| `coverage` | Whether each public function has a call to replay |
| `types` | Type instantiations, check time, and check memory of each export, and of each type test |
| `call-types` | Type instantiations of the first call the tests write to each public function |
| `type-coverage` | Whether each public function has a test call to measure |
| `fuzz` | Whether fuzzing of each public function ran and found no crash, and the share of its lines it ran |

Each metric also has a `hot-*` copy for the items the project lists in `hot`, so they score against tighter targets on their own.

## Project Inputs

`local/config.ts` in the vendored pack, `.agents/packs/typescript/local/config.ts`, holds the project's inputs. `uphill update` keeps `local/` and `uphill audit` skips it, so the files the inputs name live there too. Its default export has the type `Config` in [metrics/library.ts](metrics/library.ts), and every key is optional.

```ts
// .agents/packs/typescript/local/config.ts
import type { Config } from '../metrics/library.ts'

export default {
  // Exports that only feed tooling.
  exclude: ['./index.docs'],
  // The parts of the library its users call most.
  hot: ['lib:Math.add', 'lib/Math'],
  // The structured fuzz properties, beside the boundary mutations of recorded arguments.
  fuzz: { properties: '.agents/packs/typescript/local/fuzz-properties.ts' },
} satisfies Config
```

Other keys empty the library's caches before each measured call, pick the vitest projects to replay, prepare what the tests reach, and point the types metrics at other tsconfig files.

## Requirements

- **Bun:** Runs the script and installs its locked parser, linter, formatter, and TypeScript binding API.
- **Project tools:** `lint` and `formatted` use the project's linter and formatter. Each falls back to the pack's oxlint or oxfmt only if the project declares no tool. A missing or failed tool skips its metric.
- **TypeScript:** The project's `tsc` or `tsgo` supplies `type-errors` for `tsconfig.json` and its references. Files outside those programs skip. Project-wide diagnostics use the configuration file as their item.
- **A build:** The library metrics read the build. Build before a run, and set `setup` to build each checkout that `--compare` creates.
- **vitest:** The call replay records the project's vitest tests. Without a vitest config, the call metrics skip and imports still measure.
- **Node 26:** The types metrics count allocated bytes with Node 26 or later, and install it with `npx` when `node` is older.

## Add

```sh
# Pin the pack, and approve the install of its dependencies.
uphill add wevm/uphill/packs/typescript@main
```

A project that measures its own footprint or speed can take only some categories.

```yaml
# Take only the convention categories.
packs:
  - { pack: wevm/uphill/packs/typescript@<commit>, categories: [correctness, style, architecture, documentation, testing, configuration], install: true }
```
