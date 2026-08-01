# mldsa-native

This directory contains the portable-C subset of mldsa-native v1.0.0-beta2
needed by Ox's ML-DSA-44 WASM implementation.

- Repository: https://github.com/pq-code-package/mldsa-native
- Tag: `v1.0.0-beta2`
- Commit: `9b0ee84f4cf399043eca59eca4e5f8531ca1d61b`
- License: Apache-2.0 OR ISC OR MIT, in `LICENSE`

`README.md` is the upstream readme; this file documents the vendoring.

Ox compiles the single-compilation-unit build (`mldsa/mldsa_native.c`) with
`MLD_CONFIG_CORE_API_ONLY`, so only the deterministic `_internal` API is built
and upstream's `randombytes` is never referenced — randomness crosses the WASM
boundary explicitly. The `mldsa/src/native/` and `mldsa/src/fips202/native/`
assembly backends are omitted: every include of them sits behind
`MLD_CONFIG_USE_NATIVE_BACKEND_ARITH` / `MLD_CONFIG_USE_NATIVE_BACKEND_FIPS202`,
which Ox does not define.

## Checksums

```text
26ee68617256be39e12fbbb0fb0c8c7087980a2020ded46e3ef3c3810c35d847  LICENSE
ac89789a8f90e87c6722d10aa372efcc89722e77e5fffcd6f6dad59c8153d2f8  mldsa/mldsa_native.c
0742e2c581dc5802eaa3e97cb2b075cd4357a57afae183b2908bb0a9ba9797f2  mldsa/mldsa_native.h
1ca5852553f87ce38dc08720a957f55e097accd3baf6f81affb2e6205241d3c8  mldsa/mldsa_native_config.h
5d5641f89ee92f8d33f4489b7746ca20d4226cf6ecfcc9895bf644d4bc8871e5  mldsa/src/ct.c
14c8356b7cd6ad0b6de8e2915468aa5271bcea2c2d959cfe22180c65fc9a580d  mldsa/src/debug.c
5a3cd24d2243e17e33371ea708d5a64deb08cb3fd8be297e8adae7772bce7a80  mldsa/src/packing.c
3038aebf65a435b3e1ead7432028618316cbc595dac389c06bc1b805c0eb667a  mldsa/src/poly.c
0e5bedc2269d8398611635ef1a58b7fcc87fa24a641819ede69364caf474e316  mldsa/src/poly_kl.c
2d5c794654b8b1926cb990eaf7224de5c03d16584afd81a925bfd171f977f213  mldsa/src/polyvec.c
e1de3ea478f017b83eb67544e404fe1997c6d2dc8a9d70853c49e2ad00ab3a30  mldsa/src/polyvec_lazy.c
a18fd65dea26403448ed08dabe5db5117ad1cd7559637fc1e3aa3302aaaf8c25  mldsa/src/sign.c
e132882026902871f3a267a596959a5d8a88794c1b978fabf21cb506226ba5df  mldsa/src/cbmc.h
666dc8cc8a9b411e2162ead1b6be2c7180686ed87f1ba4564471b822bf7e16ce  mldsa/src/common.h
4d819282890a14d165cb2bf562116338df7a7a0959a6dc564ca213d5b0d3415f  mldsa/src/ct.h
a5342cb1a9fe2165cecead09a57d73682cbedd30b0e254b9d7ccef3e5715bdcc  mldsa/src/debug.h
4cd96be95e8849d0d56ae2fa75475998d79f00217b5c31f9fee6980da752e3b0  mldsa/src/packing.h
9752e4fb21ed390fc94cd9d05691e5c1b76939a69b7c7ed72f8e19e193d5f54b  mldsa/src/params.h
52433bf4a817bc195e83c02e2239cbe4d84d1c9086d1138cb4531d3f29d99d16  mldsa/src/poly.h
10937897c1701cf6ce6af19ded9479846d217ffe3eb43fc9cd6202dd84bff25b  mldsa/src/poly_kl.h
5411d2272d78ea6e7092af0b1ae57da7b0c5b7fcb8af448b815b260faf9a7893  mldsa/src/polyvec.h
fbfce5d005bb8ac305f5ddff511824728f4e94fb83dc311b1b184ab74f20468a  mldsa/src/polyvec_lazy.h
b8ccb9a34818d8e1cd0cfea9b24829ab9949cb88c20ed0648459c5c7d36aa492  mldsa/src/randombytes.h
47fb384ac1fb4d53477525139dd42e2ae316878975a1a993b32b16efc9b23818  mldsa/src/reduce.h
5a32b95402fb1b07dcf0a7ffd329d40c1a1dafe0fd51ade3eb6bc3b39ffee2c1  mldsa/src/rounding.h
1dfae3699c0ac776f1fb8507839a5e8921df1a3a1ab8a47d727d71b3db08d9db  mldsa/src/sign.h
4ed2df211b960a747e29aec04055100470def1ae8c481feb203c27fbc61a0b70  mldsa/src/symmetric.h
e06262e46cccab6479f296bea6ec25f7efe4fc0901dcca6fcc6c9aae0a087b74  mldsa/src/sys.h
f27b371b78b05875d22e9b98f541f265c5f9358c3ece72dc91137114556d45ee  mldsa/src/zetas.inc
b8984253addafa72a0a127abbc80007509a36f23e63472d3ca54bed1d6e08d85  mldsa/src/fips202/fips202.c
6df264e856caf1db9c4a87067159c6cc8e375688f4318b09fb6762ed846439eb  mldsa/src/fips202/fips202x4.c
c458f0f66c6c7d3ecbb5a7fdd6f12030d57674d10ad8d8f863bfe54f31bafb36  mldsa/src/fips202/keccakf1600.c
cdae2eb8a2d8970d8cb715e1c34230ee65ed35c75311525eca5232435d93c4e2  mldsa/src/fips202/fips202.h
dc0a3bb0664ea664147df7f4ada4354114627f0fdbbe72981216c59387071a13  mldsa/src/fips202/fips202x4.h
0b8b54a10be173d712d29ac806acb73924b38b4d06c68d35b1dde06a08ed005c  mldsa/src/fips202/keccakf1600.h
```

## Updating

Check out the intended upstream tag, verify its commit, then replace
`LICENSE`, `README.md`, and the `mldsa/` files above with their matching
upstream paths (keeping the `native/` directories omitted). Update the
checksums above, run `pnpm wasm:build --target=mldsa44`, and inspect the
source and artifact diffs before running `pnpm wasm:check`.
