#ifndef OX_MLDSA_SHIM_ASSERT_H
#define OX_MLDSA_SHIM_ASSERT_H

void abort(void);

#define assert(condition) ((condition) ? (void)0 : abort())

#endif // OX_MLDSA_SHIM_ASSERT_H
