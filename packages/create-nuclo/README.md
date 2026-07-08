# create-nuclo

Scaffold a new [Nuclo](https://nuclo.dev) + Vite project with a single command.

## Usage

```bash
# npm
npm create nuclo@latest

# pnpm
pnpm create nuclo

# yarn
yarn create nuclo

# bun
bun create nuclo

# deno
deno run -A npm:create-nuclo
```

You'll be prompted for a project name and a template. To skip the prompts, pass a project name and flags directly:

```bash
npm create nuclo@latest my-app -- --template basic --yes
```

Then:

```bash
cd my-app
npm install
npm run dev
```

## Options

```
Usage:
  npm create nuclo [project-name] [options]
  npm init nuclo [project-name] [options]

Options:
  -t, --template <name>   Template to use (basic) [default: basic]
  -y, --yes               Skip prompts and accept defaults
  -f, --force             Scaffold into a non-empty directory
  -h, --help               Show this help message
```

## Templates

| Template | Description |
| --- | --- |
| `basic` | Minimal Vite + TypeScript + Nuclo starter |

## License

MIT
