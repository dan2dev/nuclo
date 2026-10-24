#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import readline from "node:readline/promises";
import { parseArgs, styleText } from "node:util";

const templatesDir = path.join(import.meta.dirname, "..", "templates");

const help = `
${styleText("bold", "create-nuclo")} — scaffold a new Nuclo project

Usage:
  npm create nuclo [project-name] [options]

Options:
  -t, --template <name>  Template to use [default: basic]
  -y, --yes              Skip prompts and accept defaults
  -f, --force            Scaffold into a non-empty directory
  -h, --help             Show this help message
`;

async function main() {
  const { values: args, positionals } = parseArgs({
    allowPositionals: true,
    options: {
      template: { type: "string", short: "t", default: "basic" },
      yes: { type: "boolean", short: "y" },
      force: { type: "boolean", short: "f" },
      help: { type: "boolean", short: "h" },
    },
  });
  if (args.help) return console.log(help);

  const templates = fs.readdirSync(templatesDir);
  if (!templates.includes(args.template)) {
    throw new Error(`Unknown template "${args.template}". Available: ${templates.join(", ")}`);
  }

  let target = positionals[0];
  if (!target && !args.yes && process.stdin.isTTY) {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    target = (await rl.question("Project name? (nuclo-app) ")).trim();
    rl.close();
  }
  target ||= "nuclo-app";

  const dir = path.resolve(target);
  const isEmpty = !fs.existsSync(dir) || fs.readdirSync(dir).every((entry) => entry === ".git");
  if (!isEmpty && !args.force) {
    throw new Error(`Directory "${target}" is not empty. Use --force to scaffold anyway.`);
  }

  fs.cpSync(path.join(templatesDir, args.template), dir, { recursive: true });
  // npm drops .gitignore from published packages, so templates ship it as _gitignore.
  fs.renameSync(path.join(dir, "_gitignore"), path.join(dir, ".gitignore"));

  const name = path.basename(dir).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "nuclo-app";
  const pkgPath = path.join(dir, "package.json");
  const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
  pkg.name = name;
  fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + "\n");

  const pm = ["pnpm", "yarn", "bun"].find((p) => process.env.npm_config_user_agent?.startsWith(p)) ?? "npm";
  const cd = path.relative(process.cwd(), dir);
  console.log(`\n${styleText("green", "✔")} Created ${styleText("bold", name)}\n\nNext steps:`);
  if (cd) console.log(`  cd ${cd}`);
  console.log(`  ${pm} install\n  ${pm === "npm" ? "npm run" : pm} dev\n`);
}

main().catch((err) => {
  console.error(styleText("red", `Error: ${err.message}`));
  process.exitCode = 1;
});
