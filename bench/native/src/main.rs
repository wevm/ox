//! Native Alloy timings for the Keccak256 primitive.
//!
//! Emits CSV on stdout: `primitive,size,ns_per_op`. `scripts/bench-hash.mts`
//! runs this and merges the rows into one table beside the Ox numbers.
//! The timing loop mirrors that script's exactly -- same warmup, same budget,
//! same best-observed repeat -- so the two sides are comparable.

use std::hint::black_box;
use std::time::{Duration, Instant};

const SIZES: [usize; 7] = [32, 64, 256, 1024, 4096, 65_536, 1_048_576];
const WARMUP: Duration = Duration::from_millis(200);
const BUDGET: Duration = Duration::from_millis(900);
const REPEATS: usize = 3;

/// Nanoseconds per call, using the best-observed repeat.
///
/// This favors peak throughput and avoids presenting the result as a latency
/// distribution.
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
    println!("primitive,size,ns_per_op");
    for size in SIZES {
        let input: Vec<u8> = (0..size).map(|i| (i % 251) as u8).collect();
        let ns = measure(|| {
            black_box(alloy_primitives::keccak256(black_box(&input)));
        });
        println!("keccak256,{size},{ns:.2}");
    }
}
