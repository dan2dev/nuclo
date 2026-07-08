#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import readline from "node:readline/promises";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const templatesDir = path.join(__dirname, "..", "templates");
const templates = fs.readdirSync(templatesDir).filter((name) =>
  fs.statSync(path.join(templatesDir, name)).isDirectory()
);
const defaultTemplate = "basic";

const colors = {
  reset: "\x1b[0m",
  bold: "\x1b[1m",
  cyan: "\x1b[36m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  red: "\x1b[31m",
  dim: "\x1b[2m",
};
const color = (c, s) => `${colors[c]}${s}${colors.reset}`;

function printHelp() {
  console.log(`
${color("bold", "create-nuclo")} — scaffold a new Nuclo project

${color("bold", "Usage:")}
  npm create nuclo [project-name] [options]
  npm init nuclo [project-name] [options]

${color("bold", "Options:")}
  -t, --template <name>  Template to use (${templates.join(", ")}) [default: ${defaultTemplate}]
  -y, --yes               Skip prompts and accept defaults
  -f, --force              Scaffold into a non-empty directory
  -h, --help                Show this help message
`);
}

function parseArgs(argv) {
  const args = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "-t" || arg === "--template") {
      args.template = argv[++i];
    } else if (arg.startsWith("--template=")) {
      args.template = arg.slice("--template=".length);
    } else if (arg === "-y" || arg === "--yes") {
      args.yes = true;
    } else if (arg === "-f" || arg === "--force") {
      args.force = true;
    } else if (arg === "-h" || arg === "--help") {
      args.help = true;
    } else {
      args._.push(arg);
    }
  }
  return args;
}

function toPackageName(input) {
  const name = input
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-~]/g, "-")
    .replace(/^[-.]+/, "")
    .replace(/-+/g, "-")
    .replace(/-+$/, "");
  return name || "nuclo-app";
}

function isEmptyDir(dir) {
  if (!fs.existsSync(dir)) return true;
  const entries = fs.readdirSync(dir);
  return entries.length === 0 || (entries.length === 1 && entries[0] === ".git");
}

function detectPackageManager() {
  const ua = process.env.npm_config_user_agent || "";
  if (ua.startsWith("pnpm")) return "pnpm";
  if (ua.startsWith("yarn")) return "yarn";
  if (ua.startsWith("bun")) return "bun";
  return "npm";
}

function copyTemplate(templateName, targetDir) {
  const srcDir = path.join(templatesDir, templateName);
  fs.mkdirSync(targetDir, { recursive: true });
  fs.cpSync(srcDir, targetDir, { recursive: true });

  const gitignorePath = path.join(targetDir, "_gitignore");
  if (fs.existsSync(gitignorePath)) {
    fs.renameSync(gitignorePath, path.join(targetDir, ".gitignore"));
  }
}

function patchPackageJson(targetDir, projectName) {
  const pkgPath = path.join(targetDir, "package.json");
  const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
  pkg.name = projectName;
  fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + "\n");
}

async function promptText(rl, question, defaultValue) {
  const answer = (await rl.question(`${question} ${color("dim", `(${defaultValue})`)} `)).trim();
  return answer || defaultValue;
}

async function promptTemplate(rl) {
  if (templates.length <= 1) return templates[0] ?? defaultTemplate;
  console.log(`\n${color("bold", "Available templates:")}`);
  templates.forEach((name, i) => {
    console.log(`  ${i + 1}. ${name}${name === defaultTemplate ? color("dim", "  (default)") : ""}`);
  });
  const answer = (await rl.question(`Select a template ${color("dim", `(1-${templates.length}, default ${defaultTemplate})`)} `)).trim();
  if (!answer) return defaultTemplate;
  const index = Number.parseInt(answer, 10);
  if (Number.isInteger(index) && index >= 1 && index <= templates.length) {
    return templates[index - 1];
  }
  if (templates.includes(answer)) return answer;
  console.log(color("yellow", `Unknown template "${answer}", using "${defaultTemplate}".`));
  return defaultTemplate;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));

  if (args.help) {
    printHelp();
    return;
  }

  const canPrompt = process.stdin.isTTY && process.stdout.isTTY && !args.yes;
  const rl = canPrompt ? readline.createInterface({ input: process.stdin, output: process.stdout }) : null;

  try {
    let targetInput = args._[0];
    if (!targetInput) {
      targetInput = rl ? await promptText(rl, "Project name?", "nuclo-app") : "nuclo-app";
    }

    const targetDir = path.resolve(process.cwd(), targetInput);
    const projectName = toPackageName(path.basename(targetDir));

    if (!isEmptyDir(targetDir) && !args.force) {
      if (rl) {
        const answer = (await rl.question(
          color("yellow", `Directory "${targetInput}" is not empty. Continue and overwrite existing files? (y/N) `)
        )).trim().toLowerCase();
        if (answer !== "y" && answer !== "yes") {
          console.log(color("red", "Aborted."));
          return;
        }
      } else {
        console.error(color("red", `Directory "${targetInput}" is not empty. Use --force to scaffold anyway.`));
        process.exitCode = 1;
        return;
      }
    }

    let template = args.template;
    if (template && !templates.includes(template)) {
      console.error(color("red", `Unknown template "${template}". Available: ${templates.join(", ")}`));
      process.exitCode = 1;
      return;
    }
    if (!template) {
      template = rl ? await promptTemplate(rl) : defaultTemplate;
    }

    copyTemplate(template, targetDir);
    patchPackageJson(targetDir, projectName);

    const pm = detectPackageManager();
    const runCmd = pm === "npm" ? "npm run" : pm;

    console.log(`\n${color("green", "✔")} Created ${color("bold", projectName)} in ${color("cyan", path.relative(process.cwd(), targetDir) || ".")}\n`);
    console.log(color("bold", "Next steps:"));
    if (targetInput !== ".") console.log(`  cd ${targetInput}`);
    console.log(`  ${pm} install`);
    console.log(`  ${runCmd} dev\n`);
  } finally {
    rl?.close();
  }
}

main().catch((err) => {
  console.error(color("red", "Error:"), err?.message ?? err);
  process.exitCode = 1;
});
