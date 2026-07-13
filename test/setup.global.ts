import * as instances from './prool.js'

export default async function () {
  // Allow offline unit-only runs (e.g. zod codec tests) without anvil.
  if (process.env.SKIP_GLOBAL_SETUP) return () => {}

  // Set up Anvil instances
  const shutdown = await Promise.all(
    Object.values(instances).map((instance) => instance.start()),
  )

  // Teardown
  return () => Promise.all(shutdown.map((fn) => fn()))
}
