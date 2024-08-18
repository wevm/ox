# Installation

Install Ox via your package manager, a `<script>` tag, or build from source.

## Package Manager

Install the required packages.

:::code-group
```bash [pnpm]
pnpm install ox
```

```bash [npm]
npm install ox
```

```bash [yarn]
yarn add ox
```

```bash [bun]
bun install ox
```
:::

## CDN

If you're not using a package manager, you can also use Viem via an ESM-compatible CDN such as [esm.sh](https://esm.sh). Simply add a `<script type="module">` tag to the bottom of your HTML file with the following content.

```html
<script type="module">
  import { Abi } from 'https://esm.sh/ox'
</script>
```

## Using Unreleased Commits

If you can't wait for a new release to test the latest features, you can either install from the `canary` tag (tracks the [`main`](https://github.com/wevm/viem/tree/main) branch).

:::code-group
```bash [pnpm]
pnpm add ox@canary
```

```bash [npm]
npm install ox@canary
```

```bash [yarn]
yarn add ox@canary
```

```bash [bun]
bun add ox@canary
```
:::

Or clone the [Ox repo](https://github.com/wevm/ox) to your local machine, build, and link it yourself.

```bash
gh repo clone wevm/ox
cd ox
pnpm install
pnpm build
pnpm link --global
```

Then go to the project where you are using Ox and run `pnpm link --global ox` (or the package manager that you used to link Ox globally).

## Security

Ethereum-related projects are often targeted in attacks to steal users' assets. Make sure you follow security best-practices for your project. Some quick things to get started.

- Pin package versions, upgrade mindfully, and inspect lockfile changes to minimize the risk of [supply-chain attacks](https://nodejs.org/en/guides/security/#supply-chain-attacks).
- Install the [Socket Security](https://socket.dev) [GitHub App](https://github.com/apps/socket-security) to help detect and block supply-chain attacks.
- Add a [Content Security Policy](https://cheatsheetseries.owasp.org/cheatsheets/Content_Security_Policy_Cheat_Sheet.html) to defend against external scripts running in your app.

