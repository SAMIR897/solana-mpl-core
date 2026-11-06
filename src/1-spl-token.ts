import {
  createMint,
  getOrCreateAssociatedTokenAccount,
  mintTo,
  transfer,
  getAccount,
} from "@solana/spl-token";
import { PublicKey } from "@solana/web3.js";
import {
  connection,
  getOrCreateKeypair,
  ensureSufficientBalance,
  saveState,
  getExplorerUrl,
} from "./utils/helpers";

async function main() {
  console.log("=================================================");
  console.log("TASK 1: Mint and Transfer Your Own SPL Token");
  console.log("=================================================\n");

  const payer = getOrCreateKeypair("payer.json");
  const recipient = process.env.RECIPIENT_PUBLIC_KEY
    ? { publicKey: new PublicKey(process.env.RECIPIENT_PUBLIC_KEY) }
    : getOrCreateKeypair("recipient.json");

  await ensureSufficientBalance(payer, 0.5);

  console.log(`Payer (Authority): ${payer.publicKey.toBase58()}`);
  console.log(`Recipient:         ${recipient.publicKey.toBase58()}\n`);

  // 1. Create a new SPL Token Mint
  const decimals = 6;
  console.log("1. Creating SPL Token Mint...");
  const mint = await createMint(
    connection,
    payer,
    payer.publicKey,     // Mint authority
    payer.publicKey,     // Freeze authority
    decimals
  );
  console.log(`✅ Token Mint created: ${mint.toBase58()}`);
  console.log(`🔗 Mint Explorer: ${getExplorerUrl(mint.toBase58(), "address")}\n`);

  // 2. Create Associated Token Account (ATA) for Payer
  console.log("2. Creating ATA for Payer...");
  const payerAta = await getOrCreateAssociatedTokenAccount(
    connection,
    payer,
    mint,
    payer.publicKey
  );
  console.log(`✅ Payer ATA: ${payerAta.address.toBase58()}`);
  console.log(`🔗 Payer ATA Explorer: ${getExplorerUrl(payerAta.address.toBase58(), "address")}\n`);

  // 3. Mint tokens to Payer ATA
  const mintAmount = 1_000 * 10 ** decimals; // 1,000 tokens
  console.log(`3. Minting 1,000 tokens to Payer ATA...`);
  const mintSig = await mintTo(
    connection,
    payer,
    mint,
    payerAta.address,
    payer,
    mintAmount
  );
  console.log(`✅ Minted successfully!`);
  console.log(`🔗 Mint Tx: ${getExplorerUrl(mintSig)}\n`);

  // 4. Create ATA for Recipient
  console.log("4. Creating ATA for Recipient...");
  const recipientAta = await getOrCreateAssociatedTokenAccount(
    connection,
    payer,
    mint,
    recipient.publicKey
  );
  console.log(`✅ Recipient ATA: ${recipientAta.address.toBase58()}`);
  console.log(`🔗 Recipient ATA Explorer: ${getExplorerUrl(recipientAta.address.toBase58(), "address")}\n`);

  // 5. Transfer tokens from Payer to Recipient
  const transferAmount = 250 * 10 ** decimals; // 250 tokens
  console.log(`5. Transferring 250 tokens to Recipient...`);
  const transferSig = await transfer(
    connection,
    payer,
    payerAta.address,
    recipientAta.address,
    payer,
    transferAmount
  );
  console.log(`✅ Transfer successful!`);
  console.log(`🔗 Transfer Tx: ${getExplorerUrl(transferSig)}\n`);

  // Verify Final Balances
  const payerBalance = await getAccount(connection, payerAta.address);
  const recipientBalance = await getAccount(connection, recipientAta.address);

  console.log("----------------- Final Balances -----------------");
  console.log(`Payer balance:     ${Number(payerBalance.amount) / 10 ** decimals} Tokens`);
  console.log(`Recipient balance: ${Number(recipientBalance.amount) / 10 ** decimals} Tokens`);
  console.log("--------------------------------------------------\n");

  saveState({
    tokenMint: mint.toBase58(),
    senderAta: payerAta.address.toBase58(),
    recipientAta: recipientAta.address.toBase58(),
    recipientWallet: recipient.publicKey.toBase58(),
  });

  console.log("🎉 Task 1 Completed Successfully!");
}

main().catch((err) => {
  console.error("Error in Task 1:", err);
  process.exit(1);
});
