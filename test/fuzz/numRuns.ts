/**
 * Cases per property, from `FC_NUM_RUNS`.
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
  }
}

export const numRuns = Number(import.meta.env.FC_NUM_RUNS) || 100
