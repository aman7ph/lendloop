import { execFileSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";

// Run from the project root. Only secret NAMES are ever printed, never values.
const SECRET_NAME = /SECRET|KEY|TOKEN|PASSWORD|WEBHOOK_URL/i;
const root = new URL("../", import.meta.url);
const secrets = [];

for (const file of ["n8n/.env", ".env.local"]) {
  const path = new URL(file, root);
  if (!existsSync(path)) continue;
  for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
    const i = line.indexOf("=");
    if (i < 1 || line.trimStart().startsWith("#")) continue;
    const name = line.slice(0, i).trim();
    const value = line
      .slice(i + 1)
      .trim()
      .replace(/^["']|["']$/g, "");
    if (SECRET_NAME.test(name) && value.length >= 16)
      secrets.push({ name, value });
  }
}
console.log(
  `Checking ${secrets.length} secret values (names only are printed).`,
);

let problems = 0;

// 1. Every file git currently tracks.
const tracked = execFileSync("git", ["ls-files"], { encoding: "utf8" })
  .split(/\r?\n/)
  .filter(Boolean);
for (const file of tracked) {
  let text;
  try {
    if (statSync(file).size > 2_000_000) continue;
    text = readFileSync(file, "utf8");
  } catch {
    continue;
  }
  for (const s of secrets) {
    if (text.includes(s.value)) {
      console.log(`FOUND ${s.name} in ${file}`);
      problems++;
    }
  }
}

// 2. The whole git history, all branches.
for (const s of secrets) {
  const hits = execFileSync(
    "git",
    ["log", "--all", "--oneline", `-S${s.value}`],
    {
      encoding: "utf8",
    },
  ).trim();
  if (hits) {
    console.log(`FOUND ${s.name} in history:\n${hits}`);
    problems++;
  }
}

// 3. Workflow exports must not carry pinned test data or stored delivery keys.
const dir = new URL("n8n/workflows/", root);
if (existsSync(dir)) {
  for (const f of readdirSync(dir).filter((f) => f.endsWith(".json"))) {
    const wf = JSON.parse(readFileSync(new URL(f, dir), "utf8"));
    if (wf.pinData && Object.keys(wf.pinData).length) {
      console.log(`WARN ${f}: contains pinned test data`);
      problems++;
    }
    if (wf.staticData && Object.keys(wf.staticData).length) {
      console.log(`WARN ${f}: contains static data (delivered keys)`);
      problems++;
    }
  }
}

console.log(
  problems
    ? `${problems} problem(s) found.`
    : "OK: no secret values found in tracked files or history.",
);
process.exit(problems ? 1 : 0);
