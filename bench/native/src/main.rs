//! Native timings for the primitives `ox/wasm` implements, as a ceiling to
//! measure the WASM engine against.
//!
//! Emits CSV on stdout: `primitive,crate,size,ns_per_op`. `scripts/bench-hash.mts`
//! runs this and merges the rows into one table beside the JavaScript numbers.
//! The timing loop mirrors that script's exactly -- same warmup, same budget,
//! same `min` over repeats -- so the two sides are comparable.
//!
//! `alloy-primitives` only provides keccak256. The rest come from the
//! RustCrypto crates, which is what a Rust project would use, and each row
//! names the crate it came from so no column claims more than it measured.

use hmac::{Hmac, Mac};
use ripemd::Ripemd160;
use sha2::{Digest, Sha256};
use std::hint::black_box;
use std::time::{Duration, Instant};

const SIZES: [usize; 7] = [32, 64, 256, 1024, 4096, 65_536, 1_048_576];
const WARMUP: Duration = Duration::from_millis(200);
const BUDGET: Duration = Duration::from_millis(900);
const REPEATS: usize = 3;

/// Nanoseconds per call, best of `REPEATS`.
///
/// Interference only ever makes a sample slower, so the minimum is the robust
/// estimator here -- a mean would fold in whatever else the machine was doing.
fn measure(mut run: impl FnMut()) -> f64 {
    let mut best = f64::INFINITY;
    for _ in 0..REPEATS {
        let start = Instant::now();
        while start.elapsed() < WARMUP {
            run();
        }
        let mut iters: u64 = 0;
        let start = Instant::now();
        while start.elapsed() < BUDGET {
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

fn main() {
    println!("primitive,crate,size,ns_per_op");
    for size in SIZES {
        let input: Vec<u8> = (0..size).map(|i| (i % 251) as u8).collect();
        let key: Vec<u8> = (0..32).map(|i| (i % 97) as u8).collect();

        let rows: [(&str, &str, f64); 4] = [
            (
                "keccak256",
                "alloy-primitives",
                measure(|| {
                    black_box(alloy_primitives::keccak256(black_box(&input)));
                }),
            ),
            (
                "sha256",
                "sha2",
                measure(|| {
                    black_box(Sha256::digest(black_box(&input)));
                }),
            ),
            (
                "ripemd160",
                "ripemd",
                measure(|| {
                    black_box(Ripemd160::digest(black_box(&input)));
                }),
            ),
            (
                "hmacSha256",
                "hmac + sha2",
                measure(|| {
                    let mut mac = <Hmac<Sha256> as Mac>::new_from_slice(black_box(&key))
                        .expect("hmac accepts any key length");
                    mac.update(black_box(&input));
                    black_box(mac.finalize());
                }),
            ),
        ];

        for (primitive, krate, ns) in rows {
            println!("{primitive},{krate},{size},{ns:.2}");
        }
    }
}
