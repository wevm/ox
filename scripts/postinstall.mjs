import { spawnSync } from 'node:child_process'

if (process.env.VERCEL) {
  process.stdout.write('Skipping postinstall on Vercel.\n')
  process.exit(0)
}

for (const [command, args] of [
  ['git', ['submodule', 'update', '--init', '--recursive']],
  ['pnpm', ['contracts:build']],
  ['pnpm', ['dev']],
]) {
  const result = spawnSync(command, args, { stdio: 'inherit' })

  if (result.error) {
    process.stderr.write(`${result.error.message}\n`)
    process.exit(1)
  }

  if (result.signal) {
    process.stderr.write(`${command} exited with signal ${result.signal}\n`)
    process.exit(1)
  }

  if (result.status) process.exit(result.status)
}
