/**
 * ox's inputs to the typescript pack.
 *
 * @module
 */

import * as os from 'node:os'
import * as path from 'node:path'

import type { Config } from './packs/typescript/metrics/library.ts'

const build = path.resolve(import.meta.dirname, '../dist')

export default {
  // Calls `onWrite` on every write to one of ox's caches in the build, and returns `Caches.clear`.
  async caches(onWrite) {
    const { caches } = await import(path.join(build, 'core/internal/caches.js'))
    for (const cache of Object.values(caches) as {
      set: (...args: unknown[]) => unknown
    }[]) {
      const set = cache.set
      cache.set = function (this: unknown, ...args: unknown[]) {
        onWrite()
        return set.apply(this, args)
      }
    }
    const { clear } = await import(path.join(build, 'core/Caches.js'))
    return clear as () => void
  },
  callTypes: {
    // attest's snapshots assert, so a measured call is checked without them.
    assertions: ['attest'],
    // ox's own tests live beside its sources; `vectors/` and `test/` hold other projects' tests.
    tests: ['src/**/*.{test,test-d,snap-d}.ts'],
  },
  // Feeds only the docs generator.
  exclude: ['./index.docs'],
  fuzz: {
    baseError: 'ox/Errors:BaseError',
    // `Json.parse` throws `JSON.parse`'s `SyntaxError`.
    documentedErrors: { 'ox:Json.parse': /^SyntaxError$/ },
    // A Bech32m string starts with its human-readable part, which can be `0x`.
    freeOutput: ['ox:Bech32m.encode'],
    isolated: ['ox:Engine.install', 'ox:Engine.reset'],
    // Round trips, differentials against viem, ethers, noble, scure and micro-eth-signer, and seeds.
    properties: '.agents/typescript/fuzz-properties.ts',
    // Key derivation whose cost is its iteration count (PBKDF2 runs 262,144 rounds unless told
    // otherwise), proof-of-work salt mining, and loading the KZG trusted setup.
    slow: [
      [/Keystore\.(pbkdf2|scrypt|toKey|decrypt|encrypt)\w*$/, 20_000],
      [/AesGcm\.(getKey|fromMnemonic|fromSeed)\w*$/, 20_000],
      [/VirtualMaster\.mineSalt\w*$/, 30_000],
      [/Kzg\.create$/, 30_000],
    ],
  },
  hot: [
    // Encoding: Hex and Bytes conversions run at every boundary, and most of ox calls them.
    'ox:Hex.fromBytes',
    'ox:Hex.fromNumber',
    'ox:Hex.slice',
    'ox:Hex.size',
    'ox:Hex.concat',
    'ox:Hex.toBigInt',
    'ox:Hex.fromString',
    'ox:Hex.validate',
    'ox:Hex.random',
    'ox:Hex.padLeft',
    'ox:Hex.toNumber',
    'ox:Hex.assert',
    'ox:Bytes.fromString',
    'ox:Bytes.from',
    'ox:Bytes.concat',
    'ox:Bytes.fromNumber',
    'ox:Bytes.fromHex',
    'ox:Bytes.random',
    'ox:Bytes.toHex',
    'ox:Base64.fromBytes',
    'ox:Base64.toBytes',
    'ox:Base64.toString',
    'ox:Json.stringify',
    'ox:Rlp.fromHex',
    'ox:Rlp.toHex',
    'ox:Value.format',
    // Hashing, addresses and signatures.
    'ox:Hash.keccak256',
    'ox:Hash.sha256',
    'ox:Address.isEqual',
    'ox:Address.validate',
    'ox:Address.fromPublicKey',
    'ox:Address.checksum',
    'ox:Address.from',
    'ox:Signature.fromHex',
    'ox:Signature.toHex',
    'ox:Signature.from',
    'ox:Signature.toRpc',
    'ox:Signature.fromRpc',
    'ox:Signature.extract',
    'ox:PublicKey.toHex',
    'ox:PersonalMessage.getSignPayload',
    'ox:TypedData.getSignPayload',
    'ox:Secp256k1.getPublicKey',
    'ox:Secp256k1.sign',
    'ox:Secp256k1.recoverAddress',
    'ox:WebAuthnP256.getSignPayload',
    'ox:WebCryptoP256.sign',
    'ox:WebCryptoP256.createKeyPair',
    'ox:Ens.normalize',
    'ox/erc6492:SignatureErc6492.validate',
    'ox/erc8010:SignatureErc8010.validate',
    'ox/erc8010:SignatureErc8010.unwrap',
    // ABI: calldata, results and logs for every contract call.
    'ox:Abi.from',
    'ox:AbiParameters.encode',
    'ox:AbiParameters.decode',
    'ox:AbiParameters.from',
    'ox:AbiParameters.encodePacked',
    'ox:AbiFunction.encodeData',
    'ox:AbiFunction.decodeResult',
    'ox:AbiFunction.fromAbi',
    'ox:AbiEvent.extractLogs',
    // Tempo transactions and their signatures.
    'ox/tempo:SignatureEnvelope.serialize',
    'ox/tempo:SignatureEnvelope.from',
    'ox/tempo:SignatureEnvelope.extractAddress',
    'ox/tempo:TxEnvelopeTempo.serialize',
    'ox/tempo:TxEnvelopeTempo.deserialize',
    'ox/tempo:KeyAuthorization.fromRpc',
    // Entry points, by the files that import them.
    'ox',
    'ox/tempo',
    'ox/Hex',
    'ox/Address',
    'ox/Signature',
    'ox/TypedData',
    'ox/RpcResponse',
    'ox/Secp256k1',
    'ox/Provider',
    'ox/AbiFunction',
    'ox/AbiParameters',
    'ox/Bytes',
    'ox/Hash',
    'ox/WebAuthnP256',
    'ox/erc4337',
    'ox/erc6492',
  ],
  // `ox/zod`'s `z` re-exports zod's own functions and types, which are zod's to measure.
  reexports: ['zod/mini'],
  speed: {
    // Anvil forks mainnet through a proxy that caches what mainnet nodes answer and falls back
    // across public nodes. foundryup installs anvil in ~/.foundry/bin without putting it on PATH.
    async environment(cache) {
      const { forkProxy } = await import('./typescript/fork-proxy.ts')
      const fork = forkProxy(path.join(cache, 'fork-rpc.json'))
      return {
        env: {
          PATH: [process.env.PATH, path.join(os.homedir(), '.foundry/bin')]
            .filter(Boolean)
            .join(path.delimiter),
          VITE_ANVIL_FORK_URL: fork.url,
        },
        stop: () => fork.stop(),
      }
    },
    // `core` and `tempo-unit` as ox defines them; `frames-unit`, the tests in src/ of
    // `tmp_frames` without its global setup, which starts a frames node in Docker; and `calls`,
    // the calls for public functions no test calls in a way the bench can replay. The browser,
    // fuzz, and Tempo end-to-end projects are left out.
    projects(projects) {
      const find = (name: string) => {
        const project = projects.find((project) => project.name === name)
        if (!project)
          throw new Error(`ox's vitest config has no ${name} project.`)
        return project
      }
      const core = find('core')
      const tempo = find('tempo-unit')
      const frames = find('tmp_frames')
      const list = (value: string | string[] | undefined) =>
        value === undefined ? [] : [value].flat()
      // Destroys the anvil instances each test file used.
      const anvil = path.join(
        import.meta.dirname,
        'typescript/speed-anvil-setup.ts',
      )
      return [
        {
          name: 'core',
          include: core.include,
          globalSetup: core.globalSetup,
          setupFiles: [anvil, ...list(core.setupFiles)],
        },
        {
          name: 'tempo-unit',
          include: tempo.include,
          setupFiles: [anvil, ...list(tempo.setupFiles)],
        },
        {
          name: 'frames-unit',
          include: (frames.include ?? []).filter((file) =>
            file.startsWith('src/'),
          ),
          setupFiles: [anvil],
        },
        {
          name: 'calls',
          include: ['.agents/typescript/speed-calls.test.ts'],
          setupFiles: [anvil, ...list(core.setupFiles)],
        },
      ]
    },
  },
  types: {
    // ox's attest files.
    benches: 'src/**/*.{snap,bench}-d.ts',
    consumerTsconfig: 'src/tsconfig.json',
    // Its `paths` point `ox` and its entries at the sources.
    testTsconfig: 'test/tsconfig.json',
  },
} satisfies Config
