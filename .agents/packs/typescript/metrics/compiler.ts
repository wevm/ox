/**
 * Resolves TypeScript projects and measures the files the project's compiler actually checks.
 * @module
 */
import * as fs from 'node:fs'
import * as path from 'node:path'
import * as ts from 'typescript'

/** A compiler configuration, with its inputs and inherited options resolved relative to its file. */
export type Project = {
  /** Path relative to the measured checkout. */
  config: string
  /** Root inputs, references, diagnostics, and resolved options. */
  parsed: ts.ParsedCommandLine
}

/** Returns the root project and each distinct project reachable through its references. */
export function projects(): Project[] {
  const found = new Map<string, Project>()
  function visit(file: string) {
    const config = path.relative(process.cwd(), file)
    if (found.has(config)) return

    const parsed = ts.getParsedCommandLineOfConfigFile(
      path.resolve(file),
      {},
      {
        ...ts.sys,
        onUnRecoverableConfigFileDiagnostic(error) {
          throw new Error(
            `${config}: ${ts.flattenDiagnosticMessageText(error.messageText, '\n')}`,
          )
        },
      },
    )
    if (!parsed) throw new Error(`Cannot read ${config}`)
    found.set(config, { config, parsed })

    for (const reference of parsed.projectReferences ?? [])
      visit(ts.resolveProjectReferencePath(reference))
  }

  if (fs.existsSync('tsconfig.json')) visit('tsconfig.json')
  return [...found.values()]
}

/** Runs the project's compiler without writing build information or output to the checkout. */
export function measure(
  files: readonly string[],
  projects: readonly Project[],
  temporary: string,
) {
  const bin = ['node_modules/.bin/tsgo', 'node_modules/.bin/tsc'].find((file) =>
    fs.existsSync(file),
  )
  const checked = new Set<string>()
  const errors = new Map<string, string[]>()
  const options = new Map<string, Record<string, unknown>>()
  const tracked = new Set(files)

  for (const project of projects) {
    const { config, parsed } = project
    if (!parsed.fileNames.length && parsed.projectReferences?.length) continue
    if (!bin) {
      if (parsed.errors.length)
        throw new Error(
          `${config}: ${ts.flattenDiagnosticMessageText(parsed.errors[0]!.messageText, '\n')}`,
        )
      options.set(config, parsed.options)
      continue
    }

    const show = Bun.spawnSync([
      bin,
      '-p',
      config,
      '--showConfig',
      '--pretty',
      'false',
    ])
    if (!show.success)
      throw new Error(
        `${bin} --showConfig: ${show.stdout.toString()}${show.stderr.toString()}`,
      )
    const effective = JSON.parse(show.stdout.toString()).compilerOptions ?? {}
    options.set(config, effective)

    const flags: string[] = []
    if (effective.composite || effective.incremental)
      flags.push(
        '--tsBuildInfoFile',
        path.join(temporary, `${options.size}.tsbuildinfo`),
      )
    if (effective.noCheck) flags.push('--noCheck', 'false')
    if (effective.emitDeclarationOnly)
      flags.push('--emitDeclarationOnly', 'false')

    const result = Bun.spawnSync([
      bin,
      '-p',
      config,
      '--noEmit',
      '--pretty',
      'false',
      '--locale',
      'en',
      '--listFiles',
      ...flags,
    ])
    const output = `${result.stdout.toString()}\n${result.stderr.toString()}`
    let diagnosed = false
    for (const line of output.split(/\r?\n/)) {
      const diagnostic = /^(?:(.+)\((\d+),\d+\): )?error (TS\d+: .+)$/.exec(
        line,
      )
      if (diagnostic) {
        diagnosed = true
        const location =
          diagnostic[1] &&
          path.relative(process.cwd(), path.resolve(diagnostic[1]))
        const file = location && tracked.has(location) ? location : config
        const message = (
          location
            ? `${location === file ? '' : `${location}: `}line ${diagnostic[2]}: ${diagnostic[3]}`
            : diagnostic[3]!
        ).replaceAll(`${process.cwd()}${path.sep}`, '')
        const previous = errors.get(file) ?? []
        previous.push(message)
        errors.set(file, previous)
      } else if (line && !/^\s/.test(line)) {
        const file = path.relative(process.cwd(), path.resolve(line))
        if (
          tracked.has(file) &&
          !(effective.skipLibCheck && /\.d\.[cm]?ts$/.test(file))
        )
          checked.add(file)
      }
    }
    if (!result.success && !diagnosed)
      throw new Error(
        `${bin} -p ${config}: ${output.trim() || `exit ${result.exitCode}`}`,
      )
  }
  return { bin, checked, errors, options }
}
