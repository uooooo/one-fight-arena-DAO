#!/usr/bin/env bun

/**
 * Create USDO faucet for the new package
 * 
 * This script:
 * 1. Creates a USDO faucet using TreasuryCap<USDO> from the new package
 * 2. Updates SEED_DATA.json with the new faucet ID
 * 
 * Usage:
 *   bun run scripts/create-usdo-faucet.ts [local|testnet] <admin-cap-id> <treasury-cap-usdo-id> [max-per-call]
 * 
 * Example:
 *   bun run scripts/create-usdo-faucet.ts testnet 0x123... 0x456... 1000000000000
 */

import { SuiClient, getFullnodeUrl } from "@mysten/sui/client";
import { Transaction } from "@mysten/sui/transactions";
import { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519";
import { fromB64 } from "@mysten/sui/utils";
import { execSync } from "child_process";
import { join } from "path";
import { existsSync } from "fs";

// Import decodeSuiPrivateKey if available
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

const network = process.argv[2] || "testnet";
const adminCapId = process.argv[3];
const treasuryCapUsdoId = process.argv[4];
const maxPerCall = process.argv[5] || "1000000000000"; // Default: 1000 USDO (10^9 * 1000)

if (!adminCapId || !treasuryCapUsdoId) {
  console.error("❌ Admin Cap ID and TreasuryCap<USDO> ID are required");
  console.error("\nUsage:");
  console.error("  bun run scripts/create-usdo-faucet.ts [local|testnet] <admin-cap-id> <treasury-cap-usdo-id> [max-per-call]");
  process.exit(1);
}

// Get package ID
const packageIdFile = join(import.meta.dir, "..", "move", "open_corner", "PACKAGE_ID.txt");
if (!existsSync(packageIdFile)) {
  console.error("❌ Package ID file not found. Please deploy the package first.");
  process.exit(1);
}
const packageId = (await Bun.file(packageIdFile).text()).trim();

console.log(`🚀 Creating USDO faucet on ${network} network...\n`);
console.log(`📦 Package ID: ${packageId}`);
console.log(`🔑 Admin Cap ID: ${adminCapId}`);
console.log(`💰 TreasuryCap<USDO> ID: ${treasuryCapUsdoId}`);
console.log(`💧 Max per call: ${maxPerCall} (${Number(maxPerCall) / 1_000_000_000} USDO)\n`);

// Get signer
async function getSigner() {
  try {
    // Get active address
    const address = execSync("sui client active-address", { encoding: "utf-8" }).trim();
    
    // Try to export key in JSON format first
    let keyExport: any;
    try {
      const keyListJson = execSync("sui keytool list --json", { encoding: "utf-8" });
      const keys = JSON.parse(keyListJson);
      
      // Find key matching the active address
      const matchingKey = keys.find((key: any) => key.suiAddress === address);
      if (!matchingKey) {
        throw new Error("Key not found in JSON list");
      }
      
      // Export the key
      const exportOutput = execSync(`sui keytool export --key-identity ${matchingKey.alias} --json`, { encoding: "utf-8" });
      keyExport = JSON.parse(exportOutput);
    } catch (jsonError) {
      // Fallback to parsing table output
      const keyList = execSync("sui keytool list", { encoding: "utf-8" });
      
      // Simple regex to find alias in the nested table structure
      const aliasMatch = keyList.match(/alias\s*│\s*([^\s│]+)/);
      if (!aliasMatch) {
        throw new Error("Could not extract alias from key list");
      }
      
      const keyAlias = aliasMatch[1].trim();
      console.log(`   Using key alias: ${keyAlias}`);
      
      // Export the key
      const exportOutput = execSync(`sui keytool export --key-identity ${keyAlias} --json`, { encoding: "utf-8" });
      keyExport = JSON.parse(exportOutput);
    }
    
    // Extract private key from export
    const privateKeyStr = keyExport.exportedPrivateKey || keyExport.key?.exportedPrivateKey;
    if (!privateKeyStr) {
      throw new Error("Could not find exportedPrivateKey in export output");
    }
    
    // Parse the Sui private key format (suiprivkey1...)
    if (privateKeyStr.startsWith("suiprivkey1")) {
      // Use decodeSuiPrivateKey if available
      if (decodeSuiPrivateKey) {
        const decoded = decodeSuiPrivateKey(privateKeyStr);
        return Ed25519Keypair.fromSecretKey(decoded.secretKey);
      } else {
        // Fallback: try to decode base64 directly
        // Sui private keys are base58 encoded with prefix
        const base64Key = privateKeyStr.replace("suiprivkey1", "");
        return Ed25519Keypair.fromSecretKey(fromB64(base64Key));
      }
    } else {
      // Assume it's already base64
      return Ed25519Keypair.fromSecretKey(fromB64(privateKeyStr));
    }
  } catch (error: any) {
    console.error("❌ Failed to get signer:", error.message);
    console.error("   Make sure you have an active address configured: sui client active-address");
    process.exit(1);
  }
}

// Create client
const rpcUrl = network === "local" 
  ? "http://127.0.0.1:9000"
  : getFullnodeUrl("testnet");
const client = new SuiClient({ url: rpcUrl });

// Create faucet
try {
  const signer = await getSigner();
  const tx = new Transaction();
  
  // Call create_usdo_faucet
  tx.moveCall({
    target: `${packageId}::usdo_faucet::create_usdo_faucet`,
    arguments: [
      tx.object(adminCapId), // &ProtocolAdminCap
      tx.object(treasuryCapUsdoId), // TreasuryCap<USDO>
      tx.pure.u64(BigInt(maxPerCall)), // max_per_call
    ],
    typeArguments: [],
  });
  
  console.log("📤 Executing transaction...");
  const result = await client.signAndExecuteTransaction({
    signer,
    transaction: tx,
    options: {
      showEffects: true,
      showEvents: true,
      showObjectChanges: true,
      showBalanceChanges: true,
    },
  });
  
  console.log(`✅ Transaction executed: ${result.digest}\n`);
  
  // Extract Faucet ID from objectChanges
  let faucetId: string | null = null;
  
  if (result.objectChanges) {
    for (const change of result.objectChanges) {
      if (change.type === "created") {
        const objectType = change.objectType || "";
        if (objectType.includes("usdo_faucet::UsdoFaucet")) {
          faucetId = change.objectId;
          console.log(`🚰 Faucet ID: ${faucetId}`);
        }
      }
    }
  }
  
  if (!faucetId) {
    console.warn("⚠️  Could not extract Faucet ID from transaction");
    console.log("   Please check the transaction output manually:");
    console.log(`   Transaction: ${result.digest}`);
  } else {
    // Update SEED_DATA.json
    const seedDataFile = join(import.meta.dir, "..", "app", "public", "SEED_DATA.json");
    if (existsSync(seedDataFile)) {
      const seedData = JSON.parse(await Bun.file(seedDataFile).text());
      seedData.usdoFaucetId = faucetId;
      seedData.usdoFaucetPackageId = packageId;
      seedData.treasuryCapUsdoId = treasuryCapUsdoId;
      seedData.timestamp = new Date().toISOString();
      await Bun.write(seedDataFile, JSON.stringify(seedData, null, 2));
      console.log(`\n💾 Updated ${seedDataFile}`);
    }
    
    // Also update root SEED_DATA.json
    const rootSeedDataFile = join(import.meta.dir, "..", "SEED_DATA.json");
    if (existsSync(rootSeedDataFile)) {
      const seedData = JSON.parse(await Bun.file(rootSeedDataFile).text());
      seedData.usdoFaucetId = faucetId;
      seedData.usdoFaucetPackageId = packageId;
      seedData.treasuryCapUsdoId = treasuryCapUsdoId;
      seedData.timestamp = new Date().toISOString();
      await Bun.write(rootSeedDataFile, JSON.stringify(seedData, null, 2));
      console.log(`💾 Updated ${rootSeedDataFile}`);
    }
    
    console.log("\n🎉 USDO faucet created successfully!");
    console.log(`\n📋 Summary:`);
    console.log(`   Faucet ID: ${faucetId}`);
    console.log(`   Package ID: ${packageId}`);
    console.log(`   Max per call: ${Number(maxPerCall) / 1_000_000_000} USDO`);
    console.log(`   Anyone can now claim USDO from this faucet`);
  }
  
} catch (error: any) {
  console.error("❌ Failed to create faucet:", error.message);
  if (error.stack) {
    console.error(error.stack);
  }
  process.exit(1);
}

