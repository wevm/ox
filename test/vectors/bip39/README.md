# BIP-39 vectors

`index.ts` holds one fixed English vector and one Japanese Unicode vector so
every engine provider exercises the same published inputs.

- English source: https://github.com/trezor/python-mnemonic/blob/master/vectors.json
- Japanese source: https://github.com/bip32JP/bip32JP.github.io/blob/master/test_JP_BIP39.json

The English vector is the first `english` case and uses the published `TREZOR`
passphrase. The Japanese vector is the first case and preserves its ideographic
spaces and normalization-stressing passphrase exactly.
