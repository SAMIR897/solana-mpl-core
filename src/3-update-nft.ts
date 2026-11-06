import { publicKey } from "@metaplex-foundation/umi";
import { updateV1, fetchAssetV1 } from "@metaplex-foundation/mpl-core";
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
  console.log("TASK 3: Update NFT Name and Metadata as Authority");
  console.log("=================================================\n");

  const state = loadState();
  if (!state.nftAsset) {
    throw new Error(
      "No NFT asset found in state.json. Please run Task 2 (npm run task2:mint-nft) first!"
    );
  }

  const payer = getOrCreateKeypair("payer.json");
  await ensureSufficientBalance(payer, 0.2);

  const umi = getUmi(payer);
  const assetAddress = publicKey(state.nftAsset);

  console.log(`Payer / Update Authority: ${payer.publicKey.toBase58()}`);
  console.log(`Target Asset Address:     ${assetAddress}\n`);

  // Fetch current details
  const initialAsset = await fetchAssetV1(umi, assetAddress);
  console.log("Before Update:");
  console.log(`- Current Name: ${initialAsset.name}`);
  console.log(`- Current URI:  ${initialAsset.uri}\n`);

  const updatedName = "Core Legend #001 [Evolved]";
  const updatedUri = "https://raw.githubusercontent.com/solana-developers/program-examples/new-syntax/tokens/tokens/.assets/nft-updated.json";

  console.log(`Updating NFT to new Name: "${updatedName}"...`);

  // Call MPL Core updateV1
  const response = await updateV1(umi, {
    asset: assetAddress,
    newName: updatedName,
    newUri: updatedUri,
  }).sendAndConfirm(umi, { confirm: { commitment: "finalized" } });

  const signature = bs58.encode(response.signature);
  console.log(`\n✅ Metadata updated successfully!`);
  console.log(`🔗 Update Tx:  ${getExplorerUrl(signature)}`);
  console.log(`🔗 Asset URL:  ${getExplorerUrl(assetAddress, "address")}\n`);

  // Verify updated state on-chain
  const finalAsset = await fetchAssetV1(umi, assetAddress);
  console.log("After Update:");
  console.log(`- Updated Name: ${finalAsset.name}`);
  console.log(`- Updated URI:  ${finalAsset.uri}\n`);

  console.log("🎉 Task 3 Completed Successfully!");
}

main().catch((err) => {
  console.error("Error in Task 3:", err);
  process.exit(1);
});
