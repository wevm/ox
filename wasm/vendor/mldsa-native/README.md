[//]: # (SPDX-License-Identifier: CC-BY-4.0)

# mldsa-native

![CI](https://github.com/pq-code-package/mldsa-native/actions/workflows/all.yml/badge.svg)
![Proof: HOL-Light](https://github.com/pq-code-package/mldsa-native/actions/workflows/hol_light.yml/badge.svg)
![Benchmarks](https://github.com/pq-code-package/mldsa-native/actions/workflows/bench.yml/badge.svg)
![C90](https://img.shields.io/badge/language-C90-blue.svg)

[![License: Apache](https://img.shields.io/badge/license-Apache--2.0-green.svg)](https://www.apache.org/licenses/LICENSE-2.0)
[![License: ISC](https://img.shields.io/badge/License-ISC-blue.svg)](https://opensource.org/licenses/ISC)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

mldsa-native is a secure, fast, and portable C90[^C90] implementation of the ML-DSA[^FIPS204] post-quantum signature standard. It is a fork of the ML-DSA reference implementation[^REF].

mldsa-native is supported by the [Post-Quantum Cryptography Alliance](https://pqca.org/) as part of the [Linux Foundation](https://linuxfoundation.org/).

## Why mldsa-native?

mldsa-native allows developers to support ML-DSA with minimal performance and maintenance cost.

**Minimal Dependencies:** mldsa-native is written in portable C90 with minimal and configurable dependencies on the standard library.

**Maintainability and Safety:** Memory safety, type safety and absence of various classes of timing leakage are automatically checked on every change, using a combination of static model checking (using CBMC) and dynamic instrumentation (using valgrind). This reduces review and maintenance burden and accelerates safe code delivery. See [Formal Verification](#formal-verification) and [Security](#security).

**Architecture Support:** Native backends are added under a unified interface, minimizing duplicated code and reasoning. mldsa-native comes with backends for AArch64 and x86-64. See [Design](#design).

## Quickstart for Ubuntu

```bash
# Install base packages
sudo apt-get update
sudo apt-get install make gcc python3 git

# Clone mldsa-native
git clone https://github.com/pq-code-package/mldsa-native.git
cd mldsa-native

# Build and run tests
make build
make test

# The same using `tests`, a convenience wrapper around `make`
./scripts/tests all
# Show all options
./scripts/tests --help
```


## Applications

mldsa-native is used in
 - AWS' Cryptography library [AWS-LC](https://github.com/aws/aws-lc/)
 - [libOQS](https://github.com/open-quantum-safe/liboqs/) of the Open Quantum Safe project
 - The [zeroRISC's fork of OpenTitan](https://github.com/zerorisc/expo) - an open source silicon Root of Trust (RoT)
 - [CHERIoT-PQC](https://github.com/CHERIoT-Platform/cheriot-pqc) — post-quantum cryptography support for the CHERIoT platform

## Formal Verification

We use the [C Bounded Model Checker (CBMC)](https://github.com/diffblue/cbmc) to prove absence of various classes of undefined behaviour in C, including out of bounds memory accesses and integer overflows. The proofs cover all C code in [mldsa/src/*](mldsa) and [mldsa/src/fips202/*](mldsa/src/fips202) involved in running mldsa-native with its C backend. See [proofs/cbmc](proofs/cbmc) for details.

HOL-Light functional correctness proofs can be found in [proofs/hol_light](proofs/hol_light). See the [HOL-Light README](proofs/hol_light/README.md) for the list of functions that have been proven correct. These proofs utilize the verification infrastructure in [s2n-bignum](https://github.com/awslabs/s2n-bignum).

Finally, [proofs/isabelle](proofs/isabelle/compress) contains proofs in [Isabelle/HOL](https://isabelle.in.tum.de/) of the correctness of
different approaches for computing the scalar decomposition routines used in ML-DSA. Those are still experimental and do not yet operate
on the source level.

**NOTE:** Formal Verification is never absolute. See [SOUNDNESS.md](SOUNDNESS.md) for an analysis of the scope, assumptions and risks of the formal verification efforts around mldsa-native.

## Security

All assembly in mldsa-native is constant-time in the sense that it is free of secret-dependent control flow, memory access,
and instructions that are commonly variable-time, thwarting most timing side channels. C code is hardened against compiler-introduced
timing side channels through suitable barriers and constant-time patterns.

Absence of secret-dependent branches, memory-access patterns and variable-latency instructions is also tested using `valgrind`
with various combinations of compilers and compilation options.

**Other attacks.** mldsa-native targets resistance against timing side-channels only. Other attack classes, such as power and electromagnetic side-channels, microarchitectural side-channels (e.g. speculative execution), or fault-injection attacks, are currently out of scope.

## Design

mldsa-native is split into a _frontend_ and two _backends_ for arithmetic and FIPS202 / SHA3. The frontend is
fixed, written in C, and covers all routines that are not critical to performance. The backends are flexible, take care of
performance-sensitive routines, and can be implemented in C or native code (assembly/intrinsics); see
[mldsa/src/native/api.h](mldsa/src/native/api.h) for the arithmetic backend and
[mldsa/src/fips202/native/api.h](mldsa/src/fips202/native/api.h) for the FIPS-202 backend.

mldsa-native currently offers the following backends:

* Default portable C backend
* 64-bit Arm backend (using Neon)
* 64-bit Intel/AMD backend (using AVX2)
* 32-bit Armv8.1-M backend (using Helium/MVE). This is still experimental and disabled by default.

If you'd like contribute new backends, please reach out!

## Test Vectors

mldsa-native is tested against all official ACVP ML-DSA test vectors[^ACVP] and the
Wycheproof[^wycheproof] ML-DSA test vectors.

### ACVP

You can run ACVP tests using the [`tests`](./scripts/tests) script or the [ACVP client](./test/acvp/acvp_client.py) directly:

```bash
# Using the tests script
./scripts/tests acvp
# Using a specific ACVP release
./scripts/tests acvp --version v1.1.0.41

# Using the ACVP client directly
python3 ./test/acvp/acvp_client.py
python3 ./test/acvp/acvp_client.py --version v1.1.0.41

# Using specific ACVP test vector files (downloaded from the ACVP-Server)
# python3 ./test/acvp/acvp_client.py -p {PROMPT}.json -e {EXPECTED_RESULT}.json
# For example, assuming you have run the above
python3 ./test/acvp/acvp_client.py \
  -p ./test/acvp/.acvp-data/v1.1.0.41/files/ML-DSA-sigVer-FIPS204/prompt.json \
  -e ./test/acvp/.acvp-data/v1.1.0.41/files/ML-DSA-sigVer-FIPS204/expectedResults.json
```

### Wycheproof

You can run Wycheproof[^wycheproof] tests using the [`tests`](./scripts/tests) script or the [Wycheproof client](./test/wycheproof/wycheproof_client.py) directly:

```bash
# Using the tests script
./scripts/tests wycheproof

# Using the Wycheproof client directly
python3 ./test/wycheproof/wycheproof_client.py
```

## Benchmarking

You can measure performance, memory usage, and binary size using the [`tests`](./scripts/tests) script:

```bash
# Speed benchmarks (-c selects cycle counter: NO, PMU, PERF, or MAC)
# Note: PERF/MAC may require the -r flag to run benchmarking binaries using sudo
./scripts/tests bench -c PMU
./scripts/tests bench -c PERF -r

# Stack usage analysis
./scripts/tests stack

# Binary size measurement
./scripts/tests size
```

For CI benchmark results and historical performance data, see the [benchmarking page](https://pq-code-package.github.io/mldsa-native/dev/bench/).

## Usage

If you want to use mldsa-native, import [mldsa](mldsa) into your project's source tree and build using your favourite build system. See [examples/basic](examples/basic) for a simple example. The build system provided in this repository is for development purposes only.

### Can I bring my own FIPS-202?

mldsa-native relies on and comes with an implementation of FIPS-202[^FIPS202]. If your library has its own FIPS-202 implementation, you
can use it instead of the one shipped with mldsa-native. See [FIPS202.md](FIPS202.md), and [examples/bring_your_own_fips202](examples/bring_your_own_fips202)
for an example using tiny_sha3[^tiny_sha3].

### Do I need to use the assembly backends?

No. If you want a C-only build, just omit the directories [mldsa/src/native](mldsa/src/native) and/or [mldsa/src/fips202/native](mldsa/src/fips202/native) from your import
and unset `MLD_CONFIG_USE_NATIVE_BACKEND_ARITH` and/or `MLD_CONFIG_USE_NATIVE_BACKEND_FIPS202` in your [mldsa_native_config.h](mldsa/mldsa_native_config.h).

### Do I need to setup CBMC to use mldsa-native?

No. While we recommend that you consider using it, mldsa-native will build + run fine without CBMC -- just make sure to
include [cbmc.h](mldsa/src/cbmc.h) and have `CBMC` undefined. In particular, you do _not_ need to remove all function
contracts and loop invariants from the code; they will be ignored unless `CBMC` is set.


### Does mldsa-native support all security levels of ML-DSA?

Yes. mldsa-native supports all three ML-DSA security levels (ML-DSA-44, ML-DSA-65, ML-DSA-87) as defined in FIPS 204. The security level is a compile-time parameter configured by setting `MLD_CONFIG_PARAMETER_SET=44/65/87` in [mldsa_native_config.h](mldsa/mldsa_native_config.h).

### Can I reduce RAM usage for embedded systems?

Yes. mldsa-native provides a compile-time option `MLD_CONFIG_REDUCE_RAM` that reduces RAM usage. This trades memory for performance. See the `MLD_TOTAL_ALLOC_*` constants in [mldsa_native.h](mldsa/mldsa_native.h) for memory usage per parameter set and operation.

To enable this mode, define `MLD_CONFIG_REDUCE_RAM` in [mldsa_native_config.h](mldsa/mldsa_native_config.h) or pass `-DMLD_CONFIG_REDUCE_RAM` as a compiler flag.

### Does mldsa-native use hedged or deterministic signing?

By default, mldsa-native uses the randomized "hedged" signing variant as specified in FIPS 204 Section 3.4. The hedged variant uses both fresh randomness at signing time and precomputed randomness from the private key. This helps mitigate fault injection attacks and side-channel attacks while protecting against potential flaws in the random number generator.

If you need the deterministic variant of ML-DSA, you can call `crypto_sign_signature_internal`
directly with an all-zero `rnd` argument.
However, note that FIPS 204 warns that this should not be used on platforms where fault injection attacks and side-channel attacks are a concern, as the lack of fresh randomness makes fault attacks more difficult to mitigate.

### Does mldsa-native support the external mu mode?

Yes. mldsa-native supports external mu mode, which allows for pre-hashing of messages before signing. This addresses the pre-hashing capability described in the NIST PQC FAQ[^NIST_FAQ] and detailed in NIST's guidance on FIPS 204 Section 6[^NIST_FIPS204_SEC6].

External mu mode enables applications to compute the message digest (mu) externally and provide it to the signing implementation, which is particularly useful for large messages or streaming applications where the entire message cannot be held in memory during signing.

### Does mldsa-native support HashML-DSA?

Yes. mldsa-native supports HashML-DSA, the pre-hashing variant of ML-DSA defined in FIPS 204 Algorithms 4 and 5.

mldsa-native provides two levels of API:
- `crypto_sign_signature_pre_hash_internal` and `crypto_sign_verify_pre_hash_internal` - Low-level functions that accept a pre-hashed message digest. This function supports all 12 allowed hash functions.
- `crypto_sign_signature_pre_hash_shake256` and `crypto_sign_verify_pre_hash_shake256` - High-level functions that perform SHAKE256 pre-hashing internally for convenience. Currently, only SHAKE256 is supported. If you require another hash function, use the `*_pre_hash_internal` functions or open an issue.

## Have a Question?

If you think you have found a security bug in mldsa-native, please report the vulnerability through
Github's [private vulnerability reporting](https://github.com/pq-code-package/mldsa-native/security).
Please do **not** create a public GitHub issue.

If you have any other question / non-security related issue / feature request, please open a GitHub issue.

## Contributing

If you want to help us build mldsa-native, please reach out. You can contact the mldsa-native team
through the [PQCA Discord](https://discord.com/invite/xyVnwzfg5R). See also [CONTRIBUTING.md](CONTRIBUTING.md).

[^C90]: Strictly speaking, we rely on C90 + `stdint.h` + 64-bit `unsigned long long`.


<!--- bibliography --->
[^ACVP]: National Institute of Standards and Technology: Automated Cryptographic Validation Protocol (ACVP) Server, [https://github.com/usnistgov/ACVP-Server](https://github.com/usnistgov/ACVP-Server)
[^FIPS202]: National Institute of Standards and Technology: FIPS202 SHA-3 Standard: Permutation-Based Hash and Extendable-Output Functions, [https://csrc.nist.gov/pubs/fips/202/final](https://csrc.nist.gov/pubs/fips/202/final)
[^FIPS204]: National Institute of Standards and Technology: FIPS 204 Module-Lattice-Based Digital Signature Standard, [https://csrc.nist.gov/pubs/fips/204/final](https://csrc.nist.gov/pubs/fips/204/final)
[^NIST_FAQ]: National Institute of Standards and Technology: Post-Quantum Cryptography FAQs, [https://csrc.nist.gov/Projects/post-quantum-cryptography/faqs#Rdc7](https://csrc.nist.gov/Projects/post-quantum-cryptography/faqs#Rdc7)
[^NIST_FIPS204_SEC6]: National Institute of Standards and Technology: FIPS 204 Section 6 Guidance, [https://csrc.nist.gov/csrc/media/Projects/post-quantum-cryptography/documents/faq/fips204-sec6-03192025.pdf](https://csrc.nist.gov/csrc/media/Projects/post-quantum-cryptography/documents/faq/fips204-sec6-03192025.pdf)
[^REF]: Bai, Ducas, Kiltz, Lepoint, Lyubashevsky, Schwabe, Seiler, Stehlé: CRYSTALS-Dilithium reference implementation, [https://github.com/pq-crystals/dilithium/tree/master/ref](https://github.com/pq-crystals/dilithium/tree/master/ref)
[^tiny_sha3]: Markku-Juhani O. Saarinen: tiny_sha3, [https://github.com/mjosaarinen/tiny_sha3](https://github.com/mjosaarinen/tiny_sha3)
[^wycheproof]: Community Cryptography Specification Project: Project Wycheproof, [https://github.com/C2SP/wycheproof](https://github.com/C2SP/wycheproof)
