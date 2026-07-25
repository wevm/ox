// Account and storage state for the Ox EVM.
//
// The engine owns all state in its own arena and never calls out. Accounts and
// slots live in open-addressed hash tables; every mutation appends an undo
// record to a journal so a snapshot is an integer and a revert is a backwards
// replay. That is what makes `REVERT` and a failed `CALL` cheap.

#ifndef OX_EVM_STATE_H
#define OX_EVM_STATE_H

#include "keccak.h"
#include "u256.h"

// Sized for a state test or a single simulated transaction, not for a whole
// block: the tables are flat arrays inside the VM struct, so these bounds are
// the memory footprint.
#define MAX_ACCOUNTS 4096
#define ACCOUNT_SLOTS 8192 // power of two, > 2x MAX_ACCOUNTS
#define MAX_STORAGE 16384
#define STORAGE_SLOTS 32768 // power of two, > 2x MAX_STORAGE
#define MAX_JOURNAL 65536
#define MAX_TRANSIENT 2048
#define CODE_ARENA (2 * 1024 * 1024)

typedef struct {
  uint8_t address[20];
  u256 balance;
  uint64_t nonce;
  int32_t code_offset; // into the code arena
  int32_t code_len;
  uint8_t code_hash[32];
  int32_t analysis; // index of this account's cached analysis, -1 if none
  uint8_t warm;     // EIP-2929
  uint8_t exists;   // present in the state trie
  uint8_t created;  // created in this transaction (EIP-6780)
  uint8_t destroyed;
} account;

typedef struct {
  int32_t account;
  u256 key;
  u256 value;
  u256 original; // value at transaction start, for EIP-2200 gas and refunds
  uint8_t warm;
  uint8_t present;
} storage_slot;

typedef struct {
  int32_t account;
  u256 key;
  u256 value;
} transient_slot;

typedef enum {
  J_BALANCE,
  J_NONCE,
  J_STORAGE,
  J_CODE,
  J_WARM_ACCOUNT,
  J_WARM_SLOT,
  J_EXISTS,
  J_CREATED,
  J_DESTROYED,
  J_TRANSIENT,
  J_LOG,
  J_REFUND,
} journal_kind;

typedef struct {
  uint8_t kind;
  int32_t target;
  u256 value;      // previous u256 (balance, storage, transient)
  uint64_t scalar;  // previous nonce / code length / refund
  int32_t aux;      // previous code offset / analysis index
} journal_entry;

typedef struct {
  uint8_t address[20];
  int32_t topic_count;
  u256 topics[4];
  int32_t data_offset; // into the log data arena
  int32_t data_len;
} evm_log;

#define MAX_LOGS 2048
#define LOG_ARENA (1024 * 1024)

typedef struct {
  account accounts[MAX_ACCOUNTS];
  int32_t account_count;
  int32_t account_index[ACCOUNT_SLOTS]; // -1 empty, else index into accounts

  storage_slot slots[MAX_STORAGE];
  int32_t slot_count;
  int32_t slot_index[STORAGE_SLOTS];

  transient_slot transients[MAX_TRANSIENT];
  int32_t transient_count;

  journal_entry journal[MAX_JOURNAL];
  int32_t journal_len;

  evm_log logs[MAX_LOGS];
  int32_t log_count;
  uint8_t *log_data;
  int32_t log_data_len;

  uint8_t *code_arena;
  int32_t code_arena_len;

  // Signed: EIP-3529 decrements this on a slot revisit and the running total is
  // allowed to go negative in intermediate states. Clamping at zero lost that
  // and over-refunded.
  int64_t refund;
} evm_state;

// ---------------------------------------------------------------------------
// Hashing
// ---------------------------------------------------------------------------

static inline uint64_t hash_bytes(const uint8_t *p, int n) {
  uint64_t h = 0xcbf29ce484222325ULL;
  for (int i = 0; i < n; i++) {
    h ^= p[i];
    h *= 0x100000001b3ULL;
  }
  return h;
}

static inline uint64_t hash_slot(int32_t acct, u256 key) {
  uint64_t h = 0xcbf29ce484222325ULL ^ (uint64_t)acct;
  h *= 0x100000001b3ULL;
  for (int i = 0; i < 4; i++) {
    h ^= key.l[i];
    h *= 0x100000001b3ULL;
  }
  return h;
}

static inline int addr_eq(const uint8_t *a, const uint8_t *b) {
  for (int i = 0; i < 20; i++)
    if (a[i] != b[i]) return 0;
  return 1;
}

// ---------------------------------------------------------------------------
// Accounts
// ---------------------------------------------------------------------------

static void state_reset(evm_state *st) {
  st->account_count = 0;
  st->slot_count = 0;
  st->transient_count = 0;
  st->journal_len = 0;
  st->log_count = 0;
  st->log_data_len = 0;
  st->code_arena_len = 0;
  st->refund = 0;
  for (int i = 0; i < ACCOUNT_SLOTS; i++) st->account_index[i] = -1;
  for (int i = 0; i < STORAGE_SLOTS; i++) st->slot_index[i] = -1;
}

/** Looks up an account, returning its index or -1. */
__attribute__((unused)) static int32_t account_find(const evm_state *st, const uint8_t *addr) {
  uint64_t h = hash_bytes(addr, 20);
  for (uint64_t i = 0; i < ACCOUNT_SLOTS; i++) {
    const uint64_t probe = (h + i) & (ACCOUNT_SLOTS - 1);
    const int32_t idx = st->account_index[probe];
    if (idx < 0) return -1;
    if (addr_eq(st->accounts[idx].address, addr)) return idx;
  }
  return -1;
}

/** Looks up an account, inserting an empty one if absent. Returns -1 if full. */
static int32_t account_intern(evm_state *st, const uint8_t *addr) {
  uint64_t h = hash_bytes(addr, 20);
  for (uint64_t i = 0; i < ACCOUNT_SLOTS; i++) {
    const uint64_t probe = (h + i) & (ACCOUNT_SLOTS - 1);
    const int32_t idx = st->account_index[probe];
    if (idx < 0) {
      if (st->account_count >= MAX_ACCOUNTS) return -1;
      const int32_t n = st->account_count++;
      account *a = &st->accounts[n];
      for (int k = 0; k < 20; k++) a->address[k] = addr[k];
      a->balance = U256_ZERO;
      a->nonce = 0;
      a->code_offset = 0;
      a->code_len = 0;
      a->analysis = -1;
      a->warm = 0;
      a->exists = 0;
      a->created = 0;
      a->destroyed = 0;
      // keccak256 of the empty string, the code hash of a codeless account.
      keccak256((const uint8_t *)0, 0, a->code_hash);
      st->account_index[probe] = n;
      return n;
    }
    if (addr_eq(st->accounts[idx].address, addr)) return idx;
  }
  return -1;
}

// ---------------------------------------------------------------------------
// Storage
// ---------------------------------------------------------------------------

__attribute__((unused)) static int32_t slot_find(const evm_state *st, int32_t acct, u256 key) {
  uint64_t h = hash_slot(acct, key);
  for (uint64_t i = 0; i < STORAGE_SLOTS; i++) {
    const uint64_t probe = (h + i) & (STORAGE_SLOTS - 1);
    const int32_t idx = st->slot_index[probe];
    if (idx < 0) return -1;
    if (st->slots[idx].account == acct && u256_eq(st->slots[idx].key, key))
      return idx;
  }
  return -1;
}

static int32_t slot_intern(evm_state *st, int32_t acct, u256 key) {
  uint64_t h = hash_slot(acct, key);
  for (uint64_t i = 0; i < STORAGE_SLOTS; i++) {
    const uint64_t probe = (h + i) & (STORAGE_SLOTS - 1);
    const int32_t idx = st->slot_index[probe];
    if (idx < 0) {
      if (st->slot_count >= MAX_STORAGE) return -1;
      const int32_t n = st->slot_count++;
      storage_slot *s = &st->slots[n];
      s->account = acct;
      s->key = key;
      s->value = U256_ZERO;
      s->original = U256_ZERO;
      s->warm = 0;
      s->present = 1;
      st->slot_index[probe] = n;
      return n;
    }
    if (st->slots[idx].account == acct && u256_eq(st->slots[idx].key, key))
      return idx;
  }
  return -1;
}

// ---------------------------------------------------------------------------
// Journal
// ---------------------------------------------------------------------------

static inline void journal_push(evm_state *st, uint8_t kind, int32_t target,
                                u256 value, uint64_t scalar, int32_t aux) {
  if (st->journal_len >= MAX_JOURNAL) return; // saturate rather than corrupt
  journal_entry *e = &st->journal[st->journal_len++];
  e->kind = kind;
  e->target = target;
  e->value = value;
  e->scalar = scalar;
  e->aux = aux;
}

static inline int32_t state_snapshot(const evm_state *st) {
  return st->journal_len;
}

/** Undoes every mutation recorded after `snapshot`. */
static void state_revert(evm_state *st, int32_t snapshot) {
  while (st->journal_len > snapshot) {
    const journal_entry *e = &st->journal[--st->journal_len];
    switch (e->kind) {
      case J_BALANCE: st->accounts[e->target].balance = e->value; break;
      case J_NONCE: st->accounts[e->target].nonce = e->scalar; break;
      case J_STORAGE: st->slots[e->target].value = e->value; break;
      case J_CODE:
        st->accounts[e->target].code_offset = e->aux;
        st->accounts[e->target].code_len = (int32_t)e->scalar;
        st->accounts[e->target].analysis = -1;
        break;
      case J_WARM_ACCOUNT:
        st->accounts[e->target].warm = (uint8_t)e->scalar;
        break;
      case J_WARM_SLOT: st->slots[e->target].warm = (uint8_t)e->scalar; break;
      case J_EXISTS: st->accounts[e->target].exists = (uint8_t)e->scalar; break;
      case J_CREATED:
        st->accounts[e->target].created = (uint8_t)e->scalar;
        break;
      case J_DESTROYED:
        st->accounts[e->target].destroyed = (uint8_t)e->scalar;
        break;
      case J_TRANSIENT:
        st->transients[e->target].value = e->value;
        break;
      case J_LOG: st->log_count = e->target; break;
      case J_REFUND: st->refund = (int64_t)e->scalar; break;
      default: break;
    }
  }
}

// ---------------------------------------------------------------------------
// Mutations, each journaled
// ---------------------------------------------------------------------------

static inline void set_balance(evm_state *st, int32_t acct, u256 v) {
  journal_push(st, J_BALANCE, acct, st->accounts[acct].balance, 0, 0);
  st->accounts[acct].balance = v;
}

static inline void set_nonce(evm_state *st, int32_t acct, uint64_t n) {
  journal_push(st, J_NONCE, acct, U256_ZERO, st->accounts[acct].nonce, 0);
  st->accounts[acct].nonce = n;
}

static inline void set_exists(evm_state *st, int32_t acct, uint8_t v) {
  journal_push(st, J_EXISTS, acct, U256_ZERO, st->accounts[acct].exists, 0);
  st->accounts[acct].exists = v;
}

static inline void set_created(evm_state *st, int32_t acct, uint8_t v) {
  journal_push(st, J_CREATED, acct, U256_ZERO, st->accounts[acct].created, 0);
  st->accounts[acct].created = v;
}

static inline void set_destroyed(evm_state *st, int32_t acct, uint8_t v) {
  journal_push(st, J_DESTROYED, acct, U256_ZERO, st->accounts[acct].destroyed,
               0);
  st->accounts[acct].destroyed = v;
}

static inline void add_refund(evm_state *st, int64_t amount) {
  journal_push(st, J_REFUND, 0, U256_ZERO, (uint64_t)st->refund, 0);
  st->refund += amount;
}

static inline void sub_refund(evm_state *st, int64_t amount) {
  journal_push(st, J_REFUND, 0, U256_ZERO, (uint64_t)st->refund, 0);
  st->refund -= amount;
}

/** Marks an account warm, returning 1 if it was cold. */
static inline int warm_account(evm_state *st, int32_t acct) {
  if (st->accounts[acct].warm) return 0;
  journal_push(st, J_WARM_ACCOUNT, acct, U256_ZERO, 0, 0);
  st->accounts[acct].warm = 1;
  return 1;
}

/** Marks a slot warm, returning 1 if it was cold. */
static inline int warm_slot(evm_state *st, int32_t slot) {
  if (st->slots[slot].warm) return 0;
  journal_push(st, J_WARM_SLOT, slot, U256_ZERO, 0, 0);
  st->slots[slot].warm = 1;
  return 1;
}

static inline void set_storage(evm_state *st, int32_t slot, u256 v) {
  journal_push(st, J_STORAGE, slot, st->slots[slot].value, 0, 0);
  st->slots[slot].value = v;
}

/** Writes code into the arena and points the account at it. */
static int set_code(evm_state *st, int32_t acct, const uint8_t *code, int len) {
  if (st->code_arena_len + len > CODE_ARENA) return 0;
  journal_push(st, J_CODE, acct, U256_ZERO,
               (uint64_t)st->accounts[acct].code_len,
               st->accounts[acct].code_offset);
  const int32_t off = st->code_arena_len;
  for (int i = 0; i < len; i++) st->code_arena[off + i] = code[i];
  st->code_arena_len += len;
  st->accounts[acct].code_offset = off;
  st->accounts[acct].code_len = len;
  st->accounts[acct].analysis = -1;
  keccak256(code, (uint64_t)len, st->accounts[acct].code_hash);
  return 1;
}

// ---------------------------------------------------------------------------
// Transient storage (EIP-1153), cleared per transaction
// ---------------------------------------------------------------------------

static int32_t transient_find(const evm_state *st, int32_t acct, u256 key) {
  for (int32_t i = 0; i < st->transient_count; i++)
    if (st->transients[i].account == acct && u256_eq(st->transients[i].key, key))
      return i;
  return -1;
}

static inline u256 transient_load(const evm_state *st, int32_t acct, u256 key) {
  const int32_t i = transient_find(st, acct, key);
  return i < 0 ? U256_ZERO : st->transients[i].value;
}

static inline void transient_store(evm_state *st, int32_t acct, u256 key,
                                   u256 value) {
  int32_t i = transient_find(st, acct, key);
  if (i < 0) {
    if (st->transient_count >= MAX_TRANSIENT) return;
    i = st->transient_count++;
    st->transients[i].account = acct;
    st->transients[i].key = key;
    st->transients[i].value = U256_ZERO;
  }
  journal_push(st, J_TRANSIENT, i, st->transients[i].value, 0, 0);
  st->transients[i].value = value;
}

#endif // OX_EVM_STATE_H
