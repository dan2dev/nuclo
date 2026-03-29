const platform = process.platform === "win32" ? "windows" : process.platform;
const arch = process.arch;
const ext = process.platform === "win32" ? ".exe" : "";
const binary = `${import.meta.dir}/build/server-bun-${platform}-${arch}${ext}`;
const buildDir = `${import.meta.dir}/build`;

const proc = Bun.spawn([binary], {
  stdio: ["inherit", "inherit", "inherit"],
  env: { ...process.env, NODE_ENV: "production" },
  cwd: buildDir,
});

process.exit(await proc.exited);
