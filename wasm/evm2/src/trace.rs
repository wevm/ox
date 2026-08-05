//! Records evm2's inspector hooks as a flat event stream.
//!
//! The hooks fire with live interpreter state that cannot cross the ABI, and
//! `step` fires once per instruction, so a host callback per hook is not an
//! option. This collector runs compiled instead, appending one record per hook in
//! the order evm2 calls them.
//!
//! It records and nothing else. Structure, call trees, and gas attribution are
//! the caller's to build from the stream, which keeps this side free of any shape
//! evm2 did not hand us and lets that shape change without a rebuilt artifact.

use alloc::vec::Vec;

use alloy_primitives::{Address, B256, Log, U256};
use evm2::{
    BaseEvmTypes, Inspector,
    interpreter::{Interpreter, Message, MessageKind, MessageResult},
};

/// Record tags in a serialized event stream.
pub mod event {
    /// End of the stream.
    pub const END: u8 = 0;
    /// A frame's interpreter was initialized.
    pub const INITIALIZE: u8 = 1;
    /// An instruction is about to execute.
    pub const STEP: u8 = 2;
    /// An instruction finished.
    pub const STEP_END: u8 = 3;
    /// A log was emitted.
    pub const LOG: u8 = 4;
    /// A call message is about to execute.
    pub const CALL: u8 = 5;
    /// A call message finished.
    pub const CALL_END: u8 = 6;
    /// A create message is about to execute.
    pub const CREATE: u8 = 7;
    /// A create message finished.
    pub const CREATE_END: u8 = 8;
    /// A contract self-destructed.
    pub const SELFDESTRUCT: u8 = 9;
}

/// What a collector records.
#[derive(Clone, Copy, Debug, Default)]
pub struct Options {
    /// Records `step` and `step_end`.
    ///
    /// Off by default, and deliberately: these fire once per instruction, so a
    /// mainnet transaction produces millions of records where the message hooks
    /// produce tens.
    pub steps: bool,
    /// Records the stack on each step. Requires [`Self::steps`].
    pub stack: bool,
    /// Records memory size on each step. Requires [`Self::steps`].
    pub memory: bool,
    /// Largest stream to keep, in bytes.
    pub limit: u32,
}

/// Collects hook records into a bounded buffer.
#[derive(Debug, Default)]
pub struct Collector {
    options: Options,
    stream: Vec<u8>,
    /// Set once the limit stopped a record from being written.
    truncated: bool,
}

impl Collector {
    /// Creates a collector recording what `options` selects.
    pub fn new(options: Options) -> Self {
        Self { options, stream: Vec::new(), truncated: false }
    }

    /// Takes the recorded stream and whether it stopped short.
    pub fn take(&mut self) -> (Vec<u8>, bool) {
        // Terminates outside the byte budget: a truncated stream must still end
        // with a marker, or a reader cannot tell it from a short response.
        self.stream.push(event::END);
        (core::mem::take(&mut self.stream), core::mem::take(&mut self.truncated))
    }

    /// Whether a record of `length` bytes still fits.
    ///
    /// Refusing whole records rather than trimming one keeps every record in the
    /// stream complete, so a reader never meets a half-written one.
    fn fits(&mut self, length: usize) -> bool {
        if self.stream.len() + length <= self.options.limit as usize {
            return true;
        }
        self.truncated = true;
        false
    }

    fn u8(&mut self, value: u8) {
        self.stream.push(value);
    }

    fn u16(&mut self, value: u16) {
        self.stream.extend_from_slice(&value.to_le_bytes());
    }

    fn u32(&mut self, value: u32) {
        self.stream.extend_from_slice(&value.to_le_bytes());
    }

    fn u64(&mut self, value: u64) {
        self.stream.extend_from_slice(&value.to_le_bytes());
    }

    fn word(&mut self, value: U256) {
        self.stream.extend_from_slice(&value.to_be_bytes::<32>());
    }

    fn address(&mut self, value: Address) {
        self.stream.extend_from_slice(value.as_slice());
    }

    fn hash(&mut self, value: B256) {
        self.stream.extend_from_slice(value.as_slice());
    }

    fn bytes(&mut self, value: &[u8]) {
        self.u32(value.len() as u32);
        self.stream.extend_from_slice(value);
    }

    /// Writes the fields shared by every message hook.
    fn message(&mut self, message: &Message<BaseEvmTypes>) {
        self.u8(kind(message.kind));
        self.u16(message.depth);
        self.u64(message.gas_limit);
        self.address(message.caller);
        self.address(message.destination);
        self.address(message.code_address);
        self.word(message.value);
        self.bytes(&message.input);
    }

    /// Writes the fields shared by every message-end hook.
    fn result(&mut self, result: &MessageResult<BaseEvmTypes>) {
        self.u8(result.stop as u8);
        self.u64(result.gas.remaining());
        self.u64(result.gas.spent());
        match result.created_address {
            Some(address) => {
                self.u8(1);
                self.address(address);
            }
            None => self.u8(0),
        }
        self.bytes(&result.output);
    }
}

/// evm2's `MessageKind`, as the ABI numbers it.
fn kind(value: MessageKind) -> u8 {
    match value {
        MessageKind::Call => 0,
        MessageKind::DelegateCall => 1,
        MessageKind::CallCode => 2,
        MessageKind::Create => 3,
        MessageKind::Create2 => 4,
        MessageKind::StaticCall => 5,
        // `MessageKind` is `#[non_exhaustive]`, so an evm2 revision can add a
        // kind. Reporting it as unknown keeps the stream readable rather than
        // failing an execution that is otherwise fine.
        _ => u8::MAX,
    }
}

/// The collector, held outside the engine.
///
/// Keeping it here rather than inside the engine is what lets a trace be read
/// while a transaction handle is parked: that handle holds the engine's exclusive
/// borrow, so anything reached through the engine is unreachable until it
/// resolves. A [`Proxy`] goes into the engine instead and forwards here.
struct Slot(core::cell::UnsafeCell<Option<Collector>>);

// Single-threaded, and the adapter's running flag serializes every access.
unsafe impl Sync for Slot {}

static COLLECTOR: Slot = Slot(core::cell::UnsafeCell::new(None));

/// Borrows the collector, when one is installed.
///
/// SAFETY: callers hold the adapter's exclusive claim, so no other borrow is live.
fn collector() -> Option<&'static mut Collector> {
    unsafe { (*COLLECTOR.0.get()).as_mut() }
}

/// Installs a collector and returns the inspector to hand evm2.
pub fn install(options: Options) -> Proxy {
    unsafe { *COLLECTOR.0.get() = Some(Collector::new(options)) };
    Proxy
}

/// Removes the collector.
pub fn remove() {
    unsafe { *COLLECTOR.0.get() = None };
}

/// Takes the recorded stream, when a collector is installed.
pub fn take() -> Option<(Vec<u8>, bool)> {
    collector().map(Collector::take)
}

/// Forwards evm2's hooks to the collector held outside the engine.
///
/// Stateless, so evm2 owning it costs nothing and the trace survives being read
/// while a transaction handle holds the engine.
#[derive(Debug)]
pub struct Proxy;

impl Inspector<BaseEvmTypes> for Proxy {
    fn initialize_interp(&mut self, interp: &mut Interpreter<'_, '_, BaseEvmTypes>) {
        if let Some(collector) = collector() {
            collector.initialize_interp(interp);
        }
    }

    fn step(&mut self, interp: &mut Interpreter<'_, '_, BaseEvmTypes>) {
        if let Some(collector) = collector() {
            collector.step(interp);
        }
    }

    fn step_end(&mut self, interp: &mut Interpreter<'_, '_, BaseEvmTypes>) {
        if let Some(collector) = collector() {
            collector.step_end(interp);
        }
    }

    fn log(&mut self, log: &Log, host: &mut <BaseEvmTypes as evm2::EvmTypesHost>::Host<'_>) {
        if let Some(collector) = collector() {
            collector.log(log, host);
        }
    }

    fn call(
        &mut self,
        interp: &mut Interpreter<'_, '_, BaseEvmTypes>,
        message: &mut Message<BaseEvmTypes>,
    ) -> Option<MessageResult<BaseEvmTypes>> {
        if let Some(collector) = collector() {
            collector.call(interp, message);
        }
        // Always `None`: a result here would replace the call.
        None
    }

    fn call_end(
        &mut self,
        interp: &mut Interpreter<'_, '_, BaseEvmTypes>,
        message: &Message<BaseEvmTypes>,
        result: &mut MessageResult<BaseEvmTypes>,
    ) {
        if let Some(collector) = collector() {
            collector.call_end(interp, message, result);
        }
    }

    fn create(
        &mut self,
        interp: &mut Interpreter<'_, '_, BaseEvmTypes>,
        message: &mut Message<BaseEvmTypes>,
    ) -> Option<MessageResult<BaseEvmTypes>> {
        if let Some(collector) = collector() {
            collector.create(interp, message);
        }
        None
    }

    fn create_end(
        &mut self,
        interp: &mut Interpreter<'_, '_, BaseEvmTypes>,
        message: &Message<BaseEvmTypes>,
        result: &mut MessageResult<BaseEvmTypes>,
    ) {
        if let Some(collector) = collector() {
            collector.create_end(interp, message, result);
        }
    }

    fn selfdestruct(
        &mut self,
        contract: &Address,
        target: &Address,
        value: &U256,
        host: &mut <BaseEvmTypes as evm2::EvmTypesHost>::Host<'_>,
    ) {
        if let Some(collector) = collector() {
            collector.selfdestruct(contract, target, value, host);
        }
    }
}

impl Inspector<BaseEvmTypes> for Collector {
    fn initialize_interp(&mut self, interp: &mut Interpreter<'_, '_, BaseEvmTypes>) {
        if !self.options.steps || !self.fits(1 + 2 + 8) {
            return;
        }
        self.u8(event::INITIALIZE);
        self.u16(interp.message().depth);
        self.u64(interp.gas().remaining());
    }

    fn step(&mut self, interp: &mut Interpreter<'_, '_, BaseEvmTypes>) {
        if !self.options.steps {
            return;
        }
        let stack = if self.options.stack { interp.stack().len() } else { 0 };
        // Sized before anything is written, so a record is never half-appended.
        if !self.fits(1 + 4 + 1 + 2 + 8 + 4 + 1 + stack * 32) {
            return;
        }
        self.u8(event::STEP);
        self.u32(interp.pc() as u32);
        self.u8(interp.opcode());
        self.u16(interp.message().depth);
        self.u64(interp.gas().remaining());
        self.u32(if self.options.memory { interp.memory().len() as u32 } else { 0 });
        self.u8(stack as u8);
        for index in 0..stack {
            // Top of stack first, matching how a reader thinks about operands.
            let value = interp.stack().peek(index).unwrap_or_default();
            self.word(value);
        }
    }

    fn step_end(&mut self, interp: &mut Interpreter<'_, '_, BaseEvmTypes>) {
        if !self.options.steps || !self.fits(1 + 8) {
            return;
        }
        self.u8(event::STEP_END);
        self.u64(interp.gas().remaining());
    }

    fn log(&mut self, log: &Log, _host: &mut <BaseEvmTypes as evm2::EvmTypesHost>::Host<'_>) {
        let topics = log.topics().len();
        if !self.fits(1 + 20 + 1 + topics * 32 + 4 + log.data.data.len()) {
            return;
        }
        self.u8(event::LOG);
        self.address(log.address);
        self.u8(topics as u8);
        for topic in log.topics() {
            self.hash(*topic);
        }
        self.bytes(&log.data.data);
    }

    fn call(
        &mut self,
        _interp: &mut Interpreter<'_, '_, BaseEvmTypes>,
        message: &mut Message<BaseEvmTypes>,
    ) -> Option<MessageResult<BaseEvmTypes>> {
        if self.fits(1 + 71 + 4 + message.input.len()) {
            self.u8(event::CALL);
            self.message(message);
        }
        // Always `None`: returning a result here would replace the call, and an
        // observer must not change what executes.
        None
    }

    fn call_end(
        &mut self,
        _interp: &mut Interpreter<'_, '_, BaseEvmTypes>,
        _message: &Message<BaseEvmTypes>,
        result: &mut MessageResult<BaseEvmTypes>,
    ) {
        if !self.fits(1 + 18 + 21 + 4 + result.output.len()) {
            return;
        }
        self.u8(event::CALL_END);
        self.result(result);
    }

    fn create(
        &mut self,
        _interp: &mut Interpreter<'_, '_, BaseEvmTypes>,
        message: &mut Message<BaseEvmTypes>,
    ) -> Option<MessageResult<BaseEvmTypes>> {
        if self.fits(1 + 71 + 4 + message.input.len()) {
            self.u8(event::CREATE);
            self.message(message);
        }
        None
    }

    fn create_end(
        &mut self,
        _interp: &mut Interpreter<'_, '_, BaseEvmTypes>,
        _message: &Message<BaseEvmTypes>,
        result: &mut MessageResult<BaseEvmTypes>,
    ) {
        if !self.fits(1 + 18 + 21 + 4 + result.output.len()) {
            return;
        }
        self.u8(event::CREATE_END);
        self.result(result);
    }

    fn selfdestruct(
        &mut self,
        contract: &Address,
        target: &Address,
        value: &U256,
        _host: &mut <BaseEvmTypes as evm2::EvmTypesHost>::Host<'_>,
    ) {
        if !self.fits(1 + 20 + 20 + 32) {
            return;
        }
        self.u8(event::SELFDESTRUCT);
        self.address(*contract);
        self.address(*target);
        self.word(*value);
    }
}
