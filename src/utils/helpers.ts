import { Connection, Keypair, LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import { keypairIdentity } from "@metaplex-foundation/umi";
import { fromWeb3JsKeypair } from "@metaplex-foundation/umi-web3js-adapters";
import { mplCore } from "@metaplex-foundation/mpl-core";
import bs58 from "bs58";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";

dotenv.config();

export const RPC_ENDPOINT = process.env.RPC_ENDPOINT || "https://api.devnet.solana.com";
export const connection = new Connection(RPC_ENDPOINT, "confirmed");

const STATE_FILE = path.join(__dirname, "../../state.json");
const KEYS_DIR = path.join(__dirname, "../../keys");

export interface AppState {
  tokenMint?: string;
  senderAta?: string;
  recipientAta?: string;
  nftAsset?: string;
  recipientWallet?: string;
}

export function loadState(): AppState {
  if (fs.existsSync(STATE_FILE)) {
    try {
      return JSON.parse(fs.readFileSync(STATE_FILE, "utf-8"));
    } catch {
      return {};
    }
  }
  return {};
}

export function saveState(patch: Partial<AppState>): void {
  const current = loadState();
  const next = { ...current, ...patch };
  fs.writeFileSync(STATE_FILE, JSON.stringify(next, null, 2), "utf-8");
}

export function getOrCreateKeypair(filename: string = "payer.json"): Keypair {
  if (!fs.existsSync(KEYS_DIR)) {
    fs.mkdirSync(KEYS_DIR, { recursive: true });
  }

  // Check env variable first — support base58, JSON array, or a file path
  if (filename === "payer.json") {
    // Option 1: PRIVATE_KEY_PATH points to a Solana CLI JSON keypair file
    if (process.env.PRIVATE_KEY_PATH) {
      const keyData = JSON.parse(fs.readFileSync(process.env.PRIVATE_KEY_PATH, "utf-8"));
      return Keypair.fromSecretKey(Uint8Array.from(keyData));
    }
    // Option 2: PRIVATE_KEY is a base58 string or JSON array
    if (process.env.PRIVATE_KEY) {
      const rawKey = process.env.PRIVATE_KEY.trim();
      if (rawKey.startsWith("[") && rawKey.endsWith("]")) {
        return Keypair.fromSecretKey(Uint8Array.from(JSON.parse(rawKey)));
      }
      return Keypair.fromSecretKey(bs58.decode(rawKey));
    }
  }

  const keyPath = path.join(KEYS_DIR, filename);
  if (fs.existsSync(keyPath)) {
    const keyData = JSON.parse(fs.readFileSync(keyPath, "utf-8"));
    return Keypair.fromSecretKey(Uint8Array.from(keyData));
  }

  const newKeypair = Keypair.generate();
  fs.writeFileSync(keyPath, JSON.stringify(Array.from(newKeypair.secretKey)), "utf-8");
  return newKeypair;
}

export async function ensureSufficientBalance(keypair: Keypair, minSol: number = 0.5): Promise<void> {
  const balance = await connection.getBalance(keypair.publicKey);
  const currentSol = balance / LAMPORTS_PER_SOL;

  console.log(`Wallet: ${keypair.publicKey.toBase58()}`);
  console.log(`Current Balance: ${currentSol.toFixed(4)} SOL`);

  if (currentSol < minSol) {
    console.log(`\nBalance is under ${minSol} SOL. Requesting airdrop on Devnet...`);
    try {
      const airdropSig = await connection.requestAirdrop(
        keypair.publicKey,
        1 * LAMPORTS_PER_SOL
      );
      const latestBlockhash = await connection.getLatestBlockhash();
      await connection.confirmTransaction({
        signature: airdropSig,
        ...latestBlockhash,
      });
      console.log(`Airdrop successful! Tx: ${airdropSig}`);
    } catch (err: any) {
      console.warn(`Airdrop failed or rate limited: ${err.message || err}`);
      console.log(
        `💡 If rate-limited, get Devnet SOL manually via faucet: https://faucet.solana.com/`
      );
    }
  }
}

export function getUmi(keypair: Keypair) {
  const umi = createUmi(RPC_ENDPOINT).use(mplCore());
  const umiKeypair = fromWeb3JsKeypair(keypair);
  umi.use(keypairIdentity(umiKeypair));
  return umi;
}

export function getExplorerUrl(
  identifier: string,
  type: "tx" | "address" = "tx",
  cluster: string = "devnet"
): string {
  return `https://explorer.solana.com/${type}/${identifier}?cluster=${cluster}`;
}
