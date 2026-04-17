import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

const steps = [
  { label: "validate", file: "scripts/validate-content.ts" },
  { label: "generate indexes", file: "scripts/generate-indexes.ts" },
  { label: "sync docs", file: "scripts/sync-docs.ts" }
];

for (const step of steps) {
  process.stdout.write(`Running ${step.label}...\n`);
  const result = await execFileAsync(process.execPath, [step.file], {
    cwd: process.cwd(),
    env: process.env
  });

  if (result.stdout) {
    process.stdout.write(result.stdout);
  }

  if (result.stderr) {
    process.stderr.write(result.stderr);
  }
}

process.stdout.write("Build complete.\n");
