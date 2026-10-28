#!/usr/bin/env node
// Inlines the shared SDK/CSS into each miniapp and writes immutable, versioned
// bundles to public/miniapps/<slug>/<version>/index.html plus their SHA-256.
// Usage: node scripts/build-miniapps.mjs [--check]
import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, readdirSync, writeFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { cloudflareHeadersFile } from "../security-headers.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const check = process.argv.includes("--check");
const MAX_BYTES = 200 * 1024;
const VERSION = "1.0.0";

const sdk = readFileSync(join(root, "miniapps/shared/sdk.js"), "utf8").trim();
const css = readFileSync(join(root, "miniapps/shared/base.css"), "utf8").trim();

function bundle(sourceFile) {
  const html = readFileSync(sourceFile, "utf8");
  if (!html.includes("/*LOOP_SDK*/")) throw new Error(`${sourceFile}: missing /*LOOP_SDK*/ marker`);
  return html.replace("/*LOOP_BASE_CSS*/", () => css).replace("/*LOOP_SDK*/", () => sdk);
}

const targets = [
  ...readdirSync(join(root, "miniapps/apps")).map((slug) => ({
    source: join(root, "miniapps/apps", slug, "index.html"),
    entryPath: `/miniapps/${slug}/${VERSION}/index.html`,
    hashed: true,
  })),
  ...readdirSync(join(root, "miniapps/fixtures")).map((name) => ({
    source: join(root, "miniapps/fixtures", name, "index.html"),
    entryPath: `/miniapps/_fixtures/${name}/index.html`,
    hashed: false,
  })),
];

const hashes = {};
let stale = [];
for (const { source, entryPath, hashed } of targets) {
  const output = bundle(source);
  if (Buffer.byteLength(output) > MAX_BYTES) throw new Error(`${entryPath} exceeds ${MAX_BYTES} bytes`);
  const dest = join(root, "public", entryPath);
  if (hashed) hashes[entryPath] = createHash("sha256").update(output).digest("hex");
  if (check) {
    if (!existsSync(dest) || readFileSync(dest, "utf8") !== output) stale.push(entryPath);
  } else {
    mkdirSync(dirname(dest), { recursive: true });
    writeFileSync(dest, output);
  }
}

const headersFile = join(root, "public/_headers");
const headersText = cloudflareHeadersFile();
if (check) {
  if (!existsSync(headersFile) || readFileSync(headersFile, "utf8") !== headersText) stale.push("public/_headers");
} else {
  writeFileSync(headersFile, headersText);
}

const hashFile = join(root, "src/lib/catalog/miniapp-hashes.json");
const hashJson = JSON.stringify(hashes, null, 2) + "\n";
if (check) {
  if (!existsSync(hashFile) || readFileSync(hashFile, "utf8") !== hashJson) stale.push("miniapp-hashes.json");
  if (stale.length) {
    console.error(`Miniapp bundles are out of date: ${stale.join(", ")}\nRun: npm run miniapps:build`);
    process.exit(1);
  }
  console.log("Miniapp bundles are up to date.");
} else {
  writeFileSync(hashFile, hashJson);
  console.log(`Built ${targets.length} miniapp bundles.`);
}
