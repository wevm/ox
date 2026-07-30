import { glob, readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'

const out = resolve(import.meta.dirname, '../generated.ts')
const paths: string[] = []

for await (const file of glob(
  resolve(import.meta.dirname, '../out/**/*.json'),
))
  if (!file.includes('build-info')) paths.push(file)

const artifacts: string[] = []
const fileNames = new Set<string>()

for (const file of paths) {
  const fileName = file.split('/').pop()?.replace('.json', '')!
  if (fileNames.has(fileName)) continue

  const { abi, bytecode } = JSON.parse(await readFile(file, 'utf-8'))
  fileNames.add(fileName)

  artifacts.push(
    `export const ${fileName} = ${JSON.stringify(
      { abi, bytecode },
      null,
      2,
    )} as const;\n\n`,
  )
}

await writeFile(out, artifacts.join(''))
