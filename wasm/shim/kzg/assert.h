#ifndef OX_KZG_SHIM_ASSERT_H
#define OX_KZG_SHIM_ASSERT_H

#include <stdlib.h>

#define assert(expression) ((expression) ? (void)0 : abort())

#endif // OX_KZG_SHIM_ASSERT_H
