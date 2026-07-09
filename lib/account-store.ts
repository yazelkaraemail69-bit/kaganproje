import { promises as fs } from "fs";
import path from "path";
import {
  createAccountId,
  hashPassword,
  normalizeEmail,
  verifyPassword,
} from "@/lib/domains/account/plan";
import type { AccountRecord, PublicAccount } from "@/lib/domains/account/types";
import { toPublicAccount } from "@/lib/domains/account/types";

const DATA_DIR = path.join(process.cwd(), ".data", "accounts");

async function ensureDir(): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
}

function filePath(id: string): string {
  const safe = id.replace(/[^a-z0-9_-]/gi, "");
  return path.join(DATA_DIR, `${safe}.json`);
}

export async function saveAccount(account: AccountRecord): Promise<void> {
  await ensureDir();
  await fs.writeFile(filePath(account.id), JSON.stringify(account, null, 2), "utf-8");
}

export async function getAccountById(id: string): Promise<AccountRecord | null> {
  try {
    const raw = await fs.readFile(filePath(id), "utf-8");
    return JSON.parse(raw) as AccountRecord;
  } catch {
    return null;
  }
}

export async function listAccounts(): Promise<AccountRecord[]> {
  await ensureDir();
  const files = await fs.readdir(DATA_DIR);
  const accounts: AccountRecord[] = [];
  for (const file of files) {
    if (!file.endsWith(".json")) continue;
    try {
      const raw = await fs.readFile(path.join(DATA_DIR, file), "utf-8");
      accounts.push(JSON.parse(raw) as AccountRecord);
    } catch {
      /* skip corrupt */
    }
  }
  return accounts;
}

export async function getAccountByEmail(email: string): Promise<AccountRecord | null> {
  const normalized = normalizeEmail(email);
  const accounts = await listAccounts();
  return accounts.find((a) => a.email === normalized) ?? null;
}

export async function createAccount(input: {
  email: string;
  name: string;
  password: string;
}): Promise<AccountRecord> {
  const email = normalizeEmail(input.email);
  const existing = await getAccountByEmail(email);
  if (existing) {
    throw new Error("Bu e-posta ile zaten bir hesap var.");
  }

  const now = new Date().toISOString();
  const account: AccountRecord = {
    id: createAccountId(email),
    email,
    name: input.name.trim() || email.split("@")[0],
    passwordHash: hashPassword(input.password),
    plan: "free",
    subscriptionStatus: "none",
    teamIds: [],
    profileSlugs: [],
    createdAt: now,
    updatedAt: now,
  };

  await saveAccount(account);
  return account;
}

export async function authenticateAccount(
  email: string,
  password: string
): Promise<AccountRecord | null> {
  const account = await getAccountByEmail(email);
  if (!account) return null;
  if (!verifyPassword(password, account.passwordHash)) return null;
  return account;
}

export async function updateAccount(
  id: string,
  patch: Partial<Omit<AccountRecord, "id" | "createdAt" | "passwordHash">>
): Promise<AccountRecord | null> {
  const account = await getAccountById(id);
  if (!account) return null;
  const next: AccountRecord = {
    ...account,
    ...patch,
    updatedAt: new Date().toISOString(),
  };
  await saveAccount(next);
  return next;
}

export async function attachProfileToAccount(accountId: string, slug: string): Promise<void> {
  const account = await getAccountById(accountId);
  if (!account) return;
  if (account.profileSlugs.includes(slug)) return;
  account.profileSlugs = [...account.profileSlugs, slug];
  account.updatedAt = new Date().toISOString();
  await saveAccount(account);
}

export async function getPublicAccount(id: string): Promise<PublicAccount | null> {
  const account = await getAccountById(id);
  return account ? toPublicAccount(account) : null;
}
