import { defineConfig } from 'vocs'
import pkg from '../src/package.json'

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
  rootDir: '.',
  sidebar: [
    { text: 'Introduction', link: '/' },
    { text: 'Installation', link: '/installation' },
    { text: 'Modules & Imports', link: '/modules-imports' },
    { text: 'Platform Compatibility', link: '/platform-compatibility' },
    {
      text: 'API Reference',
      items: [
        {
          text: 'Abi 🚧',
          collapsed: true,
          link: '/api/abi',
          items: [
            { text: '.encode', link: '/api/abi/encode' },
            {
              text: '.encodePacked',
              link: '/api/abi/encodePacked',
            },
            {
              text: '.encodeDeployData',
              link: '/api/abi/encodeDeployData',
            },
            {
              text: '.encodeErrorResult',
              link: '/api/abi/encodeErrorResult',
            },
            {
              text: '.encodeFunctionData',
              link: '/api/abi/encodeFunctionData',
            },
            {
              text: '.encodeFunctionResult',
              link: '/api/abi/encodeFunctionResult',
            },
            { text: '.encodeLogTopics', link: '/api/abi/encodeLogTopics' },
            { text: '.decode', link: '/api/abi/decode' },
            {
              text: '.decodeDeployData',
              link: '/api/abi/decodeDeployData',
            },
            {
              text: '.decodeErrorResult',
              link: '/api/abi/decodeErrorResult',
            },
            {
              text: '.decodeFunctionData',
              link: '/api/abi/decodeFunctionData',
            },
            {
              text: '.decodeFunctionResult',
              link: '/api/abi/decodeFunctionResult',
            },
            {
              text: '.decodeLog',
              link: '/api/abi/decodeLog',
            },
            { text: '.formatAbi', link: '/api/abi/formatAbi' },
            { text: '.formatAbiItem', link: '/api/abi/formatAbiItem' },
            {
              text: '.formatAbiParameter',
              link: '/api/abi/formatAbiParameter',
            },
            {
              text: '.formatAbiParameters',
              link: '/api/abi/formatAbiParameters',
            },
            { text: '.parseAbi', link: '/api/abi/parseAbi' },
            { text: '.parseAbiItem', link: '/api/abi/parseAbiItem' },
            {
              text: '.parseAbiParameter',
              link: '/api/abi/parseAbiParameter',
            },
            {
              text: '.parseAbiParameters',
              link: '/api/abi/parseAbiParameters',
            },
          ],
        },
        {
          text: 'Address 🚧',
          collapsed: true,
          link: '/api/address',
          items: [
            { text: '.from', link: '/api/address/from' },
            { text: '.checksum', link: '/api/address/checksum' },
            {
              text: '.getContractAddress',
              link: '/api/address/getContractAddress',
            },
            {
              text: '.getCreateAddress',
              link: '/api/address/getCreateAddress',
            },
            {
              text: '.getCreate2Address',
              link: '/api/address/getCreate2Address',
            },
            { text: '.isAddress', link: '/api/address/isAddress' },
            { text: '.isEqual', link: '/api/address/isEqual' },
          ],
        },
        {
          text: 'Base58 🚧',
          collapsed: true,
          link: '/api/base58',
          items: [
            { text: '.encode', link: '/api/base58/encode' },
            { text: '.decode', link: '/api/base58/decode' },
          ],
        },
        {
          text: 'Base64 🚧',
          collapsed: true,
          link: '/api/base64',
          items: [
            { text: '.encode', link: '/api/base64/encode' },
            { text: '.decode', link: '/api/base64/decode' },
          ],
        },
        {
          text: 'Blobs 🚧',
          collapsed: true,
          link: '/api/blobs',
          items: [
            { text: '.from', link: '/api/blobs/from' },
            {
              text: '.commitmentToVersionedHash',
              link: '/api/blobs/commitmentToVersionedHash',
            },
            {
              text: '.commitmentsToVersionedHashes',
              link: '/api/blobs/commitmentsToVersionedHashes',
            },
            {
              text: '.sidecarsToVersionedHashes',
              link: '/api/blobs/sidecarsToVersionedHashes',
            },
            { text: '.to', link: '/api/blobs/to' },
            { text: '.toBytes', link: '/api/blobs/toBytes' },
            { text: '.toCommitments', link: '/api/blobs/toCommitments' },
            { text: '.toHex', link: '/api/blobs/toHex' },
            { text: '.toProofs', link: '/api/blobs/toProofs' },
            { text: '.toSidecars', link: '/api/blobs/toSidecars' },
          ],
        },
        {
          text: 'Block 🚧',
          collapsed: true,
          link: '/api/block',
          items: [
            { text: '.from', link: '/api/block/from' },
            { text: '.fromRpc', link: '/api/block/fromRpc' },
            { text: '.toRpc', link: '/api/block/toRpc' },
          ],
        },
        {
          text: 'Bytes',
          collapsed: true,
          link: '/api/bytes',
          items: [
            { text: '.from', link: '/api/bytes/from' },
            { text: '.fromBigInt', link: '/api/bytes/fromBigInt' },
            { text: '.fromBoolean', link: '/api/bytes/fromBoolean' },
            { text: '.fromHex', link: '/api/bytes/fromHex' },
            { text: '.fromNumber', link: '/api/bytes/fromNumber' },
            { text: '.fromString', link: '/api/bytes/fromString' },
            { text: '.assert', link: '/api/bytes/assert' },
            { text: '.concat', link: '/api/bytes/concat' },
            { text: '.isBytes', link: '/api/bytes/isBytes' },
            { text: '.isEqual', link: '/api/bytes/isEqual' },
            { text: '.padLeft', link: '/api/bytes/padLeft' },
            { text: '.padRight', link: '/api/bytes/padRight' },
            { text: '.random', link: '/api/bytes/random' },
            { text: '.size', link: '/api/bytes/size' },
            { text: '.slice', link: '/api/bytes/slice' },
            { text: '.to', link: '/api/bytes/to' },
            { text: '.toBigInt', link: '/api/bytes/toBigInt' },
            { text: '.toBoolean', link: '/api/bytes/toBoolean' },
            { text: '.toHex', link: '/api/bytes/toHex' },
            { text: '.toNumber', link: '/api/bytes/toNumber' },
            { text: '.toString', link: '/api/bytes/toString' },
            { text: '.trimLeft', link: '/api/bytes/trimLeft' },
            { text: '.trimRight', link: '/api/bytes/trimRight' },
          ],
        },
        {
          text: 'Constants 🚧',
          collapsed: true,
          link: '/api/constants',
          items: [],
        },
        {
          text: 'Ens 🚧',
          collapsed: true,
          link: '/api/ens',
          items: [
            {
              text: '.deserializeLabelhash',
              link: '/api/ens/deserializeLabelhash',
            },
            { text: '.labelhash', link: '/api/ens/labelhash' },
            { text: '.namehash', link: '/api/ens/namehash' },
            { text: '.normalize', link: '/api/ens/normalize' },
            { text: '.packetToBytes', link: '/api/ens/packetToBytes' },
            {
              text: '.serializeLabelhash',
              link: '/api/ens/serializeLabelhash',
            },
          ],
        },
        {
          text: 'Hash 🚧',
          collapsed: true,
          link: '/api/hash',
          items: [
            { text: '.isHash', link: '/api/hash/isHash' },
            { text: '.keccak256', link: '/api/hash/keccak256' },
            {
              text: '.normalizeSignature',
              link: '/api/hash/normalizeSignature',
            },
            {
              text: '.ripemd160',
              link: '/api/hash/ripemd160',
            },
            {
              text: '.sha256',
              link: '/api/hash/sha256',
            },
            {
              text: '.toEventHash',
              link: '/api/hash/toEventHash',
            },
            {
              text: '.toEventSelector',
              link: '/api/hash/toEventSelector',
            },
            {
              text: '.toEventSignature',
              link: '/api/hash/toEventSignature',
            },
            {
              text: '.toFunctionHash',
              link: '/api/hash/toFunctionHash',
            },
            {
              text: '.toFunctionSelector',
              link: '/api/hash/toFunctionSelector',
            },
            {
              text: '.toFunctionSignature',
              link: '/api/hash/toFunctionSignature',
            },
            {
              text: '.toSignature',
              link: '/api/hash/toSignature',
            },
            {
              text: '.toSignatureHash',
              link: '/api/hash/toSignatureHash',
            },
          ],
        },
        {
          text: 'Hex',
          collapsed: true,
          link: '/api/hex',
          items: [
            { text: '.from', link: '/api/hex/from' },
            { text: '.fromBigInt', link: '/api/hex/fromBigInt' },
            { text: '.fromBoolean', link: '/api/hex/fromBoolean' },
            { text: '.fromBytes', link: '/api/hex/fromBytes' },
            { text: '.fromNumber', link: '/api/hex/fromNumber' },
            { text: '.fromString', link: '/api/hex/fromString' },
            { text: '.assert', link: '/api/hex/assert' },
            { text: '.concat', link: '/api/hex/concat' },
            { text: '.isHex', link: '/api/hex/isHex' },
            { text: '.isEqual', link: '/api/hex/isEqual' },
            { text: '.padLeft', link: '/api/hex/padLeft' },
            { text: '.padRight', link: '/api/hex/padRight' },
            { text: '.random', link: '/api/hex/random' },
            { text: '.size', link: '/api/hex/size' },
            { text: '.slice', link: '/api/hex/slice' },
            { text: '.to', link: '/api/hex/to' },
            { text: '.toBigInt', link: '/api/hex/toBigInt' },
            { text: '.toBoolean', link: '/api/hex/toBoolean' },
            { text: '.toBytes', link: '/api/toBytes' },
            { text: '.toNumber', link: '/api/hex/toNumber' },
            { text: '.toString', link: '/api/hex/toString' },
            { text: '.trimLeft', link: '/api/hex/trimLeft' },
            { text: '.trimRight', link: '/api/hex/trimRight' },
          ],
        },
        {
          text: 'Json 🚧',
          collapsed: true,
          link: '/api/json',
          items: [
            { text: '.deserialize', link: '/api/json/deserialize' },
            { text: '.serialize', link: '/api/json/serialize' },
            { text: '.stringify', link: '/api/json/stringify' },
          ],
        },
        {
          text: 'JsonRpc 🚧',
          collapsed: true,
          link: '/api/jsonRpc',
          items: [
            {
              text: '.createRequestBuilder',
              link: '/api/jsonRpc/createRequestBuilder',
            },
            {
              text: '.parseResponse',
              link: '/api/jsonRpc/parseResponse',
            },
          ],
        },
        {
          text: 'Kzg 🚧',
          collapsed: true,
          link: '/api/kzg',
          items: [
            { text: '.from', link: '/api/kzg/from' },
            { text: '.setup', link: '/api/kzg/setup' },
          ],
        },
        {
          text: 'Log 🚧',
          collapsed: true,
          link: '/api/log',
          items: [
            { text: '.from', link: '/api/log/from' },
            { text: '.decode', link: '/api/log/decode' },
            { text: '.fromRpc', link: '/api/log/fromRpc' },
            { text: '.parseLogs', link: '/api/log/parseLogs' },
            { text: '.toRpc', link: '/api/log/toRpc' },
          ],
        },
        {
          text: 'Rlp 🚧',
          collapsed: true,
          link: '/api/rlp',
          items: [
            { text: '.encode', link: '/api/rlp/encode' },
            { text: '.decode', link: '/api/rlp/decode' },
          ],
        },
        {
          text: 'Secp256k1 🚧',
          collapsed: true,
          link: '/api/secp256k1',
          items: [
            {
              text: '.recoverAddress',
              link: '/api/secp256k1/recoverAddress',
            },
            {
              text: '.recoverPublicKey',
              link: '/api/secp256k1/recoverPublicKey',
            },
            {
              text: '.sign',
              link: '/api/secp256k1/sign',
            },
            {
              text: '.verify',
              link: '/api/secp256k1/verify',
            },
          ],
        },
        {
          text: 'SignedData (EIP-191) 🚧',
          collapsed: true,
          link: '/api/signedData',
          items: [
            {
              text: '.hashPersonalSignData',
              link: '/api/signedData/hashPersonalSignData',
            },
            {
              text: '.hashTypedData',
              link: '/api/signedData/hashTypedData',
            },
            {
              text: '.hashValidatorData',
              link: '/api/signedData/hashValidatorData',
            },
            {
              text: '.toPersonalSignData',
              link: '/api/signedData/toPersonalSignData',
            },
            {
              text: '.toTypedData',
              link: '/api/signedData/toTypedData',
            },
            {
              text: '.toValidatorData',
              link: '/api/signedData/toValidatorData',
            },
          ],
        },
        {
          text: 'Signature 🚧',
          collapsed: true,
          link: '/api/signature',
          items: [
            { text: '.from', link: '/api/signature/from' },
            { text: '.fromCompact', link: '/api/signature/fromCompact' },
            { text: '.fromSerialized', link: '/api/signature/fromSerialized' },
            { text: '.serialize', link: '/api/signature/serialize' },
            {
              text: '.serializeCompact',
              link: '/api/signature/serializeCompact',
            },
            {
              text: '.toCompact',
              link: '/api/signature/toCompact',
            },
            {
              text: '.vToYParity',
              link: '/api/signature/vToYParity',
            },
            {
              text: '.yParityToV',
              link: '/api/signature/yParityToV',
            },
          ],
        },
        {
          text: 'Siwe (ERC-4361) 🚧',
          collapsed: true,
          link: '/api/siwe',
          items: [
            {
              text: '.createMessage',
              link: '/api/siwe/createMessage',
            },
            {
              text: '.generateNonce',
              link: '/api/siwe/generateNonce',
            },
            {
              text: '.isUri',
              link: '/api/siwe/isUri',
            },
            {
              text: '.parseMessage',
              link: '/api/siwe/parseMessage',
            },
            {
              text: '.validateMessage',
              link: '/api/siwe/validateMessage',
            },
          ],
        },
        {
          text: 'Transaction 🚧',
          collapsed: true,
          link: '/api/transaction',
          items: [
            { text: '.from', link: '/api/transaction/from' },
            { text: '.fromRpc', link: '/api/transaction/fromRpc' },
            { text: '.assertLegacy', link: '/api/transaction/assertLegacy' },
            { text: '.assertEip1559', link: '/api/transaction/assertEip1559' },
            { text: '.assertEip2930', link: '/api/transaction/assertEip2930' },
            { text: '.assertEip4844', link: '/api/transaction/assertEip4844' },
            { text: '.assertEip7702', link: '/api/transaction/assertEip7702' },
            {
              text: '.getSerializedType',
              link: '/api/transaction/getSerializedType',
            },
            { text: '.getType', link: '/api/transaction/getType' },
            { text: '.toRpc', link: '/api/transaction/toRpc' },
          ],
        },
        {
          text: 'TransactionEnvelope 🚧',
          collapsed: true,
          link: '/api/transactionEnvelope',
          items: [
            { text: '.from', link: '/api/transactionEnvelope/from' },
            {
              text: '.assertLegacy',
              link: '/api/transactionEnvelope/assertLegacy',
            },
            {
              text: '.assertEip1559',
              link: '/api/transactionEnvelope/assertEip1559',
            },
            {
              text: '.assertEip2930',
              link: '/api/transactionEnvelope/assertEip2930',
            },
            {
              text: '.assertEip4844',
              link: '/api/transactionEnvelope/assertEip4844',
            },
            {
              text: '.assertEip7702',
              link: '/api/transactionEnvelope/assertEip7702',
            },
            {
              text: '.getSerializedType',
              link: '/api/transactionEnvelope/getSerializedType',
            },
            { text: '.getType', link: '/api/transactionEnvelope/getType' },
            { text: '.parse', link: '/api/transactionEnvelope/parse' },
            {
              text: '.parseLegacy',
              link: '/api/transactionEnvelope/parseLegacy',
            },
            {
              text: '.parseEip1559',
              link: '/api/transactionEnvelope/parseEip1559',
            },
            {
              text: '.parseEip2930',
              link: '/api/transactionEnvelope/parseEip2930',
            },
            {
              text: '.parseEip4844',
              link: '/api/transactionEnvelope/parseEip4844',
            },
            {
              text: '.parseEip7702',
              link: '/api/transactionEnvelope/parseEip7702',
            },
            { text: '.serialize', link: '/api/transactionEnvelope/serialize' },
            {
              text: '.serializeLegacy',
              link: '/api/transactionEnvelope/serializeLegacy',
            },
            {
              text: '.serializeEip1559',
              link: '/api/transactionEnvelope/serializeEip1559',
            },
            {
              text: '.serializeEip2930',
              link: '/api/transactionEnvelope/serializeEip2930',
            },
            {
              text: '.serializeEip4844',
              link: '/api/transactionEnvelope/serializeEip4844',
            },
            {
              text: '.serializeEip7702',
              link: '/api/transactionEnvelope/serializeEip7702',
            },
          ],
        },
        {
          text: 'TransactionReceipt 🚧',
          collapsed: true,
          link: '/api/transactionReceipt',
          items: [
            { text: '.from', link: '/api/transactionReceipt/from' },
            { text: '.fromRpc', link: '/api/transactionReceipt/fromRpc' },
            { text: '.toRpc', link: '/api/transactionReceipt/toRpc' },
          ],
        },
        {
          text: 'TypedData (EIP-712) 🚧',
          collapsed: true,
          link: '/api/typedData',
          items: [
            {
              text: '.from',
              link: '/api/typedData/from',
            },
            {
              text: '.domainSeparator',
              link: '/api/typedData/domainSeparator',
            },
            {
              text: '.encodeType',
              link: '/api/typedData/encodeType',
            },
            {
              text: '.getEip712DomainTypes',
              link: '/api/typedData/getEip712DomainTypes',
            },
            {
              text: '.hash',
              link: '/api/typedData/hash',
            },
            {
              text: '.hashDomain',
              link: '/api/typedData/hashDomain',
            },
            {
              text: '.hashStruct',
              link: '/api/typedData/hashStruct',
            },
            {
              text: '.serialize',
              link: '/api/typedData/serialize',
            },
            {
              text: '.validate',
              link: '/api/typedData/validate',
            },
          ],
        },
        {
          text: 'Value',
          collapsed: true,
          link: '/api/value',
          items: [
            { text: '.from', link: '/api/value/from' },
            { text: '.fromEther', link: '/api/value/fromEther' },
            { text: '.fromGwei', link: '/api/value/fromGwei' },
            { text: '.format', link: '/api/value/format' },
            { text: '.formatEther', link: '/api/value/formatEther' },
            { text: '.formatGwei', link: '/api/value/formatGwei' },
          ],
        },
        {
          text: 'WebAuthnP256 🚧',
          collapsed: true,
          link: '/api/webAuthnP256',
          items: [
            { text: '.createCredential', link: '/api/unit/createCredential' },
            { text: '.parsePublicKey', link: '/api/unit/parsePublicKey' },
            { text: '.parseSignature', link: '/api/unit/parseSignature' },
            { text: '.sign', link: '/api/unit/sign' },
            {
              text: '.serializePublicKey',
              link: '/api/unit/serializePublicKey',
            },
            {
              text: '.serializeSignature',
              link: '/api/unit/serializeSignature',
            },
            { text: '.verify', link: '/api/unit/verify' },
          ],
        },
      ],
    },
    {
      text: 'Glossary',
      items: [
        {
          text: 'Errors',
          link: '/errors',
        },
      ],
    },
  ],
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
      light: '#ff9318',
      dark: '#ffc517',
    },
  },
  topNav: [
    {
      text: pkg.version,
      items: [
        {
          text: 'Changelog',
          link: 'https://github.com/wevm/viem/blob/main/src/CHANGELOG.md',
        },
        {
          text: 'Contributing',
          link: 'https://github.com/wevm/viem/blob/main/.github/CONTRIBUTING.md',
        },
      ],
    },
  ],
})
