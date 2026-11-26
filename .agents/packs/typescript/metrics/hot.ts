/**
 * Repeats the lines about the library's hot items, which `hot` in `local/config.ts`
 * lists, as `hot-<metric>` lines. The `hot-*` metrics score these items on their own, so the
 * project can give them tighter targets: in a full list, a few dozen items that miss their targets
 * hide under the p90 that the list scores.
 *
 * @module
 */

import * as library from './library.ts'

/** The metrics whose hot lines the pack scores. */
const metrics = new Set([
  'entry-size',
  'call-time',
  'call-memory',
  'import-time',
  'import-memory',
  'instantiations',
  'fuzz-coverage',
])

/**
 * Returns a `hot-<metric>` copy of each line about a hot item, and a `skip` line for each metric
 * with items when none of them is hot, such as when the project lists no hot items.
 */
export function hot(lines: readonly string[]): string[] {
  const copies: string[] = []
  const measured = new Set<string>()
  for (const line of lines) {
    const match = /^([a-z-]+) "((?:[^"\\]|\\.)*)"(.*)$/.exec(line)
    if (!match) continue

    const [, metric, item, rest] = match
    if (!metrics.has(metric!)) continue

    measured.add(metric!)
    if (library.hot.has(item!.replace(/\\(.)/g, '$1')))
      copies.push(`hot-${metric} "${item}"${rest}`)
  }

  const skips = [...measured]
    .filter(
      (metric) => !copies.some((line) => line.startsWith(`hot-${metric} `)),
    )
    .map((metric) => `hot-${metric} skip note "no hot items among its items"`)
  return [...copies, ...skips]
}
