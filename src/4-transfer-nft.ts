import { publicKey } from "@metaplex-foundation/umi";
import { transferV1, fetchAssetV1 } from "@metaplex-foundation/mpl-core";
import { PublicKey } from "@solana/web3.js";
import bs58 from "bs58";
import {
  getOrCreateKeypair,
  ensureSufficientBalance,
  getUmi,
  loadState,
  getExplorerUrl,
} from "./utils/helpers";

async function main() {
  console.log("=================================================");
  console.log("EXTENSION TASK 4: Transfer NFT Ownership Between Wallets");
  console.log("=================================================\n");

  const state = loadState();
  if (!state.nftAsset) {
    throw new Error(
      "No NFT asset found in state.json. Please run Task 2 (npm run task2:mint-nft) first!"
    );
  }

  const payer = getOrCreateKeypair("payer.json");
  await ensureSufficientBalance(payer, 0.2);

  const recipient = process.env.RECIPIENT_PUBLIC_KEY
    ? { publicKey: new PublicKey(process.env.RECIPIENT_PUBLIC_KEY) }
    : getOrCreateKeypair("recipient.json");

  const umi = getUmi(payer);
  const assetAddress = publicKey(state.nftAsset);
  const newOwner = publicKey(recipient.publicKey.toBase58());

  console.log(`Current Owner (Payer): ${payer.publicKey.toBase58()}`);
  console.log(`New Owner (Recipient):  ${newOwner}`);
  console.log(`Target Asset Address:   ${assetAddress}\n`);

  // Verify ownership before transfer
  const assetBefore = await fetchAssetV1(umi, assetAddress);
  console.log(`Asset Owner before transfer: ${assetBefore.owner}`);

  if (assetBefore.owner.toString() !== payer.publicKey.toBase58()) {
    console.warn(
      `⚠️ Warning: Payer is not the current owner (${assetBefore.owner}). Transfer might fail unless signed by owner.`
    );
  }

  console.log(`\nTransferring asset directly to new owner (no ATA required!)...`);

  // Call MPL Core transferV1
  const response = await transferV1(umi, {
    asset: assetAddress,
    newOwner: newOwner,
  }).sendAndConfirm(umi, { confirm: { commitment: "finalized" } });

  const signature = bs58.encode(response.signature);
  console.log(`\n✅ NFT Transferred successfully!`);
  console.log(`🔗 Transfer Tx: ${getExplorerUrl(signature)}`);
  console.log(`🔗 Asset URL:   ${getExplorerUrl(assetAddress, "address")}\n`);

  // Verify new owner on-chain
  const assetAfter = await fetchAssetV1(umi, assetAddress);
  console.log(`Asset Owner after transfer:  ${assetAfter.owner}`);
  console.log(`Update Authority remains:    ${assetAfter.updateAuthority.address}\n`);

  console.log("🎉 Task 4 Completed Successfully!");
}

main().catch((err) => {
  console.error("Error in Task 4:", err);
  process.exit(1);
});
