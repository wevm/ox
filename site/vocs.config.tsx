import { defineConfig } from 'vocs'
import pkg from '../src/package.json'
import { sidebar } from './sidebar-generated'

export default defineConfig({
  baseUrl:
    process.env.VERCEL_ENV === 'production'
      ? 'https://oxlib.sh'
      : process.env.VERCEL_URL,
  title: 'Ox',
  titleTemplate: '%s · Ox',
  description: 'Ethereum Standard Library',
  editLink: {
    pattern: 'https://github.com/wevm/ox/edit/main/site/pages/:path',
    text: 'Suggest changes to this page',
  },
  // head() {
  // 	return (
  // 		<>
  // 			<script
  // 				src="https://cdn.usefathom.com/script.js"
  // 				data-site="BYCJMNBD"
  // 				defer
  // 			/>
  // 		</>
  // 	);
  // },
  // ogImageUrl: {
  //   '/': '/og-image.png',
  // },
  iconUrl: { light: '/logo-light.png', dark: '/logo-dark.png' },
  logoUrl: { light: '/logo-light.png', dark: '/logo-dark.png' },
  markdown: {
    code: {
      themes: {
        light: 'vitesse-light',
        dark: 'vitesse-dark',
      },
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
        // collapsed: true,
        items: [
          { text: 'AES-GCM Encryption 🚧', link: '/guides/encryption' },
          { text: 'Applications of ABIs 🚧', link: '/guides/abis' },
          { text: 'Applications of RLP 🚧', link: '/guides/rlp' },
          { text: 'Bytes & Hex Manipulation 🚧', link: '/guides/bytes-hex' },
          { text: 'ECDSA & Signers 🚧', link: '/guides/ecdsa' },
          {
            text: 'EIP-1193 Providers 🚧',
            link: '/guides/eip-1193',
          },
          {
            text: 'EIP-4844 Blob Transactions 🚧',
            link: '/guides/eip-4844',
          },
          {
            text: 'EIP-7702 Auth Transactions 🚧',
            link: '/guides/eip-7702',
          },
          { text: 'ENS 🚧', link: '/guides/ens' },
          { text: 'JSON-RPC & Execution API 🚧', link: '/guides/json-rpc' },
          {
            text: 'Sign-In With Ethereum (SIWE) 🚧',
            link: '/guides/siwe',
          },
          {
            text: 'Signed Data (EIP-191) 🚧',
            link: '/guides/signed-data',
          },
          {
            text: 'Transaction Envelopes 🚧',
            link: '/guides/transaction-envelopes',
          },
          {
            text: 'Typed Data (EIP-712) 🚧',
            link: '/guides/typed-data',
          },
          { text: 'WebAuthn Signers 🚧', link: '/guides/webauthn' },
          { text: 'Using with Effect 🚧', link: '/guides/effect' },
          { text: 'Using with NeverThrow 🚧', link: '/guides/neverthrow' },
          {
            text: 'Using with Validators 🚧',
            link: '/guides/validators',
          },
        ],
      },
      {
        text: 'API Reference',
        link: '/api',
        items: [],
      },
    ],
    '/api': { backLink: true, items: sidebar },
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
  sponsors: [
    {
      name: 'Collaborator',
      height: 120,
      items: [
        [
          {
            name: 'Paradigm',
            link: 'https://paradigm.xyz',
            image:
              'https://raw.githubusercontent.com/wevm/.github/main/content/sponsors/paradigm-light.svg',
          },
        ],
      ],
    },
    {
      name: 'Large Enterprise',
      height: 60,
      items: [
        [
          {
            name: 'Stripe',
            link: 'https://www.stripe.com',
            image:
              'https://raw.githubusercontent.com/wevm/.github/main/content/sponsors/stripe-light.svg',
          },
          {
            name: 'ZKsync',
            link: 'https://zksync.io',
            image:
              'https://raw.githubusercontent.com/wevm/.github/main/content/sponsors/zksync-light.svg',
          },
        ],
        [
          {
            name: 'Brave',
            link: 'https://brave.com',
            image:
              'https://raw.githubusercontent.com/wevm/.github/main/content/sponsors/brave-light.svg',
          },
          {
            name: 'Linea',
            link: 'https://linea.build',
            image:
              'https://raw.githubusercontent.com/wevm/.github/main/content/sponsors/linea-light.svg',
          },
        ],
      ],
    },
    {
      name: 'Small Enterprise',
      height: 40,
      items: [
        [
          {
            name: 'Family',
            link: 'https://twitter.com/family',
            image:
              'https://raw.githubusercontent.com/wevm/.github/main/content/sponsors/family-light.svg',
          },
          {
            name: 'Context',
            link: 'https://twitter.com/context',
            image:
              'https://raw.githubusercontent.com/wevm/.github/main/content/sponsors/context-light.svg',
          },
          {
            name: 'WalletConnect',
            link: 'https://walletconnect.com',
            image:
              'https://raw.githubusercontent.com/wevm/.github/main/content/sponsors/walletconnect-light.svg',
          },
          {
            name: 'PartyDAO',
            link: 'https://twitter.com/prtyDAO',
            image:
              'https://raw.githubusercontent.com/wevm/.github/main/content/sponsors/partydao-light.svg',
          },
        ],
        [
          {
            name: 'SushiSwap',
            link: 'https://www.sushi.com',
            image:
              'https://raw.githubusercontent.com/wevm/.github/main/content/sponsors/sushi-light.svg',
          },
          {
            name: 'Dynamic',
            link: 'https://www.dynamic.xyz',
            image:
              'https://raw.githubusercontent.com/wevm/.github/main/content/sponsors/dynamic-light.svg',
          },
          {
            name: 'Privy',
            link: 'https://privy.io',
            image:
              'https://raw.githubusercontent.com/wevm/.github/main/content/sponsors/privy-light.svg',
          },
          {
            name: 'PancakeSwap',
            link: 'https://pancakeswap.finance/',
            image:
              'https://raw.githubusercontent.com/wevm/.github/main/content/sponsors/pancake-light.svg',
          },
        ],
        [
          {
            name: 'Celo',
            link: 'https://celo.org',
            image:
              'https://raw.githubusercontent.com/wevm/.github/main/content/sponsors/celo-light.svg',
          },
          {
            name: 'Rainbow',
            link: 'https://rainbow.me',
            image:
              'https://raw.githubusercontent.com/wevm/.github/main/content/sponsors/rainbow-light.svg',
          },
          {
            name: 'Pimlico',
            link: 'https://pimlico.io',
            image:
              'https://raw.githubusercontent.com/wevm/.github/main/content/sponsors/pimlico-light.svg',
          },
          {
            name: 'Zora',
            link: 'https://zora.co',
            image:
              'https://raw.githubusercontent.com/wevm/.github/main/content/sponsors/zora-light.svg',
          },
        ],
        [
          {
            name: 'Lattice',
            link: 'https://lattice.xyz',
            image:
              'https://raw.githubusercontent.com/wevm/.github/main/content/sponsors/lattice-light.svg',
          },
          {
            name: 'Supa',
            link: 'https://twitter.com/supafinance',
            image:
              'https://raw.githubusercontent.com/wevm/.github/main/content/sponsors/supa-light.svg',
          },
          {
            name: 'Syndicate',
            link: 'https://syndicate.io',
            image:
              'https://raw.githubusercontent.com/wevm/.github/main/content/sponsors/syndicate-light.svg',
          },
          {
            name: 'Reservoir',
            link: 'https://reservoir.tools',
            image:
              'https://raw.githubusercontent.com/wevm/.github/main/content/sponsors/reservoir-light.svg',
          },
        ],
        [
          {
            name: 'Uniswap',
            link: 'https://uniswap.org',
            image:
              'https://raw.githubusercontent.com/wevm/.github/main/content/sponsors/uniswap-light.svg',
          },
          {
            name: '',
            image: '',
            link: 'https://github.com/sponsors/wevm',
          },
          {
            name: '',
            image: '',
            link: 'https://github.com/sponsors/wevm',
          },
          {
            name: '',
            image: '',
            link: 'https://github.com/sponsors/wevm',
          },
        ],
      ],
    },
  ],
  theme: {
    accentColor: {
      light: '#4b7b2b',
      dark: '#d2991d',
    },
  },
  topNav: [
    {
      text: 'API Reference',
      link: '/api',
    },
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
})
