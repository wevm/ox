import { fileURLToPath } from 'node:url'
import {
  defineConfig,
  Embedding,
  Reranker,
  Retriever,
  VectorStore,
} from 'vocs/config'
import pkg from '../package.json' with { type: 'json' }
import { sidebar, topNav } from './src/config-generated'
import { shikiDark, shikiLight } from './src/shiki-themes'

// Load `site/.env` (e.g. `CLOUDFLARE_*` for AI search). No-op if absent.
try {
  process.loadEnvFile(fileURLToPath(new URL('./.env', import.meta.url)))
} catch {}

// Only enable AI search when Cloudflare credentials are present.
const hasCloudflareCredentials = Boolean(
  process.env.CLOUDFLARE_ACCOUNT_ID && process.env.CLOUDFLARE_API_TOKEN,
)

export default defineConfig({
  ...(hasCloudflareCredentials
    ? {
        ai: {
          retriever: Retriever.local({
            embedding: Embedding.cloudflare(),
            reranker: Reranker.cloudflare(),
            // Remote store keeps vectors out of the server bundle entirely.
            vectorStore: VectorStore.cloudflare({ index: 'ox-docs' }),
          }),
        },
      }
    : {}),
  accentColor: 'light-dark(#b8421d, #e85d35)',
  baseUrl: pkg.version.includes('-beta.')
    ? 'https://v1.oxlib.sh'
    : process.env.VERCEL_ENV === 'production'
      ? 'https://oxlib.sh'
      : process.env.VERCEL_URL,
  title: 'Ox',
  titleTemplate: '%s · Ox',
  description: 'Ethereum Standard Library',
  ogImageUrl: (path, { baseUrl }) => {
    if (path === '/') return `${baseUrl ?? ''}/og-image.png`
    return `${baseUrl ?? ''}/api/og?title=%title&description=%description`
  },
  iconUrl: { light: '/logo-light.png', dark: '/logo-dark.png' },
  logoUrl: { light: '/logo-light.png', dark: '/logo-dark.png' },
  codeHighlight: {
    themes: {
      light: shikiLight,
      dark: shikiDark,
    },
  },
  rootDir: '.',
  sidebar: {
    '/': [
      { text: 'Introduction', link: '/' },
      { text: 'Installation', link: '/installation' },
      { text: 'Imports & Bundle Size', link: '/imports' },
      { text: 'Error Handling', link: '/error-handling' },
      { text: 'Platform Compatibility', link: '/platform-compatibility' },
      {
        text: 'Guides',
        items: [
          { text: 'AES-GCM Encryption', link: '/guides/encryption' },
          {
            text: 'Application Binary Interface (ABI)',
            link: '/guides/abi',
          },
          { text: 'Bytes & Hex', link: '/guides/bytes-hex' },
          { text: 'ECDSA & Signers', link: '/guides/ecdsa' },
          {
            text: 'EIP-1193 Providers',
            link: '/guides/eip-1193',
          },
          { text: 'JSON-RPC', link: '/guides/json-rpc' },
          {
            text: 'Mnemonics',
            link: '/guides/mnemonics',
          },
          { text: 'Recursive Length Prefix (RLP)', link: '/guides/rlp' },
          {
            text: 'Signed & Typed Data',
            link: '/guides/signed-data',
          },
          {
            text: 'Transaction Envelopes',
            link: '/guides/transaction-envelopes',
          },
          { text: 'WebAuthn Signers', link: '/guides/webauthn' },
          { text: 'Zod Schemas', link: '/guides/zod' },
        ],
      },
      {
        text: 'API Reference',
        items: [
          {
            text: 'Core',
            link: '/api',
          },
          {
            text: 'WebAuthn',
            link: '/webauthn',
          },
          {
            text: 'ERCs',
            link: '/ercs',
          },
          {
            text: 'Tempo',
            link: '/tempo',
          },
          {
            text: 'Zod',
            link: '/zod',
          },
        ],
      },
    ],
    ...sidebar,
  },
  socials: [
    {
      icon: 'github',
      link: 'https://github.com/wevm/ox',
    },
    {
      icon: 'discord',
      link: 'https://discord.gg/xCUz9FRcXD',
    },
    {
      icon: 'x',
      link: 'https://x.com/wevm_dev',
    },
  ],
  topNav: [
    ...topNav,
    {
      text: pkg.version,
      items: [
        {
          text: 'Changelog',
          link: 'https://github.com/wevm/ox/blob/main/CHANGELOG.md',
        },
        {
          text: 'Contributing',
          link: 'https://github.com/wevm/ox/blob/main/.github/CONTRIBUTING.md',
        },
      ],
    },
  ],
  twoslash: {
    compilerOptions: {
      moduleResolution: 100,
    },
  },
})
