#!/usr/bin/env bun

/**
 * Create a new market with TreasuryCap stored in MarketPool (v2 design)
 * 
 * This script:
 * 1. Finds TreasuryCap<YES_COIN> and TreasuryCap<NO_COIN> for the new package
 * 2. Creates a new market with TreasuryCaps transferred to MarketPool
 * 3. Updates SEED_DATA.json with new market and pool IDs
 * 
 * Usage:
 *   bun run scripts/create-market-v2.ts [local|testnet] <admin-cap-id> <treasury-cap-yes-id> <treasury-cap-no-id> [event-id] [question]
 * 
 * Example:
 *   bun run scripts/create-market-v2.ts testnet 0x123... 0x456... 0x789... 0xABC... "Will this test market resolve correctly?"
 */

import { $ } from "bun";
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
const treasuryCapYesId = process.argv[4];
const treasuryCapNoId = process.argv[5];
const eventId = process.argv[6] || "0x" + "0".repeat(64);
const question = process.argv[7] || "Will this test market resolve correctly?";

if (!adminCapId || !treasuryCapYesId || !treasuryCapNoId) {
  console.error("❌ Admin Cap ID, TreasuryCap<YES_COIN> ID, and TreasuryCap<NO_COIN> ID are required");
  console.error("\nUsage:");
  console.error("  bun run scripts/create-market-v2.ts [local|testnet] <admin-cap-id> <treasury-cap-yes-id> <treasury-cap-no-id> [event-id] [question]");
  process.exit(1);
}

// Get package ID
const packageIdFile = join(import.meta.dir, "..", "move", "open_corner", "PACKAGE_ID.txt");
if (!existsSync(packageIdFile)) {
  console.error("❌ Package ID file not found. Please deploy the package first.");
  process.exit(1);
}
const packageId = (await Bun.file(packageIdFile).text()).trim();

console.log(`🚀 Creating new market (v2 design) on ${network} network...\n`);
console.log(`📦 Package ID: ${packageId}`);
console.log(`🔑 Admin Cap ID: ${adminCapId}`);
console.log(`💰 TreasuryCap<YES_COIN> ID: ${treasuryCapYesId}`);
console.log(`💰 TreasuryCap<NO_COIN> ID: ${treasuryCapNoId}`);
console.log(`📅 Event ID: ${eventId}`);
console.log(`❓ Question: ${question}\n`);

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

// Create market
try {
  const signer = await getSigner();
  const tx = new Transaction();
  
  // Convert question to vector<u8>
  const questionBytes = Array.from(Buffer.from(question, "utf-8"));
  
  // Get vault address (use active address as placeholder)
  const activeAddress = await signer.toSuiAddress();
  
  // Call create_market with TreasuryCaps
  // Note: create_market is a public fun, not an entry fun, so we can call it directly
  tx.moveCall({
    target: `${packageId}::markets::create_market`,
    arguments: [
      tx.object(adminCapId), // &ProtocolAdminCap
      tx.pure.id(eventId), // ID
      tx.pure.vector("u8", questionBytes), // vector<u8>
      tx.pure.u64(500), // u64 (5% fee in bps)
      tx.pure.address(activeAddress), // address (vault address)
      tx.object(treasuryCapYesId), // TreasuryCap<YES_COIN> (transferred to MarketPool)
      tx.object(treasuryCapNoId), // TreasuryCap<NO_COIN> (transferred to MarketPool)
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
  
  // Extract Market ID and Pool ID from objectChanges
  let marketId: string | null = null;
  let poolId: string | null = null;
  
  if (result.objectChanges) {
    for (const change of result.objectChanges) {
      if (change.type === "created") {
        const objectType = change.objectType || "";
        if (objectType.includes("markets::Market")) {
          marketId = change.objectId;
          console.log(`📊 Market ID: ${marketId}`);
        } else if (objectType.includes("market_pool::MarketPool")) {
          poolId = change.objectId;
          console.log(`🏊 Pool ID: ${poolId}`);
        }
      }
    }
  }
  
  if (!marketId || !poolId) {
    console.warn("⚠️  Could not extract Market ID or Pool ID from transaction");
    console.log("   Please check the transaction output manually:");
    console.log(`   Transaction: ${result.digest}`);
  } else {
    // Update SEED_DATA.json
    const seedDataFile = join(import.meta.dir, "..", "app", "public", "SEED_DATA.json");
    if (existsSync(seedDataFile)) {
      const seedData = JSON.parse(await Bun.file(seedDataFile).text());
      seedData.marketId = marketId;
      seedData.poolId = poolId;
      seedData.timestamp = new Date().toISOString();
      await Bun.write(seedDataFile, JSON.stringify(seedData, null, 2));
      console.log(`\n💾 Updated ${seedDataFile}`);
    }
    
    // Also update root SEED_DATA.json
    const rootSeedDataFile = join(import.meta.dir, "..", "SEED_DATA.json");
    if (existsSync(rootSeedDataFile)) {
      const seedData = JSON.parse(await Bun.file(rootSeedDataFile).text());
      seedData.marketId = marketId;
      seedData.poolId = poolId;
      seedData.timestamp = new Date().toISOString();
      await Bun.write(rootSeedDataFile, JSON.stringify(seedData, null, 2));
      console.log(`💾 Updated ${rootSeedDataFile}`);
    }
    
    console.log("\n🎉 Market created successfully!");
    console.log(`\n📋 Summary:`);
    console.log(`   Market ID: ${marketId}`);
    console.log(`   Pool ID: ${poolId}`);
    console.log(`   TreasuryCaps are now stored in MarketPool`);
    console.log(`   Anyone can now call split_usdo_for_market without owning TreasuryCaps`);
  }
  
} catch (error: any) {
  console.error("❌ Failed to create market:", error.message);
  if (error.stack) {
    console.error(error.stack);
  }
  process.exit(1);
}

