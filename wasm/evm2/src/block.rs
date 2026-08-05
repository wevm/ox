//! Block state accumulation.
//!
//! evm2's `BlockStateAccumulator` gathers what a block's transactions changed, so
//! it outlives any one of them and is held here rather than passed per call. A
//! transaction records into it by resolving through `commit_to`.

use alloc::vec::Vec;
use evm2::evm::{AccountInfo, BlockStateAccumulator};

use crate::abi::Writer;

/// Holds the accumulator outside the engine, like the trace collector.
///
/// The engine is borrowed while a transaction handle is outstanding, and a block
/// commits many transactions into one accumulator, so it cannot live on either.
struct Slot(core::cell::UnsafeCell<Option<BlockStateAccumulator>>);

// The adapter is single-threaded: WebAssembly has one instance per isolate and
// reentrancy is refused before any handler runs.
unsafe impl Sync for Slot {}

static BLOCK: Slot = Slot(core::cell::UnsafeCell::new(None));

/// Returns the accumulator, when one is being built.
pub fn accumulator() -> Option<&'static mut BlockStateAccumulator> {
    unsafe { (*BLOCK.0.get()).as_mut() }
}

/// Installs an empty accumulator, discarding any in progress.
pub fn install() {
    unsafe { *BLOCK.0.get() = Some(BlockStateAccumulator::new()) };
}

/// Removes the accumulator.
pub fn remove() {
    unsafe { *BLOCK.0.get() = None };
}

/// Takes the accumulator, leaving none behind.
pub fn take() -> Option<BlockStateAccumulator> {
    unsafe { (*BLOCK.0.get()).take() }
}

/// Writes an accumulator's contents in a deterministic order.
///
/// Accounts, storage, and wipes use evm2's sorted accessors. Code has none, so it
/// is sorted here by hash: it is a hash map upstream, and an unsorted enumeration
/// would differ run to run.
pub fn write(writer: &mut Writer, block: &BlockStateAccumulator) {
    let accounts = block.accounts_sorted();
    writer.u32(accounts.len() as u32);
    for (address, tracked) in &accounts {
        writer.address(*address);
        info(writer, &tracked.original);
        info(writer, &tracked.current);
    }

    let wipes = block.storage_wipes_sorted();
    writer.u32(wipes.len() as u32);
    for address in &wipes {
        writer.address(*address);
    }

    let storage = block.storage_sorted();
    writer.u32(storage.len() as u32);
    for (key, tracked) in &storage {
        writer.address(key.address());
        writer.word(key.key());
        writer.word(tracked.original);
        writer.word(tracked.current);
    }

    let mut code: Vec<_> = block.code().collect();
    code.sort_unstable_by_key(|(hash, _)| **hash);
    writer.u32(code.len() as u32);
    for (hash, bytecode) in &code {
        writer.hash(**hash);
        writer.bytes(bytecode.original_bytes().as_ref());
    }
}

/// Writes an account's fields, or a flag saying it is absent.
fn info(writer: &mut Writer, value: &Option<AccountInfo>) {
    match value {
        Some(info) => {
            writer.bool(true);
            writer.word(info.balance);
            writer.u64(info.nonce);
            writer.hash(info.code_hash);
        }
        None => writer.bool(false),
    }
}
