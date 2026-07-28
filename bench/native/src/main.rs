//! Native Alloy timings for the Keccak256 primitive.
//!
//! Emits CSV on stdout: `primitive,size,ns_per_op`. `scripts/bench:engines.ts`
//! runs this and merges the rows into one table beside the Ox numbers.
//! The timing loop mirrors that script's exactly -- same warmup, same budget,
//! same best-observed repeat -- so the two sides are comparable.

use std::env;
use std::hint::black_box;
use std::time::{Duration, Instant};

const SIZES: [usize; 7] = [32, 64, 256, 1024, 4096, 65_536, 1_048_576];

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

    println!("primitive,size,ns_per_op");
    for size in SIZES {
        let input: Vec<u8> = (0..size).map(|i| (i % 251) as u8).collect();
        let ns = measure(
            || {
                black_box(alloy_primitives::keccak256(black_box(&input)));
            },
            warmup,
            budget,
            repeats,
        );
        println!("keccak256,{size},{ns:.2}");
    }
}
