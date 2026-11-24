import { join } from 'node:path'
import fs from 'fs-extra'

// Writes `dist/package.json`, which makes `dist` its own package scope.
//
// Node looks up the nearest `package.json` for every module it loads, to read its `type`, and
// parses that file's whole `exports` map each time. The root `package.json` maps every entry
// point, so a scope of its own roughly halves the time to import ox (`ox` 260 → 130 ms,
// `ox/Hex` 11 → 6.5 ms). Bundlers read `sideEffects` from the nearest `package.json` too, so it
// repeats the root's. Without `name` or `exports`, it changes nothing else: specifiers still
// resolve through the root `package.json`.
//
// Runs after `zile`, which writes `dist`.

fs.writeJsonSync(
  join(import.meta.dirname, '../dist/package.json'),
  { sideEffects: false, type: 'module' },
  { spaces: 2 },
)

console.log('Wrote dist/package.json.')
