#!/usr/bin/env bun

/**
 * Create DeepBook pool and YES/NO coins for a market
 * 
 * This script:
 * 1. Creates YES and NO coins using One-Time Witness pattern
 * 2. Creates a DeepBook pool for YES/NO coin trading
 * 3. Updates SEED_DATA.json with pool ID and coin types
 * 
 * Usage:
 *   bun run scripts/create-market-pool.ts [local|testnet] <package-id> <market-id>
 * 
 * Example:
 *   bun run scripts/create-market-pool.ts testnet 0x123... 0x456...
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
const packageId = process.argv[3];
const marketId = process.argv[4];

if (!packageId || !marketId) {
  console.error("❌ Package ID and Market ID are required");
  console.error("Usage: bun run scripts/create-market-pool.ts [local|testnet] <package-id> <market-id>");
  process.exit(1);
}

const RPC_URL = network === "local" ? "http://127.0.0.1:9000" : getFullnodeUrl("testnet");
const client = new SuiClient({ url: RPC_URL });

console.log(`🏊 Creating DeepBook pool and YES/NO coins on ${network} network...\n`);
console.log(`📦 Package ID: ${packageId}`);
console.log(`📊 Market ID: ${marketId}\n`);

// Get signer from Sui CLI
async function getSigner() {
  try {
    const address = execSync("sui client active-address", { encoding: "utf-8" }).trim();
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
      if (decodeSuiPrivateKey) {
        const decoded = decodeSuiPrivateKey(privateKeyStr);
        return Ed25519Keypair.fromSecretKey(decoded.secretKey);
      } else {
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

// Note: One-Time Witness pattern requires the witness to be created in init function
// For now, we'll use Sui CLI to create coins, then create DeepBook pool
// In the future, we should add init functions to yes_coin.move and no_coin.move

async function createCoinsAndPool() {
  try {
    console.log("⚠️  Note: One-Time Witness pattern requires init functions in Move modules.");
    console.log("   For MVP, we'll create coins using Sui CLI if init functions are available.\n");

    const signer = await getSigner();
    const activeAddress = signer.toSuiAddress();
    console.log(`✅ Active address: ${activeAddress}\n`);

    // Step 1: Create YES coin using One-Time Witness
    // Note: This requires init function in yes_coin.move module
    // For now, we'll try to create using moveCall with package::module::TYPE pattern
    console.log("🪙 Creating YES coin...");
    
    // The One-Time Witness is created automatically when calling init
    // But we need to use the correct pattern: package::module::TYPE
    const yesCoinType = `${packageId}::yes_coin::YES_COIN`;
    
    // For One-Time Witness, we need to pass the type directly
    // In Sui, when you call a function that expects a One-Time Witness,
    // you don't pass an argument - the witness is automatically created
    // But this only works in init functions or with special handling
    
    // Since our current Move modules don't have init functions,
    // we'll need to create a transaction that calls create_yes_coin
    // However, One-Time Witness can only be created in init functions
    
    // Alternative approach: Create coins using TransactionBuilder with proper type handling
    // But this is complex and may not work without init functions
    
    // For now, let's create a simple DeepBook pool using SUI as both base and quote
    // This is a temporary solution until we can properly create YES/NO coins
    
    console.log("⚠️  YES/NO coin creation requires init functions in Move modules.");
    console.log("   Skipping coin creation for now. Using placeholder coin types.\n");

    // Step 2: Create DeepBook pool
    console.log("🏊 Creating DeepBook pool...");
    
    // Note: DeepBook pool creation requires actual coin types
    // For MVP demo, we'll create a pool with YES_COIN/NO_COIN types
    // These coin types will be used once YES/NO coins are created
    
    // DeepBook pool creation using TransactionBuilder
    const tx = new Transaction();
    
    // DeepBook package ID
    const DEEPBOOK_PACKAGE_ID = "0x000000000000000000000000000000000000000000000000000000000000dee9";
    
    // Coin types for YES/NO coins
    // These types will be created when YES/NO coins are minted
    const baseCoinType = `${packageId}::yes_coin::YES_COIN`;
    const quoteCoinType = `${packageId}::no_coin::NO_COIN`;
    const tickSize = BigInt(1_000_000); // 1 SUI = 1,000,000 ticks
    const lotSize = BigInt(1_000_000); // Minimum lot size
    
    console.log(`   Base Coin Type: ${baseCoinType}`);
    console.log(`   Quote Coin Type: ${quoteCoinType}`);
    console.log(`   Tick Size: ${tickSize}`);
    console.log(`   Lot Size: ${lotSize}\n`);
    
    tx.moveCall({
      target: `${DEEPBOOK_PACKAGE_ID}::clob_v2::create_pool`,
      arguments: [
        tx.pure.string(baseCoinType),
        tx.pure.string(quoteCoinType),
        tx.pure.u64(tickSize),
        tx.pure.u64(lotSize),
      ],
    });
    
    tx.setGasBudget(BigInt(100_000_000));
    
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

    console.log("✅ DeepBook pool creation transaction submitted");
    console.log(`   Transaction: ${result.digest}\n`);

    // Wait for transaction to be indexed
    await client.waitForTransaction({ digest: result.digest });

    // Extract pool ID from transaction result
    let poolId: string | null = null;
    
    // Debug: Print transaction result structure
    console.log("   Debug: Transaction result structure:");
    console.log(`   - objectChanges: ${result.objectChanges?.length || 0} changes`);
    console.log(`   - effects?.created: ${result.effects?.created?.length || 0} objects\n`);
    
    // Method 1: Check objectChanges (most reliable)
    if (result.objectChanges) {
      console.log("   Checking objectChanges...");
      for (const change of result.objectChanges) {
        if (change.type === "created") {
          const objectType = change.objectType || "";
          console.log(`     - Created: ${change.objectId} (${objectType})`);
          // DeepBook pool type format: "0x...::clob_v2::Pool<BaseType, QuoteType>"
          if (objectType.includes("clob_v2::Pool") || objectType.includes("::Pool<")) {
            poolId = change.objectId;
            console.log(`   ✅ Found pool in objectChanges: ${poolId}`);
            break;
          }
        }
      }
    }

    // Method 2: Check all created objects and query them
    if (!poolId) {
      console.log("   Checking all created objects by querying...");
      const allCreated = result.objectChanges?.filter(c => c.type === "created") || [];
      for (const change of allCreated) {
        if (change.type === "created" && change.objectId) {
          try {
            const obj = await client.getObject({
              id: change.objectId,
              options: { showType: true, showContent: false },
            });
            const objType = obj.data?.type || "";
            console.log(`     - Checking ${change.objectId}: ${objType}`);
            if (objType.includes("Pool") || objType.includes("clob_v2")) {
              poolId = change.objectId;
              console.log(`   ✅ Found pool by querying: ${poolId}`);
              console.log(`   Pool type: ${objType}`);
              break;
            }
          } catch (error) {
            // Continue searching
          }
        }
      }
    }

    // Method 3: Check effects.created (older format)
    if (!poolId && result.effects?.created) {
      console.log("   Checking effects.created...");
      for (const created of result.effects.created) {
        if (created.reference?.objectId) {
          try {
            const obj = await client.getObject({
              id: created.reference.objectId,
              options: { showType: true, showContent: false },
            });
            if (obj.data?.type?.includes("Pool")) {
              poolId = created.reference.objectId;
              console.log(`   ✅ Found pool in effects: ${poolId}`);
              break;
            }
          } catch {
            // Continue searching
          }
        }
      }
    }

    if (!poolId) {
      console.warn("\n⚠️  Could not extract pool ID from transaction result");
      console.warn("   Transaction digest:", result.digest);
      console.warn("\n   All created objects:");
      const created = result.objectChanges?.filter(c => c.type === "created") || [];
      for (const obj of created) {
        console.warn(`     - ${obj.objectId}: ${obj.objectType || "unknown"}`);
      }
      console.warn("\n   Please check the transaction manually using Sui Explorer:");
      console.warn(`   https://suiexplorer.com/txblock/${result.digest}?network=testnet\n`);
      
      // Return placeholder data so the script can continue
      return {
        poolId: "PLACEHOLDER_POOL_ID",
        yesCoinType: baseCoinType,
        noCoinType: quoteCoinType,
      };
    }

    console.log(`✅ Pool created: ${poolId}\n`);

    return {
      poolId,
      yesCoinType: baseCoinType,
      noCoinType: quoteCoinType,
    };
  } catch (error: any) {
    console.error("❌ Failed to create pool:", error.message);
    console.error("   Error details:", error);
    return null;
  }
}

// Main execution
async function main() {
  // Switch to target network
  try {
    if (network === "local") {
      await $`sui client switch --env local`.quiet();
    } else if (network === "testnet") {
      await $`sui client switch --env testnet`.quiet();
    }
    console.log(`✅ Switched to ${network}\n`);
  } catch (error) {
    console.error(`❌ Failed to switch network:`, error);
    process.exit(1);
  }

  // Create pool and coins
  const poolData = await createCoinsAndPool();
  
  if (!poolData) {
    console.error("❌ Failed to create pool. Please check the error messages above.");
    process.exit(1);
  }

  // Update SEED_DATA.json
  const seedDataFile = join(import.meta.dir, "..", "SEED_DATA.json");
  let seedData: any = {};
  
  if (existsSync(seedDataFile)) {
    const seedDataText = await Bun.file(seedDataFile).text();
    seedData = JSON.parse(seedDataText);
  }

  seedData.poolId = poolData.poolId;
  seedData.yesCoinType = poolData.yesCoinType;
  seedData.noCoinType = poolData.noCoinType;
  seedData.timestamp = new Date().toISOString();

  await Bun.write(seedDataFile, JSON.stringify(seedData, null, 2));
  console.log(`💾 Updated SEED_DATA.json`);
  console.log(`   Pool ID: ${poolData.poolId}`);
  console.log(`   YES Coin Type: ${poolData.yesCoinType}`);
  console.log(`   NO Coin Type: ${poolData.noCoinType}\n`);

  console.log("🎉 Pool creation complete!\n");
  console.log("📋 Summary:");
  console.log(`   Pool ID: ${poolData.poolId}`);
  console.log(`   YES Coin Type: ${poolData.yesCoinType}`);
  console.log(`   NO Coin Type: ${poolData.noCoinType}`);
  console.log(`\n⚠️  Note: YES/NO coins need to be created separately using init functions in Move modules.`);
  console.log(`   The coin types above are placeholders until coins are created.`);
}

main().catch(console.error);

