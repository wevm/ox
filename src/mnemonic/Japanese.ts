// Per-wordlist deep export so consumers can avoid pulling in every BIP39
// wordlist when they only need one. Bundlers typically cannot tree-shake
// the flat re-exports from `core/Mnemonic.ts`.
export { wordlist } from '@scure/bip39/wordlists/japanese.js'
