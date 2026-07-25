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
  // Reserved for the Phase 3 suspend/resume protocol. The driver treats any
  // status >= EVM_NEEDS_ACCOUNT as "fill the request buffer and resume".
  EVM_NEEDS_ACCOUNT = 64,
  EVM_NEEDS_STORAGE = 65,
  EVM_NEEDS_PRECOMPILE = 66,
} evm_status;

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
} evm_vm;

// ---------------------------------------------------------------------------
// Stack
// ---------------------------------------------------------------------------

// Bounds are guaranteed by the enclosing block's entry check, so these do not
// re-validate. Correctness now rests on `analyze` computing `stack_req` and
// `stack_max_growth` correctly for every block.
//
// The value is still materialized before `sp` moves: writing this as
// `vm->stack[vm->sp++] = (v)` is undefined behaviour whenever `v` itself reads
// `sp` — which `PUSH(PEEK(n))` in DUP does, and which silently duplicated the
// stale slot above the top.
#define PUSH(v)                    \
  do {                             \
    u256 pushed_ = (v);            \
    vm->stack[vm->sp++] = pushed_; \
  } while (0)
#define POP() (vm->stack[--vm->sp])
#define PEEK(i) (vm->stack[vm->sp - 1 - (i)])

/** Charges dynamic gas. Static per-block gas is charged by `ENTER_BLOCK`. */
#define USE_GAS(n)                \
  do {                            \
    int64_t cost_ = (int64_t)(n); \
    if (vm->gas < cost_) {        \
      vm->gas = 0;                \
      return EVM_OUT_OF_GAS;      \
    }                             \
    vm->gas -= cost_;             \
  } while (0)

/** An exceptional halt consumes all remaining gas. */
#define HALT(status)  \
  do {                \
    vm->gas = 0;      \
    return (status);  \
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
static evm_status memory_expand(evm_vm *vm, uint64_t offset, uint64_t size) {
  if (size == 0) return EVM_SUCCESS;
  uint64_t end = offset + size;
  if (end < offset) return EVM_OUT_OF_GAS; // 64-bit overflow: unaffordable
  if (end <= vm->memory_size) return EVM_SUCCESS;
  if (end > vm->memory_cap) return EVM_OUT_OF_MEMORY;

  uint64_t words = (end + 31) / 32;
  uint64_t cost = memory_gas(words);
  if (cost > vm->memory_cost) {
    int64_t charge = (int64_t)(cost - vm->memory_cost);
    if (vm->gas < charge) {
      vm->gas = 0;
      return EVM_OUT_OF_GAS;
    }
    vm->gas -= charge;
    vm->memory_cost = cost;
  }
  vm->memory_size = words * 32;
  return EVM_SUCCESS;
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
    if (vm->gas < b_.gas) HALT(EVM_OUT_OF_GAS);               \
    vm->gas -= b_.gas;                                        \
    if (vm->sp < b_.stack_req) HALT(EVM_STACK_UNDERFLOW);     \
    if (vm->sp + b_.stack_max_growth > STACK_LIMIT)           \
      HALT(EVM_STACK_OVERFLOW);                               \
  } while (0)

static evm_status interpret(evm_vm *vm) {
  int pc = 0;
  vm->output_len = 0;

  if (vm->code_len == 0) return EVM_SUCCESS;
  ENTER_BLOCK(0);

  for (;;) {
    if (pc >= vm->code_len) return EVM_SUCCESS; // running off the end is STOP
    uint8_t op = vm->code[pc];

    switch (op) {
      case 0x00: // STOP
        return EVM_SUCCESS;

      case 0x01: { // ADD
        u256 a = POP(), b = POP();
        PUSH(u256_add(a, b));
        break;
      }
      case 0x02: { // MUL
        u256 a = POP(), b = POP();
        PUSH(u256_mul(a, b));
        break;
      }
      case 0x03: { // SUB
        u256 a = POP(), b = POP();
        PUSH(u256_sub(a, b));
        break;
      }
      case 0x04: { // DIV
        u256 a = POP(), b = POP();
        PUSH(u256_div(a, b));
        break;
      }
      case 0x05: { // SDIV
        u256 a = POP(), b = POP();
        PUSH(u256_sdiv(a, b));
        break;
      }
      case 0x06: { // MOD
        u256 a = POP(), b = POP();
        PUSH(u256_mod(a, b));
        break;
      }
      case 0x07: { // SMOD
        u256 a = POP(), b = POP();
        PUSH(u256_smod(a, b));
        break;
      }
      case 0x08: { // ADDMOD
        u256 a = POP(), b = POP(), m = POP();
        PUSH(u256_addmod(a, b, m));
        break;
      }
      case 0x09: { // MULMOD
        u256 a = POP(), b = POP(), m = POP();
        PUSH(u256_mulmod(a, b, m));
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
      case 0x0b: { // SIGNEXTEND
        u256 k = POP(), v = POP();
        PUSH(u256_signextend(k, v));
        break;
      }

      case 0x10: { // LT
        u256 a = POP(), b = POP();
        PUSH(u256_from_u64(u256_cmp(a, b) < 0));
        break;
      }
      case 0x11: { // GT
        u256 a = POP(), b = POP();
        PUSH(u256_from_u64(u256_cmp(a, b) > 0));
        break;
      }
      case 0x12: { // SLT
        u256 a = POP(), b = POP();
        int sa = u256_sign(a), sb = u256_sign(b);
        PUSH(u256_from_u64(sa != sb ? sa : u256_cmp(a, b) < 0));
        break;
      }
      case 0x13: { // SGT
        u256 a = POP(), b = POP();
        int sa = u256_sign(a), sb = u256_sign(b);
        PUSH(u256_from_u64(sa != sb ? sb : u256_cmp(a, b) > 0));
        break;
      }
      case 0x14: { // EQ
        u256 a = POP(), b = POP();
        PUSH(u256_from_u64(u256_eq(a, b)));
        break;
      }
      case 0x15: { // ISZERO
        u256 a = POP();
        PUSH(u256_from_u64(u256_is_zero(a)));
        break;
      }
      case 0x16: { // AND
        u256 a = POP(), b = POP();
        PUSH(u256_and(a, b));
        break;
      }
      case 0x17: { // OR
        u256 a = POP(), b = POP();
        PUSH(u256_or(a, b));
        break;
      }
      case 0x18: { // XOR
        u256 a = POP(), b = POP();
        PUSH(u256_xor(a, b));
        break;
      }
      case 0x19: { // NOT
        u256 a = POP();
        PUSH(u256_not(a));
        break;
      }
      case 0x1a: { // BYTE
        u256 i = POP(), v = POP();
        PUSH(u256_byte(i, v));
        break;
      }
      case 0x1b: { // SHL
        u256 n = POP(), v = POP();
        uint64_t s = u256_to_u64_sat(n);
        PUSH(s >= 256 ? U256_ZERO : u256_shl(v, (uint32_t)s));
        break;
      }
      case 0x1c: { // SHR
        u256 n = POP(), v = POP();
        uint64_t s = u256_to_u64_sat(n);
        PUSH(s >= 256 ? U256_ZERO : u256_shr(v, (uint32_t)s));
        break;
      }
      case 0x1d: { // SAR
        u256 n = POP(), v = POP();
        uint64_t s = u256_to_u64_sat(n);
        PUSH(u256_sar(v, s >= 256 ? 256 : (uint32_t)s));
        break;
      }

      case 0x20: { // KECCAK256
        u256 off = POP(), len = POP();
        uint64_t o = u256_to_u64_sat(off), n = u256_to_u64_sat(len);
        if (o > MAX_INPUT || n > MAX_INPUT) HALT(EVM_OUT_OF_GAS);
        USE_GAS(6 * ((n + 31) / 32));
        evm_status s = memory_expand(vm, o, n);
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
        evm_status st = memory_expand(vm, d, n);
        if (st != EVM_SUCCESS) HALT(st);
        copy_padded(vm->memory + d, vm->input, (uint64_t)vm->input_len, s, n);
        break;
      }
      case 0x38: // CODESIZE
        PUSH(u256_from_u64((uint64_t)vm->code_len));
        break;
      case 0x39: { // CODECOPY
        u256 dst = POP(), src = POP(), len = POP();
        uint64_t d = u256_to_u64_sat(dst), s = u256_to_u64_sat(src),
                 n = u256_to_u64_sat(len);
        if (d > MAX_INPUT || n > MAX_INPUT) HALT(EVM_OUT_OF_GAS);
        USE_GAS(3 * ((n + 31) / 32));
        evm_status st = memory_expand(vm, d, n);
        if (st != EVM_SUCCESS) HALT(st);
        copy_padded(vm->memory + d, vm->code, (uint64_t)vm->code_len, s, n);
        break;
      }

      case 0x50: // POP
        vm->sp--;
        break;
      case 0x51: { // MLOAD
        u256 off = POP();
        uint64_t o = u256_to_u64_sat(off);
        if (o > MAX_INPUT) HALT(EVM_OUT_OF_GAS);
        evm_status s = memory_expand(vm, o, 32);
        if (s != EVM_SUCCESS) HALT(s);
        PUSH(u256_from_be(vm->memory + o));
        break;
      }
      case 0x52: { // MSTORE
        u256 off = POP(), v = POP();
        uint64_t o = u256_to_u64_sat(off);
        if (o > MAX_INPUT) HALT(EVM_OUT_OF_GAS);
        evm_status s = memory_expand(vm, o, 32);
        if (s != EVM_SUCCESS) HALT(s);
        u256_to_be(v, vm->memory + o);
        break;
      }
      case 0x53: { // MSTORE8
        u256 off = POP(), v = POP();
        uint64_t o = u256_to_u64_sat(off);
        if (o > MAX_INPUT) HALT(EVM_OUT_OF_GAS);
        evm_status s = memory_expand(vm, o, 1);
        if (s != EVM_SUCCESS) HALT(s);
        vm->memory[o] = (uint8_t)(v.l[0] & 0xff);
        break;
      }
      case 0x56: { // JUMP
        u256 t = POP();
        uint64_t d = u256_to_u64_sat(t);
        if (d >= (uint64_t)vm->code_len || !JUMPDEST_GET(d))
          HALT(EVM_INVALID_JUMP);
        // The target is a JUMPDEST, which enters its own block below.
        pc = (int)d;
        continue;
      }
      case 0x57: { // JUMPI
        u256 t = POP(), cond = POP();
        if (!u256_is_zero(cond)) {
          uint64_t d = u256_to_u64_sat(t);
          if (d >= (uint64_t)vm->code_len || !JUMPDEST_GET(d))
            HALT(EVM_INVALID_JUMP);
          pc = (int)d;
          continue;
        }
        // Falling through starts a new block, since this one ended here.
        pc++;
        if (pc >= vm->code_len) return EVM_SUCCESS;
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
        PUSH(u256_from_u64((uint64_t)vm->gas));
        break;
      case 0x5b: // JUMPDEST
        ENTER_BLOCK(pc);
        break;
      case 0x5f: // PUSH0
        PUSH(U256_ZERO);
        break;

      case 0xf3: { // RETURN
        u256 off = POP(), len = POP();
        uint64_t o = u256_to_u64_sat(off), n = u256_to_u64_sat(len);
        if (o > MAX_INPUT || n > MAX_INPUT) HALT(EVM_OUT_OF_GAS);
        evm_status s = memory_expand(vm, o, n);
        if (s != EVM_SUCCESS) HALT(s);
        mem_copy(vm->output, vm->memory + o, n);
        vm->output_len = (int)n;
        return EVM_SUCCESS;
      }
      case 0xfd: { // REVERT
        u256 off = POP(), len = POP();
        uint64_t o = u256_to_u64_sat(off), n = u256_to_u64_sat(len);
        if (o > MAX_INPUT || n > MAX_INPUT) HALT(EVM_OUT_OF_GAS);
        evm_status s = memory_expand(vm, o, n);
        if (s != EVM_SUCCESS) HALT(s);
        mem_copy(vm->output, vm->memory + o, n);
        vm->output_len = (int)n;
        // REVERT is not an exceptional halt: unspent gas is returned.
        return EVM_REVERT;
      }

      // PUSH, DUP, and SWAP get explicit labels rather than range tests under
      // `default:`. They are the most frequent opcodes in real bytecode, and
      // this lets the jump table dispatch them directly instead of falling
      // through to a chain of comparisons.
      case 0x60: // PUSH1 — the single most common opcode in compiled output
        PUSH(u256_from_u64(pc + 1 < vm->code_len ? vm->code[pc + 1] : 0));
        pc += 2;
        continue;

      case 0x61 ... 0x67: { // PUSH2..PUSH8 fit in one limb
        const int n = op - 0x5f;
        if (pc + 1 + n <= vm->code_len) {
          const uint8_t *p = vm->code + pc + 1;
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
        if (pc + 1 + n <= vm->code_len) {
          PUSH(u256_from_be_n(vm->code + pc + 1, n));
          pc += 1 + n;
          continue;
        }
      push_truncated: {
        // An immediate running past the end of code is zero-padded on the
        // right. Only reachable at the very end of a program.
        const int size = op - 0x5f;
        int avail = vm->code_len - pc - 1;
        if (avail < 0) avail = 0;
        u256 v = u256_from_be_n(vm->code + pc + 1, avail);
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

#define EXPORT(name) __attribute__((export_name(name))) __attribute__((used))

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
  if (!vm->jumpdest || !vm->blocks || !vm->block_at || !vm->memory ||
      !vm->output)
    return 0;
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
