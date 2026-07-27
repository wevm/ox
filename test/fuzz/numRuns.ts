/**
 * Shared `fast-check` budget.
 *
 * Read through `import.meta.env` rather than `process.env` so the same fuzz
 * files run under Node and in a browser, where `process` does not exist. Vite
 * populates it from the environment via the `FC_` entry in `envPrefix`.
 *
 * @internal
 */

declare global {
  interface ImportMetaEnv {
    readonly FC_NUM_RUNS?: string | undefined
    readonly FC_TIME_LIMIT_MS?: string | undefined
  }
}

/** Cases per property. */
export const numRuns = Number(import.meta.env.FC_NUM_RUNS) || 100

/**
 * Per-property wall-clock cap, for soak runs.
 *
 * A soak wants to explore for as long as it is given, but how many cases fit
 * in that time depends on the property and the machine -- picking a run count
 * instead means guessing, and guessing wrong is what timed the pull-request
 * job out. With this set, `numRuns` becomes a ceiling rather than a target and
 * each property simply stops when its time is up.
 *
 * @internal
 */
const timeLimit = Number(import.meta.env.FC_TIME_LIMIT_MS) || 0

/**
 * Options every property passes to `test.prop`.
 *
 * @internal
 */
export const fuzz = timeLimit
  ? {
      numRuns,
      interruptAfterTimeLimit: timeLimit,
      markInterruptAsFailure: false,
    }
  : { numRuns }
