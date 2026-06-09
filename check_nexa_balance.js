/**
 * NexaEdge — NEXA Token Balance Checker
 * Reads real SPL token supply and holder balances on Solana mainnet.
 *
 * Contract : D7h9MvFDkVxPYeJwSTcE7VkKXo6mygCHYph36P8oeic2
 * Name     : Nexa Edge (NEXA)
 * Decimals : 9
 * Supply   : 100,000,000
 * Minted   : 2026-05-17
 *
 * Usage:
 *   npm install @solana/web3.js @solana/spl-token
 *   node check_nexa_balance.js
 *   node check_nexa_balance.js <wallet_address>
 */

const { Connection, PublicKey, clusterApiUrl } = require("@solana/web3.js");
const { getAccount, getMint, getAssociatedTokenAddress } = require("@solana/spl-token");

const NEXA_MINT = new PublicKey("D7h9MvFDkVxPYeJwSTcE7VkKXo6mygCHYph36P8oeic2");
const connection = new Connection(clusterApiUrl("mainnet-beta"), "confirmed");

async function getMintInfo() {
  const mint = await getMint(connection, NEXA_MINT);
  const supply = Number(mint.supply) / Math.pow(10, mint.decimals);
  console.log("\n── NEXA Token Info ──────────────────────────────");
  console.log(`  Mint Address : ${NEXA_MINT.toBase58()}`);
  console.log(`  Decimals     : ${mint.decimals}`);
  console.log(`  Total Supply : ${supply.toLocaleString()} NEXA`);
  console.log(`  Mint Auth    : ${mint.mintAuthority?.toBase58() ?? "null (frozen)"}`);
  console.log(`  Freeze Auth  : ${mint.freezeAuthority?.toBase58() ?? "null"}`);
  console.log("─────────────────────────────────────────────────\n");
  return mint;
}

async function getWalletBalance(walletAddress) {
  const wallet = new PublicKey(walletAddress);
  const mint = await getMint(connection, NEXA_MINT);
  const ata = await getAssociatedTokenAddress(NEXA_MINT, wallet);

  try {
    const account = await getAccount(connection, ata);
    const balance = Number(account.amount) / Math.pow(10, mint.decimals);
    console.log(`── Wallet Balance ────────────────────────────────`);
    console.log(`  Wallet  : ${walletAddress}`);
    console.log(`  ATA     : ${ata.toBase58()}`);
    console.log(`  Balance : ${balance.toLocaleString()} NEXA`);
    console.log("─────────────────────────────────────────────────\n");
  } catch {
    console.log(`  Wallet ${walletAddress} holds 0 NEXA (no token account found).`);
  }
}

(async () => {
  try {
    await getMintInfo();
    const wallet = process.argv[2];
    if (wallet) await getWalletBalance(wallet);
  } catch (err) {
    console.error("Error:", err.message);
    process.exit(1);
  }
})();
