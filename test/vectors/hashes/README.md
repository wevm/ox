# Hash test vectors

Published test vectors for the hash primitives ox implements, from sources
independent of `@noble/hashes`.

Ox's other hash tests are differential against `@noble/hashes` — which is the
right primary oracle, since it is audited and it is what ox ships by default. But
a differential test only proves two implementations agree. These vectors are the
independent check: they come from the algorithms' specifications and designers,
so they would catch a fault that `@noble/hashes` and a WASM port happened to
share.

They are run against **both** implementations — `src/core/_test/Hash.vectors.test.ts`
for the default and `src/wasm/_test/Hash.vectors.test.ts` for the WASM engine.

## Files

| File                                   | Cases | Source |
| -------------------------------------- | ----- | ------ |
| `blake3.json`                          | 35    | BLAKE3 team's official test vectors |
| `SHA256ShortMsg.rsp`                   | 65    | NIST CAVP, SHA-256 byte-oriented short messages |
| `SHA256LongMsg.rsp`                    | 64    | NIST CAVP, SHA-256 byte-oriented long messages |
| `rfc-4231-sha256.txt`                  | 6     | RFC 4231 §4, HMAC-SHA-256 test cases |
| `ripemd160.txt`                        | 8     | The RIPEMD-160 homepage's reference vectors |
| `keccak256-openssl.txt`                | 3     | OpenSSL EVP digest tests |
| `KeccakF-1600-IntermediateValues.txt`  | 2     | XKCP, the Keccak team's own reference values |

## Provenance

Vendored verbatim, so the checksums below verify them against upstream:

```
dcb91ea8accc77e6d6e632af7cdc1a99a9f3ae78cf648da595c7d064db32f624  blake3.json
75e1cb83994638481808e225b9eb0c1ebd0c232d952ac42b61abce6363be283c  SHA256ShortMsg.rsp
6fac36f37360bcf74ffcf4465c18e30d6d5a04cc90885b901fc3130c16060974  SHA256LongMsg.rsp
a152130875a5afa91afe974499822d96a995131ab2bbbaf3106ef4c00d3f334b  rfc-4231-sha256.txt
5f67e7f1169b5d458a73c28aed442120657ee1ddd1e47620e935fea4ab5ff13c  ripemd160.txt
db0947545a5d91c20b2105aac75fac430deafe0ccaecb660af60044244df30d4  KeccakF-1600-IntermediateValues.txt
```

- **`SHA256ShortMsg.rsp`, `SHA256LongMsg.rsp`** — NIST's Cryptographic Algorithm
  Validation Program response files, `shabytetestvectors.zip`, taken via
  [`pyca/cryptography`](https://github.com/pyca/cryptography) at
  `6b781b384f6570442921109af3062cc6571265e7`
  (`vectors/cryptography_vectors/hashes/SHA2/`). `csrc.nist.gov` is not reachable
  from CI, and pyca vendors the files unmodified.
- **`blake3.json`** — the BLAKE3 team's official vectors from version 1.8.5,
  commit `93a431c78a52d7ccf0f366f106467f5070e6075e`
  (`test_vectors/test_vectors.json`). The file is vendored unmodified.
- **`rfc-4231-sha256.txt`** — RFC 4231 §4, reformatted by pyca into the same
  `Len`/`Key`/`Msg`/`MD` shape as the CAVP files, from the same commit
  (`vectors/cryptography_vectors/HMAC/`). Covers RFC 4231 cases 1–4, 6 and 7;
  case 5 is omitted upstream because it tests truncated output, which ox does not
  expose.
- **`ripemd160.txt`** — the reference vectors from
  [the RIPEMD-160 homepage](https://homes.esat.kuleuven.be/~bosselae/ripemd160.html),
  again via pyca (`vectors/cryptography_vectors/hashes/ripemd160/ripevectors.txt`).
  The homepage's million-`a` case is not in this file; it is asserted directly in
  the tests instead, since it is the only case that exercises a long multi-block
  message.
- **`KeccakF-1600-IntermediateValues.txt`** — from
  [`XKCP/XKCP`](https://github.com/XKCP/XKCP) at
  `78477d2e0b980737deaa07b928b29302257055ca`
  (`tests/TestVectors/`). Written by the Keccak designers. Gives the 24 round
  constants, the rho offsets, and two complete Keccak-f[1600] permutations with
  per-round intermediate states.
- **`keccak256-openssl.txt`** — the `KECCAK-256` cases from
  [`openssl/openssl`](https://github.com/openssl/openssl) at
  `971b8d060e52499d6ffd2f9ca697fe23f72a629a`
  (`test/recipes/30-test_evp_data/evpmd_sha.txt`). This is the one file that is
  *not* byte-identical to upstream: OpenSSL keeps Keccak alongside every other
  digest in one 1500-line file, so only the `KECCAK-256` blocks were extracted.
  The `Digest`/`Input`/`Output` lines are verbatim. OpenSSL's own comments record
  that it sourced these from the Keccak team's `ShortMsgKAT_256.txt` and
  `LongMsgKAT_256.txt`.

## Why Keccak-256 has the fewest vectors

Keccak-256 is Keccak with its original padding, not FIPS-202 SHA3-256, so NIST's
SHA-3 vectors do not apply to it — the two differ by a domain-separation byte and
produce entirely different digests. The Keccak team's own `ShortMsgKAT_256.txt`
would be ideal, but it ships in the SHA-3 submission archive on `keccak.team`,
which is not reachable from CI and is not mirrored in XKCP's git history.

The coverage is still meaningful, from two directions:

- **The permutation** is checked against the designers' reference values,
  including every intermediate state of every round. That is the shared core of
  `wasm/src/hashes.c` and `wasm/src/mine.c`.
- **Padding and the absorb loop** are checked by OpenSSL's three digests: the
  empty input, and two multi-block messages of 445 and 508 bytes.

Everything else rests on the differential fuzz tests against `@noble/hashes`.

## Adding vectors

Vendor the upstream file unmodified, record its source and SHA-256 above, and
extend `test/vectors/hashes/index.ts` to parse it. Prefer files that already use
the `Len`/`Msg`/`MD` shape — the parser handles that format for free.
