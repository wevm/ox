import { defineConfig } from 'vocs/config'
import pkg from '../package.json' with { type: 'json' }
import { sidebar, topNav } from './src/config-generated'

export default defineConfig({
  accentColor: 'light-dark(#4b7b2b, #bd976a)',
  baseUrl:
    process.env.VERCEL_ENV === 'production'
      ? 'https://oxlib.sh'
      : process.env.VERCEL_URL,
  title: 'Ox',
  titleTemplate: '%s · Ox',
  description: 'Ethereum Standard Library',
  ogImageUrl: (path, { baseUrl }) => {
    if (path === '/') return `${baseUrl ?? ''}/og-image.png`
    return `https://og.oxlib.sh?title=%title&description=%description`
  },
  iconUrl: { light: '/logo-light.png', dark: '/logo-dark.png' },
  logoUrl: { light: '/logo-light.png', dark: '/logo-dark.png' },
  codeHighlight: {
    themes: {
      light: 'vitesse-light',
      dark: 'vitesse-dark',
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
          link: 'https://github.com/wevm/ox/blob/main/src/CHANGELOG.md',
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
