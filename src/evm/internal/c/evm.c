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
#include "bls12381.h"
#include "bn254.h"
#include "precompile.h"
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
// Both check for zero before calling the builtin. With `-mbulk-memory` these
// lower to wasm's `memory.fill` and `memory.copy`, which bounds-check their
// operands before looking at the length — so a zero-length move through a
// pointer the EVM never actually reads, which a saturated 256-bit offset
// produces, traps rather than doing nothing. A trap does not restore the shadow
// stack pointer, so it poisons the module for every later call.
static void mem_zero(uint8_t *p, uint64_t n) {
  if (n) __builtin_memset(p, 0, (unsigned long)n);
}

static void mem_copy(uint8_t *dst, const uint8_t *src, uint64_t n) {
  if (n) __builtin_memcpy(dst, src, (unsigned long)n);
}

// ---------------------------------------------------------------------------
// Limits and status codes
// ---------------------------------------------------------------------------

#define STACK_LIMIT 1024
#define MAX_CODE 49152    // 2x EIP-170, so initcode fits
#define MAX_INPUT 1048576 // 1 MiB of calldata
// Memory offsets are bounded separately: expansion is priced quadratically, so
// anything past this is unaffordable long before it is reached, and the check
// only exists to keep the arithmetic below in range.
#define MAX_MEMORY_OFFSET (1 << 30)
// Freestanding: there is no <stdint.h> here, so no limit macros. Used as a
// saturating price for operands too large to bill honestly — nothing pays it.
#define GAS_UNAFFORDABLE 0x7FFFFFFFFFFFFFFFLL
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
  // EIP-7691 raised the per-block maximum to 9; the slack costs nothing.
  u256 blob_hashes[16];
  int32_t blob_count;
  // The 256 most recent block hashes, index 0 being `number - 1`.
  uint8_t block_hashes[256][32];
  int32_t block_hash_count;
  // Fork identifier. Account and storage access were repriced repeatedly, so
  // these costs cannot be constants.
  int32_t spec;
} evm_context;

// Only the forks that changed a cost this engine charges.
#define SPEC_HOMESTEAD 1  // EIP-7 added DELEGATECALL
#define SPEC_TANGERINE 2  // EIP-150 repriced all external account access
#define SPEC_SPURIOUS 3   // EIP-170 capped deployed code, EIP-161 changed emptiness
#define SPEC_CONSTANTINOPLE 5
#define SPEC_ISTANBUL 7   // EIP-1884 repriced BALANCE, EXTCODEHASH, SLOAD
#define SPEC_BYZANTIUM 4  // modexp and bn254 arrived
#define SPEC_SHANGHAI 11  // EIP-3855 added PUSH0
#define SPEC_BERLIN 8     // EIP-2929 introduced warm/cold, EIP-2565 repriced modexp
#define SPEC_LONDON 9    // EIP-3529 cut the refunds
#define SPEC_CANCUN 12
#define SPEC_PRAGUE 13
// What a VM starts on, and what it returns to on reset. Callers that want an
// older fork's semantics say so through `evm_set_context`.
#define SPEC_DEFAULT SPEC_PRAGUE

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

#ifdef OX_TRACE
// A step record. Present only in the tracing build: recording unconditionally
// would put a branch on every instruction in the dispatch loop, and the two
// pure-dispatch benchmarks are close enough that it would show.
typedef struct {
  int32_t pc;
  int32_t op;
  int64_t gas; // remaining, before the instruction executes
  int32_t depth;
  int32_t sp;
} evm_trace_entry;
#define TRACE_CAP (1 << 18)
#endif

typedef struct {
  u256 stack[STACK_LIMIT];
  int sp;

  uint8_t code[MAX_CODE];
  int code_len;
  // Bitmap, one bit per code position. A bitmap rather than a byte array
  // because this is cleared on every analysis and jumps read it rarely.
  uint8_t *jumpdest;
  // Indexed by code position, written only at block starts. Never cleared:
  // the interpreter only reads positions analysis just wrote. Indexing by pc
  // rather than by a block number costs no more memory than the block-number
  // table it replaces, and takes a dependent load off every block entry.
  block_info *blocks;
  // Static gas still owed by the rest of the block, per GAS opcode position.
  // Charging a whole block up front makes `gas` too low mid-block, and GAS is
  // the one instruction that can observe it.
  int32_t *gas_fix;

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
  // Address of a local in the outermost entry point. `run_frame` recurses on
  // the C stack, so this is the reference point for the depth guard below.
  __UINTPTR_TYPE__ stack_top;
  uint8_t *returndata; // result of the most recent sub-call
  int32_t returndata_len;
  // Staging area the host reads and writes across the ABI boundary.
  uint8_t *stage;
#ifdef OX_TRACE
  evm_trace_entry *trace;
  int32_t trace_count;
#endif

  // Per-frame, saved and restored around a nested call. EVM memory and the
  // jumpdest/block analysis are both per-frame, so they are carved out of bump
  // arenas whose tops are part of the saved state.
  uint8_t *mem;      // this frame's memory base
  uint64_t mem_cap;  // bytes available to this frame
  uint8_t *arena;
  int32_t arena_top;
  int32_t arena_cap;
  // The executing frame's code and calldata. These point at the code arena or
  // at a caller's memory, not at the top-level staging buffers.
  const uint8_t *frame_code;
  const uint8_t *frame_input;
  // Base of the executing frame's stack. Each frame gets its own region, so
  // `sp` and the 1024-slot limit are both relative to this rather than to the
  // bottom of the shared array.
  u256 *stack_base;
} evm_vm;

/**
 * Cost of touching an external account, and marks it warm.
 *
 * Before Berlin there is no warm/cold distinction and the price is flat; the
 * account is still marked so that later forks' bookkeeping is uniform.
 */
static inline int64_t access_cost(evm_vm *vm, int32_t acct, int64_t pre_berlin) {
  const int cold = warm_account(vm->st, acct);
  if (vm->ctx.spec >= SPEC_BERLIN)
    return cold ? GAS_COLD_ACCOUNT : GAS_WARM;
  return pre_berlin;
}

/**
 * Resolves an EIP-7702 delegation designation.
 *
 * A designation is exactly `0xef0100` followed by 20 address bytes. When the
 * callee carries one, the code that runs is the delegate's, and touching the
 * delegate costs a further warm-or-cold access. Storage, balance, and the
 * address seen by the callee all stay with the designating account.
 *
 * Returns the account whose code should run, and charges into `gas`. `*oog` is
 * set when the access cost cannot be paid.
 */
static int32_t resolve_delegation(evm_vm *vm, int32_t acct, int64_t *gas,
                                  int *oog) {
  *oog = 0;
  if (vm->ctx.spec < SPEC_PRAGUE) return acct;
  const account *a = &vm->st->accounts[acct];
  if (a->code_len != 23) return acct;
  const uint8_t *code = vm->st->code_arena + a->code_offset;
  if (code[0] != 0xef || code[1] != 0x01 || code[2] != 0x00) return acct;
  const int32_t target = account_intern(vm->st, code + 3);
  if (target < 0) {
    *oog = 1;
    return acct;
  }
  const int64_t cost = access_cost(vm, target, GAS_WARM);
  if (*gas < cost) {
    *oog = 1;
    return acct;
  }
  *gas -= cost;
  return target;
}

/**
 * Rejects an opcode the fork has not introduced yet.
 *
 * Checked here rather than during analysis because the analysis is cached per
 * code, not per fork. Charging the block's gas before halting is harmless: an
 * invalid opcode consumes everything anyway.
 */
#define REQUIRE_SPEC(min)                                 \
  do {                                                    \
    if (vm->ctx.spec < (min)) HALT(EVM_INVALID_OPCODE);    \
  } while (0)

#define ANALYSIS_ARENA (48 * 1024 * 1024)
// A frame's first memory block, which doubles from there. Small on purpose:
// this is reserved out of the shared analysis arena for every live frame, so
// at 64 KiB a thousand nested frames claimed 64 MiB of a 48 MiB arena and the
// recursion died partway down with contracts silently uncreated. Doubling is
// amortized, so a frame that really needs megabytes pays a handful of copies.
#define FRAME_MEMORY (4 * 1024)
#define FRAME_STACK (STACK_LIMIT * (int32_t)sizeof(u256))
#define MAX_DEPTH 1024
// Must stay under the linker's `-z stack-size` with room for one more frame.
#define C_STACK_BUDGET (6 * 1024 * 1024)
/**
 * Marks the base of the C stack for the recursion guard, and resets the depth.
 *
 * Every ABI entry point that can run a frame goes through this so `run_frame`
 * has a reference point to measure against.
 */
#define ENTER_TOP(vm)                                    \
  do {                                                   \
    volatile uint8_t probe_;                             \
    (vm)->depth = 0;                                     \
    (vm)->stack_top = (__UINTPTR_TYPE__)&probe_;                \
  } while (0)

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
    vm->sp = (int)(sp - vm->stack_base);    \
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

/** Defined below with the frame machinery; memory is allocated from the arena. */
static void *arena_alloc(evm_vm *vm, int32_t n);

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

  // Charge before allocating. Expansion is priced quadratically, so anything
  // large enough to trouble the arena is unaffordable first, and reporting that
  // as out-of-gas rather than out-of-memory is what the spec asks for.
  const uint64_t words = (end + 31) / 32;
  const uint64_t cost = memory_gas(words);
  if (cost > vm->memory_cost) {
    int64_t charge = (int64_t)(cost - vm->memory_cost);
    if (charge < 0 || *gas < charge) {
      *gas = 0;
      return EVM_OUT_OF_GAS;
    }
    *gas -= charge;
    vm->memory_cost = cost;
  }

  if (end > vm->mem_cap) {
    // Frame memory grows on demand rather than reserving a ceiling per frame: a
    // program can legitimately expand past a megabyte, and reserving that for
    // each of 1024 frames is not possible.
    uint64_t want = vm->mem_cap ? vm->mem_cap : FRAME_MEMORY;
    while (want < end) want *= 2;
    if (want > (uint64_t)ANALYSIS_ARENA) return EVM_OUT_OF_MEMORY;
    uint8_t *grown = (uint8_t *)arena_alloc(vm, (int32_t)want);
    if (!grown) return EVM_OUT_OF_MEMORY;
    if (vm->memory_size) mem_copy(grown, vm->mem, vm->memory_size);
    vm->mem = grown;
    vm->mem_cap = want;
  }
  // Belt and braces: a trap here would poison the whole module, so anything the
  // accounting above failed to cover becomes a clean error instead.
  if (words * 32 > vm->mem_cap) return EVM_OUT_OF_MEMORY;
  // Newly reachable bytes must read as zero. Clearing on growth rather than up
  // front is what lets a frame's memory come from a bump arena.
  mem_zero(vm->mem + vm->memory_size, words * 32 - vm->memory_size);
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

/** CREATE address: the low 20 bytes of `keccak256(rlp([sender, nonce]))`. */
static void create_address(const uint8_t *sender, uint64_t nonce,
                           uint8_t *out) {
  uint8_t buf[32];
  int n = 0;
  // The payload is always shorter than 56 bytes, so the list header is one
  // byte: 0xc0 + length.
  uint8_t nonce_bytes[9];
  int nonce_len = 0;
  if (nonce == 0) {
    nonce_bytes[nonce_len++] = 0x80;
  } else if (nonce < 0x80) {
    nonce_bytes[nonce_len++] = (uint8_t)nonce;
  } else {
    uint8_t tmp[8];
    int k = 0;
    for (uint64_t v = nonce; v; v >>= 8) tmp[k++] = (uint8_t)(v & 0xff);
    nonce_bytes[nonce_len++] = (uint8_t)(0x80 + k);
    for (int i = k - 1; i >= 0; i--) nonce_bytes[nonce_len++] = tmp[i];
  }
  buf[n++] = (uint8_t)(0xc0 + 21 + nonce_len);
  buf[n++] = 0x94; // 0x80 + 20, a 20-byte string
  for (int i = 0; i < 20; i++) buf[n++] = sender[i];
  for (int i = 0; i < nonce_len; i++) buf[n++] = nonce_bytes[i];

  uint8_t hash[32];
  keccak256(buf, (uint64_t)n, hash);
  for (int i = 0; i < 20; i++) out[i] = hash[12 + i];
}

/** CREATE2 address: `keccak256(0xff ++ sender ++ salt ++ keccak256(init))`. */
static void create2_address(const uint8_t *sender, u256 salt,
                            const uint8_t *init, uint64_t init_len,
                            uint8_t *out) {
  uint8_t init_hash[32];
  keccak256(init, init_len, init_hash);
  uint8_t buf[85];
  buf[0] = 0xff;
  for (int i = 0; i < 20; i++) buf[1 + i] = sender[i];
  u256_to_be(salt, buf + 21);
  for (int i = 0; i < 32; i++) buf[53 + i] = init_hash[i];
  uint8_t hash[32];
  keccak256(buf, 85, hash);
  for (int i = 0; i < 20; i++) out[i] = hash[12 + i];
}

/** Copies into memory from a source, zero-filling reads past the source end. */
static void copy_padded(uint8_t *dst, const uint8_t *src, uint64_t src_len,
                        uint64_t src_off, uint64_t size) {
  // An offset at or past the end reads only padding. Deciding that up front
  // also keeps `src_off + i` from wrapping: a saturated offset — what a
  // negative-looking 256-bit operand becomes — would otherwise come back
  // around to zero part way through and start copying real bytes.
  if (src_off >= src_len) {
    for (uint64_t i = 0; i < size; i++) dst[i] = 0;
    return;
  }
  const uint64_t avail = src_len - src_off;
  const uint64_t take = size < avail ? size : avail;
  for (uint64_t i = 0; i < take; i++) dst[i] = src[src_off + i];
  for (uint64_t i = take; i < size; i++) dst[i] = 0;
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

  block_info *block = 0;
  // Stack height relative to block entry, plus its running extremes.
  int height = 0, lowest = 0, highest = 0;
  int start_block = 1;

  for (int i = 0; i < vm->code_len;) {
    const uint8_t op = vm->frame_code[i];
    const op_info info = op_table[op];

    if (op == 0x5b) start_block = 1; // JUMPDEST always begins a block

    if (start_block) {
      if (block) {
        block->stack_req = (int16_t)-lowest;
        block->stack_max_growth = (int16_t)highest;
      }
      block = &vm->blocks[i];
      block->gas = 0;
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

  // Second pass: for each GAS opcode, record the static gas its block still
  // owes after that instruction, so the interpreter can add it back.
  //
  // Cleared first: the array is reused across programs, and a position this
  // pass does not reach would otherwise read a previous program's correction.
  mem_zero((uint8_t *)vm->gas_fix, (uint64_t)vm->code_len * sizeof(int32_t));
  int32_t cur = -1;
  int32_t prefix = 0;
  for (int i = 0; i < vm->code_len;) {
    const uint8_t op = vm->frame_code[i];
    const op_info info = op_table[op];
    if (op == 0x5b || cur < 0) {
      cur = i; // a block starts here, so its info lives at this position
      prefix = 0;
    }
    if (!(info.flags & OP_VALID)) {
      cur = -1;
      i++;
      continue;
    }
    prefix += info.gas;
    // GAS reports the gas left, and from EIP-2200 SSTORE compares it against
    // the call stipend. Both need the part of this block's static gas that
    // `ENTER_BLOCK` charged up front but that execution has not reached yet.
    if (op == 0x5a || op == 0x55)
      vm->gas_fix[i] = vm->blocks[cur].gas - prefix;
    if (info.flags & OP_TERMINATOR) {
      // The instruction after a terminator opens a new block.
      if (i + 1 < vm->code_len) cur = i + 1;
      prefix = 0;
    }
    i += (op >= 0x60 && op <= 0x7f) ? 1 + (op - 0x5f) : 1;
  }
}

// ---------------------------------------------------------------------------
// Interpreter
// ---------------------------------------------------------------------------

static evm_status interpret(evm_vm *vm);

// ---------------------------------------------------------------------------
// Frames
// ---------------------------------------------------------------------------

/** The parts of the VM that belong to one frame. */
typedef struct {
  int32_t self;
  uint8_t caller[20];
  u256 call_value;
  int is_static;
  u256 *stack_base;
  int sp;
  uint8_t *mem;
  uint64_t mem_cap;
  uint64_t memory_size;
  uint64_t memory_cost;
  uint8_t *jumpdest;
  block_info *blocks;
  int32_t *gas_fix;
  int32_t arena_top;
  int code_len;
  int input_len;
  const uint8_t *code_ptr;
  const uint8_t *input_ptr;
} frame_state;

static void *arena_alloc(evm_vm *vm, int32_t n) {
  n = (n + 15) & ~15;
  if (vm->arena_top + n > vm->arena_cap) return 0;
  void *p = vm->arena + vm->arena_top;
  vm->arena_top += n;
  return p;
}

/**
 * Runs `code` as a nested frame and returns its status.
 *
 * The caller's per-frame fields are saved on the C stack and restored on the
 * way out, so recursion carries the frame stack. Memory and analysis for the
 * new frame come from the bump arena, whose top is part of the saved state.
 */
static evm_status run_frame(evm_vm *vm, int32_t self, const uint8_t *caller,
                            u256 value, const uint8_t *code, int code_len,
                            const uint8_t *input, int input_len, int is_static,
                            int64_t *gas) {
  if (vm->depth >= MAX_DEPTH) return EVM_INVALID_JUMP;

  frame_state saved;
  // A C-stack overflow is a wasm trap, and a trap does not restore the shadow
  // stack pointer: every later call into the module then traps immediately, so
  // one deep program would poison the instance for good. Degrade to an EVM
  // error instead, well before the real limit.
  if (vm->stack_top - (__UINTPTR_TYPE__)&saved > C_STACK_BUDGET)
    return EVM_OUT_OF_MEMORY;

  saved.self = vm->self;
  for (int i = 0; i < 20; i++) saved.caller[i] = vm->caller[i];
  saved.call_value = vm->call_value;
  saved.is_static = vm->is_static;
  saved.stack_base = vm->stack_base;
  saved.sp = vm->sp;
  saved.mem = vm->mem;
  saved.mem_cap = vm->mem_cap;
  saved.memory_size = vm->memory_size;
  saved.memory_cost = vm->memory_cost;
  saved.jumpdest = vm->jumpdest;
  saved.blocks = vm->blocks;
  saved.gas_fix = vm->gas_fix;
  saved.arena_top = vm->arena_top;
  saved.code_len = vm->code_len;
  saved.input_len = vm->input_len;
  saved.code_ptr = vm->frame_code;
  saved.input_ptr = vm->frame_input;

  const int32_t arena_mark = vm->arena_top;
  uint8_t *fjd = (uint8_t *)arena_alloc(vm, (code_len + 7) / 8 + 8);
  block_info *fblocks =
      (block_info *)arena_alloc(vm, (code_len + 1) * (int32_t)sizeof(block_info));
  int32_t *fgas_fix =
      (int32_t *)arena_alloc(vm, (code_len + 1) * (int32_t)sizeof(int32_t));
  u256 *fstack = (u256 *)arena_alloc(vm, FRAME_STACK);
  if (!fjd || !fblocks || !fgas_fix || !fstack) {
    vm->arena_top = arena_mark;
    return EVM_OUT_OF_MEMORY;
  }

  vm->self = self;
  for (int i = 0; i < 20; i++) vm->caller[i] = caller[i];
  vm->call_value = value;
  vm->is_static = is_static;
  vm->stack_base = fstack;
  vm->sp = 0; // every frame starts with an empty stack
  // Deferred to the first `memory_expand`.
  vm->mem = 0;
  vm->mem_cap = 0;
  vm->memory_size = 0;
  vm->memory_cost = 0;
  vm->jumpdest = fjd;
  vm->blocks = fblocks;
  vm->gas_fix = fgas_fix;
  vm->frame_code = code;
  vm->frame_input = input;
  vm->code_len = code_len;
  vm->input_len = input_len;
  vm->gas = *gas;
  vm->depth++;
  analyze(vm);

  const evm_status status = interpret(vm);

  *gas = vm->gas;
  vm->depth--;
  vm->self = saved.self;
  for (int i = 0; i < 20; i++) vm->caller[i] = saved.caller[i];
  vm->call_value = saved.call_value;
  vm->is_static = saved.is_static;
  vm->stack_base = saved.stack_base;
  vm->sp = saved.sp;
  vm->mem = saved.mem;
  vm->mem_cap = saved.mem_cap;
  vm->memory_size = saved.memory_size;
  vm->memory_cost = saved.memory_cost;
  vm->jumpdest = saved.jumpdest;
  vm->blocks = saved.blocks;
  vm->gas_fix = saved.gas_fix;
  vm->arena_top = saved.arena_top;
  vm->code_len = saved.code_len;
  vm->input_len = saved.input_len;
  vm->frame_code = saved.code_ptr;
  vm->frame_input = saved.input_ptr;
  return status;
}

/**
 * Applies the deployed-code rules to a finished initcode frame, charging the
 * 200-per-byte deposit. Returns 1 when the contract is created.
 *
 * Both length and prefix rules are fork-gated, and Frontier is the odd one
 * out at the end: it cannot fail for want of deposit gas, it simply keeps the
 * account with no code at all. Applying any of these three unconditionally is
 * wrong on some fork, which is why the two call sites share this.
 */
static int deposit_code(evm_vm *vm, int32_t created, int32_t snapshot,
                        int64_t *child_gas) {
  const int32_t dep_len = vm->output_len;
  const int spec = vm->ctx.spec;
  // EIP-170 caps deployed code from Spurious Dragon; EIP-3541 reserves the
  // 0xEF prefix from London, for what became EOF.
  if ((spec >= SPEC_SPURIOUS && dep_len > 24576) ||
      (spec >= SPEC_LONDON && dep_len > 0 && vm->output[0] == 0xEF)) {
    state_revert(vm->st, snapshot);
    *child_gas = 0;
    return 0;
  }
  const int64_t deposit = (int64_t)dep_len * 200;
  if (*child_gas < deposit) {
    // Frontier had no way to signal this, so the account survives with empty
    // code and the initcode's gas is simply gone. EIP-2 made it a failure.
    if (spec < SPEC_HOMESTEAD) {
      *child_gas = 0;
      return 1;
    }
    state_revert(vm->st, snapshot);
    *child_gas = 0;
    return 0;
  }
  *child_gas -= deposit;
  // A full code arena is an engine limit, not a protocol one, so fail the
  // creation rather than quietly deploying an empty contract.
  if (!set_code(vm->st, created, vm->output, dep_len)) {
    state_revert(vm->st, snapshot);
    *child_gas = 0;
    return 0;
  }
  return 1;
}

/** Address `0x00..01` through `0x00..11` are the precompiles. */
static inline int precompile_id(const uint8_t *addr, int spec) {
  for (int i = 0; i < 19; i++)
    if (addr[i]) return 0;
  // A precompile that a fork has not introduced yet is an ordinary empty
  // account, so a call to it succeeds and returns nothing.
  int highest = 0x04;
  if (spec >= SPEC_PRAGUE)
    highest = 0x11; // EIP-2537 BLS12-381
  else if (spec >= SPEC_CANCUN)
    highest = 0x0a; // EIP-4844 point evaluation
  else if (spec >= SPEC_ISTANBUL)
    highest = 0x09; // EIP-152 blake2f
  else if (spec >= SPEC_BYZANTIUM)
    highest = 0x08; // bn254 and modexp
  return addr[19] >= 1 && addr[19] <= highest ? addr[19] : 0;
}

/**
 * Runs precompile `id`. Returns `PRE_OK`, `PRE_FAIL` for a precompile that
 * rejects its input, or `PRE_UNSUPPORTED` for one needing curve arithmetic.
 *
 * `gas` is charged here so the caller does not need each precompile's cost
 * formula.
 */
static int run_precompile(int id, const uint8_t *in, uint64_t len,
                          int64_t *gas, uint8_t *out, int32_t *out_len,
                          int spec) {
  const uint64_t words = (len + 31) / 32;
  *out_len = 0;
  switch (id) {
    case 0x01: { // ecrecover
      if (*gas < 3000) return PRE_FAIL;
      *gas -= 3000;
      uint8_t padded[128];
      copy_padded(padded, in, len, 0, 128);
      // The recovery id is the last byte of the second word and must be 27 or
      // 28; a non-zero byte anywhere else in that word is invalid.
      int valid_v = padded[63] == 27 || padded[63] == 28;
      for (int i = 32; i < 63; i++)
        if (padded[i]) valid_v = 0;
      // An invalid signature is not a precompile failure: it succeeds and
      // returns nothing.
      if (!valid_v) return PRE_OK;
      uint8_t addr[20];
      if (!ecrecover(padded, u256_from_be(padded + 64),
                     u256_from_be(padded + 96), padded[63] - 27, addr))
        return PRE_OK;
      // The recovered address is right-aligned in a 32-byte word.
      for (int i = 0; i < 12; i++) out[i] = 0;
      for (int i = 0; i < 20; i++) out[12 + i] = addr[i];
      *out_len = 32;
      return PRE_OK;
    }
    case 0x02: { // SHA2-256
      const int64_t cost = 60 + 12 * (int64_t)words;
      if (*gas < cost) return PRE_FAIL;
      *gas -= cost;
      sha256(in, len, out);
      *out_len = 32;
      return PRE_OK;
    }
    case 0x03: { // RIPEMD-160
      const int64_t cost = 600 + 120 * (int64_t)words;
      if (*gas < cost) return PRE_FAIL;
      *gas -= cost;
      ripemd160(in, len, out);
      *out_len = 32;
      return PRE_OK;
    }
    case 0x04: { // identity
      const int64_t cost = 15 + 3 * (int64_t)words;
      if (*gas < cost) return PRE_FAIL;
      *gas -= cost;
      mem_copy(out, in, len);
      *out_len = (int32_t)len;
      return PRE_OK;
    }
    case 0x05: { // MODEXP (EIP-198, repriced by EIP-2565 and EIP-7883)
      uint8_t hdr[96];
      copy_padded(hdr, in, len, 0, 96);
      const u256 bl_w = u256_from_be(hdr);
      const u256 el_w = u256_from_be(hdr + 32);
      const u256 ml_w = u256_from_be(hdr + 64);
      const uint64_t bl = u256_to_u64_sat(bl_w);
      const uint64_t el = u256_to_u64_sat(el_w);
      const uint64_t ml = u256_to_u64_sat(ml_w);
      // The spec bounds modexp by price, not by length. A header may declare
      // terabyte operands: with an empty modulus that is a legal call costing
      // the 200 floor and returning nothing, and rejecting it out of hand
      // charged the caller everything it had forwarded instead. So price it
      // from the declared lengths first, and only then require that whatever
      // has to be computed fits.
      const uint64_t maxlen = bl > ml ? bl : ml;

      // The adjusted exponent length reads at most the exponent's first 32
      // bytes, however long the exponent claims to be.
      uint8_t exphead[32];
      const uint64_t headlen = el < 32 ? el : 32;
      copy_padded(exphead, in, len, 96 + (bl < len ? bl : len), headlen);
      uint64_t highest = 0;
      for (uint64_t i = 0; i < headlen; i++)
        if (exphead[i]) {
          highest = (headlen - i - 1) * 8 + 7;
          uint8_t bt = exphead[i];
          while (!(bt & 0x80)) {
            bt <<= 1;
            highest--;
          }
          break;
        }
      // Everything below saturates rather than wrapping: an unaffordable price
      // has to stay unaffordable, and these lengths are attacker-chosen.
      uint64_t adj = el <= 32 ? highest : 8 * (el - 32) + highest;
      if (el > 32 && el > ((uint64_t)GAS_UNAFFORDABLE / 8)) adj = (uint64_t)GAS_UNAFFORDABLE;
      if (adj == 0) adj = 1;

      const uint64_t divisor = spec >= SPEC_BERLIN ? 3 : 20;
      int64_t cost;
      if (maxlen > (1ULL << 31)) {
        cost = GAS_UNAFFORDABLE;
      } else {
        uint64_t mult;
        if (spec >= SPEC_BERLIN) {
          // EIP-2565: complexity in 8-byte words, divided by 3.
          const uint64_t wordsm = (maxlen + 7) / 8;
          mult = wordsm * wordsm;
        } else {
          // EIP-198's piecewise complexity, divided by GQUADDIVISOR = 20.
          if (maxlen <= 64) mult = maxlen * maxlen;
          else if (maxlen <= 1024)
            mult = maxlen * maxlen / 4 + 96 * maxlen - 3072;
          else mult = maxlen * maxlen / 16 + 480 * maxlen - 199680;
        }
        cost = mult && adj > (uint64_t)GAS_UNAFFORDABLE / mult
                   ? GAS_UNAFFORDABLE
                   : (int64_t)(mult * adj / divisor);
      }
      // EIP-2565 introduced the floor; before Berlin there is none.
      if (spec >= SPEC_BERLIN && cost < 200) cost = 200;
      if (*gas < cost) return PRE_FAIL;
      *gas -= cost;

      // An empty modulus returns nothing, which is the whole result for the
      // oversized headers above: they never reach the arithmetic.
      if (ml == 0) {
        *out_len = 0;
        return PRE_OK;
      }
      if (bl > MODEXP_MAX_BYTES || el > MODEXP_MAX_BYTES ||
          ml > MODEXP_MAX_BYTES)
        return PRE_FAIL;

      uint8_t basebuf[MODEXP_MAX_BYTES], modbuf[MODEXP_MAX_BYTES];
      uint8_t expbuf[MODEXP_MAX_BYTES];
      copy_padded(basebuf, in, len, 96, bl);
      copy_padded(expbuf, in, len, 96 + bl, el);
      copy_padded(modbuf, in, len, 96 + bl + el, ml);
      modexp(basebuf, bl, expbuf, el, modbuf, ml, out);
      *out_len = (int32_t)ml;
      return PRE_OK;
    }
    case 0x09: { // BLAKE2b F compression (EIP-152)
      // The layout is fixed at 213 bytes; anything else is a hard failure.
      if (len != 213) return PRE_FAIL;
      // The final-block flag is a byte, and only 0 and 1 are valid.
      if (in[212] > 1) return PRE_FAIL;
      const uint32_t rounds = ((uint32_t)in[0] << 24) | ((uint32_t)in[1] << 16) |
                              ((uint32_t)in[2] << 8) | (uint32_t)in[3];
      const int64_t cost = (int64_t)rounds;
      if (*gas < cost) return PRE_FAIL;
      *gas -= cost;
      // The state, message, and counters are little-endian, unlike everything
      // else in the EVM.
      uint64_t h[8], m[16], t[2];
      for (int i = 0; i < 8; i++) h[i] = load64_le(in + 4 + i * 8);
      for (int i = 0; i < 16; i++) m[i] = load64_le(in + 68 + i * 8);
      t[0] = load64_le(in + 196);
      t[1] = load64_le(in + 204);
      blake2b_f(rounds, h, m, t, in[212]);
      for (int i = 0; i < 8; i++) store64_le(out + i * 8, h[i]);
      *out_len = 64;
      return PRE_OK;
    }
    case 0x06: { // bn254 G1 addition (EIP-196)
      // EIP-1108 repriced this from 500.
      const int64_t cost = spec >= SPEC_ISTANBUL ? 150 : 500;
      if (*gas < cost) return PRE_FAIL;
      *gas -= cost;
      uint8_t buf[128];
      copy_padded(buf, in, len, 0, 128);
      g1 a, b, r;
      if (!g1_decode(buf, &a) || !g1_decode(buf + 64, &b)) return PRE_FAIL;
      g1_add(&r, &a, &b);
      u256 x, y;
      g1_affine(&r, &x, &y);
      u256_to_be(x, out);
      u256_to_be(y, out + 32);
      *out_len = 64;
      return PRE_OK;
    }
    case 0x07: { // bn254 G1 scalar multiplication (EIP-196)
      const int64_t cost = spec >= SPEC_ISTANBUL ? 6000 : 40000;
      if (*gas < cost) return PRE_FAIL;
      *gas -= cost;
      uint8_t buf[96];
      copy_padded(buf, in, len, 0, 96);
      g1 a, r;
      if (!g1_decode(buf, &a)) return PRE_FAIL;
      // The scalar is taken as-is: it is not required to be below the order.
      g1_mul(&r, &a, u256_from_be(buf + 64));
      u256 x, y;
      g1_affine(&r, &x, &y);
      u256_to_be(x, out);
      u256_to_be(y, out + 32);
      *out_len = 64;
      return PRE_OK;
    }
    case 0x08: { // bn254 pairing check (EIP-197)
      if (len % 192 != 0) return PRE_FAIL;
      const uint64_t pairs = len / 192;
      // EIP-1108 repriced this from 100000 + 80000 per pair.
      const int64_t base = spec >= SPEC_ISTANBUL ? 45000 : 100000;
      const int64_t per = spec >= SPEC_ISTANBUL ? 34000 : 80000;
      const int64_t cost = base + per * (int64_t)pairs;
      if (*gas < cost) return PRE_FAIL;
      *gas -= cost;
      bn_init();
      fq12 acc = FQ12_ONE;
      for (uint64_t i = 0; i < pairs; i++) {
        const uint8_t *rec = in + i * 192;
        g1 a;
        g2 b;
        if (!g1_decode(rec, &a) || !g2_decode(rec + 64, &b)) return PRE_FAIL;
        // Pairing anything with the identity gives one, so those terms drop
        // out; including them would divide by a zero denominator.
        if (g1_is_inf(&a) || g2_is_inf(&b)) continue;
        u256 px, py;
        g1_affine(&a, &px, &py);
        acc = fq12_mul(acc, bn_miller(px, py, b.x, b.y));
      }
      const int one = fq12_is_one(bn_final_exp(acc));
      for (int i = 0; i < 32; i++) out[i] = 0;
      out[31] = (uint8_t)one;
      *out_len = 32;
      return PRE_OK;
    }
    case 0x0b: { // BLS12_G1ADD (EIP-2537)
      if (len != 256) return PRE_FAIL;
      if (*gas < 375) return PRE_FAIL;
      *gas -= 375;
      bls_init();
      // Addition does not require subgroup membership, only that the points be
      // on the curve.
      bg1 a, b, r;
      if (!bls_read_g1(in, &a, 0) || !bls_read_g1(in + 128, &b, 0))
        return PRE_FAIL;
      bg1_add(&r, &a, &b);
      bls_write_g1(&r, out);
      *out_len = 128;
      return PRE_OK;
    }
    case 0x0d: { // BLS12_G2ADD (EIP-2537)
      if (len != 512) return PRE_FAIL;
      if (*gas < 600) return PRE_FAIL;
      *gas -= 600;
      bls_init();
      bg2 a, b, r;
      if (!bls_read_g2(in, &a, 0) || !bls_read_g2(in + 256, &b, 0))
        return PRE_FAIL;
      bg2_add(&r, &a, &b);
      bls_write_g2(&r, out);
      *out_len = 256;
      return PRE_OK;
    }
    case 0x0c: { // BLS12_G1MSM (EIP-2537)
      if (len == 0 || len % 160 != 0) return PRE_FAIL;
      const uint64_t k = len / 160;
      const int64_t cost =
          (int64_t)k * 12000 * bls_msm_discount(k, 1) / 1000;
      if (*gas < cost) return PRE_FAIL;
      *gas -= cost;
      bls_init();
      bg1 acc = bg1_inf();
      for (uint64_t i = 0; i < k; i++) {
        const uint8_t *rec = in + i * 160;
        bg1 p, t;
        if (!bls_read_g1(rec, &p, 1)) return PRE_FAIL;
        uint64_t scalar[4] = {0};
        for (int j = 0; j < 32; j++) {
          const int nib = 31 - j;
          scalar[nib / 8] |= (uint64_t)rec[128 + j] << ((nib % 8) * 8);
        }
        bg1_mul(&t, &p, scalar, 4);
        bg1 sum;
        bg1_add(&sum, &acc, &t);
        acc = sum;
      }
      bls_write_g1(&acc, out);
      *out_len = 128;
      return PRE_OK;
    }
    case 0x0e: { // BLS12_G2MSM (EIP-2537)
      if (len == 0 || len % 288 != 0) return PRE_FAIL;
      const uint64_t k = len / 288;
      const int64_t cost =
          (int64_t)k * 22500 * bls_msm_discount(k, 0) / 1000;
      if (*gas < cost) return PRE_FAIL;
      *gas -= cost;
      bls_init();
      bg2 acc = bg2_inf();
      for (uint64_t i = 0; i < k; i++) {
        const uint8_t *rec = in + i * 288;
        bg2 p, t;
        if (!bls_read_g2(rec, &p, 1)) return PRE_FAIL;
        uint64_t scalar[4] = {0};
        for (int j = 0; j < 32; j++) {
          const int nib = 31 - j;
          scalar[nib / 8] |= (uint64_t)rec[256 + j] << ((nib % 8) * 8);
        }
        bg2_mul(&t, &p, scalar, 4);
        bg2 sum;
        bg2_add(&sum, &acc, &t);
        acc = sum;
      }
      bls_write_g2(&acc, out);
      *out_len = 256;
      return PRE_OK;
    }
    case 0x0f: { // BLS12_PAIRING_CHECK (EIP-2537)
      if (len == 0 || len % 384 != 0) return PRE_FAIL;
      const uint64_t k = len / 384;
      const int64_t cost = 32600 * (int64_t)k + 37700;
      if (*gas < cost) return PRE_FAIL;
      *gas -= cost;
      bls_init();
      fp12 acc = fp12_one();
      for (uint64_t i = 0; i < k; i++) {
        const uint8_t *rec = in + i * 384;
        bg1 a;
        bg2 b;
        if (!bls_read_g1(rec, &a, 1) || !bls_read_g2(rec + 128, &b, 1))
          return PRE_FAIL;
        // Pairing with the identity gives one, so those terms drop out.
        if (bg1_is_inf(&a) || bg2_is_inf(&b)) continue;
        bfp ax, ay;
        bg1_affine(&a, &ax, &ay);
        acc = fp12_mul(acc, bls_miller(ax, ay, b.x, b.y));
      }
      const int one = fp12_is_one(bls_final_exp(acc));
      for (int i = 0; i < 32; i++) out[i] = 0;
      out[31] = (uint8_t)one;
      *out_len = 32;
      return PRE_OK;
    }
    case 0x10: { // BLS12_MAP_FP_TO_G1 (EIP-2537)
      if (len != 64) return PRE_FAIL;
      if (*gas < 5500) return PRE_FAIL;
      *gas -= 5500;
      bls_init();
      bfp u;
      if (!bls_read_fp(in, &u)) return PRE_FAIL;
      bg1 r;
      bls_map_fp_to_g1(u, &r);
      bls_write_g1(&r, out);
      *out_len = 128;
      return PRE_OK;
    }
    case 0x11: { // BLS12_MAP_FP2_TO_G2 (EIP-2537)
      if (len != 128) return PRE_FAIL;
      if (*gas < 23800) return PRE_FAIL;
      *gas -= 23800;
      bls_init();
      fp2 u;
      if (!bls_read_fp2(in, &u)) return PRE_FAIL;
      bg2 r;
      if (!bls_map_fp2_to_g2(u, &r)) return PRE_FAIL;
      bls_write_g2(&r, out);
      *out_len = 256;
      return PRE_OK;
    }
    case 0x0a: { // KZG point evaluation (EIP-4844)
      if (len != 192) return PRE_FAIL;
      if (*gas < 50000) return PRE_FAIL;
      *gas -= 50000;
      bls_init();
      // versioned_hash || z || y || commitment || proof
      const uint8_t *vh = in;
      const uint8_t *zb = in + 32;
      const uint8_t *yb = in + 64;
      const uint8_t *cb = in + 96;
      const uint8_t *pb = in + 144;
      // The versioned hash commits to the commitment: sha256 of it with the
      // leading byte replaced by the version.
      uint8_t digest[32];
      sha256(cb, 48, digest);
      digest[0] = 0x01;
      for (int i = 0; i < 32; i++)
        if (digest[i] != vh[i]) return PRE_FAIL;
      // z and y are scalars, so they must be below the group order.
      uint64_t z[4] = {0}, y[4] = {0};
      for (int i = 0; i < 32; i++) {
        const int nib = 31 - i;
        z[nib / 8] |= (uint64_t)zb[i] << ((nib % 8) * 8);
        y[nib / 8] |= (uint64_t)yb[i] << ((nib % 8) * 8);
      }
      for (int i = 3; i >= 0; i--) {
        if (z[i] != BLS_ORDER[i]) {
          if (z[i] > BLS_ORDER[i]) return PRE_FAIL;
          break;
        }
        if (i == 0) return PRE_FAIL;
      }
      for (int i = 3; i >= 0; i--) {
        if (y[i] != BLS_ORDER[i]) {
          if (y[i] > BLS_ORDER[i]) return PRE_FAIL;
          break;
        }
        if (i == 0) return PRE_FAIL;
      }
      bg1 commitment, proof;
      if (!bls_decompress_g1(cb, &commitment) ||
          !bls_decompress_g1(pb, &proof))
        return PRE_FAIL;

      // The check is e(C - [y]G1, -G2) * e(proof, [s]G2 - [z]G2) == 1.
      const bg1 g1 = bls_g1_generator();
      bg1 yg1, lhs;
      bg1_mul(&yg1, &g1, y, 4);
      if (!bg1_is_inf(&yg1)) yg1.y = bfp_neg(yg1.y);
      bg1_add(&lhs, &commitment, &yg1);

      bg2 g2 = bls_g2_from(BLS_G2_GEN);
      const bg2 sg2 = bls_g2_from(BLS_SETUP_G2);
      bg2 zg2, rhs;
      bg2_mul(&zg2, &g2, z, 4);
      if (!bg2_is_inf(&zg2)) zg2.y = fp2_neg(zg2.y);
      bg2_add(&rhs, &sg2, &zg2);
      g2.y = fp2_neg(g2.y); // -G2

      fp12 acc = fp12_one();
      if (!bg1_is_inf(&lhs) && !bg2_is_inf(&g2)) {
        bfp ax, ay;
        bg1_affine(&lhs, &ax, &ay);
        fp2 bx, by;
        bg2_affine(&g2, &bx, &by);
        acc = fp12_mul(acc, bls_miller(ax, ay, bx, by));
      }
      if (!bg1_is_inf(&proof) && !bg2_is_inf(&rhs)) {
        bfp ax, ay;
        bg1_affine(&proof, &ax, &ay);
        fp2 bx, by;
        bg2_affine(&rhs, &bx, &by);
        acc = fp12_mul(acc, bls_miller(ax, ay, bx, by));
      }
      if (!fp12_is_one(bls_final_exp(acc))) return PRE_FAIL;

      // On success the precompile returns the blob width and the modulus.
      for (int i = 0; i < 64; i++) out[i] = 0;
      out[30] = 0x10; // FIELD_ELEMENTS_PER_BLOB = 4096
      for (int i = 0; i < 4; i++)
        for (int j = 0; j < 8; j++)
          out[63 - (i * 8 + j)] = (uint8_t)(BLS_ORDER[i] >> (j * 8));
      *out_len = 64;
      return PRE_OK;
    }
    default:
      // The two map-to-curve precompiles need more curve arithmetic.
      return PRE_UNSUPPORTED;
  }
}

/** EIP-150: a caller may only forward all but a 64th of its remaining gas. */
static inline int64_t capped_gas(int64_t available, u256 requested) {
  const int64_t retained = available / 64;
  const int64_t allowed = available - retained;
  const uint64_t want = u256_to_u64_sat(requested);
  return want < (uint64_t)allowed ? (int64_t)want : allowed;
}

/**
 * The gas a sub-call receives, on any fork.
 *
 * Before Tangerine there is no cap and no retention: the callee gets exactly
 * what was asked for, and asking for more than the caller holds is an
 * out-of-gas error rather than a silent clamp. Returns -1 for that case.
 */
static inline int64_t call_gas(int64_t available, u256 requested, int spec) {
  if (spec >= SPEC_TANGERINE) return capped_gas(available, requested);
  const uint64_t want = u256_to_u64_sat(requested);
  return want <= (uint64_t)available ? (int64_t)want : -1;
}

/** Charges a block's static gas and validates its stack bounds up front. */
#define ENTER_BLOCK(at)                                       \
  do {                                                        \
    const block_info b_ = vm->blocks[at];                     \
    if (gas < b_.gas) HALT(EVM_OUT_OF_GAS);                   \
    gas -= b_.gas;                                            \
    const int height_ = (int)(sp - vm->stack_base);           \
    if (height_ < b_.stack_req) HALT(EVM_STACK_UNDERFLOW);    \
    if (height_ + b_.stack_max_growth > STACK_LIMIT)          \
      HALT(EVM_STACK_OVERFLOW);                               \
  } while (0)

#ifdef OX_TRACE
#define TRACE_STEP()                                    \
  if (vm->trace_count < TRACE_CAP) {                    \
    evm_trace_entry *e_ = &vm->trace[vm->trace_count++]; \
    e_->pc = pc;                                        \
    e_->op = op;                                        \
    e_->gas = gas;                                      \
    e_->depth = vm->depth;                              \
    e_->sp = (int32_t)(sp - vm->stack_base);            \
  }
#else
#define TRACE_STEP() ((void)0)
#endif

/**
 * Opens the block starting at `pc`, having arrived at it rather than fallen
 * through into it — a taken jump, or the instruction after a call.
 *
 * A JUMPDEST is always the first instruction of its own block, so opening the
 * block has already executed it and `pc` moves past it. That is what keeps the
 * block from being charged twice, and on a taken jump it also saves a dispatch
 * round-trip through `case 0x5b` — one instruction in eight around a tight
 * loop. `continue` stays at the call site: inside the `do`/`while (0)` here it
 * would bind to the macro rather than to the interpreter loop.
 */
#define OPEN_BLOCK()            \
  do {                          \
    ENTER_BLOCK(pc);            \
    if (code[pc] == 0x5b) pc++; \
  } while (0)

static evm_status interpret(evm_vm *vm) {
  int pc = 0;
  u256 *sp = vm->stack_base + vm->sp;
  int64_t gas = vm->gas;
  // Hoisted for the same reason as `sp` and `gas`: reached through `vm` these
  // were reloaded on every instruction.
  const uint8_t *const code = vm->frame_code;
  const int code_len = vm->code_len;
  vm->output_len = 0;

  if (code_len == 0) return EVM_SUCCESS;
  OPEN_BLOCK();

  for (;;) {
    if (pc >= code_len) DONE(EVM_SUCCESS); // running off the end is STOP
    const uint8_t op = code[pc];
    TRACE_STEP();

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
      case 0x1b: // SHL (EIP-145)
        REQUIRE_SPEC(SPEC_CONSTANTINOPLE);
        BINARY(u256_to_u64_sat(a) >= 256 ? U256_ZERO : u256_shl(b, (uint32_t)u256_to_u64_sat(a)));
        break;
      case 0x1c: // SHR (EIP-145)
        REQUIRE_SPEC(SPEC_CONSTANTINOPLE);
        BINARY(u256_to_u64_sat(a) >= 256 ? U256_ZERO : u256_shr(b, (uint32_t)u256_to_u64_sat(a)));
        break;
      case 0x1d: // SAR (EIP-145)
        REQUIRE_SPEC(SPEC_CONSTANTINOPLE);
        BINARY(u256_sar(b, u256_to_u64_sat(a) >= 256 ? 256 : (uint32_t)u256_to_u64_sat(a)));
        break;

      case 0x20: { // KECCAK256
        u256 off = POP(), len = POP();
        uint64_t o = u256_to_u64_sat(off), n = u256_to_u64_sat(len);
        if (n && (o > MAX_MEMORY_OFFSET || n > MAX_MEMORY_OFFSET))
          HALT(EVM_OUT_OF_GAS);
        USE_GAS(6 * ((n + 31) / 32));
        evm_status s = memory_expand(vm, o, n, &gas);
        if (s != EVM_SUCCESS) HALT(s);
        uint8_t hash[32];
        keccak256(vm->mem + o, n, hash);
        PUSH(u256_from_be(hash));
        break;
      }

      case 0x35: { // CALLDATALOAD
        u256 off = POP();
        uint64_t o = u256_to_u64_sat(off);
        uint8_t word[32];
        copy_padded(word, vm->frame_input, (uint64_t)vm->input_len, o, 32);
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
        if (n && (d > MAX_MEMORY_OFFSET || n > MAX_MEMORY_OFFSET))
          HALT(EVM_OUT_OF_GAS);
        USE_GAS(3 * ((n + 31) / 32));
        evm_status st = memory_expand(vm, d, n, &gas);
        if (st != EVM_SUCCESS) HALT(st);
        copy_padded(vm->mem + d, vm->frame_input, (uint64_t)vm->input_len, s, n);
        break;
      }
      case 0x38: // CODESIZE
        PUSH(u256_from_u64((uint64_t)code_len));
        break;
      case 0x39: { // CODECOPY
        u256 dst = POP(), src = POP(), len = POP();
        uint64_t d = u256_to_u64_sat(dst), s = u256_to_u64_sat(src),
                 n = u256_to_u64_sat(len);
        if (n && (d > MAX_MEMORY_OFFSET || n > MAX_MEMORY_OFFSET))
          HALT(EVM_OUT_OF_GAS);
        USE_GAS(3 * ((n + 31) / 32));
        evm_status st = memory_expand(vm, d, n, &gas);
        if (st != EVM_SUCCESS) HALT(st);
        copy_padded(vm->mem + d, code, (uint64_t)code_len, s, n);
        break;
      }

      case 0x50: // POP
        sp--;
        break;
      case 0x51: { // MLOAD
        u256 off = POP();
        uint64_t o = u256_to_u64_sat(off);
        // Bounded so `o + 32` cannot wrap. The limit is the addressable range,
        // not the calldata limit these three used to share by mistake: an
        // MSTORE8 a couple of megabytes up is affordable and legal, and was
        // being rejected. Anything genuinely out of range runs out of gas on
        // the quadratic expansion price long before it reaches this.
        if (o > MAX_MEMORY_OFFSET) HALT(EVM_OUT_OF_GAS);
        evm_status s = memory_expand(vm, o, 32, &gas);
        if (s != EVM_SUCCESS) HALT(s);
        PUSH(u256_from_be(vm->mem + o));
        break;
      }
      case 0x52: { // MSTORE
        u256 off = POP(), v = POP();
        uint64_t o = u256_to_u64_sat(off);
        if (o > MAX_MEMORY_OFFSET) HALT(EVM_OUT_OF_GAS);
        evm_status s = memory_expand(vm, o, 32, &gas);
        if (s != EVM_SUCCESS) HALT(s);
        u256_to_be(v, vm->mem + o);
        break;
      }
      case 0x53: { // MSTORE8
        u256 off = POP(), v = POP();
        uint64_t o = u256_to_u64_sat(off);
        if (o > MAX_MEMORY_OFFSET) HALT(EVM_OUT_OF_GAS);
        evm_status s = memory_expand(vm, o, 1, &gas);
        if (s != EVM_SUCCESS) HALT(s);
        vm->mem[o] = (uint8_t)(v.l[0] & 0xff);
        break;
      }
      case 0x56: { // JUMP
        u256 t = POP();
        uint64_t d = u256_to_u64_sat(t);
        if (d >= (uint64_t)code_len || !JUMPDEST_GET(d))
          HALT(EVM_INVALID_JUMP);
        pc = (int)d;
        OPEN_BLOCK();
        continue;
      }
      case 0x57: { // JUMPI
        u256 t = POP(), cond = POP();
        if (!u256_is_zero(cond)) {
          uint64_t d = u256_to_u64_sat(t);
          if (d >= (uint64_t)code_len || !JUMPDEST_GET(d))
            HALT(EVM_INVALID_JUMP);
          pc = (int)d;
          OPEN_BLOCK();
          continue;
        }
        // Falling through starts a new block, since this one ended here.
        pc++;
        if (pc >= code_len) DONE(EVM_SUCCESS);
        OPEN_BLOCK();
        continue;
      }
      case 0x58: // PC
        PUSH(u256_from_u64((uint64_t)pc));
        break;
      case 0x59: // MSIZE
        PUSH(u256_from_u64(vm->memory_size));
        break;
      case 0x5a: // GAS
        // Add back the part of this block's static gas not yet reached.
        PUSH(u256_from_u64((uint64_t)(gas + vm->gas_fix[pc])));
        break;
      case 0x5b: // JUMPDEST
        ENTER_BLOCK(pc);
        break;
      case 0x5f: // PUSH0 (EIP-3855)
        REQUIRE_SPEC(SPEC_SHANGHAI);
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
      case 0x46: // CHAINID (EIP-1344)
        REQUIRE_SPEC(SPEC_ISTANBUL);
        PUSH(vm->ctx.chain_id);
        break;
      case 0x48: // BASEFEE (EIP-3198)
        REQUIRE_SPEC(SPEC_LONDON);
        PUSH(vm->ctx.base_fee);
        break;
      case 0x4a: // BLOBBASEFEE (EIP-7516)
        REQUIRE_SPEC(SPEC_CANCUN);
        PUSH(vm->ctx.blob_base_fee);
        break;
      case 0x47: // SELFBALANCE (EIP-1884)
        REQUIRE_SPEC(SPEC_ISTANBUL);
        PUSH(vm->st->accounts[vm->self].balance);
        break;
      case 0x49: { // BLOBHASH (EIP-4844)
        REQUIRE_SPEC(SPEC_CANCUN);
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
        // EIP-1884 raised BALANCE from 400 to 700; before EIP-150 it was 20.
        USE_GAS(access_cost(vm, a,
                            vm->ctx.spec >= SPEC_ISTANBUL
                                ? 700
                                : (vm->ctx.spec >= SPEC_TANGERINE ? 400 : 20)));
        PUSH(vm->st->accounts[a].balance);
        break;
      }
      case 0x3b: { // EXTCODESIZE
        uint8_t addr[20];
        word_to_address(POP(), addr);
        const int32_t a = account_intern(vm->st, addr);
        if (a < 0) HALT(EVM_OUT_OF_MEMORY);
        USE_GAS(access_cost(vm, a, vm->ctx.spec >= SPEC_TANGERINE ? 700 : 20));
        PUSH(u256_from_u64((uint64_t)vm->st->accounts[a].code_len));
        break;
      }
      case 0x3f: { // EXTCODEHASH (EIP-1052)
        REQUIRE_SPEC(SPEC_CONSTANTINOPLE);
        uint8_t addr[20];
        word_to_address(POP(), addr);
        const int32_t a = account_intern(vm->st, addr);
        if (a < 0) HALT(EVM_OUT_OF_MEMORY);
        // EXTCODEHASH arrived in Constantinople at 400 and was raised to 700.
        USE_GAS(access_cost(vm, a, vm->ctx.spec >= SPEC_ISTANBUL ? 700 : 400));
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
        USE_GAS(access_cost(vm, a, vm->ctx.spec >= SPEC_TANGERINE ? 700 : 20));
        const uint64_t d = u256_to_u64_sat(dst), so = u256_to_u64_sat(src),
                       n = u256_to_u64_sat(len);
        if (n && (d > MAX_MEMORY_OFFSET || n > MAX_MEMORY_OFFSET))
          HALT(EVM_OUT_OF_GAS);
        USE_GAS(3 * ((n + 31) / 32));
        evm_status st_ = memory_expand(vm, d, n, &gas);
        if (st_ != EVM_SUCCESS) HALT(st_);
        copy_padded(vm->mem + d,
                    vm->st->code_arena + vm->st->accounts[a].code_offset,
                    (uint64_t)vm->st->accounts[a].code_len, so, n);
        break;
      }

      case 0x3d: // RETURNDATASIZE (EIP-211)
        REQUIRE_SPEC(SPEC_BYZANTIUM);
        PUSH(u256_from_u64((uint64_t)vm->returndata_len));
        break;
      case 0x3e: { // RETURNDATACOPY (EIP-211)
        REQUIRE_SPEC(SPEC_BYZANTIUM);
        const u256 dst = POP(), src = POP(), len = POP();
        const uint64_t d = u256_to_u64_sat(dst), so = u256_to_u64_sat(src),
                       n = u256_to_u64_sat(len);
        if (n && (d > MAX_MEMORY_OFFSET || n > MAX_MEMORY_OFFSET))
          HALT(EVM_OUT_OF_GAS);
        // Unlike the other copies, reading past the end is an error rather
        // than a zero-fill.
        if (so + n > (uint64_t)vm->returndata_len || so + n < so)
          HALT(EVM_INVALID_JUMP);
        USE_GAS(3 * ((n + 31) / 32));
        evm_status st_ = memory_expand(vm, d, n, &gas);
        if (st_ != EVM_SUCCESS) HALT(st_);
        mem_copy(vm->mem + d, vm->returndata + so, n);
        break;
      }

      case 0x54: { // SLOAD
        const u256 key = PEEK(0);
        const int32_t slot = slot_intern(vm->st, vm->self, key);
        if (slot < 0) HALT(EVM_OUT_OF_MEMORY);
        // SLOAD: 50 originally, 200 after EIP-150, 800 after EIP-1884, then
        // warm/cold from Berlin.
        const int cold = warm_slot(vm->st, slot);
        USE_GAS(vm->ctx.spec >= SPEC_BERLIN
                    ? (cold ? GAS_COLD_SLOAD : GAS_WARM)
                    : (vm->ctx.spec >= SPEC_ISTANBUL
                           ? 800
                           : (vm->ctx.spec >= SPEC_TANGERINE ? 200 : 50)));
        sp[-1] = vm->st->slots[slot].value;
        break;
      }
      case 0x55: { // SSTORE
        if (vm->is_static) HALT(EVM_STATIC_VIOLATION);
        // EIP-2200's sentry: an SSTORE with no more than the call stipend left
        // fails outright, whatever it would have cost. It exists so that a
        // 2300-gas transfer callback cannot write storage, and the check is
        // against the gas *before* the charge — `gas_fix` adds back the part
        // of this block that `ENTER_BLOCK` has already taken but that
        // execution has not reached.
        if (vm->ctx.spec >= SPEC_ISTANBUL && gas + vm->gas_fix[pc] <= 2300)
          HALT(EVM_OUT_OF_GAS);
        const u256 key = POP(), value = POP();
        const int32_t slot = slot_intern(vm->st, vm->self, key);
        if (slot < 0) HALT(EVM_OUT_OF_MEMORY);
        const int cold = warm_slot(vm->st, slot);
        const u256 current = vm->st->slots[slot].value;
        if (vm->ctx.spec < SPEC_ISTANBUL) {
          // Before EIP-2200 the price depends only on the current value, and
          // there is no net metering to unwind.
          USE_GAS(u256_is_zero(current) && !u256_is_zero(value) ? GAS_SSET
                                                                : 5000);
          if (!u256_is_zero(current) && u256_is_zero(value))
            add_refund(vm->st, 15000);
          set_storage(vm->st, slot, value);
          break;
        }
        // EIP-2200 net metering: the cost depends on the original, current, and
        // new values. Berlin split the base into a cold surcharge plus the warm
        // read, and EIP-3529 cut the clearing refund from 15000 to 4800.
        const int64_t noop_gas = vm->ctx.spec >= SPEC_BERLIN ? GAS_WARM : 800;
        const int64_t reset_gas = vm->ctx.spec >= SPEC_BERLIN ? GAS_SRESET
                                                              : 5000;
        const int64_t clear_refund =
            vm->ctx.spec >= SPEC_LONDON ? REFUND_SCLEAR : 15000;
        if (cold && vm->ctx.spec >= SPEC_BERLIN) USE_GAS(GAS_COLD_SLOAD);
        const u256 original = vm->st->slots[slot].original;
        if (u256_eq(current, value)) {
          USE_GAS(noop_gas);
        } else if (u256_eq(original, current)) {
          USE_GAS(u256_is_zero(original) ? GAS_SSET : reset_gas);
          if (!u256_is_zero(original) && u256_is_zero(value))
            add_refund(vm->st, clear_refund);
        } else {
          USE_GAS(noop_gas);
          // Refund bookkeeping when a slot is revisited within the transaction.
          if (!u256_is_zero(original)) {
            if (u256_is_zero(current)) sub_refund(vm->st, clear_refund);
            if (u256_is_zero(value)) add_refund(vm->st, clear_refund);
          }
          if (u256_eq(original, value)) {
            if (u256_is_zero(original))
              add_refund(vm->st, GAS_SSET - noop_gas);
            else
              add_refund(vm->st, reset_gas - noop_gas);
          }
        }
        set_storage(vm->st, slot, value);
        break;
      }
      case 0x5c: { // TLOAD (EIP-1153)
        REQUIRE_SPEC(SPEC_CANCUN);
        const u256 key = PEEK(0);
        sp[-1] = transient_load(vm->st, vm->self, key);
        break;
      }
      case 0x5d: { // TSTORE (EIP-1153)
        REQUIRE_SPEC(SPEC_CANCUN);
        if (vm->is_static) HALT(EVM_STATIC_VIOLATION);
        const u256 key = POP(), value = POP();
        transient_store(vm->st, vm->self, key, value);
        break;
      }

      case 0x5e: { // MCOPY (EIP-5656)
        REQUIRE_SPEC(SPEC_CANCUN);
        const u256 dst = POP(), src = POP(), len = POP();
        const uint64_t d = u256_to_u64_sat(dst), so = u256_to_u64_sat(src),
                       n = u256_to_u64_sat(len);
        if (n && (d > MAX_MEMORY_OFFSET || so > MAX_MEMORY_OFFSET ||
                  n > MAX_MEMORY_OFFSET))
          HALT(EVM_OUT_OF_GAS);
        USE_GAS(3 * ((n + 31) / 32));
        // Both ends must be covered before the move, and the regions may
        // overlap in either direction.
        evm_status st_ = memory_expand(vm, d > so ? d : so, n, &gas);
        if (st_ != EVM_SUCCESS) HALT(st_);
        if (n) __builtin_memmove(vm->mem + d, vm->mem + so,
                                 (unsigned long)n);
        break;
      }

      case 0xa0: case 0xa1: case 0xa2: case 0xa3: case 0xa4: { // LOG0..LOG4
        if (vm->is_static) HALT(EVM_STATIC_VIOLATION);
        const int topics = op - 0xa0;
        const u256 off = POP(), len = POP();
        const uint64_t o = u256_to_u64_sat(off), n = u256_to_u64_sat(len);
        if (n && (o > MAX_MEMORY_OFFSET || n > MAX_MEMORY_OFFSET))
          HALT(EVM_OUT_OF_GAS);
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
        mem_copy(vm->st->log_data + vm->st->log_data_len, vm->mem + o, n);
        vm->st->log_data_len += (int32_t)n;
        break;
      }

      case 0xf1:   // CALL
      case 0xf2:   // CALLCODE
      case 0xf4:   // DELEGATECALL
      case 0xfa: { // STATICCALL
        // DELEGATECALL arrived in Homestead (EIP-7) and STATICCALL in
        // Byzantium (EIP-214).
        if (op == 0xf4) REQUIRE_SPEC(SPEC_HOMESTEAD);
        if (op == 0xfa) REQUIRE_SPEC(SPEC_BYZANTIUM);
        const int has_value = (op == 0xf1 || op == 0xf2);
        const u256 gas_arg = POP();
        uint8_t to[20];
        word_to_address(POP(), to);
        const u256 value = has_value ? POP() : U256_ZERO;
        const uint64_t in_off = u256_to_u64_sat(POP());
        const uint64_t in_len = u256_to_u64_sat(POP());
        const uint64_t out_off = u256_to_u64_sat(POP());
        const uint64_t out_len = u256_to_u64_sat(POP());
        // A zero-length window never touches memory, so its offset is free to
        // be nonsense; only a non-empty one has to be addressable.
        if ((in_len && (in_off > MAX_MEMORY_OFFSET ||
                        in_len > MAX_MEMORY_OFFSET)) ||
            (out_len && (out_off > MAX_MEMORY_OFFSET ||
                         out_len > MAX_MEMORY_OFFSET)))
          HALT(EVM_OUT_OF_GAS);
        // A static frame may not move value — but only CALL moves any.
        // CALLCODE's value never leaves the account: it runs foreign code in
        // this one, and the figure is there for the stipend and for CALLVALUE.
        // Rejecting it too made a CALLCODE with value inside a STATICCALL fail
        // where it should run.
        if (op == 0xf1 && vm->is_static && !u256_is_zero(value))
          HALT(EVM_STATIC_VIOLATION);

        const int32_t callee = account_intern(vm->st, to);
        if (callee < 0) HALT(EVM_OUT_OF_MEMORY);
        // EIP-150 raised the call cost from 40 to 700; Berlin replaced it with
        // warm/cold.
        USE_GAS(access_cost(vm, callee,
                            vm->ctx.spec >= SPEC_TANGERINE ? 700 : 40));
        // An EIP-7702 delegation costs a further access, and it is part of the
        // call's own cost rather than the child's: it comes out of the caller's
        // gas before the 63/64 cap is applied.
        int deleg_oog = 0;
        const int32_t code_from =
            resolve_delegation(vm, callee, &gas, &deleg_oog);
        if (deleg_oog) HALT(EVM_OUT_OF_GAS);

        evm_status ms = memory_expand(vm, in_off, in_len, &gas);
        if (ms != EVM_SUCCESS) HALT(ms);
        ms = memory_expand(vm, out_off, out_len, &gas);
        if (ms != EVM_SUCCESS) HALT(ms);

        if (!u256_is_zero(value)) {
          USE_GAS(9000);
          // Funding an account that does not yet exist costs extra.
          if (op == 0xf1 && !vm->st->accounts[callee].exists &&
              u256_is_zero(vm->st->accounts[callee].balance) &&
              vm->st->accounts[callee].nonce == 0 &&
              vm->st->accounts[callee].code_len == 0)
            USE_GAS(25000);
        }

        int64_t child_gas = call_gas(gas, gas_arg, vm->ctx.spec);
        if (child_gas < 0) HALT(EVM_OUT_OF_GAS);
        gas -= child_gas;
        // The stipend is granted on top of the 63/64 cap.
        if (!u256_is_zero(value)) child_gas += 2300;

        // Copy the calldata out of memory first: the child gets its own memory
        // and the arena may hand it the very bytes we are reading.
        uint8_t *args = (uint8_t *)arena_alloc(vm, (int32_t)in_len + 16);
        if (!args) HALT(EVM_OUT_OF_MEMORY);
        mem_copy(args, vm->mem + in_off, in_len);

        const int32_t snapshot = state_snapshot(vm->st);
        const u256 caller_balance = vm->st->accounts[vm->self].balance;
        // Every call replaces the returndata buffer, including one that never
        // starts. Leaving the previous call's output in place made
        // RETURNDATASIZE report it.
        vm->returndata_len = 0;
        int ok = 1;
        if (!u256_is_zero(value) && u256_cmp(caller_balance, value) < 0) {
          ok = 0; // insufficient balance: the call fails without executing
        } else {
          if (!u256_is_zero(value) && op == 0xf1) {
            set_balance(vm->st, vm->self, u256_sub(caller_balance, value));
            set_balance(vm->st, callee,
                        u256_add(vm->st->accounts[callee].balance, value));
            if (!vm->st->accounts[callee].exists)
              set_exists(vm->st, callee, 1);
          }
          // DELEGATECALL and CALLCODE run the callee's code against the
          // caller's own storage and address.
          const int32_t exec_self = (op == 0xf1 || op == 0xfa) ? callee : vm->self;
          const uint8_t *sub_caller =
              op == 0xf4 ? vm->caller : vm->st->accounts[vm->self].address;
          const u256 sub_value = op == 0xf4 ? vm->call_value : value;
          const int sub_static = vm->is_static || op == 0xfa;

          const int pid = precompile_id(to, vm->ctx.spec);
          if (pid) {
            int32_t plen = 0;
            const int pr = run_precompile(pid, args, in_len, &child_gas,
                                          vm->returndata, &plen, vm->ctx.spec);
            if (pr == PRE_OK) {
              ok = 1;
              vm->returndata_len = plen;
            } else {
              // A failed or unimplemented precompile consumes the whole
              // forwarded allowance, as a failed call does.
              ok = 0;
              child_gas = 0;
              vm->returndata_len = 0;
              state_revert(vm->st, snapshot);
            }
            goto call_done;
          }
          const evm_status cs = run_frame(
              vm, exec_self, sub_caller, sub_value,
              vm->st->code_arena + vm->st->accounts[code_from].code_offset,
              vm->st->accounts[code_from].code_len, args, (int)in_len,
              sub_static, &child_gas);
          ok = cs == EVM_SUCCESS;
          if (cs != EVM_SUCCESS) state_revert(vm->st, snapshot);
          // REVERT returns data; an exceptional halt does not.
          vm->returndata_len =
              (cs == EVM_SUCCESS || cs == EVM_REVERT) ? vm->output_len : 0;
          mem_copy(vm->returndata, vm->output, (uint64_t)vm->returndata_len);
          // `output_len` is shared across frames. This frame has not returned
          // anything yet, so leaving the child's length there would make its own
          // STOP look like a RETURN of that many bytes to *its* caller.
          vm->output_len = 0;
        }
      call_done:
        if (!ok && vm->returndata_len == 0) state_revert(vm->st, snapshot);
        gas += child_gas; // unspent child gas returns to the caller

        const uint64_t n = out_len < (uint64_t)vm->returndata_len
                               ? out_len
                               : (uint64_t)vm->returndata_len;
        mem_copy(vm->mem + out_off, vm->returndata, n);
        PUSH(u256_from_u64(ok ? 1 : 0));
        pc++;
        if (pc >= code_len) DONE(EVM_SUCCESS);
        OPEN_BLOCK();
        continue;
      }

      case 0xf0:   // CREATE
      case 0xf5: { // CREATE2 (EIP-1014)
        // Only CREATE2 is fork-gated; CREATE has existed since Frontier, and
        // they share this label.
        if (op == 0xf5) REQUIRE_SPEC(SPEC_CONSTANTINOPLE);
        if (vm->is_static) HALT(EVM_STATIC_VIOLATION);
        const u256 value = POP();
        const uint64_t off = u256_to_u64_sat(POP());
        const uint64_t len = u256_to_u64_sat(POP());
        const u256 salt = op == 0xf5 ? POP() : U256_ZERO;
        if (len && (off > MAX_MEMORY_OFFSET || len > MAX_MEMORY_OFFSET))
          HALT(EVM_OUT_OF_GAS);
        USE_GAS(32000);
        evm_status ms = memory_expand(vm, off, len, &gas);
        if (ms != EVM_SUCCESS) HALT(ms);
        // EIP-3860 charges for initcode words from Shanghai on, and caps the
        // initcode at twice the deployed-code limit. CREATE2 hashes the
        // initcode at every fork that has it.
        if (vm->ctx.spec >= SPEC_SHANGHAI) {
          if (len > 49152) HALT(EVM_OUT_OF_GAS);
          USE_GAS(2 * ((len + 31) / 32));
        }
        if (op == 0xf5) USE_GAS(6 * ((len + 31) / 32));

        // EIP-2681 caps a nonce at 2^64 - 1, so an account there can create
        // nothing further: the creation fails, the nonce does not move, and the
        // gas that would have gone to the initcode stays with the caller.
        if (vm->st->accounts[vm->self].nonce == 0xFFFFFFFFFFFFFFFFULL) {
          vm->returndata_len = 0;
          PUSH(U256_ZERO);
          pc++;
          if (pc >= code_len) DONE(EVM_SUCCESS);
          OPEN_BLOCK();
          continue;
        }

        uint8_t *init = (uint8_t *)arena_alloc(vm, (int32_t)len + 16);
        if (!init) HALT(EVM_OUT_OF_MEMORY);
        mem_copy(init, vm->mem + off, len);

        uint8_t addr[20];
        const uint8_t *creator = vm->st->accounts[vm->self].address;
        if (op == 0xf0)
          create_address(creator, vm->st->accounts[vm->self].nonce, addr);
        else
          create2_address(creator, salt, init, len, addr);

        // A creation names no gas figure, so it takes everything the cap
        // allows — which before Tangerine is everything.
        int64_t child_gas =
            vm->ctx.spec >= SPEC_TANGERINE
                ? capped_gas(gas, u256_from_u64(~(uint64_t)0))
                : gas;
        gas -= child_gas;

        const u256 creator_balance = vm->st->accounts[vm->self].balance;
        const int32_t created = account_intern(vm->st, addr);
        if (created < 0) HALT(EVM_OUT_OF_MEMORY);
        warm_account(vm->st, created);

        int ok = 0;
        vm->returndata_len = 0;
        // Order matters. Depth and balance are checked before the creator's
        // nonce moves, so a CREATE that fails either way leaves the nonce alone
        // and gets its whole allowance back. A collision is checked after, so
        // that one does advance the nonce and does consume the allowance.
        const int started =
            u256_cmp(creator_balance, value) >= 0 && vm->depth < MAX_DEPTH;
        if (started)
          set_nonce(vm->st, vm->self, vm->st->accounts[vm->self].nonce + 1);
        // Snapshot after the bump: initcode that reverts must not take the
        // creator's nonce back with it.
        const int32_t snapshot = state_snapshot(vm->st);
        // Creating over an account that already has code, a nonce, or — per
        // EIP-7610 — storage fails.
        const int occupied = vm->st->accounts[created].code_len > 0 ||
                             vm->st->accounts[created].nonce > 0 ||
                             vm->st->accounts[created].has_storage;
        if (!started) {
          // Nothing ran.
        } else if (occupied) {
          child_gas = 0;
        } else {
          set_balance(vm->st, vm->self, u256_sub(creator_balance, value));
          set_balance(vm->st, created,
                      u256_add(vm->st->accounts[created].balance, value));
          set_exists(vm->st, created, 1);
          set_created(vm->st, created, 1);
          // EIP-161 (Spurious Dragon) starts a created account at nonce 1;
          // before it, at 0.
          if (vm->ctx.spec >= SPEC_SPURIOUS) set_nonce(vm->st, created, 1);
          const evm_status cs =
              run_frame(vm, created, creator, value, init, (int)len, init, 0, 0,
                        &child_gas);
          if (cs == EVM_SUCCESS) {
            ok = deposit_code(vm, created, snapshot, &child_gas);
          } else {
            state_revert(vm->st, snapshot);
            if (cs == EVM_REVERT) {
              vm->returndata_len = vm->output_len;
              mem_copy(vm->returndata, vm->output, (uint64_t)vm->output_len);
            } else {
              child_gas = 0;
            }
          }
          // Same as the call family: this frame has returned nothing yet, so the
          // initcode's own output length must not be left behind.
          vm->output_len = 0;
        }
        gas += child_gas;
        PUSH(ok ? address_to_word(addr) : U256_ZERO);
        pc++;
        if (pc >= code_len) DONE(EVM_SUCCESS);
        OPEN_BLOCK();
        continue;
      }

      case 0xfe: // INVALID
        HALT(EVM_INVALID_OPCODE);

      case 0xff: { // SELFDESTRUCT
        if (vm->is_static) HALT(EVM_STATIC_VIOLATION);
        // The 5000 base in the opcode table arrived with EIP-150; give it back
        // on the forks that predate it.
        if (vm->ctx.spec < SPEC_TANGERINE) gas += 5000;
        uint8_t addr[20];
        word_to_address(POP(), addr);
        const int32_t target = account_intern(vm->st, addr);
        if (target < 0) HALT(EVM_OUT_OF_MEMORY);
        USE_GAS(vm->ctx.spec >= SPEC_BERLIN
                    ? (warm_account(vm->st, target) ? GAS_COLD_ACCOUNT : 0)
                    : (warm_account(vm->st, target), 0));
        const u256 balance = vm->st->accounts[vm->self].balance;
        // Sending a balance to an account that does not yet exist creates it.
        // EIP-150 introduced this charge alongside the 5000 base.
        if (vm->ctx.spec >= SPEC_TANGERINE && !u256_is_zero(balance) &&
            target != vm->self &&
            !vm->st->accounts[target].exists &&
            u256_is_zero(vm->st->accounts[target].balance) &&
            vm->st->accounts[target].nonce == 0 &&
            vm->st->accounts[target].code_len == 0)
          USE_GAS(25000);
        // EIP-6780 narrowed removal to accounts created in this same
        // transaction. Before Cancun the account always goes.
        const int removed =
            vm->ctx.spec < SPEC_CANCUN || vm->st->accounts[vm->self].created;
        if (!u256_is_zero(balance)) {
          if (target != vm->self) {
            set_balance(vm->st, target,
                        u256_add(vm->st->accounts[target].balance, balance));
            if (!vm->st->accounts[target].exists)
              set_exists(vm->st, target, 1);
            set_balance(vm->st, vm->self, U256_ZERO);
          } else if (removed) {
            // Sending to yourself and being removed burns the balance: the
            // credit and the clear land on the same account and the clear is
            // last. Sending to yourself and surviving is a plain no-op — do
            // neither step, or the balance doubles.
            //
            // Before Cancun everything was removed, so the two cases had
            // nowhere to differ. From Cancun a surviving contract can read its
            // own balance afterwards, and either mistake is worth 19900 gas
            // downstream: the difference between an SSTORE that sets and one
            // that does nothing.
            set_balance(vm->st, vm->self, U256_ZERO);
          }
        }
        // EIP-3529 removed the refund; before London it is 24000, once per
        // account per transaction.
        if (vm->ctx.spec < SPEC_LONDON && !vm->st->accounts[vm->self].destroyed)
          add_refund(vm->st, 24000);
        if (removed) set_destroyed(vm->st, vm->self, 1);
        DONE(EVM_SUCCESS);
      }

      case 0xf3: { // RETURN
        u256 off = POP(), len = POP();
        uint64_t o = u256_to_u64_sat(off), n = u256_to_u64_sat(len);
        if (n && (o > MAX_MEMORY_OFFSET || n > MAX_MEMORY_OFFSET))
          HALT(EVM_OUT_OF_GAS);
        // The output buffer is a fixed megabyte. Memory can be expanded past
        // that affordably, so the length has to be checked against the buffer
        // and not just against memory.
        if (n > MAX_INPUT) HALT(EVM_OUT_OF_MEMORY);
        evm_status s = memory_expand(vm, o, n, &gas);
        if (s != EVM_SUCCESS) HALT(s);
        mem_copy(vm->output, vm->mem + o, n);
        vm->output_len = (int)n;
        DONE(EVM_SUCCESS);
      }
      case 0xfd: { // REVERT (EIP-140)
        REQUIRE_SPEC(SPEC_BYZANTIUM);
        u256 off = POP(), len = POP();
        uint64_t o = u256_to_u64_sat(off), n = u256_to_u64_sat(len);
        if (n && (o > MAX_MEMORY_OFFSET || n > MAX_MEMORY_OFFSET))
          HALT(EVM_OUT_OF_GAS);
        // The output buffer is a fixed megabyte. Memory can be expanded past
        // that affordably, so the length has to be checked against the buffer
        // and not just against memory.
        if (n > MAX_INPUT) HALT(EVM_OUT_OF_MEMORY);
        evm_status s = memory_expand(vm, o, n, &gas);
        if (s != EVM_SUCCESS) HALT(s);
        mem_copy(vm->output, vm->mem + o, n);
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

      case 0x7f: // PUSH32 — a whole word, so no masking or shifting
        if (pc + 33 <= code_len) {
          PUSH(u256_from_be(code + pc + 1));
          pc += 33;
          continue;
        }
        goto push_truncated;

      case 0x68 ... 0x7e: { // PUSH9..PUSH31
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
  vm->ctx.spec = SPEC_DEFAULT;
  vm->jumpdest = (uint8_t *)ox_alloc((MAX_CODE + 7) / 8);
  // One entry per code position, since a block can start at any of them.
  vm->blocks = (block_info *)ox_alloc((uint64_t)MAX_CODE * sizeof(block_info));
  vm->gas_fix = (int32_t *)ox_alloc((uint64_t)MAX_CODE * sizeof(int32_t));
  vm->memory = (uint8_t *)ox_alloc((uint64_t)memory_cap);
  vm->output = (uint8_t *)ox_alloc(MAX_INPUT);
  vm->st = (evm_state *)ox_alloc(sizeof(evm_state));
  vm->returndata = (uint8_t *)ox_alloc(MAX_INPUT);
  vm->stage = (uint8_t *)ox_alloc(MAX_INPUT);
#ifdef OX_TRACE
  vm->trace = (evm_trace_entry *)ox_alloc(TRACE_CAP * sizeof(evm_trace_entry));
  vm->trace_count = 0;
  if (!vm->trace) return 0;
#endif
  if (!vm->jumpdest || !vm->blocks || !vm->gas_fix ||
      !vm->memory || !vm->output || !vm->st || !vm->returndata || !vm->stage)
    return 0;
  vm->st->log_data = (uint8_t *)ox_alloc(LOG_ARENA);
  vm->st->code_arena = (uint8_t *)ox_alloc(CODE_ARENA);
  vm->arena = (uint8_t *)ox_alloc(ANALYSIS_ARENA);
  if (!vm->st->log_data || !vm->st->code_arena || !vm->arena) return 0;
  vm->arena_cap = ANALYSIS_ARENA;
  vm->arena_top = 0;
  vm->mem = vm->memory;
  vm->mem_cap = (uint64_t)memory_cap;
  vm->frame_code = vm->code;
  vm->frame_input = vm->input;
  vm->stack_base = vm->stack;
  state_reset(vm->st);
  vm->self = 0;
  vm->is_static = 0;
  ENTER_TOP(vm);
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
  vm->frame_code = vm->code;
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
  vm->arena_top = 0;
  ENTER_TOP(vm);
  vm->mem = vm->memory;
  vm->mem_cap = vm->memory_cap;
  vm->frame_code = vm->code;
  vm->frame_input = vm->input;
  // Only the previous run's high-water mark is dirty — the rest was zeroed by
  // `evm_new` and never written. Clearing the full capacity here costs more
  // than most programs execute.
  // Clamp to the static buffer: a previous execution may have grown into a
  // larger arena block, leaving `memory_size` past the end of `vm->memory`.
  mem_zero(vm->memory, vm->memory_size < vm->memory_cap ? vm->memory_size
                                                        : vm->memory_cap);
  vm->memory_size = 0;
  return (int)interpret(vm);
}

#ifdef OX_TRACE
EXPORT("evm_trace_ptr") evm_trace_entry *evm_trace_ptr(evm_vm *vm) {
  return vm->trace;
}
EXPORT("evm_trace_count") int evm_trace_count(evm_vm *vm) {
  return vm->trace_count;
}
EXPORT("evm_trace_reset") void evm_trace_reset(evm_vm *vm) { vm->trace_count = 0; }
#endif

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
  vm->ctx.spec = SPEC_DEFAULT;
  vm->returndata_len = 0;
  ENTER_TOP(vm);
  vm->is_static = 0;
  vm->sp = 0;
  vm->stack_base = vm->stack;
  vm->arena_top = 0;
}

/** Interns the account at `stage[0..20)` and sets its balance, nonce, and code. */
EXPORT("evm_put_account")
int evm_put_account(evm_vm *vm, int64_t nonce, int code_len) {
  const int32_t a = account_intern(vm->st, vm->stage + STAGE_ADDR);
  if (a < 0) return EVM_OUT_OF_MEMORY;
  vm->st->accounts[a].balance = u256_from_be(vm->stage + STAGE_WORD_A);
  vm->st->accounts[a].nonce = (uint64_t)nonce;
  vm->st->accounts[a].exists = 1;
  // A zero length clears the code: EIP-7702 undelegation needs that, and a
  // caller loading a codeless account wants it too.
  if (!set_code(vm->st, a, vm->stage + STAGE_BYTES, code_len))
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
  if (!u256_is_zero(v)) vm->st->accounts[a].has_storage = 1;
  vm->st->journal_len = 0;
  return EVM_SUCCESS;
}

EXPORT("evm_set_context")
void evm_set_context(evm_vm *vm, int64_t number, int64_t timestamp,
                     int64_t block_gas_limit, int blob_count,
                     int block_hash_count, int spec) {
  vm->ctx.spec = spec;
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
  vm->ctx.blob_count = blob_count > 16 ? 16 : blob_count;
  for (int i = 0; i < vm->ctx.blob_count; i++)
    vm->ctx.blob_hashes[i] = u256_from_be(p + 224 + i * 32);
  vm->ctx.block_hash_count = block_hash_count > 256 ? 256 : block_hash_count;
  const uint8_t *bh = p + 224 + 16 * 32;
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
  ENTER_TOP(vm);
  vm->returndata_len = 0;

  // A transaction can be sent straight to a precompile, which has no code for
  // the interpreter to run.
  const int top_pid = precompile_id(vm->st->accounts[a].address, vm->ctx.spec);
  if (top_pid) {
    mem_copy(vm->input, vm->stage + STAGE_BYTES, (uint64_t)input_len);
    vm->input_len = input_len;
    int32_t plen = 0;
    int64_t left = gas;
    const int pr =
        run_precompile(top_pid, vm->input, (uint64_t)input_len, &left,
                       vm->output, &plen, vm->ctx.spec);
    if (pr == PRE_OK) {
      vm->output_len = plen;
      vm->gas = left;
      return EVM_SUCCESS;
    }
    vm->output_len = 0;
    vm->gas = 0;
    return EVM_OUT_OF_GAS;
  }

  // The transaction target may itself be an EIP-7702 delegation, in which case
  // the delegate's code runs. The extra access is charged out of the gas the
  // frame is about to run with.
  int deleg_oog = 0;
  int64_t deleg_free = 1 << 30;
  const int32_t code_from = resolve_delegation(vm, a, &deleg_free, &deleg_oog);
  if (deleg_oog) return EVM_OUT_OF_GAS;
  const int32_t code_len = vm->st->accounts[code_from].code_len;
  if (code_len > MAX_CODE) return EVM_CODE_TOO_LARGE;
  mem_copy(vm->code,
           vm->st->code_arena + vm->st->accounts[code_from].code_offset,
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
  vm->arena_top = 0;
  ENTER_TOP(vm);
  vm->mem = vm->memory;
  vm->mem_cap = vm->memory_cap;
  vm->frame_code = vm->code;
  vm->frame_input = vm->input;
  vm->stack_base = vm->stack;
  vm->sp = 0;
  // Clamp to the static buffer: a previous execution may have grown into a
  // larger arena block, leaving `memory_size` past the end of `vm->memory`.
  mem_zero(vm->memory, vm->memory_size < vm->memory_cap ? vm->memory_size
                                                        : vm->memory_cap);
  vm->memory_size = 0;
  const int32_t snapshot = state_snapshot(vm->st);
  const int status = (int)interpret(vm);
  // Anything but a clean finish or an explicit revert still rolls state back.
  if (status != EVM_SUCCESS) state_revert(vm->st, snapshot);
  return status;
}

/**
 * Runs a create transaction: the initcode at `stage[128..)` deploys from the
 * sender at `stage[20..40)` with the value at `stage[64..96)`.
 *
 * The sender's nonce must already have been advanced by the host, so the
 * address derives from `nonce - 1`.
 */
EXPORT("evm_execute_create")
int evm_execute_create(evm_vm *vm, int init_len, int64_t gas) {
  if (init_len < 0 || init_len > MAX_CODE) return EVM_CODE_TOO_LARGE;
  const int32_t sender = account_intern(vm->st, vm->stage + STAGE_ADDR2);
  if (sender < 0) return EVM_OUT_OF_MEMORY;
  const u256 value = u256_from_be(vm->stage + STAGE_WORD_A);

  uint8_t addr[20];
  create_address(vm->st->accounts[sender].address,
                 vm->st->accounts[sender].nonce - 1, addr);
  const int32_t created = account_intern(vm->st, addr);
  if (created < 0) return EVM_OUT_OF_MEMORY;

  vm->arena_top = 0;
  ENTER_TOP(vm);
  vm->mem = vm->memory;
  vm->mem_cap = vm->memory_cap;
  vm->returndata_len = 0;
  vm->gas = gas;
  vm->stack_base = vm->stack;
  vm->sp = 0;

  uint8_t *init = (uint8_t *)arena_alloc(vm, init_len + 16);
  if (!init) return EVM_OUT_OF_MEMORY;
  mem_copy(init, vm->stage + STAGE_BYTES, (uint64_t)init_len);

  // A create transaction whose address is already occupied consumes all of its
  // gas and deploys nothing. EIP-7610 counts pre-existing storage as occupied.
  if (vm->st->accounts[created].code_len > 0 ||
      vm->st->accounts[created].nonce > 0 ||
      vm->st->accounts[created].has_storage) {
    vm->gas = 0;
    return EVM_OUT_OF_GAS;
  }

  const int32_t snapshot = state_snapshot(vm->st);
  set_balance(vm->st, sender,
              u256_sub(vm->st->accounts[sender].balance, value));
  set_balance(vm->st, created,
              u256_add(vm->st->accounts[created].balance, value));
  set_exists(vm->st, created, 1);
  set_created(vm->st, created, 1);
  set_nonce(vm->st, created, 1);
  warm_account(vm->st, created);

  int64_t child_gas = gas;
  const evm_status cs =
      run_frame(vm, created, vm->st->accounts[sender].address, value, init,
                init_len, init, 0, 0, &child_gas);
  int status = (int)cs;
  if (cs == EVM_SUCCESS) {
    if (!deposit_code(vm, created, snapshot, &child_gas))
      status = EVM_OUT_OF_GAS;
  } else {
    state_revert(vm->st, snapshot);
    if (cs != EVM_REVERT) child_gas = 0;
  }
  vm->gas = child_gas;
  return status;
}

EXPORT("evm_refund") int64_t evm_refund(evm_vm *vm) {
  return vm->st->refund;
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
