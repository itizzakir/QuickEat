#!/usr/bin/env node
/**
 * Runs the backend's Maven wrapper with the right name for the platform.
 *
 * The root scripts cannot just say `mvnw.cmd` (breaks on macOS/Linux) or `./mvnw` (breaks in
 * cmd.exe, which npm uses on Windows), so this picks the correct one and forwards the args.
 *
 *   node scripts/mvnw.mjs spring-boot:run
 *
 * The wrapper is invoked by absolute, quoted path: cmd.exe does not reliably resolve a .cmd
 * from a spawned working directory, and the repository path may contain spaces.
 */

import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const backendDir = join(dirname(fileURLToPath(import.meta.url)), "..", "food-delivery-backend");
const wrapper = join(backendDir, process.platform === "win32" ? "mvnw.cmd" : "mvnw");

if (!existsSync(wrapper)) {
  console.error(`Maven wrapper not found at ${wrapper}`);
  process.exit(1);
}

// Passed as one shell string so the quoting survives, and so Node does not warn about
// unescaped args (DEP0190).
const command = [`"${wrapper}"`, ...process.argv.slice(2)].join(" ");

const child = spawn(command, {
  cwd: backendDir,
  stdio: "inherit",
  shell: true,
});

child.on("exit", (code, signal) => {
  if (signal) process.kill(process.pid, signal);
  else process.exit(code ?? 0);
});

child.on("error", (error) => {
  console.error(`Could not run the Maven wrapper at ${wrapper}`);
  console.error(error.message);
  process.exit(1);
});
