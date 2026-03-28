const platform = process.platform === "win32" ? "windows" : process.platform;
const arch = process.arch;
const ext = process.platform === "win32" ? ".exe" : "";
const binary = `${import.meta.dir}/dist-server/server-bun-${platform}-${arch}${ext}`;
const distServerDir = `${import.meta.dir}/dist-server`;

const proc = Bun.spawn([binary], {
  stdio: ["inherit", "inherit", "inherit"],
  env: { ...process.env, NODE_ENV: "production" },
  cwd: distServerDir,
});

process.exit(await proc.exited);
