#ifndef OX_BLAKE3_ASSERT_H
#define OX_BLAKE3_ASSERT_H

void abort(void);

#define assert(condition) ((condition) ? (void)0 : abort())

#endif // OX_BLAKE3_ASSERT_H
