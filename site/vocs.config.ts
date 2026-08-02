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
  banner: {
    content: 'Looking for Ox v0? View the v0 documentation.',
    dismissId: 'v0-docs',
    href: 'https://v0.oxlib.sh',
  },
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
  redirects: [
    {
      source: '/guides/bytes-hex',
      destination: '/guides/data/bytes-hex',
      status: 301,
    },
    {
      source: '/guides/ecdsa',
      destination: '/guides/crypto/secp256k1',
      status: 301,
    },
    {
      source: '/guides/eip-1193',
      destination: '/guides/rpc/providers',
      status: 301,
    },
    {
      source: '/guides/encryption',
      destination: '/guides/crypto/encryption',
      status: 301,
    },
    {
      source: '/guides/engine',
      destination: '/guides/runtime/engines',
      status: 301,
    },
    {
      source: '/guides/json-rpc',
      destination: '/guides/rpc/requests',
      status: 301,
    },
    { source: '/guides/kzg', destination: '/guides/runtime/kzg', status: 301 },
    {
      source: '/guides/mnemonics',
      destination: '/guides/accounts/mnemonics-hd',
      status: 301,
    },
    { source: '/guides/rlp', destination: '/guides/data/rlp', status: 301 },
    {
      source: '/guides/signed-data',
      destination: '/guides/messages/personal-messages',
      status: 301,
    },
    {
      source: '/guides/siwe',
      destination: '/guides/messages/siwe',
      status: 301,
    },
    {
      source: '/guides/transaction-envelopes',
      destination: '/guides/transactions/build-sign-send',
      status: 301,
    },
    { source: '/guides/zod', destination: '/guides/schemas/zod', status: 301 },
  ],
  sidebar: {
    '/': [
      { text: 'Introduction', link: '/' },
      { text: 'Installation', link: '/installation' },
      { text: 'Imports & Bundle Size', link: '/imports' },
      { text: 'Error Handling', link: '/error-handling' },
      { text: 'Platform Compatibility', link: '/platform-compatibility' },
      { text: 'Migrating from v0', link: '/migrating-from-v0' },
      { text: 'Benchmarks', link: '/benchmarks' },
      {
        text: 'Guides',
        items: [
          { text: 'Overview', link: '/guides' },
          {
            text: 'ABIs & Contracts',
            collapsed: true,
            items: [
              { text: 'Overview', link: '/guides/abi' },
              {
                text: 'Deploy Contracts & Compute Addresses',
                link: '/guides/abi/deployment',
              },
              { text: 'Work with ABIs', link: '/guides/abi/abis' },
              { text: 'Work with Events & Logs', link: '/guides/abi/events' },
              {
                text: 'Work with Function Calls',
                link: '/guides/abi/function-calls',
              },
              {
                text: 'Work with Reverts & Custom Errors',
                link: '/guides/abi/errors',
              },
            ],
          },
          {
            text: 'Account Abstraction',
            collapsed: true,
            items: [
              { text: 'Overview', link: '/guides/account-abstraction' },
              {
                text: 'Attribute Calldata with ERC-8021',
                link: '/guides/account-abstraction/erc-8021',
              },
              {
                text: 'Batch Calls with ERC-7821',
                link: '/guides/account-abstraction/erc-7821',
              },
              {
                text: 'Build ERC-4337 User Operations',
                link: '/guides/account-abstraction/user-operations',
              },
            ],
          },
          {
            text: 'Accounts & Keys',
            collapsed: true,
            items: [
              { text: 'Overview', link: '/guides/accounts' },
              {
                text: 'Derive & Validate Addresses',
                link: '/guides/accounts/addresses',
              },
              {
                text: 'Mnemonics & HD Wallets',
                link: '/guides/accounts/mnemonics-hd',
              },
              {
                text: 'Work with Keystores',
                link: '/guides/accounts/keystores',
              },
            ],
          },
          {
            text: 'Chain Data & State',
            collapsed: true,
            items: [
              { text: 'Overview', link: '/guides/chain-data' },
              {
                text: 'Query Logs, Filters & Bloom',
                link: '/guides/chain-data/logs-filters',
              },
              { text: 'Resolve ENS Names', link: '/guides/chain-data/ens' },
              {
                text: 'Simulate with State Overrides',
                link: '/guides/chain-data/overrides',
              },
              {
                text: 'Verify State & Account Proofs',
                link: '/guides/chain-data/proofs',
              },
              {
                text: 'Work with Blocks & Receipts',
                link: '/guides/chain-data/blocks',
              },
            ],
          },
          {
            text: 'Cryptography',
            collapsed: true,
            items: [
              { text: 'Overview', link: '/guides/crypto' },
              {
                text: 'BLS Signatures & Aggregation',
                link: '/guides/crypto/bls',
              },
              {
                text: 'Convert Signature Formats',
                link: '/guides/crypto/signatures',
              },
              {
                text: 'Ed25519 & X25519',
                link: '/guides/crypto/ed25519-x25519',
              },
              { text: 'Hash Data', link: '/guides/crypto/hashing' },
              {
                text: 'Post-Quantum Signatures (ML-DSA)',
                link: '/guides/crypto/ml-dsa',
              },
              {
                text: 'Work with AES-GCM',
                link: '/guides/crypto/encryption',
              },
              { text: 'Work with P256', link: '/guides/crypto/p256' },
              {
                text: 'Work with Secp256k1',
                link: '/guides/crypto/secp256k1',
              },
              {
                text: 'Work with WebCryptoP256',
                link: '/guides/crypto/webcrypto-p256',
              },
            ],
          },
          {
            text: 'Data & Encoding',
            collapsed: true,
            items: [
              { text: 'Overview', link: '/guides/data' },
              { text: 'Base32 Coding', link: '/guides/data/base32' },
              { text: 'Base58 Coding', link: '/guides/data/base58' },
              { text: 'Base64 Coding', link: '/guides/data/base64' },
              { text: 'Bech32m Coding', link: '/guides/data/bech32m' },
              { text: 'CBOR Coding', link: '/guides/data/cbor' },
              { text: 'CompactSize Coding', link: '/guides/data/compact-size' },
              {
                text: 'Format Ether & Gwei Values',
                link: '/guides/data/value',
              },
              { text: 'Serialize JSON Safely', link: '/guides/data/json' },
              { text: 'Work with Bytes & Hex', link: '/guides/data/bytes-hex' },
              { text: 'Work with RLP', link: '/guides/data/rlp' },
            ],
          },
          {
            text: 'JSON-RPC & Providers',
            collapsed: true,
            items: [
              { text: 'Overview', link: '/guides/rpc' },
              { text: 'Send JSON-RPC Requests', link: '/guides/rpc/requests' },
              {
                text: 'Serve & Handle RPC Requests',
                link: '/guides/rpc/handling',
              },
              { text: 'Type-Safe RPC Schemas', link: '/guides/rpc/schemas' },
              {
                text: 'Use EIP-1193 Providers',
                link: '/guides/rpc/providers',
              },
            ],
          },
          {
            text: 'Messages & Authentication',
            collapsed: true,
            items: [
              { text: 'Overview', link: '/guides/messages' },
              {
                text: 'Sign Personal Messages (EIP-191)',
                link: '/guides/messages/personal-messages',
              },
              {
                text: 'Sign Typed Data (EIP-712)',
                link: '/guides/messages/typed-data',
              },
              {
                text: 'Sign-In with Ethereum (SIWE)',
                link: '/guides/messages/siwe',
              },
              {
                text: 'Smart Account Signatures (6492/8010)',
                link: '/guides/messages/smart-account-signatures',
              },
            ],
          },
          {
            text: 'Runtime & Performance',
            collapsed: true,
            items: [
              { text: 'Overview', link: '/guides/runtime' },
              {
                text: 'Caching & Bundle Size',
                link: '/guides/runtime/caches-bundle',
              },
              { text: 'WASM & Engines', link: '/guides/runtime/engines' },
              { text: 'WASM KZG', link: '/guides/runtime/kzg' },
            ],
          },
          {
            text: 'Schemas & Validation',
            collapsed: true,
            items: [
              { text: 'Overview', link: '/guides/schemas' },
              { text: 'Validate with Zod', link: '/guides/schemas/zod' },
            ],
          },
          {
            text: 'Transactions',
            collapsed: true,
            items: [
              { text: 'Overview', link: '/guides/transactions' },
              {
                text: 'Build, Sign & Send',
                link: '/guides/transactions/build-sign-send',
              },
              {
                text: 'Choose an Envelope Type',
                link: '/guides/transactions/envelope-types',
              },
              {
                text: 'Delegate with EIP-7702',
                link: '/guides/transactions/eip-7702',
              },
              {
                text: 'Estimate Fees & Access Lists',
                link: '/guides/transactions/fees-access-lists',
              },
              {
                text: 'Parse & Inspect Transactions',
                link: '/guides/transactions/parse-inspect',
              },
              {
                text: 'Send Blob Transactions (EIP-4844)',
                link: '/guides/transactions/blobs',
              },
            ],
          },
          {
            text: 'WebAuthn & Passkeys',
            collapsed: true,
            items: [
              { text: 'Overview', link: '/guides/webauthn' },
              {
                text: 'Derive Secrets with PRF',
                link: '/guides/webauthn/prf',
              },
              {
                text: 'Register & Authenticate Credentials',
                link: '/guides/webauthn/credentials',
              },
              {
                text: 'Sign & Verify with Passkeys',
                link: '/guides/webauthn/signing',
              },
            ],
          },
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
