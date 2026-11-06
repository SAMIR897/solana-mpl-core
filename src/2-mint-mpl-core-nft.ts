import { generateSigner } from "@metaplex-foundation/umi";
import { createV1, fetchAssetV1 } from "@metaplex-foundation/mpl-core";
import bs58 from "bs58";
import {
  getOrCreateKeypair,
  ensureSufficientBalance,
  getUmi,
  saveState,
  getExplorerUrl,
} from "./utils/helpers";

async function main() {
  console.log("=================================================");
  console.log("TASK 2: Mint an NFT Using Metaplex Core (MPL Core)");
  console.log("=================================================\n");

  const payer = getOrCreateKeypair("payer.json");
  await ensureSufficientBalance(payer, 0.5);

  const umi = getUmi(payer);
  console.log(`Update Authority / Owner: ${payer.publicKey.toBase58()}\n`);

  // Generate an asset signer keypair for the MPL Core NFT
  const asset = generateSigner(umi);
  console.log(`Asset Address (NFT): ${asset.publicKey}`);

  const nftName = "Core Legend #001";
  const nftUri = "https://raw.githubusercontent.com/solana-developers/program-examples/new-syntax/tokens/tokens/.assets/nft.json";

  console.log(`Minting MPL Core Asset: "${nftName}"...`);

  // Mint using MPL Core createV1
  const response = await createV1(umi, {
    asset,
    name: nftName,
    uri: nftUri,
  }).sendAndConfirm(umi, { confirm: { commitment: "finalized" } });

  const signature = bs58.encode(response.signature);
  console.log(`\n✅ MPL Core NFT Minted successfully!`);
  console.log(`🔗 Mint Tx:    ${getExplorerUrl(signature)}`);
  console.log(`🔗 Asset URL:  ${getExplorerUrl(asset.publicKey, "address")}\n`);

  // Save state immediately so other tasks can use the asset address
  saveState({
    nftAsset: asset.publicKey.toString(),
  });

  // Fetch and inspect the asset from the blockchain
  console.log("Fetching on-chain asset data...");
  const fetchedAsset = await fetchAssetV1(umi, asset.publicKey);
  console.log("---------------- NFT Details ----------------");
  console.log(`Name:             ${fetchedAsset.name}`);
  console.log(`URI:              ${fetchedAsset.uri}`);
  console.log(`Owner:            ${fetchedAsset.owner}`);
  console.log(`Update Authority: ${fetchedAsset.updateAuthority.address}`);
  console.log("---------------------------------------------\n");

  console.log("🎉 Task 2 Completed Successfully!");
}

main().catch((err) => {
  console.error("Error in Task 2:", err);
  process.exit(1);
});
