import { publicKey, keypairIdentity, fromWeb3JsKeypair } from "@metaplex-foundation/umi";
import { burnV1, fetchAssetV1 } from "@metaplex-foundation/mpl-core";
import { Connection, LAMPORTS_PER_SOL } from "@solana/web3.js";
import bs58 from "bs58";
import {
  connection,
  getOrCreateKeypair,
  getUmi,
  loadState,
  getExplorerUrl,
} from "./utils/helpers";

async function main() {
  console.log("=================================================");
  console.log("EXTENSION TASK 5: Burn NFT & Reclaim Rent Fees");
  console.log("=================================================\n");

  const state = loadState();
  if (!state.nftAsset) {
    throw new Error(
      "No NFT asset found in state.json. Please run Task 2 (npm run task2:mint-nft) first!"
    );
  }

  const payer = getOrCreateKeypair("payer.json");
  const recipient = getOrCreateKeypair("recipient.json");

  const assetAddress = publicKey(state.nftAsset);

  // Initialize Umi with payer first to check asset state
  let umi = getUmi(payer);

  console.log(`Checking asset state on-chain: ${assetAddress}...`);
  let asset;
  try {
    asset = await fetchAssetV1(umi, assetAddress);
  } catch (err: any) {
    console.log(`Asset ${assetAddress} does not exist or has already been burned!`);
    return;
  }

  console.log(`Current Asset Owner: ${asset.owner}`);

  // If the asset was transferred to recipient in Task 4, the owner must sign the burn!
  let signingWallet = payer;
  if (asset.owner.toString() === recipient.publicKey.toBase58()) {
    console.log("Asset is currently owned by Recipient. Using Recipient keypair to sign burn.");
    signingWallet = recipient;
    umi = getUmi(recipient);
  } else {
    console.log("Asset is currently owned by Payer. Using Payer keypair to sign burn.");
  }

  const balanceBefore = await connection.getBalance(signingWallet.publicKey);
  console.log(`Signer Balance before Burn: ${(balanceBefore / LAMPORTS_PER_SOL).toFixed(6)} SOL`);

  console.log(`\nPermanently burning MPL Core Asset ${assetAddress}...`);

  // Call MPL Core burnV1
  const response = await burnV1(umi, {
    asset: assetAddress,
  }).sendAndConfirm(umi, { confirm: { commitment: "finalized" } });

  const signature = bs58.encode(response.signature);
  console.log(`\n🔥 NFT permanently burned!`);
  console.log(`🔗 Burn Tx: ${getExplorerUrl(signature)}\n`);

  const balanceAfter = await connection.getBalance(signingWallet.publicKey);
  console.log(`Signer Balance after Burn:  ${(balanceAfter / LAMPORTS_PER_SOL).toFixed(6)} SOL`);
  console.log(
    `💰 Net SOL Change (Reclaimed rent minus tx fee): ${(
      (balanceAfter - balanceBefore) /
      LAMPORTS_PER_SOL
    ).toFixed(6)} SOL`
  );

  // Verify asset no longer exists
  console.log("\nVerifying asset destruction on-chain...");
  try {
    await fetchAssetV1(umi, assetAddress);
    console.warn("⚠️ Warning: Asset still appears to exist on-chain.");
  } catch {
    console.log("✅ Verified: Asset account successfully closed & rent reclaimed!");
  }

  console.log("\n🎉 Task 5 Completed Successfully!");
}

main().catch((err) => {
  console.error("Error in Task 5:", err);
  process.exit(1);
});
