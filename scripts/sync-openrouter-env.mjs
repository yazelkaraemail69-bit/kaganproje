/**
 * kaganproje/.env.local icindeki OPENROUTER_API_KEY degerini
 * el-yazisi backend .env dosyasina aktarir (tek anahtar, tum moduller).
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");
const backendEnvPath = path.join(rootDir, "modules", "el-yazisi-cevirmen", "backend", ".env");
const backendExamplePath = path.join(rootDir, "modules", "el-yazisi-cevirmen", "backend", ".env.example");

/** @param {string} content */
function parseEnvFile(content) {
  /** @type {Record<string, string>} */
  const out = {};
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim();
    out[key] = value;
  }
  return out;
}

/** @param {Record<string, string>} vars @param {string} template */
function serializeEnv(vars, template) {
  const lines = template.split(/\r?\n/);
  const used = new Set();

  const rendered = lines.map((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) return line;
    const eq = trimmed.indexOf("=");
    if (eq === -1) return line;
    const key = trimmed.slice(0, eq).trim();
    if (!(key in vars)) return line;
    used.add(key);
    return `${key}=${vars[key]}`;
  });

  for (const [key, value] of Object.entries(vars)) {
    if (!used.has(key)) rendered.push(`${key}=${value}`);
  }

  return `${rendered.join("\n")}\n`;
}

function loadRootOpenRouterKey() {
  for (const name of [".env.local", ".env"]) {
    const filePath = path.join(rootDir, name);
    if (!fs.existsSync(filePath)) continue;
    const vars = parseEnvFile(fs.readFileSync(filePath, "utf8"));
    const key = vars.OPENROUTER_API_KEY?.trim();
    if (key) return key;
  }
  return undefined;
}

function main() {
  const openRouterKey = loadRootOpenRouterKey();

  if (!fs.existsSync(backendEnvPath) && fs.existsSync(backendExamplePath)) {
    fs.copyFileSync(backendExamplePath, backendEnvPath);
  }

  const template = fs.existsSync(backendEnvPath)
    ? fs.readFileSync(backendEnvPath, "utf8")
    : fs.existsSync(backendExamplePath)
      ? fs.readFileSync(backendExamplePath, "utf8")
      : "PORT=4000\n";

  const vars = parseEnvFile(template);

  if (openRouterKey) {
    vars.OPENROUTER_API_KEY = openRouterKey;
    console.log("[sync-env] OPENROUTER_API_KEY -> el-yazisi backend/.env aktarildi.");
  } else {
    console.warn("[sync-env] UYARI: kaganproje/.env.local icinde OPENROUTER_API_KEY bulunamadi.");
    console.warn("[sync-env] Shorts ve El Yazisi modulleri calismayabilir.");
  }

  if (!vars.APP_SHARED_SECRET) {
    vars.APP_SHARED_SECRET = "change-this-to-a-long-random-string";
  }
  if (!vars.PORT) vars.PORT = "4000";
  if (!vars.CORS_ORIGINS) vars.CORS_ORIGINS = "http://localhost:3000,http://127.0.0.1:3000";

  fs.writeFileSync(backendEnvPath, serializeEnv(vars, template), "utf8");
}

main();
