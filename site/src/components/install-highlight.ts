import { codeToHtml } from 'shiki'
import { shikiDark, shikiLight } from '../shiki-themes'

const commands = {
  npm: 'npm i ox',
  pnpm: 'pnpm add ox',
  bun: 'bun add ox',
} as const

export type InstallPkg = keyof typeof commands

async function render(cmd: string) {
  return codeToHtml(cmd, {
    lang: 'sh',
    themes: { light: shikiLight, dark: shikiDark },
    defaultColor: false,
  })
}

export const installHtml: Record<InstallPkg, string> = Object.fromEntries(
  await Promise.all(
    (Object.keys(commands) as InstallPkg[]).map(async (k) => [k, await render(commands[k])]),
  ),
) as Record<InstallPkg, string>

export const installCommands = commands
