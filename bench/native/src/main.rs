//! Native Alloy timings for the Ox primitives Alloy also implements.
//!
//! Emits CSV on stdout: `key,ns_per_op,output`, where `key` is the `alloyKey`
//! of a benchmark in `scripts/bench:engines.ts`. That script runs this and
//! merges the rows into one table beside the Ox numbers. The timing loop
//! mirrors that script's exactly -- same warmup, same budget, same
//! best-observed repeat -- and the inputs constructed below mirror its inputs,
//! so the two sides are comparable.
//!
//! `output` is the hex result of the measured call, in the byte layout the Ox
//! contract returns rather than Alloy's own. The script compares it against
//! what Ox produces and aborts on a mismatch, so a row can never report two
//! implementations computing different things.
//!
//! Only primitives Alloy implements with a shape close enough to the Ox engine
//! contract appear here. Where Alloy's closest call does more work than Ox's,
//! the comment above that row says so. Deliberately absent:
//!
//! - ECDH (`getSharedSecret`). Alloy has no key-agreement API.
//! - Bare ECDSA `verify`. Alloy verifies by recovering and comparing an
//!   address, which is a different amount of work.
//! - `randomSecretKey`. `PrivateKeySigner::random` also derives the public key
//!   and address, so it would time key generation plus two extra steps.
//! - P256, Ed25519, X25519, and BLS. Alloy implements none of them.
//! - Keystore. `LocalSigner::encrypt_keystore` is a whole-keystore operation
//!   including file IO, not the individual AES-CTR, PBKDF2, and scrypt
//!   primitives the Ox `Keystore` slot exposes.
//!
//! Timing unlike work under a matching name would be worse than reporting
//! `n/a`, which is what the merged table does for every key missing here.

use std::env;
use std::hint::black_box;
use std::time::{Duration, Instant};

use alloy_primitives::{hex, keccak256, B256};
use alloy_signer::SignerSync;
use alloy_signer_local::coins_bip39::{English, Mnemonic};
use alloy_signer_local::PrivateKeySigner;

const SIZES: [usize; 7] = [32, 64, 256, 1024, 4096, 65_536, 1_048_576];

/// The 12-word vector the Ox harness derives a seed from.
const PHRASE: &str = "abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about";

/// Mirrors `bytes()` in `scripts/bench:engines.ts`, so both sides hash, sign,
/// and recover over byte-for-byte identical inputs.
fn bytes(length: usize, modulus: usize) -> Vec<u8> {
    (0..length).map(|index| (index % modulus) as u8).collect()
}

/// Nanoseconds per call, using the best-observed repeat.
///
/// This favors peak throughput and avoids presenting the result as a latency
/// distribution.
fn measure(mut run: impl FnMut(), warmup: Duration, budget: Duration, repeats: usize) -> f64 {
    let mut best = f64::INFINITY;
    for _ in 0..repeats {
        let start = Instant::now();
        while start.elapsed() < warmup {
            run();
        }
        let mut iters: u64 = 0;
        let start = Instant::now();
        while start.elapsed() < budget {
            for _ in 0..32 {
                run();
            }
            iters += 32;
        }
        let ns = start.elapsed().as_nanos() as f64 / iters as f64;
        if ns < best {
            best = ns;
        }
    }
    best
}

/// Measures one primitive and writes its CSV row.
///
/// `output` carries the same call's result in Ox's byte layout so the script
/// can reject a row whose two sides disagree.
fn row(
    key: &str,
    output: &[u8],
    run: impl FnMut(),
    warmup: Duration,
    budget: Duration,
    repeats: usize,
) {
    let ns = measure(run, warmup, budget, repeats);
    println!("{key},{ns:.2},{}", hex::encode(output));
}

fn duration(name: &str, default: f64, allow_zero: bool) -> Duration {
    let milliseconds = env::var(name)
        .map(|value| {
            value
                .parse::<f64>()
                .unwrap_or_else(|_| panic!("{name} must be a number"))
        })
        .unwrap_or(default);
    let valid = milliseconds.is_finite()
        && if allow_zero {
            milliseconds >= 0.0
        } else {
            milliseconds > 0.0
        };
    let requirement = if allow_zero {
        "non-negative"
    } else {
        "positive"
    };
    assert!(valid, "{name} must be a finite {requirement} number");
    Duration::from_secs_f64(milliseconds / 1000.0)
}

fn repeats() -> usize {
    let repeats = env::var("OX_BENCH_REPEATS")
        .map(|value| {
            value
                .parse::<usize>()
                .expect("OX_BENCH_REPEATS must be a positive integer")
        })
        .unwrap_or(3);
    assert!(repeats > 0, "OX_BENCH_REPEATS must be a positive integer");
    repeats
}

fn main() {
    let warmup = duration("OX_BENCH_WARMUP_MS", 200.0, true);
    let budget = duration("OX_BENCH_BUDGET_MS", 900.0, false);
    let repeats = repeats();

    println!("key,ns_per_op,output");

    for size in SIZES {
        let input = bytes(size, 251);
        row(
            &format!("Hash.keccak256:{size}"),
            keccak256(&input).as_slice(),
            || {
                black_box(keccak256(black_box(&input)));
            },
            warmup,
            budget,
            repeats,
        );
    }

    // The Ox harness signs a 32-byte payload with the private key `0x00..01`,
    // passing `prehash: false` and `extraEntropy: false`. `sign_hash_sync`
    // treats its argument as a prehash and k256 signs deterministically per
    // RFC 6979, so neither side hashes first and neither adds entropy.
    let mut secret_key = [0u8; 32];
    secret_key[31] = 1;
    let signer =
        PrivateKeySigner::from_bytes(&B256::from(secret_key)).expect("private key in curve order");
    let payload = B256::from_slice(&bytes(32, 251));
    let signature = signer.sign_hash_sync(&payload).expect("payload is signable");

    // `signer.public_key()` alone re-encodes the point k256 already cached
    // inside the `SigningKey`, which measures an encoding rather than a
    // derivation -- roughly 64 ns against the ~60 us the scalar multiplication
    // actually costs. Rebuilding the signer each iteration is what makes this
    // the same work as Ox's `getPublicKey`. Alloy has no bare private-key ->
    // public-key call, so the row also derives an address: one Keccak256 over
    // 64 bytes, about 1% of the total.
    // Ox returns SEC1 uncompressed bytes; `public_key()` drops the `0x04` tag.
    let secret_key = B256::from(secret_key);
    let public_key = [&[0x04][..], signer.public_key().as_slice()].concat();
    row(
        "Secp256k1.getPublicKey",
        &public_key,
        || {
            black_box(
                PrivateKeySigner::from_bytes(black_box(&secret_key))
                    .expect("private key in curve order")
                    .public_key(),
            );
        },
        warmup,
        budget,
        repeats,
    );
    // Alloy recovers through k256, which verifies the signature against the
    // recovered key before returning it. Ox's `recoverPublicKey` does not, so
    // this row times strictly more work. It also hands back a `VerifyingKey`
    // where Ox serializes 65 uncompressed bytes.
    row(
        "Secp256k1.recoverPublicKey",
        signature
            .recover_from_prehash(&payload)
            .expect("signature is recoverable")
            .to_encoded_point(false)
            .as_bytes(),
        || {
            black_box(
                black_box(&signature)
                    .recover_from_prehash(black_box(&payload))
                    .expect("signature is recoverable"),
            );
        },
        warmup,
        budget,
        repeats,
    );
    // Alloy lays a signature out as `r || s || yParity`; Ox leads with parity.
    let rsy = signature.as_rsy();
    let ox_signature = [&rsy[64..], &rsy[..64]].concat();
    row(
        "Secp256k1.sign",
        &ox_signature,
        || {
            black_box(
                black_box(&signer)
                    .sign_hash_sync(black_box(&payload))
                    .expect("payload is signable"),
            );
        },
        warmup,
        budget,
        repeats,
    );

    // `to_seed(None)` salts with `"mnemonic"`, matching the empty passphrase
    // the Ox harness passes. Parsing the phrase stays outside the loop so both
    // sides time BIP-39's 2048 PBKDF2-HMAC-SHA512 rounds and nothing else.
    let mnemonic = Mnemonic::<English>::new_from_phrase(PHRASE).expect("phrase is valid BIP-39");
    row(
        "Mnemonic.toSeed",
        &mnemonic.to_seed(None).expect("seed length is valid"),
        || {
            black_box(
                black_box(&mnemonic)
                    .to_seed(None)
                    .expect("seed length is valid"),
            );
        },
        warmup,
        budget,
        repeats,
    );
}
