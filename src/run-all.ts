import { execSync } from "child_process";

async function runCommand(cmd: string, title: string) {
  console.log("\n=======================================================");
  console.log(`▶ RUNNING: ${title}`);
  console.log("=======================================================\n");
  try {
    execSync(cmd, { stdio: "inherit" });
  } catch (error) {
    console.error(`Failed to execute: ${title}`);
    process.exit(1);
  }
}

async function main() {
  console.log("🚀 Starting Full Solana SPL Token & MPL Core Lifecycle Demo...\n");

  await runCommand("npx tsx src/1-spl-token.ts", "Task 1: SPL Token Mint & Transfer");
  await runCommand("npx tsx src/2-mint-mpl-core-nft.ts", "Task 2: MPL Core NFT Mint");
  await runCommand("npx tsx src/3-update-nft.ts", "Task 3: Update NFT Metadata as Authority");
  await runCommand("npx tsx src/4-transfer-nft.ts", "Task 4 (Extension): Transfer NFT Ownership");
  await runCommand("npx tsx src/5-burn-nft.ts", "Task 5 (Extension): Burn NFT & Reclaim Rent");

  console.log("\n=======================================================");
  console.log("🎉 ALL TASKS (1 - 5) COMPLETED SUCCESSFULLY!");
  console.log("=======================================================\n");
}

main().catch(console.error);
