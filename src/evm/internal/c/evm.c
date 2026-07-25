// Ox EVM — interpreter core.
//
// Phase 1 scope: the word machine. Arithmetic, bitwise, comparison, memory,
// keccak, and control flow within a single frame. No accounts, no storage, no
// calls — those arrive in Phase 3 along with the suspend/resume host protocol
// whose status codes are already reserved below.
//
// The module has no imports and no libc dependency, so the same translation
// unit compiles to a freestanding wasm32 module (for browsers) and to a native
// object linked into an N-API addon (for Node/Bun).

#include "keccak.h"
#include "opcodes.h"
#include "state.h"
#include "u256.h"

// ---------------------------------------------------------------------------
// Allocation
// ---------------------------------------------------------------------------

#ifdef __wasm__
extern uint8_t __heap_base;
static uint8_t *heap_ptr = 0;
static uint8_t *heap_end = 0;

static void *ox_alloc(uint64_t n) {
  if (!heap_ptr) {
    heap_ptr = &__heap_base;
    heap_end = (uint8_t *)((uint64_t)__builtin_wasm_memory_size(0) * 65536);
  }
  n = (n + 15) & ~(uint64_t)15;
  if (heap_ptr + n > heap_end) {
    uint64_t need = ((uint64_t)(heap_ptr + n - heap_end) + 65535) / 65536;
    if (__builtin_wasm_memory_grow(0, (uint32_t)need) == (uint32_t)-1) return 0;
    heap_end += need * 65536;
  }
  void *p = heap_ptr;
  heap_ptr += n;
  return p;
}
#else
void *malloc(unsigned long);
static void *ox_alloc(uint64_t n) { return malloc((unsigned long)n); }
#endif

// `__builtin_mem*` lower to wasm `memory.fill` / `memory.copy` (the module
// already builds with bulk-memory). The byte-at-a-time loops these replaced
// cost ~1.2 ns/byte, which made clearing dominate short executions.
static void mem_zero(uint8_t *p, uint64_t n) {
  __builtin_memset(p, 0, (unsigned long)n);
}

static void mem_copy(uint8_t *dst, const uint8_t *src, uint64_t n) {
  __builtin_memcpy(dst, src, (unsigned long)n);
}

// ---------------------------------------------------------------------------
// Limits and status codes
// ---------------------------------------------------------------------------

#define STACK_LIMIT 1024
#define MAX_CODE 49152    // 2x EIP-170, so initcode fits
#define MAX_INPUT 1048576 // 1 MiB of calldata
#define DEFAULT_MEMORY (4 * 1024 * 1024)

typedef enum {
  EVM_SUCCESS = 0,
  EVM_REVERT = 1,
  EVM_OUT_OF_GAS = 2,
  EVM_STACK_UNDERFLOW = 3,
  EVM_STACK_OVERFLOW = 4,
  EVM_INVALID_OPCODE = 5,
  EVM_INVALID_JUMP = 6,
  EVM_OUT_OF_MEMORY = 7,
  EVM_CODE_TOO_LARGE = 8,
  EVM_INPUT_TOO_LARGE = 9,
  EVM_STATIC_VIOLATION = 10,
  // Reserved for the Phase 3 suspend/resume protocol. The driver treats any
  // status >= EVM_NEEDS_ACCOUNT as "fill the request buffer and resume".
  EVM_NEEDS_ACCOUNT = 64,
  EVM_NEEDS_STORAGE = 65,
  EVM_NEEDS_PRECOMPILE = 66,
} evm_status;

/** Block and transaction environment, supplied by the host before a run. */
typedef struct {
  uint8_t origin[20];
  uint8_t coinbase[20];
  u256 gas_price;
  u256 base_fee;
  u256 blob_base_fee;
  u256 prev_randao;
  uint64_t number;
  uint64_t timestamp;
  uint64_t block_gas_limit;
  u256 chain_id;
  u256 blob_hashes[8];
  int32_t blob_count;
  // The 256 most recent block hashes, index 0 being `number - 1`.
  uint8_t block_hashes[256][32];
  int32_t block_hash_count;
} evm_context;

// EIP-2929 access costs.
#define GAS_COLD_ACCOUNT 2600
#define GAS_WARM 100
#define GAS_COLD_SLOAD 2100
#define GAS_SSET 20000
#define GAS_SRESET 2900
// EIP-3529 refunds.
#define REFUND_SCLEAR 4800

/**
 * Precomputed properties of a basic block.
 *
 * Validating gas and stack bounds once per block instead of once per
 * instruction is the single largest win available to an interpreter of this
 * shape, and it is why the opcode cases below carry no checks of their own.
 */
typedef struct {
  int32_t gas;              // total static gas for the block
  int16_t stack_req;        // items that must be on the stack at entry
  int16_t stack_max_growth; // peak height increase within the block
} block_info;

typedef struct {
  u256 stack[STACK_LIMIT];
  int sp;

  uint8_t code[MAX_CODE];
  int code_len;
  // Bitmap, one bit per code position. A bitmap rather than a byte array
  // because this is cleared on every analysis and jumps read it rarely.
  uint8_t *jumpdest;
  block_info *blocks;
  // Block index per code position, written only at block starts. Never
  // cleared: the interpreter only reads positions analysis just wrote.
  int32_t *block_at;

  uint8_t input[MAX_INPUT];
  int input_len;

  uint8_t *memory;
  uint64_t memory_cap;
  uint64_t memory_size; // in bytes, always a multiple of 32
  uint64_t memory_cost; // gas already charged for expansion

  uint8_t *output;
  int output_len;

  int64_t gas;

  // Analysis is a pure function of the bytecode, so it is computed by
  // `evm_set_code` and reused across runs. revm caches the equivalent work in
  // `Bytecode::new_raw`; re-deriving it per call was costing ~50% of a run.
  int analyzed;

  evm_state *st;
  evm_context ctx;
  // The frame currently executing.
  int32_t self;        // account index of the executing address
  uint8_t caller[20];
  u256 call_value;
  int is_static;
  int depth;
  uint8_t *returndata; // result of the most recent sub-call
  int32_t returndata_len;
  // Staging area the host reads and writes across the ABI boundary.
  uint8_t *stage;
} evm_vm;

// ---------------------------------------------------------------------------
// Stack
// ---------------------------------------------------------------------------

// `sp` and `gas` live in locals inside `interpret`, not in the VM struct. Read
// through the `vm` pointer they were reloaded and re-stored on every
// instruction, because the compiler cannot prove nothing else aliases them.
// `SYNC` writes them back before anything that inspects the VM, and `HALT`
// writes them back on the way out.
//
// `sp` points one past the top of the stack. Bounds are guaranteed by the
// enclosing block's entry check, so these do not re-validate — correctness
// rests on `analyze` computing `stack_req` and `stack_max_growth` correctly.
//
// A pushed value is materialized before `sp` moves: writing this as
// `*sp++ = (v)` is undefined behaviour whenever `v` itself reads `sp` — which
// `PUSH(PEEK(n))` in DUP does, and which silently duplicated the stale slot
// above the top.
#define PUSH(v)          \
  do {                   \
    u256 pushed_ = (v);  \
    *sp++ = pushed_;     \
  } while (0)
#define POP() (*--sp)
#define PEEK(i) (sp[-1 - (i)])

/**
 * Replaces the top two words with `expr` over them.
 *
 * `a` is the top of the stack and `b` the word beneath, matching the operand
 * order of every two-input EVM instruction. One store and one `sp` adjustment,
 * against the three 32-byte copies that `PUSH(f(POP(), POP()))` compiled to.
 */
#define BINARY(expr)         \
  do {                       \
    const u256 a = sp[-1];    \
    const u256 b = sp[-2];    \
    sp[-2] = (expr);          \
    sp--;                     \
  } while (0)

/** Replaces the top word with `expr` over it. */
#define UNARY(expr)        \
  do {                     \
    const u256 a = sp[-1];  \
    sp[-1] = (expr);        \
  } while (0)

#define SYNC()                             \
  do {                                     \
    vm->sp = (int)(sp - vm->stack);         \
    vm->gas = gas;                          \
  } while (0)

/** Charges dynamic gas. Static per-block gas is charged by `ENTER_BLOCK`. */
#define USE_GAS(n)                \
  do {                            \
    int64_t cost_ = (int64_t)(n); \
    if (gas < cost_) {            \
      gas = 0;                    \
      SYNC();                     \
      return EVM_OUT_OF_GAS;      \
    }                             \
    gas -= cost_;                 \
  } while (0)

/** An exceptional halt consumes all remaining gas. */
#define HALT(status) \
  do {               \
    gas = 0;         \
    SYNC();          \
    return (status); \
  } while (0)

/** A normal halt keeps the unspent gas. */
#define DONE(status) \
  do {               \
    SYNC();          \
    return (status); \
  } while (0)

#define JUMPDEST_SET(i) (vm->jumpdest[(i) >> 3] |= (uint8_t)(1 << ((i) & 7)))
#define JUMPDEST_GET(i) (vm->jumpdest[(i) >> 3] & (1 << ((i) & 7)))

// ---------------------------------------------------------------------------
// Memory
// ---------------------------------------------------------------------------

static inline uint64_t memory_gas(uint64_t words) {
  return 3 * words + words * words / 512;
}

/**
 * Grows memory to cover `[offset, offset + size)` and charges the expansion.
 * A zero-length access never expands, per the yellow paper.
 */
static evm_status memory_expand(evm_vm *vm, uint64_t offset, uint64_t size,
                                int64_t *gas) {
  if (size == 0) return EVM_SUCCESS;
  uint64_t end = offset + size;
  if (end < offset) return EVM_OUT_OF_GAS; // 64-bit overflow: unaffordable
  if (end <= vm->memory_size) return EVM_SUCCESS;
  if (end > vm->memory_cap) return EVM_OUT_OF_MEMORY;

  uint64_t words = (end + 31) / 32;
  uint64_t cost = memory_gas(words);
  if (cost > vm->memory_cost) {
    int64_t charge = (int64_t)(cost - vm->memory_cost);
    if (*gas < charge) {
      *gas = 0;
      return EVM_OUT_OF_GAS;
    }
    *gas -= charge;
    vm->memory_cost = cost;
  }
  vm->memory_size = words * 32;
  return EVM_SUCCESS;
}

/** Extracts the low 20 bytes of a word as an address. */
static inline void word_to_address(u256 w, uint8_t *out) {
  uint8_t buf[32];
  u256_to_be(w, buf);
  for (int i = 0; i < 20; i++) out[i] = buf[12 + i];
}

static inline u256 address_to_word(const uint8_t *addr) {
  uint8_t buf[32];
  for (int i = 0; i < 12; i++) buf[i] = 0;
  for (int i = 0; i < 20; i++) buf[12 + i] = addr[i];
  return u256_from_be(buf);
}

/** Copies into memory from a source, zero-filling reads past the source end. */
static void copy_padded(uint8_t *dst, const uint8_t *src, uint64_t src_len,
                        uint64_t src_off, uint64_t size) {
  for (uint64_t i = 0; i < size; i++) {
    uint64_t s = src_off + i;
    dst[i] = (s < src_len) ? src[s] : 0;
  }
}

// ---------------------------------------------------------------------------
// Jumpdest analysis
// ---------------------------------------------------------------------------

/**
 * Marks valid jump destinations and splits the code into basic blocks,
 * recording each block's total static gas and its stack requirements.
 *
 * A block starts at offset 0, at every `JUMPDEST`, and immediately after every
 * terminator. It ends at a terminator or just before the next `JUMPDEST`.
 */
static void analyze(evm_vm *vm) {
  mem_zero(vm->jumpdest, (uint64_t)(vm->code_len + 7) / 8);

  int block_count = 0;
  block_info *block = 0;
  // Stack height relative to block entry, plus its running extremes.
  int height = 0, lowest = 0, highest = 0;
  int start_block = 1;

  for (int i = 0; i < vm->code_len;) {
    const uint8_t op = vm->code[i];
    const op_info info = op_table[op];

    if (op == 0x5b) start_block = 1; // JUMPDEST always begins a block

    if (start_block) {
      if (block) {
        block->stack_req = (int16_t)-lowest;
        block->stack_max_growth = (int16_t)highest;
      }
      block = &vm->blocks[block_count];
      block->gas = 0;
      vm->block_at[i] = block_count;
      block_count++;
      height = lowest = highest = 0;
      start_block = 0;
    }

    if (op == 0x5b) JUMPDEST_SET(i);

    if (!(info.flags & OP_VALID)) {
      // Undefined opcode: end the block here so its gas stops accumulating.
      // The interpreter reaches it and halts.
      start_block = 1;
      i++;
      continue;
    }

    block->gas += info.gas;
    // The block must supply enough items for the deepest read it performs...
    if (height - info.pops < lowest) lowest = height - info.pops;
    height += (int)info.pushes - (int)info.pops;
    // ...and must not push past the limit at its tallest point.
    if (height > highest) highest = height;

    if (info.flags & OP_TERMINATOR) start_block = 1;

    if (op >= 0x60 && op <= 0x7f)
      i += 1 + (op - 0x5f); // skip PUSH immediates
    else
      i++;
  }

  if (block) {
    block->stack_req = (int16_t)-lowest;
    block->stack_max_growth = (int16_t)highest;
  }
}

// ---------------------------------------------------------------------------
// Interpreter
// ---------------------------------------------------------------------------

/** Charges a block's static gas and validates its stack bounds up front. */
#define ENTER_BLOCK(at)                                       \
  do {                                                        \
    const block_info b_ = vm->blocks[vm->block_at[at]];       \
    if (gas < b_.gas) HALT(EVM_OUT_OF_GAS);                   \
    gas -= b_.gas;                                            \
    const int height_ = (int)(sp - vm->stack);                \
    if (height_ < b_.stack_req) HALT(EVM_STACK_UNDERFLOW);    \
    if (height_ + b_.stack_max_growth > STACK_LIMIT)          \
      HALT(EVM_STACK_OVERFLOW);                               \
  } while (0)

static evm_status interpret(evm_vm *vm) {
  int pc = 0;
  u256 *sp = vm->stack + vm->sp;
  int64_t gas = vm->gas;
  // Hoisted for the same reason as `sp` and `gas`: reached through `vm` these
  // were reloaded on every instruction.
  const uint8_t *const code = vm->code;
  const int code_len = vm->code_len;
  vm->output_len = 0;

  if (code_len == 0) return EVM_SUCCESS;
  ENTER_BLOCK(0);

  for (;;) {
    if (pc >= code_len) DONE(EVM_SUCCESS); // running off the end is STOP
    const uint8_t op = code[pc];

    switch (op) {
      case 0x00: // STOP
        DONE(EVM_SUCCESS);

      case 0x01: // ADD
        BINARY(u256_add(a, b));
        break;
      case 0x02: // MUL
        BINARY(u256_mul(a, b));
        break;
      case 0x03: // SUB
        BINARY(u256_sub(a, b));
        break;
      case 0x04: // DIV
        BINARY(u256_div(a, b));
        break;
      case 0x05: // SDIV
        BINARY(u256_sdiv(a, b));
        break;
      case 0x06: // MOD
        BINARY(u256_mod(a, b));
        break;
      case 0x07: // SMOD
        BINARY(u256_smod(a, b));
        break;
      case 0x08: { // ADDMOD
        const u256 a = sp[-1], b = sp[-2], m = sp[-3];
        sp[-3] = u256_addmod(a, b, m);
        sp -= 2;
        break;
      }
      case 0x09: { // MULMOD
        const u256 a = sp[-1], b = sp[-2], m = sp[-3];
        sp[-3] = u256_mulmod(a, b, m);
        sp -= 2;
        break;
      }
      case 0x0a: { // EXP
        u256 base = POP(), e = POP();
        // 50 gas per byte of exponent, per EIP-160. The 10 base is in the block.
        int bytes = 0;
        for (int i = 31; i >= 0; i--) {
          if ((e.l[i / 8] >> ((i % 8) * 8)) & 0xff) {
            bytes = i + 1;
            break;
          }
        }
        USE_GAS(50 * bytes);
        PUSH(u256_exp(base, e));
        break;
      }
      case 0x0b: // SIGNEXTEND
        BINARY(u256_signextend(a, b));
        break;

      case 0x10: // LT
        BINARY(u256_from_u64(u256_cmp(a, b) < 0));
        break;
      case 0x11: // GT
        BINARY(u256_from_u64(u256_cmp(a, b) > 0));
        break;
      case 0x12: // SLT
        BINARY(u256_from_u64(u256_sign(a) != u256_sign(b) ? u256_sign(a)
                                          : u256_cmp(a, b) < 0));
        break;
      case 0x13: // SGT
        BINARY(u256_from_u64(u256_sign(a) != u256_sign(b) ? u256_sign(b)
                                          : u256_cmp(a, b) > 0));
        break;
      case 0x14: // EQ
        BINARY(u256_from_u64(u256_eq(a, b)));
        break;
      case 0x15: // ISZERO
        UNARY(u256_from_u64(u256_is_zero(a)));
        break;
      case 0x16: // AND
        BINARY(u256_and(a, b));
        break;
      case 0x17: // OR
        BINARY(u256_or(a, b));
        break;
      case 0x18: // XOR
        BINARY(u256_xor(a, b));
        break;
      case 0x19: // NOT
        UNARY(u256_not(a));
        break;
      case 0x1a: // BYTE
        BINARY(u256_byte(a, b));
        break;
      case 0x1b: // SHL
        BINARY(u256_to_u64_sat(a) >= 256 ? U256_ZERO : u256_shl(b, (uint32_t)u256_to_u64_sat(a)));
        break;
      case 0x1c: // SHR
        BINARY(u256_to_u64_sat(a) >= 256 ? U256_ZERO : u256_shr(b, (uint32_t)u256_to_u64_sat(a)));
        break;
      case 0x1d: // SAR
        BINARY(u256_sar(b, u256_to_u64_sat(a) >= 256 ? 256 : (uint32_t)u256_to_u64_sat(a)));
        break;

      case 0x20: { // KECCAK256
        u256 off = POP(), len = POP();
        uint64_t o = u256_to_u64_sat(off), n = u256_to_u64_sat(len);
        if (o > MAX_INPUT || n > MAX_INPUT) HALT(EVM_OUT_OF_GAS);
        USE_GAS(6 * ((n + 31) / 32));
        evm_status s = memory_expand(vm, o, n, &gas);
        if (s != EVM_SUCCESS) HALT(s);
        uint8_t hash[32];
        keccak256(vm->memory + o, n, hash);
        PUSH(u256_from_be(hash));
        break;
      }

      case 0x35: { // CALLDATALOAD
        u256 off = POP();
        uint64_t o = u256_to_u64_sat(off);
        uint8_t word[32];
        copy_padded(word, vm->input, (uint64_t)vm->input_len, o, 32);
        PUSH(u256_from_be(word));
        break;
      }
      case 0x36: // CALLDATASIZE
        PUSH(u256_from_u64((uint64_t)vm->input_len));
        break;
      case 0x37: { // CALLDATACOPY
        u256 dst = POP(), src = POP(), len = POP();
        uint64_t d = u256_to_u64_sat(dst), s = u256_to_u64_sat(src),
                 n = u256_to_u64_sat(len);
        if (d > MAX_INPUT || n > MAX_INPUT) HALT(EVM_OUT_OF_GAS);
        USE_GAS(3 * ((n + 31) / 32));
        evm_status st = memory_expand(vm, d, n, &gas);
        if (st != EVM_SUCCESS) HALT(st);
        copy_padded(vm->memory + d, vm->input, (uint64_t)vm->input_len, s, n);
        break;
      }
      case 0x38: // CODESIZE
        PUSH(u256_from_u64((uint64_t)code_len));
        break;
      case 0x39: { // CODECOPY
        u256 dst = POP(), src = POP(), len = POP();
        uint64_t d = u256_to_u64_sat(dst), s = u256_to_u64_sat(src),
                 n = u256_to_u64_sat(len);
        if (d > MAX_INPUT || n > MAX_INPUT) HALT(EVM_OUT_OF_GAS);
        USE_GAS(3 * ((n + 31) / 32));
        evm_status st = memory_expand(vm, d, n, &gas);
        if (st != EVM_SUCCESS) HALT(st);
        copy_padded(vm->memory + d, code, (uint64_t)code_len, s, n);
        break;
      }

      case 0x50: // POP
        sp--;
        break;
      case 0x51: { // MLOAD
        u256 off = POP();
        uint64_t o = u256_to_u64_sat(off);
        if (o > MAX_INPUT) HALT(EVM_OUT_OF_GAS);
        evm_status s = memory_expand(vm, o, 32, &gas);
        if (s != EVM_SUCCESS) HALT(s);
        PUSH(u256_from_be(vm->memory + o));
        break;
      }
      case 0x52: { // MSTORE
        u256 off = POP(), v = POP();
        uint64_t o = u256_to_u64_sat(off);
        if (o > MAX_INPUT) HALT(EVM_OUT_OF_GAS);
        evm_status s = memory_expand(vm, o, 32, &gas);
        if (s != EVM_SUCCESS) HALT(s);
        u256_to_be(v, vm->memory + o);
        break;
      }
      case 0x53: { // MSTORE8
        u256 off = POP(), v = POP();
        uint64_t o = u256_to_u64_sat(off);
        if (o > MAX_INPUT) HALT(EVM_OUT_OF_GAS);
        evm_status s = memory_expand(vm, o, 1, &gas);
        if (s != EVM_SUCCESS) HALT(s);
        vm->memory[o] = (uint8_t)(v.l[0] & 0xff);
        break;
      }
      case 0x56: { // JUMP
        u256 t = POP();
        uint64_t d = u256_to_u64_sat(t);
        if (d >= (uint64_t)code_len || !JUMPDEST_GET(d))
          HALT(EVM_INVALID_JUMP);
        // The target is a JUMPDEST, which enters its own block below.
        pc = (int)d;
        continue;
      }
      case 0x57: { // JUMPI
        u256 t = POP(), cond = POP();
        if (!u256_is_zero(cond)) {
          uint64_t d = u256_to_u64_sat(t);
          if (d >= (uint64_t)code_len || !JUMPDEST_GET(d))
            HALT(EVM_INVALID_JUMP);
          pc = (int)d;
          continue;
        }
        // Falling through starts a new block, since this one ended here.
        pc++;
        if (pc >= code_len) DONE(EVM_SUCCESS);
        ENTER_BLOCK(pc);
        continue;
      }
      case 0x58: // PC
        PUSH(u256_from_u64((uint64_t)pc));
        break;
      case 0x59: // MSIZE
        PUSH(u256_from_u64(vm->memory_size));
        break;
      case 0x5a: // GAS
        PUSH(u256_from_u64((uint64_t)gas));
        break;
      case 0x5b: // JUMPDEST
        ENTER_BLOCK(pc);
        break;
      case 0x5f: // PUSH0
        PUSH(U256_ZERO);
        break;


      case 0x30: // ADDRESS
        PUSH(address_to_word(vm->st->accounts[vm->self].address));
        break;
      case 0x32: // ORIGIN
        PUSH(address_to_word(vm->ctx.origin));
        break;
      case 0x33: // CALLER
        PUSH(address_to_word(vm->caller));
        break;
      case 0x34: // CALLVALUE
        PUSH(vm->call_value);
        break;
      case 0x3a: // GASPRICE
        PUSH(vm->ctx.gas_price);
        break;
      case 0x41: // COINBASE
        PUSH(address_to_word(vm->ctx.coinbase));
        break;
      case 0x42: // TIMESTAMP
        PUSH(u256_from_u64(vm->ctx.timestamp));
        break;
      case 0x43: // NUMBER
        PUSH(u256_from_u64(vm->ctx.number));
        break;
      case 0x44: // PREVRANDAO
        PUSH(vm->ctx.prev_randao);
        break;
      case 0x45: // GASLIMIT
        PUSH(u256_from_u64(vm->ctx.block_gas_limit));
        break;
      case 0x46: // CHAINID
        PUSH(vm->ctx.chain_id);
        break;
      case 0x48: // BASEFEE
        PUSH(vm->ctx.base_fee);
        break;
      case 0x4a: // BLOBBASEFEE
        PUSH(vm->ctx.blob_base_fee);
        break;
      case 0x47: // SELFBALANCE
        PUSH(vm->st->accounts[vm->self].balance);
        break;
      case 0x49: { // BLOBHASH
        const uint64_t i = u256_to_u64_sat(POP());
        PUSH(i < (uint64_t)vm->ctx.blob_count ? vm->ctx.blob_hashes[i]
                                             : U256_ZERO);
        break;
      }
      case 0x40: { // BLOCKHASH
        const uint64_t n = u256_to_u64_sat(POP());
        // Only the 256 blocks before the current one are addressable.
        if (n >= vm->ctx.number || vm->ctx.number - n > 256) {
          PUSH(U256_ZERO);
        } else {
          const uint64_t back = vm->ctx.number - n - 1;
          PUSH(back < (uint64_t)vm->ctx.block_hash_count
                   ? u256_from_be(vm->ctx.block_hashes[back])
                   : U256_ZERO);
        }
        break;
      }

      case 0x31: { // BALANCE
        uint8_t addr[20];
        word_to_address(POP(), addr);
        const int32_t a = account_intern(vm->st, addr);
        if (a < 0) HALT(EVM_OUT_OF_MEMORY);
        USE_GAS(warm_account(vm->st, a) ? GAS_COLD_ACCOUNT : GAS_WARM);
        PUSH(vm->st->accounts[a].balance);
        break;
      }
      case 0x3b: { // EXTCODESIZE
        uint8_t addr[20];
        word_to_address(POP(), addr);
        const int32_t a = account_intern(vm->st, addr);
        if (a < 0) HALT(EVM_OUT_OF_MEMORY);
        USE_GAS(warm_account(vm->st, a) ? GAS_COLD_ACCOUNT : GAS_WARM);
        PUSH(u256_from_u64((uint64_t)vm->st->accounts[a].code_len));
        break;
      }
      case 0x3f: { // EXTCODEHASH
        uint8_t addr[20];
        word_to_address(POP(), addr);
        const int32_t a = account_intern(vm->st, addr);
        if (a < 0) HALT(EVM_OUT_OF_MEMORY);
        USE_GAS(warm_account(vm->st, a) ? GAS_COLD_ACCOUNT : GAS_WARM);
        // A non-existent account hashes to zero, not to the empty-string hash.
        PUSH(vm->st->accounts[a].exists
                 ? u256_from_be(vm->st->accounts[a].code_hash)
                 : U256_ZERO);
        break;
      }
      case 0x3c: { // EXTCODECOPY
        uint8_t addr[20];
        word_to_address(POP(), addr);
        const u256 dst = POP(), src = POP(), len = POP();
        const int32_t a = account_intern(vm->st, addr);
        if (a < 0) HALT(EVM_OUT_OF_MEMORY);
        USE_GAS(warm_account(vm->st, a) ? GAS_COLD_ACCOUNT : GAS_WARM);
        const uint64_t d = u256_to_u64_sat(dst), so = u256_to_u64_sat(src),
                       n = u256_to_u64_sat(len);
        if (d > MAX_INPUT || n > MAX_INPUT) HALT(EVM_OUT_OF_GAS);
        USE_GAS(3 * ((n + 31) / 32));
        evm_status st_ = memory_expand(vm, d, n, &gas);
        if (st_ != EVM_SUCCESS) HALT(st_);
        copy_padded(vm->memory + d,
                    vm->st->code_arena + vm->st->accounts[a].code_offset,
                    (uint64_t)vm->st->accounts[a].code_len, so, n);
        break;
      }

      case 0x3d: // RETURNDATASIZE
        PUSH(u256_from_u64((uint64_t)vm->returndata_len));
        break;
      case 0x3e: { // RETURNDATACOPY
        const u256 dst = POP(), src = POP(), len = POP();
        const uint64_t d = u256_to_u64_sat(dst), so = u256_to_u64_sat(src),
                       n = u256_to_u64_sat(len);
        if (d > MAX_INPUT || n > MAX_INPUT) HALT(EVM_OUT_OF_GAS);
        // Unlike the other copies, reading past the end is an error rather
        // than a zero-fill.
        if (so + n > (uint64_t)vm->returndata_len || so + n < so)
          HALT(EVM_INVALID_JUMP);
        USE_GAS(3 * ((n + 31) / 32));
        evm_status st_ = memory_expand(vm, d, n, &gas);
        if (st_ != EVM_SUCCESS) HALT(st_);
        mem_copy(vm->memory + d, vm->returndata + so, n);
        break;
      }

      case 0x54: { // SLOAD
        const u256 key = PEEK(0);
        const int32_t slot = slot_intern(vm->st, vm->self, key);
        if (slot < 0) HALT(EVM_OUT_OF_MEMORY);
        USE_GAS(warm_slot(vm->st, slot) ? GAS_COLD_SLOAD : GAS_WARM);
        sp[-1] = vm->st->slots[slot].value;
        break;
      }
      case 0x55: { // SSTORE
        if (vm->is_static) HALT(EVM_STATIC_VIOLATION);
        const u256 key = POP(), value = POP();
        const int32_t slot = slot_intern(vm->st, vm->self, key);
        if (slot < 0) HALT(EVM_OUT_OF_MEMORY);
        // EIP-2200: cost depends on the original, current, and new values.
        if (warm_slot(vm->st, slot)) USE_GAS(GAS_COLD_SLOAD);
        const u256 current = vm->st->slots[slot].value;
        const u256 original = vm->st->slots[slot].original;
        if (u256_eq(current, value)) {
          USE_GAS(GAS_WARM);
        } else if (u256_eq(original, current)) {
          USE_GAS(u256_is_zero(original) ? GAS_SSET : GAS_SRESET);
          if (!u256_is_zero(original) && u256_is_zero(value))
            add_refund(vm->st, REFUND_SCLEAR);
        } else {
          USE_GAS(GAS_WARM);
          // EIP-3529 refund bookkeeping when a slot is revisited.
          if (!u256_is_zero(original)) {
            if (u256_is_zero(current)) sub_refund(vm->st, REFUND_SCLEAR);
            if (u256_is_zero(value)) add_refund(vm->st, REFUND_SCLEAR);
          }
          if (u256_eq(original, value)) {
            if (u256_is_zero(original))
              add_refund(vm->st, GAS_SSET - GAS_WARM);
            else
              add_refund(vm->st, GAS_SRESET - GAS_WARM);
          }
        }
        set_storage(vm->st, slot, value);
        break;
      }
      case 0x5c: { // TLOAD
        const u256 key = PEEK(0);
        sp[-1] = transient_load(vm->st, vm->self, key);
        break;
      }
      case 0x5d: { // TSTORE
        if (vm->is_static) HALT(EVM_STATIC_VIOLATION);
        const u256 key = POP(), value = POP();
        transient_store(vm->st, vm->self, key, value);
        break;
      }

      case 0x5e: { // MCOPY
        const u256 dst = POP(), src = POP(), len = POP();
        const uint64_t d = u256_to_u64_sat(dst), so = u256_to_u64_sat(src),
                       n = u256_to_u64_sat(len);
        if (d > MAX_INPUT || so > MAX_INPUT || n > MAX_INPUT)
          HALT(EVM_OUT_OF_GAS);
        USE_GAS(3 * ((n + 31) / 32));
        // Both ends must be covered before the move, and the regions may
        // overlap in either direction.
        evm_status st_ = memory_expand(vm, d > so ? d : so, n, &gas);
        if (st_ != EVM_SUCCESS) HALT(st_);
        if (n) __builtin_memmove(vm->memory + d, vm->memory + so,
                                 (unsigned long)n);
        break;
      }

      case 0xa0: case 0xa1: case 0xa2: case 0xa3: case 0xa4: { // LOG0..LOG4
        if (vm->is_static) HALT(EVM_STATIC_VIOLATION);
        const int topics = op - 0xa0;
        const u256 off = POP(), len = POP();
        const uint64_t o = u256_to_u64_sat(off), n = u256_to_u64_sat(len);
        if (o > MAX_INPUT || n > MAX_INPUT) HALT(EVM_OUT_OF_GAS);
        USE_GAS(8 * n);
        evm_status st_ = memory_expand(vm, o, n, &gas);
        if (st_ != EVM_SUCCESS) HALT(st_);
        if (vm->st->log_count >= MAX_LOGS ||
            vm->st->log_data_len + (int32_t)n > LOG_ARENA)
          HALT(EVM_OUT_OF_MEMORY);
        journal_push(vm->st, J_LOG, vm->st->log_count, U256_ZERO, 0, 0);
        evm_log *lg = &vm->st->logs[vm->st->log_count++];
        for (int i = 0; i < 20; i++)
          lg->address[i] = vm->st->accounts[vm->self].address[i];
        lg->topic_count = topics;
        for (int i = 0; i < topics; i++) lg->topics[i] = POP();
        lg->data_offset = vm->st->log_data_len;
        lg->data_len = (int32_t)n;
        mem_copy(vm->st->log_data + vm->st->log_data_len, vm->memory + o, n);
        vm->st->log_data_len += (int32_t)n;
        break;
      }

      case 0xfe: // INVALID
        HALT(EVM_INVALID_OPCODE);

      case 0xff: { // SELFDESTRUCT
        if (vm->is_static) HALT(EVM_STATIC_VIOLATION);
        uint8_t addr[20];
        word_to_address(POP(), addr);
        const int32_t target = account_intern(vm->st, addr);
        if (target < 0) HALT(EVM_OUT_OF_MEMORY);
        USE_GAS(warm_account(vm->st, target) ? GAS_COLD_ACCOUNT : 0);
        const u256 balance = vm->st->accounts[vm->self].balance;
        if (!u256_is_zero(balance)) {
          if (target != vm->self) {
            set_balance(vm->st, target,
                        u256_add(vm->st->accounts[target].balance, balance));
            if (!vm->st->accounts[target].exists)
              set_exists(vm->st, target, 1);
          }
          set_balance(vm->st, vm->self, U256_ZERO);
        }
        // EIP-6780: the account is only removed when created in this same
        // transaction; otherwise only the balance moves.
        if (vm->st->accounts[vm->self].created)
          set_destroyed(vm->st, vm->self, 1);
        DONE(EVM_SUCCESS);
      }

      case 0xf3: { // RETURN
        u256 off = POP(), len = POP();
        uint64_t o = u256_to_u64_sat(off), n = u256_to_u64_sat(len);
        if (o > MAX_INPUT || n > MAX_INPUT) HALT(EVM_OUT_OF_GAS);
        evm_status s = memory_expand(vm, o, n, &gas);
        if (s != EVM_SUCCESS) HALT(s);
        mem_copy(vm->output, vm->memory + o, n);
        vm->output_len = (int)n;
        DONE(EVM_SUCCESS);
      }
      case 0xfd: { // REVERT
        u256 off = POP(), len = POP();
        uint64_t o = u256_to_u64_sat(off), n = u256_to_u64_sat(len);
        if (o > MAX_INPUT || n > MAX_INPUT) HALT(EVM_OUT_OF_GAS);
        evm_status s = memory_expand(vm, o, n, &gas);
        if (s != EVM_SUCCESS) HALT(s);
        mem_copy(vm->output, vm->memory + o, n);
        vm->output_len = (int)n;
        // REVERT is not an exceptional halt: unspent gas is returned.
        DONE(EVM_REVERT);
      }

      // PUSH, DUP, and SWAP get explicit labels rather than range tests under
      // `default:`. They are the most frequent opcodes in real bytecode, and
      // this lets the jump table dispatch them directly instead of falling
      // through to a chain of comparisons.
      case 0x60: // PUSH1 — the single most common opcode in compiled output
        PUSH(u256_from_u64(pc + 1 < code_len ? code[pc + 1] : 0));
        pc += 2;
        continue;

      case 0x61 ... 0x67: { // PUSH2..PUSH8 fit in one limb
        const int n = op - 0x5f;
        if (pc + 1 + n <= code_len) {
          const uint8_t *p = code + pc + 1;
          uint64_t v = 0;
          for (int k = 0; k < n; k++) v = (v << 8) | p[k];
          PUSH(u256_from_u64(v));
          pc += 1 + n;
          continue;
        }
        goto push_truncated;
      }

      case 0x68 ... 0x7f: { // PUSH9..PUSH32
        const int n = op - 0x5f;
        if (pc + 1 + n <= code_len) {
          PUSH(u256_from_be_n(code + pc + 1, n));
          pc += 1 + n;
          continue;
        }
      push_truncated: {
        // An immediate running past the end of code is zero-padded on the
        // right. Only reachable at the very end of a program.
        const int size = op - 0x5f;
        int avail = code_len - pc - 1;
        if (avail < 0) avail = 0;
        u256 v = u256_from_be_n(code + pc + 1, avail);
        v = u256_shl(v, (uint32_t)((size - avail) * 8));
        PUSH(v);
        pc += 1 + size;
        continue;
      }
      }

      case 0x80 ... 0x8f: // DUP1..DUP16
        PUSH(PEEK(op - 0x80));
        break;

      case 0x90 ... 0x9f: { // SWAP1..SWAP16
        const int n = op - 0x8f;
        u256 tmp = PEEK(0);
        PEEK(0) = PEEK(n);
        PEEK(n) = tmp;
        break;
      }

      default:
        HALT(EVM_INVALID_OPCODE);
    }
    pc++;
  }
}

// ---------------------------------------------------------------------------
// Exported ABI
//
// Every export uses only i32/i64 so the wasm and N-API surfaces are identical.
// Pointer-returning exports hand back offsets into linear memory under wasm.
// ---------------------------------------------------------------------------

// Under wasm the export table needs explicit names. Natively the plain symbol
// name is the export, and `export_name` is ignored with a warning, so only
// apply it where it means something.
#ifdef __wasm__
#define EXPORT(name) __attribute__((export_name(name))) __attribute__((used))
#else
#define EXPORT(name) __attribute__((used))
#endif

EXPORT("evm_new") evm_vm *evm_new(int memory_cap) {
  if (memory_cap <= 0) memory_cap = DEFAULT_MEMORY;
  evm_vm *vm = (evm_vm *)ox_alloc(sizeof(evm_vm));
  if (!vm) return 0;
  vm->jumpdest = (uint8_t *)ox_alloc((MAX_CODE + 7) / 8);
  // Worst case is a block per byte, when every byte is a JUMPDEST.
  vm->blocks = (block_info *)ox_alloc((uint64_t)MAX_CODE * sizeof(block_info));
  vm->block_at = (int32_t *)ox_alloc((uint64_t)MAX_CODE * sizeof(int32_t));
  vm->memory = (uint8_t *)ox_alloc((uint64_t)memory_cap);
  vm->output = (uint8_t *)ox_alloc(MAX_INPUT);
  vm->st = (evm_state *)ox_alloc(sizeof(evm_state));
  vm->returndata = (uint8_t *)ox_alloc(MAX_INPUT);
  vm->stage = (uint8_t *)ox_alloc(MAX_INPUT);
  if (!vm->jumpdest || !vm->blocks || !vm->block_at || !vm->memory ||
      !vm->output || !vm->st || !vm->returndata || !vm->stage)
    return 0;
  vm->st->log_data = (uint8_t *)ox_alloc(LOG_ARENA);
  vm->st->code_arena = (uint8_t *)ox_alloc(CODE_ARENA);
  if (!vm->st->log_data || !vm->st->code_arena) return 0;
  state_reset(vm->st);
  vm->self = 0;
  vm->is_static = 0;
  vm->depth = 0;
  vm->returndata_len = 0;
  vm->call_value = U256_ZERO;
  for (int i = 0; i < 20; i++) vm->caller[i] = 0;
  vm->memory_cap = (uint64_t)memory_cap;
  mem_zero(vm->memory, vm->memory_cap);
  vm->sp = 0;
  vm->code_len = 0;
  vm->input_len = 0;
  vm->memory_size = 0;
  vm->memory_cost = 0;
  vm->output_len = 0;
  vm->gas = 0;
  return vm;
}

// Capacity of the code and input buffers. The caller writes directly into
// linear memory, so it must know how much room there is before it does —
// overrunning `code` corrupts the fields laid out after it.
EXPORT("evm_max_code") int evm_max_code(void) { return MAX_CODE; }
EXPORT("evm_max_input") int evm_max_input(void) { return MAX_INPUT; }

EXPORT("evm_code_ptr") uint8_t *evm_code_ptr(evm_vm *vm) { return vm->code; }
EXPORT("evm_input_ptr") uint8_t *evm_input_ptr(evm_vm *vm) { return vm->input; }
EXPORT("evm_output_ptr") uint8_t *evm_output_ptr(evm_vm *vm) {
  return vm->output;
}
EXPORT("evm_output_len") int evm_output_len(evm_vm *vm) {
  return vm->output_len;
}
EXPORT("evm_gas_left") int64_t evm_gas_left(evm_vm *vm) { return vm->gas; }
EXPORT("evm_stack_size") int evm_stack_size(evm_vm *vm) { return vm->sp; }
EXPORT("evm_memory_size") int evm_memory_size(evm_vm *vm) {
  return (int)vm->memory_size;
}

/** Reads stack item `i` (0 = top) into the output buffer as 32 big-endian bytes. */
EXPORT("evm_stack_peek") int evm_stack_peek(evm_vm *vm, int i) {
  if (i < 0 || i >= vm->sp) return 0;
  u256_to_be(vm->stack[vm->sp - 1 - i], vm->output);
  return 1;
}

/**
 * Analyzes the bytecode written to `evm_code_ptr`.
 *
 * Call once per distinct bytecode, then `evm_run` as many times as needed. The
 * caller owns the decision about when code has changed — it is the only party
 * that knows, and any check here would cost a full scan of the code.
 */
EXPORT("evm_set_code")
int evm_set_code(evm_vm *vm, int code_len) {
  // Invalidate first, so a rejected length leaves the VM unrunnable rather
  // than letting `evm_run` execute the previous program's analysis.
  vm->analyzed = 0;
  if (code_len < 0 || code_len > MAX_CODE) return EVM_CODE_TOO_LARGE;
  vm->code_len = code_len;
  analyze(vm);
  vm->analyzed = 1;
  return EVM_SUCCESS;
}

/**
 * Runs the analyzed bytecode against the calldata at `evm_input_ptr`.
 * Returns an `evm_status`.
 */
EXPORT("evm_run")
int evm_run(evm_vm *vm, int input_len, int64_t gas) {
  if (input_len < 0 || input_len > MAX_INPUT) return EVM_INPUT_TOO_LARGE;
  if (!vm->analyzed) return EVM_CODE_TOO_LARGE;
  vm->input_len = input_len;
  vm->gas = gas;
  vm->sp = 0;
  vm->memory_cost = 0;
  vm->output_len = 0;
  // Only the previous run's high-water mark is dirty — the rest was zeroed by
  // `evm_new` and never written. Clearing the full capacity here costs more
  // than most programs execute.
  mem_zero(vm->memory, vm->memory_size);
  vm->memory_size = 0;
  return (int)interpret(vm);
}

// ---------------------------------------------------------------------------
// State ABI
//
// Wide values cross the boundary through a staging buffer rather than as
// arguments, because wasm exports only carry i32/i64. Layout, in bytes:
//
//   [0..20)    address
//   [20..40)   secondary address (caller)
//   [64..96)   word A (balance, storage key, call value)
//   [96..128)  word B (storage value)
//   [128..)    variable-length bytes (code, calldata)
// ---------------------------------------------------------------------------

#define STAGE_ADDR 0
#define STAGE_ADDR2 20
#define STAGE_WORD_A 64
#define STAGE_WORD_B 96
#define STAGE_BYTES 128

EXPORT("evm_stage_ptr") uint8_t *evm_stage_ptr(evm_vm *vm) { return vm->stage; }

EXPORT("evm_reset") void evm_reset(evm_vm *vm) {
  state_reset(vm->st);
  vm->returndata_len = 0;
  vm->depth = 0;
  vm->is_static = 0;
}

/** Interns the account at `stage[0..20)` and sets its balance, nonce, and code. */
EXPORT("evm_put_account")
int evm_put_account(evm_vm *vm, int64_t nonce, int code_len) {
  const int32_t a = account_intern(vm->st, vm->stage + STAGE_ADDR);
  if (a < 0) return EVM_OUT_OF_MEMORY;
  vm->st->accounts[a].balance = u256_from_be(vm->stage + STAGE_WORD_A);
  vm->st->accounts[a].nonce = (uint64_t)nonce;
  vm->st->accounts[a].exists = 1;
  if (code_len > 0 && !set_code(vm->st, a, vm->stage + STAGE_BYTES, code_len))
    return EVM_OUT_OF_MEMORY;
  // Loading pre-state is not a mutation to roll back.
  vm->st->journal_len = 0;
  return EVM_SUCCESS;
}

/** Sets a storage slot and marks it as the transaction's original value. */
EXPORT("evm_put_storage") int evm_put_storage(evm_vm *vm) {
  const int32_t a = account_intern(vm->st, vm->stage + STAGE_ADDR);
  if (a < 0) return EVM_OUT_OF_MEMORY;
  const int32_t slot = slot_intern(vm->st, a, u256_from_be(vm->stage + STAGE_WORD_A));
  if (slot < 0) return EVM_OUT_OF_MEMORY;
  const u256 v = u256_from_be(vm->stage + STAGE_WORD_B);
  vm->st->slots[slot].value = v;
  vm->st->slots[slot].original = v;
  vm->st->journal_len = 0;
  return EVM_SUCCESS;
}

EXPORT("evm_set_context")
void evm_set_context(evm_vm *vm, int64_t number, int64_t timestamp,
                     int64_t block_gas_limit, int blob_count,
                     int block_hash_count) {
  const uint8_t *p = vm->stage;
  for (int i = 0; i < 20; i++) vm->ctx.origin[i] = p[STAGE_ADDR + i];
  for (int i = 0; i < 20; i++) vm->ctx.coinbase[i] = p[STAGE_ADDR2 + i];
  vm->ctx.gas_price = u256_from_be(p + 64);
  vm->ctx.base_fee = u256_from_be(p + 96);
  vm->ctx.blob_base_fee = u256_from_be(p + 128);
  vm->ctx.prev_randao = u256_from_be(p + 160);
  vm->ctx.chain_id = u256_from_be(p + 192);
  vm->ctx.number = (uint64_t)number;
  vm->ctx.timestamp = (uint64_t)timestamp;
  vm->ctx.block_gas_limit = (uint64_t)block_gas_limit;
  vm->ctx.blob_count = blob_count > 8 ? 8 : blob_count;
  for (int i = 0; i < vm->ctx.blob_count; i++)
    vm->ctx.blob_hashes[i] = u256_from_be(p + 224 + i * 32);
  vm->ctx.block_hash_count = block_hash_count > 256 ? 256 : block_hash_count;
  const uint8_t *bh = p + 224 + 8 * 32;
  for (int i = 0; i < vm->ctx.block_hash_count; i++)
    for (int j = 0; j < 32; j++) vm->ctx.block_hashes[i][j] = bh[i * 32 + j];
}

/** Marks an address warm ahead of execution, for EIP-2930 access lists. */
EXPORT("evm_warm_account") int evm_warm_account_abi(evm_vm *vm) {
  const int32_t a = account_intern(vm->st, vm->stage + STAGE_ADDR);
  if (a < 0) return EVM_OUT_OF_MEMORY;
  vm->st->accounts[a].warm = 1;
  vm->st->journal_len = 0;
  return EVM_SUCCESS;
}

EXPORT("evm_warm_storage") int evm_warm_storage_abi(evm_vm *vm) {
  const int32_t a = account_intern(vm->st, vm->stage + STAGE_ADDR);
  if (a < 0) return EVM_OUT_OF_MEMORY;
  const int32_t slot =
      slot_intern(vm->st, a, u256_from_be(vm->stage + STAGE_WORD_A));
  if (slot < 0) return EVM_OUT_OF_MEMORY;
  vm->st->slots[slot].warm = 1;
  vm->st->journal_len = 0;
  return EVM_SUCCESS;
}

/**
 * Executes a message call against the account at `stage[0..20)`, with the
 * caller at `stage[20..40)`, value at `stage[64..96)`, and calldata at
 * `stage[128..)`.
 *
 * The value transfer and nonce handling belong to the transaction layer and are
 * the host's responsibility; this runs the frame.
 */
EXPORT("evm_execute")
int evm_execute(evm_vm *vm, int input_len, int64_t gas, int is_static) {
  if (input_len < 0 || input_len > MAX_INPUT) return EVM_INPUT_TOO_LARGE;
  const int32_t a = account_intern(vm->st, vm->stage + STAGE_ADDR);
  if (a < 0) return EVM_OUT_OF_MEMORY;
  vm->self = a;
  for (int i = 0; i < 20; i++) vm->caller[i] = vm->stage[STAGE_ADDR2 + i];
  vm->call_value = u256_from_be(vm->stage + STAGE_WORD_A);
  vm->is_static = is_static;
  vm->depth = 0;
  vm->returndata_len = 0;

  const int32_t code_len = vm->st->accounts[a].code_len;
  if (code_len > MAX_CODE) return EVM_CODE_TOO_LARGE;
  mem_copy(vm->code, vm->st->code_arena + vm->st->accounts[a].code_offset,
           (uint64_t)code_len);
  mem_copy(vm->input, vm->stage + STAGE_BYTES, (uint64_t)input_len);
  vm->code_len = code_len;
  analyze(vm);
  vm->analyzed = 1;

  vm->input_len = input_len;
  vm->gas = gas;
  vm->sp = 0;
  vm->memory_cost = 0;
  vm->output_len = 0;
  mem_zero(vm->memory, vm->memory_size);
  vm->memory_size = 0;
  const int32_t snapshot = state_snapshot(vm->st);
  const int status = (int)interpret(vm);
  // Anything but a clean finish or an explicit revert still rolls state back.
  if (status != EVM_SUCCESS) state_revert(vm->st, snapshot);
  return status;
}

EXPORT("evm_refund") int64_t evm_refund(evm_vm *vm) {
  return (int64_t)vm->st->refund;
}

// --- post-state readback ---

EXPORT("evm_account_count") int evm_account_count(evm_vm *vm) {
  return vm->st->account_count;
}

/**
 * Writes account `i` into the staging buffer: address, balance, and code.
 * Returns the code length, or -1 when the account should be absent from the
 * post-state.
 */
EXPORT("evm_account_at") int evm_account_at(evm_vm *vm, int i) {
  if (i < 0 || i >= vm->st->account_count) return -1;
  const account *a = &vm->st->accounts[i];
  if (a->destroyed) return -1;
  // An account that never existed and is still empty is not in the trie.
  if (!a->exists && a->nonce == 0 && u256_is_zero(a->balance) &&
      a->code_len == 0)
    return -1;
  for (int k = 0; k < 20; k++) vm->stage[STAGE_ADDR + k] = a->address[k];
  u256_to_be(a->balance, vm->stage + STAGE_WORD_A);
  mem_copy(vm->stage + STAGE_BYTES, vm->st->code_arena + a->code_offset,
           (uint64_t)a->code_len);
  return a->code_len;
}

EXPORT("evm_account_nonce") int64_t evm_account_nonce(evm_vm *vm, int i) {
  if (i < 0 || i >= vm->st->account_count) return 0;
  return (int64_t)vm->st->accounts[i].nonce;
}

EXPORT("evm_storage_count") int evm_storage_count(evm_vm *vm) {
  return vm->st->slot_count;
}

/**
 * Writes slot `i` into the staging buffer: owning address, key, and value.
 * Returns 1, or 0 when the slot is zero and therefore absent from the trie.
 */
EXPORT("evm_storage_at") int evm_storage_at(evm_vm *vm, int i) {
  if (i < 0 || i >= vm->st->slot_count) return 0;
  const storage_slot *s = &vm->st->slots[i];
  if (u256_is_zero(s->value)) return 0;
  if (vm->st->accounts[s->account].destroyed) return 0;
  for (int k = 0; k < 20; k++)
    vm->stage[STAGE_ADDR + k] = vm->st->accounts[s->account].address[k];
  u256_to_be(s->key, vm->stage + STAGE_WORD_A);
  u256_to_be(s->value, vm->stage + STAGE_WORD_B);
  return 1;
}

EXPORT("evm_log_count") int evm_log_count(evm_vm *vm) {
  return vm->st->log_count;
}

/** Writes log `i`: address, topics from `stage[128..)`, then data. */
EXPORT("evm_log_at") int evm_log_at(evm_vm *vm, int i) {
  if (i < 0 || i >= vm->st->log_count) return -1;
  const evm_log *lg = &vm->st->logs[i];
  for (int k = 0; k < 20; k++) vm->stage[STAGE_ADDR + k] = lg->address[k];
  for (int t = 0; t < lg->topic_count; t++)
    u256_to_be(lg->topics[t], vm->stage + STAGE_BYTES + t * 32);
  mem_copy(vm->stage + STAGE_BYTES + lg->topic_count * 32,
           vm->st->log_data + lg->data_offset, (uint64_t)lg->data_len);
  return (lg->topic_count << 24) | (lg->data_len & 0xffffff);
}
