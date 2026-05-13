# Bench results: transactions

_TxEnvelope*, AccessList, Authorization, Withdrawal, Blobs._

See [tasks/bench/README.md](../tasks/bench/README.md) for the convention.

Baseline: `94d3e4bc` (origin/v1).

| bench | baseline | PR | delta | SHA |
| ----- | -------- | -- | ----- | --- |
| `Rlp_tx.bench.ts::Rlp.fromHex (transaction-shaped)::eip1559 tuple` | 360,488 ops/s | 441,626 ops/s | +22.5% | a57efdb8 |
| `Rlp_tx.bench.ts::Rlp.fromHex (transaction-shaped)::eip7702 tuple (with access + authorization lists)` | 150,945 ops/s | 175,186 ops/s | +16.1% | a57efdb8 |
| `Rlp_tx.bench.ts::Rlp.toHex (transaction-shaped)::eip1559 tuple` | 323,896 ops/s | 325,369 ops/s | +0.5% | a57efdb8 |
| `Rlp_tx.bench.ts::Rlp.toHex (transaction-shaped)::eip7702 tuple (with access + authorization lists)` | 139,158 ops/s | 140,680 ops/s | +1.1% | a57efdb8 |
| `Rlp_tx.bench.ts::Rlp.toBytes (transaction-shaped)::eip1559 tuple` | 423,112 ops/s | 302,199 ops/s | -28.6% | a57efdb8 |
| `Rlp_tx.bench.ts::Rlp.toBytes (transaction-shaped)::eip7702 tuple (with access + authorization lists)` | 173,571 ops/s | 165,334 ops/s | -4.7% | a57efdb8 |
| `TxEnvelopeEip1559.bench.ts::TxEnvelopeEip1559.serialize::minimal (no access list)` | 475,391 ops/s | 282,563 ops/s | -40.6% | a57efdb8 |
| `TxEnvelopeEip1559.bench.ts::TxEnvelopeEip1559.serialize::with access list (2 entries, 4 storage keys)` | 153,759 ops/s | 136,665 ops/s | -11.1% | a57efdb8 |
| `TxEnvelopeEip1559.bench.ts::TxEnvelopeEip1559.deserialize::minimal (no access list)` | 456,898 ops/s | 258,835 ops/s | -43.4% | a57efdb8 |
| `TxEnvelopeEip1559.bench.ts::TxEnvelopeEip1559.deserialize::with access list (2 entries, 4 storage keys)` | 147,861 ops/s | 111,625 ops/s | -24.5% | a57efdb8 |
| `TxEnvelopeEip1559.bench.ts::TxEnvelopeEip1559.hash::minimal (no access list)` | 168,751 ops/s | 109,894 ops/s | -34.9% | a57efdb8 |
| `TxEnvelopeEip1559.bench.ts::TxEnvelopeEip1559.hash::with access list (2 entries, 4 storage keys)` | 58,327 ops/s | 51,429 ops/s | -11.8% | a57efdb8 |

> Note: serialize/deserialize/hash regressions tracked for follow-up — read paths (`Rlp.fromHex`) gained 16-22% but the encode/hash paths regressed and need re-investigation before the next bench cycle.
