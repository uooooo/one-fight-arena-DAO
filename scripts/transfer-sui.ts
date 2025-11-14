#!/usr/bin/env bun

/**
 * Transfer SUI to a specified address on Testnet
 */

import { SuiClient, getFullnodeUrl } from "@mysten/sui/client";
import { Transaction } from "@mysten/sui/transactions";
import { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519";
import { fromB64 } from "@mysten/sui/utils";
import { execSync } from "child_process";

// Import decodeSuiPrivateKey if available (same approach as test-transactions.ts)
let decodeSuiPrivateKey: ((key: string) => { secretKey: Uint8Array }) | null = null;
try {
  const suiUtils = await import("@mysten/sui/cryptography");
  decodeSuiPrivateKey = suiUtils.decodeSuiPrivateKey as any;
} catch {
  try {
    const suiUtils = await import("@mysten/sui/utils");
    decodeSuiPrivateKey = (suiUtils as any).decodeSuiPrivateKey;
  } catch {
    // Will use fallback method
  }
}

const NETWORK = process.argv[2] || "testnet";
const RECIPIENT = process.argv[3];
const AMOUNT_MIST = process.argv[4] ? BigInt(process.argv[4]) : BigInt(5_000_000_000); // Default: 5 SUI

if (!RECIPIENT) {
  console.error("❌ Recipient address is required");
  console.error("Usage: bun run scripts/transfer-sui.ts [network] <recipient-address> [amount-in-mist]");
  process.exit(1);
}

const RPC_URL = NETWORK === "local" ? "http://127.0.0.1:9000" : getFullnodeUrl("testnet");

console.log(`💸 Transferring SUI on ${NETWORK} network...`);
console.log(`📦 Recipient: ${RECIPIENT}`);
console.log(`💰 Amount: ${Number(AMOUNT_MIST) / 1_000_000_000} SUI\n`);

// Initialize Sui client
const client = new SuiClient({ url: RPC_URL });

// Get signer from Sui CLI
async function getSigner() {
  try {
    const address = execSync("sui client active-address", { encoding: "utf-8" }).trim();
    
    // Try to export key in JSON format
    let keyExport: any;
    try {
      const keyListJson = execSync("sui keytool list --json", { encoding: "utf-8" });
      const keys = JSON.parse(keyListJson);
      const matchingKey = keys.find((key: any) => key.suiAddress === address);
      if (!matchingKey) {
        throw new Error("Key not found in JSON list");
      }
      const exportOutput = execSync(`sui keytool export --key-identity ${matchingKey.alias} --json`, { encoding: "utf-8" });
      keyExport = JSON.parse(exportOutput);
    } catch (jsonError) {
      const keyList = execSync("sui keytool list", { encoding: "utf-8" });
      const aliasMatch = keyList.match(/alias\s*│\s*([^\s│]+)/);
      if (!aliasMatch) {
        throw new Error("Could not extract alias from key list");
      }
      const keyAlias = aliasMatch[1].trim();
      const exportOutput = execSync(`sui keytool export --key-identity ${keyAlias} --json`, { encoding: "utf-8" });
      keyExport = JSON.parse(exportOutput);
    }
    
    const privateKeyStr = keyExport.exportedPrivateKey || keyExport.key?.exportedPrivateKey;
    if (!privateKeyStr) {
      throw new Error("Could not find exportedPrivateKey in export output");
    }
    
    if (privateKeyStr.startsWith("suiprivkey1")) {
      // Try to use decodeSuiPrivateKey if available (same as test-transactions.ts)
      if (decodeSuiPrivateKey) {
        const decoded = decodeSuiPrivateKey(privateKeyStr);
        return Ed25519Keypair.fromSecretKey(decoded.secretKey);
      } else {
        // Fallback: Try base64 decode directly
        try {
          return Ed25519Keypair.fromSecretKey(fromB64(privateKeyStr));
        } catch {
          throw new Error("Could not decode suiprivkey1 format. Please ensure @mysten/sui/cryptography is available.");
        }
      }
    } else {
      const keypairBytes = fromB64(privateKeyStr);
      const scheme = keypairBytes[0];
      if (scheme === 0) {
        return Ed25519Keypair.fromSecretKey(keypairBytes.slice(1));
      } else {
        throw new Error(`Unsupported key scheme: ${scheme}`);
      }
    }
  } catch (error: any) {
    console.error("❌ Failed to get signer:", error.message);
    throw error;
  }
}

// Transfer SUI
async function transferSUI() {
  try {
    const signer = await getSigner();
    const sender = signer.toSuiAddress();
    
    console.log(`📤 Sender: ${sender}`);
    
    // Get gas coins
    const coins = await client.getCoins({
      owner: sender,
      coinType: "0x2::sui::SUI",
    });
    
    if (coins.data.length === 0) {
      console.error("❌ No SUI coins found. Please request SUI from faucet first.");
      if (NETWORK === "testnet") {
        console.log(`\n💡 Testnet faucet: https://faucet.sui.io/?address=${sender}`);
      }
      process.exit(1);
    }
    
    console.log(`✅ Found ${coins.data.length} SUI coin(s)\n`);
    
    // Build transaction
    const tx = new Transaction();
    
    // Split the amount from gas coin
    const [payment] = tx.splitCoins(tx.gas, [tx.pure.u64(AMOUNT_MIST)]);
    
    // Transfer to recipient
    tx.transferObjects([payment], RECIPIENT);
    
    // Execute transaction
    console.log("📤 Executing transaction...");
    const result = await client.signAndExecuteTransaction({
      signer,
      transaction: tx,
      options: {
        showEffects: true,
        showEvents: true,
        showBalanceChanges: true,
      },
    });
    
    console.log(`\n✅ Transfer successful!`);
    console.log(`   Transaction: ${result.digest}`);
    console.log(`   Amount: ${Number(AMOUNT_MIST) / 1_000_000_000} SUI`);
    console.log(`   From: ${sender}`);
    console.log(`   To: ${RECIPIENT}\n`);
    
    // Wait for transaction to be indexed
    await client.waitForTransaction({ digest: result.digest });
    console.log("✅ Transaction indexed\n");
    
  } catch (error: any) {
    console.error(`\n❌ Transfer failed: ${error.message}`);
    if (error.stack) {
      console.error(`   ${error.stack}`);
    }
    process.exit(1);
  }
}

// Run transfer
transferSUI();

