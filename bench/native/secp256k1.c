/*
 * Compile the Ox WASM wrapper unchanged for the host. export_name is a
 * WebAssembly-only attribute, so remove it for this native benchmark.
 */
#define export_name(name)
#include "../../wasm/src/secp256k1.c"
