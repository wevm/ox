//! Native evm2 is the oracle for the WASM artifact.
//!
//! This runs the shared fixtures through `Evm::transact` compiled for the host
//! and owns the `expected` half of `fixtures/call-tx.json`. The TypeScript suite
//! runs the same fixtures through the artifact and verifies the same file, so a
//! disagreement between native and WASM evm2 shows up as a diff rather than as
//! two independently plausible results.
//!
//! Regenerate with `OX_UPDATE_FIXTURES=1 cargo test --test oracle`.

use alloy_consensus::{EthereumTxEnvelope, TxEip4844, transaction::Recovered};
use alloy_eips::eip2718::Decodable2718;
use alloy_primitives::{Address, Bytes, U256, hex};
use evm2::{
    BaseEvmTypes, Evm, ExecutionConfig, Precompiles, SpecId, TxResult, Version,
    bytecode::Bytecode,
    env::BlockEnvExt,
    ethereum::{TxEnvelope, ethereum_tx_registry},
    evm::{
        AccountChangeRef, AccountInfo, AccountInfoRef, InMemoryDB, PendingState, StateChangeSink,
        StateChangeSource, StorageChange,
    },
    interpreter::Word,
};
use serde_json::{Map, Value, json};
use std::{fs, path::PathBuf};

fn path() -> PathBuf {
    PathBuf::from(env!("CARGO_MANIFEST_DIR")).join("fixtures/call-tx.json")
}

fn hex_word(value: &Value) -> U256 {
    U256::from_str_radix(value.as_str().unwrap().trim_start_matches("0x"), 16).unwrap()
}

fn hex_bytes(value: &Value) -> Bytes {
    Bytes::from(hex::decode(value.as_str().unwrap()).unwrap())
}

fn spec_id(name: &str) -> SpecId {
    match name {
        "cancun" => SpecId::CANCUN,
        "prague" => SpecId::PRAGUE,
        "osaka" => SpecId::OSAKA,
        other => panic!("unknown spec `{other}`"),
    }
}

fn block_env(block: &Map<String, Value>) -> BlockEnvExt {
    BlockEnvExt {
        number: hex_word(&block["number"]),
        beneficiary: block["beneficiary"].as_str().unwrap().parse().unwrap(),
        timestamp: hex_word(&block["timestamp"]),
        gas_limit: hex_word(&block["gasLimit"]),
        basefee: hex_word(&block["basefee"]),
        difficulty: hex_word(&block["difficulty"]),
        prevrandao: hex_word(&block["prevrandao"]),
        blob_basefee: hex_word(&block["blobBasefee"]),
        slot_num: hex_word(&block["slotNum"]),
        ext: (),
        _non_exhaustive: (),
    }
}

/// Seeds evm2's own in-memory database from the fixture accounts.
fn database(accounts: &[Value]) -> InMemoryDB {
    let mut db = InMemoryDB::default();
    for account in accounts {
        let address: Address = account["address"].as_str().unwrap().parse().unwrap();
        let code = hex_bytes(&account["code"]);
        let mut info = AccountInfo {
            balance: Word::from(hex_word(&account["balance"])),
            nonce: account["nonce"].as_u64().unwrap(),
            code_hash: account["codeHash"].as_str().unwrap().parse().unwrap(),
            code: None,
            _non_exhaustive: (),
        };
        if !code.is_empty() {
            info = info.with_code(Bytecode::new_raw_checked(code).expect("fixture code"));
        }
        db.insert_account_info(&address, info);
        if let Some(slots) = account.get("storage").and_then(Value::as_object) {
            for (key, value) in slots {
                db.insert_account_storage(
                    &address,
                    &hex_word(&Value::String(key.clone())),
                    &hex_word(value),
                );
            }
        }
    }
    db
}

fn recovered(fixture: &Map<String, Value>) -> Recovered<TxEnvelope> {
    let bytes = hex_bytes(&fixture["envelope"]);
    let envelope = EthereumTxEnvelope::<TxEip4844>::decode_2718(&mut &bytes[..])
        .expect("fixture envelope is valid EIP-2718");
    let signer: Address = fixture["signer"].as_str().unwrap().parse().unwrap();
    Recovered::new_unchecked(TxEnvelope::from(envelope), signer)
}

/// The same shape the TypeScript codec decodes, so both sides compare like for
/// like rather than through two different projections.
fn encode(result: &TxResult) -> Value {
    json!({
        "status": result.status,
        "stop": result.stop as u8,
        "totalGasSpent": format!("{:#x}", result.total_gas_spent),
        "stateGasSpent": format!("{:#x}", result.state_gas_spent),
        "refunded": format!("{:#x}", result.refunded),
        "floorGas": format!("{:#x}", result.floor_gas),
        "txGasUsed": format!("{:#x}", result.tx_gas_used()),
        "createdAddress": result.created_address.map(|a| a.to_string().to_lowercase()),
        "errorCode": result.error_code.map(|c| format!("{:#x}", c.get())),
        "output": format!("0x{}", hex::encode(&result.output)),
        "logs": result.logs.iter().map(|log| json!({
            "address": log.address.to_string().to_lowercase(),
            "topics": log.topics().iter().map(|t| format!("{t:#x}")).collect::<Vec<_>>(),
            "data": format!("0x{}", hex::encode(&log.data.data)),
        })).collect::<Vec<_>>(),
    })
}

/// Collects a pending state into sorted JSON.
///
/// Sorted rather than visit-ordered: the TypeScript side groups records by kind,
/// so this compares the same sets rather than an interleaving neither side keeps.
#[derive(Default)]
struct Records {
    accounts: Vec<String>,
    bytecode: Vec<String>,
    reads: Vec<String>,
    storage: Vec<String>,
    wipes: Vec<String>,
}

fn info(value: Option<AccountInfoRef<'_>>) -> String {
    match value {
        Some(info) => format!(
            "{:#x}/{}/{:#x}",
            info.balance, info.nonce, info.code_hash
        ),
        None => "absent".to_string(),
    }
}

impl StateChangeSink for Records {
    type Error = core::convert::Infallible;

    fn bytecode(
        &mut self,
        code_hash: alloy_primitives::B256,
        code: &Bytecode,
    ) -> Result<(), Self::Error> {
        self.bytecode
            .push(format!("{code_hash:#x}|0x{}", hex::encode(code.original_bytes())));
        Ok(())
    }

    fn account(&mut self, change: AccountChangeRef<'_>) -> Result<(), Self::Error> {
        self.accounts.push(format!(
            "{}|{}|{}|{}|{}",
            change.address.to_string().to_lowercase(),
            info(change.original),
            info(change.current),
            change.created,
            change.selfdestructed,
        ));
        Ok(())
    }

    fn storage_wipe(&mut self, address: Address) -> Result<(), Self::Error> {
        self.wipes.push(address.to_string().to_lowercase());
        Ok(())
    }

    fn storage(&mut self, change: StorageChange) -> Result<(), Self::Error> {
        self.storage.push(format!(
            "{}|{:#x}|{:#x}|{:#x}",
            change.address.to_string().to_lowercase(),
            change.key,
            change.original,
            change.current,
        ));
        Ok(())
    }

    fn account_read(
        &mut self,
        address: Address,
        value: Option<AccountInfoRef<'_>>,
    ) -> Result<(), Self::Error> {
        self.reads
            .push(format!("{}|{}", address.to_string().to_lowercase(), info(value)));
        Ok(())
    }

    fn storage_read(
        &mut self,
        address: Address,
        key: Word,
        value: Word,
    ) -> Result<(), Self::Error> {
        self.storage.push(format!(
            "{}|{:#x}|read|{:#x}",
            address.to_string().to_lowercase(),
            key,
            value,
        ));
        Ok(())
    }
}

fn pending(state: &PendingState) -> Value {
    let mut records = Records::default();
    let Ok(()) = state.visit(&mut records);
    records.accounts.sort();
    records.bytecode.sort();
    records.reads.sort();
    records.storage.sort();
    records.wipes.sort();
    json!({
        "accounts": records.accounts,
        "bytecode": records.bytecode,
        "empty": state.is_empty(),
        "reads": records.reads,
        "storage": records.storage,
        "wipes": records.wipes,
    })
}

fn run(fixture: &Map<String, Value>, spec: &str) -> Value {
    let spec_id = spec_id(spec);
    let chain_id = hex_word(&fixture["chainId"]).to::<u64>();
    let accounts = fixture["accounts"].as_array().unwrap();

    let mut evm: Evm<'_, BaseEvmTypes> = Evm::new_with_execution_config(
        ExecutionConfig::for_spec_and_version(
            spec_id,
            Version { chain_id, ..Version::new(spec_id) },
        ),
        spec_id,
        block_env(fixture["block"].as_object().unwrap()),
        ethereum_tx_registry(spec_id),
        database(accounts),
        Precompiles::base(spec_id),
    );

    match evm.transact(&recovered(fixture)) {
        Ok(handle) => {
            // Detaching records what the transaction would have written, which
            // `call_tx` discards before a caller can see it.
            let detached = handle.detach();
            let mut value = encode(&detached.result);
            value["pendingState"] = pending(&detached.pending_state);
            value
        }
        Err(error) => json!({ "handlerError": error.to_string() }),
    }
}

#[test]
fn native_evm2_matches_the_recorded_expectations() {
    let file = path();
    let mut root: Value =
        serde_json::from_str(&fs::read_to_string(&file).expect("fixtures/call-tx.json")).unwrap();

    let specs: Vec<String> = root["specs"]
        .as_array()
        .unwrap()
        .iter()
        .map(|s| s.as_str().unwrap().to_owned())
        .collect();

    let update = std::env::var_os("OX_UPDATE_FIXTURES").is_some();
    let mut mismatches = Vec::new();

    let fixtures = root["fixtures"].as_array_mut().unwrap();
    for fixture in fixtures {
        let object = fixture.as_object_mut().unwrap();
        let name = object["name"].as_str().unwrap().to_owned();

        let mut expected = Map::new();
        for spec in &specs {
            let actual = run(object, spec);
            if update {
                expected.insert(spec.clone(), actual);
                continue;
            }
            let recorded = object
                .get("expected")
                .and_then(|value| value.get(spec))
                .unwrap_or_else(|| panic!("`{name}` has no expectation for `{spec}`"));
            if recorded != &actual {
                mismatches.push(format!(
                    "{name} / {spec}\n  recorded: {recorded}\n  native:   {actual}"
                ));
            }
        }
        if update {
            object.insert("expected".to_owned(), Value::Object(expected));
        }
    }

    if update {
        fs::write(&file, format!("{}\n", serde_json::to_string_pretty(&root).unwrap())).unwrap();
        return;
    }

    assert!(mismatches.is_empty(), "native evm2 disagrees:\n\n{}", mismatches.join("\n\n"));
}

/// Every recorded expectation must be reachable, so a stale spec or a renamed
/// fixture cannot sit in the file unnoticed.
#[test]
fn recorded_expectations_have_no_stale_entries() {
    let root: Value =
        serde_json::from_str(&fs::read_to_string(path()).expect("fixtures/call-tx.json")).unwrap();
    // Sorted on both sides: the file's key order is the serializer's business,
    // not a contract.
    let mut specs: Vec<&str> =
        root["specs"].as_array().unwrap().iter().map(|s| s.as_str().unwrap()).collect();
    specs.sort_unstable();

    for fixture in root["fixtures"].as_array().unwrap() {
        let name = fixture["name"].as_str().unwrap();
        let expected = fixture["expected"]
            .as_object()
            .unwrap_or_else(|| panic!("`{name}` has no expectations"));
        let mut recorded: Vec<&str> = expected.keys().map(String::as_str).collect();
        recorded.sort_unstable();
        assert_eq!(recorded, specs, "`{name}` records specs the fixture does not declare");
    }
}

/// A fixture whose `expected` says nothing is a fixture that proves nothing.
#[test]
fn no_fixture_only_records_a_handler_error() {
    let root: Value = serde_json::from_str(&fs::read_to_string(path()).unwrap()).unwrap();
    let mut all_failed = Vec::new();
    for fixture in root["fixtures"].as_array().unwrap() {
        let expected = fixture["expected"].as_object().unwrap();
        if expected.values().all(|v| v.get("handlerError").is_some()) {
            all_failed.push(fixture["name"].as_str().unwrap().to_owned());
        }
    }
    assert!(
        all_failed.is_empty(),
        "these fixtures are rejected on every spec, so they test transaction validation \
         rather than execution: {}",
        all_failed.join(", "),
    );
}

/// Generated-corpus differential.
///
/// The hand-written fixtures above cover known shapes; this covers shapes nobody
/// thought of. A seeded generator emits transactions, accounts, and code, records
/// what native evm2 does with them, and the TypeScript suite replays the same
/// corpus through the artifact. Regenerate with
/// `OX_UPDATE_FIXTURES=1 cargo test --test oracle`.
mod generated {
    use super::*;
    use alloy_consensus::{SignableTransaction, TxLegacy};
    use alloy_eips::eip2718::Encodable2718;
    use alloy_primitives::{Signature, TxKind};

    /// Cases in the corpus. Large enough to reach past the curated shapes, small
    /// enough that the recorded file stays reviewable.
    const COUNT: usize = 96;

    /// Fixed seed: the corpus is a committed regression suite, not a fresh draw
    /// each run. Change it to explore elsewhere.
    const SEED: u64 = 0x5eed_1eaf_c0ff_ee01;

    fn path() -> PathBuf {
        PathBuf::from(env!("CARGO_MANIFEST_DIR")).join("fixtures/fuzz.json")
    }

    /// xorshift64*, so the corpus reproduces without a dependency.
    struct Rng(u64);

    impl Rng {
        fn next(&mut self) -> u64 {
            self.0 ^= self.0 >> 12;
            self.0 ^= self.0 << 25;
            self.0 ^= self.0 >> 27;
            self.0.wrapping_mul(0x2545_f491_4f6c_dd1d)
        }

        fn below(&mut self, bound: u64) -> u64 {
            self.next() % bound
        }

        fn pick<'a, T>(&mut self, items: &'a [T]) -> &'a T {
            &items[self.below(items.len() as u64) as usize]
        }
    }

    /// Snippets worth reaching, by opcode class.
    ///
    /// `BLOCKHASH` is deliberately absent: `Database.fromMemory` fails an
    /// unseeded hash where evm2's `InMemoryDB` synthesizes one, a recorded
    /// divergence that would show up here as a false mismatch.
    const CODE: &[&str] = &[
        "",                             // no code
        "00",                           // STOP
        "602a5f5260205ff3",             // return 42
        "5f545f52602a5f5560205ff3",     // load slot 0, store 42, return the old value
        "60015f5500",                   // store 1 into slot 0
        "5f5f5500",                     // clear slot 0, an EIP-3529 refund
        "60015f5560025f5500",           // store twice, warm on the second
        "5f5ffd",                       // REVERT with empty data
        "602a5f5260205ffd",             // REVERT with data
        "fe",                           // INVALID
        "5f5f5fa100",                   // LOG1
        "602a5f5260205f5fa200",         // LOG2 with data
        "33ff",                         // CALLER SELFDESTRUCT
        "60015f5533ff",                 // store then SELFDESTRUCT
        "5f5f20505f5260205ff3",         // KECCAK256 over empty memory
        "5f61ffff5200",                 // expand memory
        "5f5f5f5f5f730000000000000000000000000000000000000004", // CALL identity
        "67602a5f5260205ff35f5260086018f3", // initcode deploying a returner
        "5f5ff3",                       // deploy empty code
        "5b5f56",                       // JUMPDEST, PUSH0, JUMP: a tight loop out of gas
        "3d5f5f3e00",                   // RETURNDATACOPY with no return data
        "5f3f5000",                     // EXTCODEHASH of address zero
        "4700",                         // SELFBALANCE
        "484900",                       // PREVRANDAO BLOBBASEFEE
    ];

    /// Addresses the corpus draws from. The last has no account, so reads miss.
    const ADDRESSES: &[&str] = &[
        "0x00000000000000000000000000000000000000c0",
        "0x00000000000000000000000000000000000000c1",
        "0x0000000000000000000000000000000000000004",
        "0x000000000000000000000000000000000000dead",
    ];

    const SENDER: &str = "0x70997970c51812dc3a010c7d01b50e0d17dc79c8";
    const SPECS: &[&str] = &["cancun", "prague", "osaka"];

    fn code(rng: &mut Rng) -> String {
        // A quarter of the corpus is arbitrary bytes: whatever they decode to,
        // both engines have to agree on how it halts.
        if rng.below(4) == 0 {
            let length = rng.below(24) as usize;
            let mut bytes = String::new();
            for _ in 0..length {
                bytes.push_str(&format!("{:02x}", rng.below(256)));
            }
            return format!("0x{bytes}");
        }
        format!("0x{}", rng.pick(CODE))
    }

    fn account(rng: &mut Rng, address: &str, code: &str) -> Value {
        let mut entry = json!({
            "address": address,
            "balance": format!("{:#x}", rng.pick(&[0u64, 1, 1_000, 1_000_000_000_000_000_000])),
            "code": code,
            "codeHash": format!("{:#x}", alloy_primitives::keccak256(hex_bytes(&json!(code)))),
            "nonce": rng.below(3),
        });
        // Half the accounts carry storage, so warm reads and clears are reached.
        if rng.below(2) == 0 {
            let mut slots = Map::new();
            for _ in 0..=rng.below(2) {
                slots.insert(
                    format!("{:#x}", rng.below(3)),
                    json!(format!("{:#x}", rng.pick(&[0u64, 1, 42, u64::MAX]))),
                );
            }
            entry["storage"] = Value::Object(slots);
        }
        entry
    }

    fn case(rng: &mut Rng, index: usize) -> Map<String, Value> {
        let create = rng.below(4) == 0;
        let target = rng.pick(ADDRESSES).to_string();

        let mut accounts = vec![json!({
            "address": SENDER,
            "balance": format!("{:#x}", 10u128.pow(18)),
            "code": "0x",
            "codeHash": format!("{:#x}", alloy_primitives::keccak256([])),
            "nonce": 0,
        })];
        for address in ADDRESSES.iter().take(3) {
            if rng.below(4) == 0 {
                continue;
            }
            let code = code(rng);
            accounts.push(account(rng, address, &code));
        }

        let data = if create { code(rng) } else { code(rng) };
        let gas_limit = *rng.pick(&[21_000u64, 30_000, 100_000, 200_000]);
        let gas_price = *rng.pick(&[0u64, 1]);
        let value = *rng.pick(&[0u64, 1, 1_000]);

        let tx = TxLegacy {
            chain_id: Some(1),
            nonce: 0,
            gas_price: gas_price as u128,
            gas_limit,
            to: if create {
                TxKind::Create
            } else {
                TxKind::Call(target.parse().unwrap())
            },
            value: U256::from(value),
            input: hex_bytes(&json!(data)),
        };
        // The signature is inert: evm2 strips it and takes the signer from
        // `Recovered`, so a placeholder is enough to satisfy 2718 decoding.
        let signed = tx.into_signed(Signature::new(U256::from(1), U256::from(1), false));
        let mut envelope = Vec::new();
        signed.encode_2718(&mut envelope);

        let mut fixture = Map::new();
        fixture.insert("accounts".into(), Value::Array(accounts));
        fixture.insert(
            "block".into(),
            json!({
                "basefee": "0x0",
                "beneficiary": "0x00000000000000000000000000000000000000cb",
                "blobBasefee": "0x1",
                "difficulty": "0x0",
                "gasLimit": "0x1c9c380",
                "number": "0x1",
                "prevrandao": "0x0",
                "slotNum": "0x0",
                "timestamp": "0x1",
            }),
        );
        fixture.insert("chainId".into(), json!("0x1"));
        fixture.insert("envelope".into(), json!(format!("0x{}", hex::encode(&envelope))));
        fixture.insert("name".into(), json!(format!("case-{index:03}")));
        fixture.insert("signer".into(), json!(SENDER));
        fixture.insert("spec".into(), json!(*rng.pick(SPECS)));
        fixture
    }

    #[test]
    fn native_evm2_matches_the_generated_corpus() {
        let mut rng = Rng(SEED);
        let cases: Vec<Value> = (0..COUNT)
            .map(|index| {
                let mut fixture = case(&mut rng, index);
                let spec = fixture["spec"].as_str().unwrap().to_string();
                let expected = run(&fixture, &spec);
                fixture.insert("expected".into(), expected);
                Value::Object(fixture)
            })
            .collect();

        let recorded = json!({
            "$comment": "Generated by `cargo test --test oracle`. Do not edit by hand.",
            "cases": cases,
            "count": COUNT,
            "seed": format!("{SEED:#x}"),
        });

        let file = path();
        if std::env::var_os("OX_UPDATE_FIXTURES").is_some() {
            fs::write(
                &file,
                format!("{}\n", serde_json::to_string_pretty(&recorded).unwrap()),
            )
            .unwrap();
            return;
        }

        let previous: Value =
            serde_json::from_str(&fs::read_to_string(&file).expect("fixtures/fuzz.json")).unwrap();
        assert_eq!(
            previous, recorded,
            "the generated corpus drifted; regenerate with OX_UPDATE_FIXTURES=1"
        );
    }
}
