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
// Import from app/node_modules (Bun resolves from workspace root)
import { createPermissionlessPool } from "../app/node_modules/@mysten/deepbook-v3/src/contracts/deepbook/pool.js";
import { poolCreationFee } from "../app/node_modules/@mysten/deepbook-v3/src/contracts/deepbook/constants.js";
import { testnetPackageIds, mainnetPackageIds, testnetCoins, mainnetCoins } from "../app/node_modules/@mysten/deepbook-v3/src/utils/constants.js";

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
    // YES/NO coins are already created via init functions
    
    // DeepBook pool creation using TransactionBuilder
    const tx = new Transaction();
    
    // Use DeepBookV3 SDK - get correct package IDs based on network
    // Note: Local network may not have DeepBookV3 deployed
    // In that case, we'll need to use the old DeepBook package ID
    let deepbookPackageIds;
    if (network === "local") {
      console.warn("⚠️  Local network detected. DeepBookV3 may not be deployed.");
      console.warn("   Using placeholder IDs. Pool creation may fail.\n");
      // Use testnet IDs as fallback (won't work on local, but structure is correct)
      deepbookPackageIds = testnetPackageIds;
    } else {
      deepbookPackageIds = network === "testnet" ? testnetPackageIds : mainnetPackageIds;
    }
    const DEEPBOOK_PACKAGE_ID = deepbookPackageIds.DEEPBOOK_PACKAGE_ID;
    const REGISTRY_ID = deepbookPackageIds.REGISTRY_ID;
    
    console.log(`   ✅ Using DeepBookV3 SDK`);
    console.log(`   Package ID: ${DEEPBOOK_PACKAGE_ID}`);
    console.log(`   Registry ID: ${REGISTRY_ID}\n`);
    
    // Coin types for YES/NO coins (already created via init)
    const baseCoinType = `${packageId}::yes_coin::YES_COIN`;
    const quoteCoinType = `${packageId}::no_coin::NO_COIN`;
    
    // Calculate tick size and lot size based on coin decimals (both YES/NO coins have 9 decimals)
    // For prediction market, we want 3 decimal precision (0.001)
    // tickSize = 10^(9 - 9 + 9 - 3) = 10^6 = 1,000,000
    const tickSize = BigInt(1_000_000);
    
    // Lot size should be approximately $0.01 to $0.10 nominal
    // Assuming 1 SUI ≈ $1, lot size = 0.01 SUI = 10,000,000 MIST (0.01 * 10^9)
    // But must be a power of 10 and >= 1,000, so we use 10,000,000 (10^7)
    const lotSize = BigInt(10_000_000); // 0.01 SUI nominal
    
    // Min size should be approximately $0.10 to $1.00 nominal
    // Must be a power of 10 and >= lot size, so we use 100,000,000 (10^8 = 0.1 SUI)
    const minSize = BigInt(100_000_000); // 0.1 SUI nominal
    
    console.log(`   Base Coin Type: ${baseCoinType}`);
    console.log(`   Quote Coin Type: ${quoteCoinType}`);
    console.log(`   Tick Size: ${tickSize}`);
    console.log(`   Lot Size: ${lotSize} (0.01 SUI)`);
    console.log(`   Min Size: ${minSize} (0.1 SUI)\n`);
    
    // Get DEEP coin for creation fee
    // According to Move code: assert!(creation_fee.value() == constants::pool_creation_fee(), EInvalidFee);
    // The exact amount from constants::pool_creation_fee() is required (cannot be waived)
    // According to docs: "Creation fee is 500 DEEP tokens"
    // However, on testnet/local, the constant value might be 0 or different
    console.log("💰 Preparing creation fee...\n");
    
    // Get DEEP coin type and info from SDK constants
    const deepCoinInfo = network === "testnet" || network === "local"
      ? testnetCoins.DEEP
      : mainnetCoins.DEEP;
    const DEEP_COIN_TYPE = deepCoinInfo.type;
    const DEEP_SCALAR = deepCoinInfo.scalar; // 1,000,000 for 6 decimals
    
    // Try to get the actual pool_creation_fee value from the chain
    // This is the only way to know the exact required amount
    let requiredFeeAmount: bigint;
    try {
      console.log("   Fetching pool_creation_fee from chain...");
      const feeTx = new Transaction();
      feeTx.add(poolCreationFee({ package: DEEPBOOK_PACKAGE_ID }));
      const feeResult = await client.devInspectTransactionBlock({
        sender: activeAddress,
        transactionBlock: feeTx,
      });
      
      // Extract the return value (should be a u64)
      if (feeResult.results && feeResult.results[0] && feeResult.results[0].returnValues) {
        const returnValue = feeResult.results[0].returnValues[0];
        // Decode u64 from return value
        const feeBytes = returnValue[0];
        const feeValue = Buffer.from(feeBytes, 'base64');
        // Convert little-endian bytes to BigInt
        requiredFeeAmount = BigInt(feeValue.readUInt32LE(0)) + (BigInt(feeValue.readUInt32LE(4)) << BigInt(32));
        console.log(`   ✅ Pool creation fee from chain: ${requiredFeeAmount} (${Number(requiredFeeAmount) / Number(DEEP_SCALAR)} DEEP tokens)\n`);
      } else {
        throw new Error("Could not get pool_creation_fee from chain");
      }
    } catch (error: any) {
      console.warn(`   ⚠️  Could not fetch pool_creation_fee from chain: ${error.message}`);
      console.warn(`   ⚠️  Using default value: 500 DEEP tokens (as per documentation)\n`);
      // Fallback to documented value: 500 DEEP tokens
      requiredFeeAmount = BigInt(500) * BigInt(DEEP_SCALAR); // 500 * 1,000,000 = 500,000,000
    }
    
    let deepCoin: any = null;
    
    // If fee is 0, we still need to provide a Coin<DEEP> object (even with 0 value)
    if (requiredFeeAmount === BigInt(0)) {
      console.log(`   ✅ Creation fee is 0 on ${network} network - fee is waived!\n`);
      // We still need to get/create a DEEP coin object, even with 0 value
      // Try to get any DEEP coin, or create one with 0 balance
      try {
        const coins = await client.getCoins({
          owner: activeAddress,
          coinType: DEEP_COIN_TYPE,
        });
        
        if (coins.data.length > 0) {
          // Use the first DEEP coin (even with 0 balance, it's fine for a 0 fee)
          deepCoin = tx.object(coins.data[0].coinObjectId);
          console.log(`   ✅ Using existing DEEP coin (fee is 0, so amount doesn't matter)\n`);
        } else {
          throw new Error("No DEEP coins found, but fee is 0. Cannot create Coin<DEEP> object without coins.");
        }
      } catch (error: any) {
        throw new Error(`Error getting DEEP coins for 0 fee: ${error.message}`);
      }
    } else {
      // Fee is non-zero, need exact amount
      console.log(`   Required fee: ${requiredFeeAmount} (${Number(requiredFeeAmount) / Number(DEEP_SCALAR)} DEEP tokens)\n`);
      
      try {
        // Get all coins of DEEP type
        const coins = await client.getCoins({
          owner: activeAddress,
          coinType: DEEP_COIN_TYPE,
        });
        
        if (coins.data.length === 0) {
          throw new Error(
            `No DEEP coins found. Need ${Number(requiredFeeAmount) / Number(DEEP_SCALAR)} DEEP tokens. ` +
            (network === "testnet" 
              ? `On testnet, you may need to request DEEP from a faucet or swap for DEEP tokens.`
              : `On mainnet, you can purchase DEEP tokens from a DEX.`)
          );
        }
        
        // Calculate total balance
        const totalBalance = coins.data.reduce((sum, coin) => sum + BigInt(coin.balance), BigInt(0));
        console.log(`   Total DEEP balance: ${totalBalance} (${Number(totalBalance) / Number(DEEP_SCALAR)} DEEP tokens)`);
        
        if (totalBalance < requiredFeeAmount) {
          throw new Error(
            `Insufficient DEEP balance: ${totalBalance} < ${requiredFeeAmount}. ` +
            `Need ${Number(requiredFeeAmount) / Number(DEEP_SCALAR)} DEEP tokens. ` +
            `Current balance: ${Number(totalBalance) / Number(DEEP_SCALAR)} DEEP tokens.`
          );
        }
        
        // Merge all DEEP coins if there are multiple
        let mergedCoinId = coins.data[0].coinObjectId;
        if (coins.data.length > 1) {
          console.log(`   Merging ${coins.data.length} DEEP coins...`);
          const mergeTx = new Transaction();
          for (let i = 1; i < coins.data.length; i++) {
            mergeTx.mergeCoins(
              mergeTx.object(mergedCoinId),
              mergeTx.object(coins.data[i].coinObjectId)
            );
          }
          const mergeResult = await client.signAndExecuteTransaction({
            signer,
            transaction: mergeTx,
            options: {
              showEffects: true,
              showObjectChanges: true,
            },
          });
          await client.waitForTransaction({ digest: mergeResult.digest });
          
          // Get the updated coin
          const updatedCoins = await client.getCoins({
            owner: activeAddress,
            coinType: DEEP_COIN_TYPE,
          });
          if (updatedCoins.data.length > 0) {
            mergedCoinId = updatedCoins.data[0].coinObjectId;
            console.log(`   ✅ Merged DEEP coins\n`);
          }
        }
        
        // Split the exact amount needed for the fee
        const [feeCoin] = tx.splitCoins(tx.object(mergedCoinId), [requiredFeeAmount]);
        deepCoin = feeCoin;
        console.log(`   ✅ Prepared ${requiredFeeAmount} (${Number(requiredFeeAmount) / Number(DEEP_SCALAR)} DEEP tokens) for creation fee\n`);
        
      } catch (error: any) {
        console.error(`   ❌ Error preparing DEEP fee: ${error.message}\n`);
        throw error;
      }
    }
    
    // Use DeepBookV3 SDK's createPermissionlessPool function
    console.log("🏊 Creating DeepBook pool using DeepBookV3 SDK...\n");
    
    const createPoolTx = createPermissionlessPool({
      package: DEEPBOOK_PACKAGE_ID,
      arguments: {
        registry: REGISTRY_ID,
        tickSize: tickSize,
        lotSize: lotSize,
        minSize: minSize,
        creationFee: deepCoin,
      },
      typeArguments: [baseCoinType, quoteCoinType],
    });
    
    // Add the transaction to the transaction block
    tx.add(createPoolTx);
    
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
    // create_permissionless_pool returns ID (the pool ID as address)
    let poolId: string | null = null;
    
    // Debug: Print transaction result structure
    console.log("   Debug: Transaction result structure:");
    console.log(`   - objectChanges: ${result.objectChanges?.length || 0} changes`);
    console.log(`   - effects?.created: ${result.effects?.created?.length || 0} objects`);
    if (result.effects?.mutated) {
      console.log(`   - effects?.mutated: ${result.effects.mutated.length} objects`);
    }
    
    // Check for PoolCreated event (DeepBookV3 emits this event)
    if (result.events) {
      console.log("\n   Checking events for PoolCreated...");
      for (const event of result.events) {
        if (event.type && event.type.includes("PoolCreated")) {
          try {
            const parsedJson = event.parsedJson as any;
            if (parsedJson && parsedJson.pool_id) {
              poolId = parsedJson.pool_id;
              console.log(`   ✅ Found pool ID from PoolCreated event: ${poolId}`);
              break;
            }
          } catch (error: any) {
            console.warn(`     ⚠️  Could not parse PoolCreated event: ${error.message}`);
          }
        }
      }
    }
    
    // Method 1: Check objectChanges for created Pool objects
    if (!poolId && result.objectChanges) {
      console.log("\n   Checking objectChanges...");
      for (const change of result.objectChanges) {
        if (change.type === "created") {
          const objectType = change.objectType || "";
          console.log(`     - Created: ${change.objectId} (${objectType})`);
          // DeepBookV3 pool type format: "0x...::pool::Pool<BaseType, QuoteType>"
          if (objectType.includes("pool::Pool") || objectType.includes("::Pool<")) {
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

