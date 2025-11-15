#!/usr/bin/env bun

/**
 * Script to create a MarketPool for an existing Market
 * 
 * This is useful when a Market was created before CPMM integration
 * and doesn't have a pool_id set.
 * 
 * Usage:
 *   bun scripts/create-pool-for-market.ts <market-id>
 * 
 * Example:
 *   bun scripts/create-pool-for-market.ts 0x876c6432bb74ec286e815a864f69b57065eb0bf28a3878f1ba66a0efda90f048
 */

import { SuiClient, getFullnodeUrl } from "@mysten/sui/client";
import { Transaction } from "@mysten/sui/transactions";
import { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519";
import { fromB64 } from "@mysten/sui/utils";
import * as dotenv from "dotenv";

// Load environment variables
dotenv.config();

const MARKET_ID = process.argv[2];
const NETWORK = process.env.NEXT_PUBLIC_SUI_NETWORK || "testnet";
const PACKAGE_ID = process.env.NEXT_PUBLIC_SUI_PACKAGE_ID || "0x0";
const PRIVATE_KEY = process.env.SUI_PRIVATE_KEY;

if (!MARKET_ID) {
  console.error("❌ Error: Market ID is required");
  console.log("\nUsage: bun scripts/create-pool-for-market.ts <market-id>");
  console.log("\nExample:");
  console.log("  bun scripts/create-pool-for-market.ts 0x876c6432bb74ec286e815a864f69b57065eb0bf28a3878f1ba66a0efda90f048");
  process.exit(1);
}

if (!PACKAGE_ID || PACKAGE_ID === "0x0") {
  console.error("❌ Error: PACKAGE_ID is not set");
  console.log("Please set NEXT_PUBLIC_SUI_PACKAGE_ID in .env.local");
  process.exit(1);
}

if (!PRIVATE_KEY) {
  console.error("❌ Error: SUI_PRIVATE_KEY is not set");
  console.log("Please set SUI_PRIVATE_KEY in .env.local");
  process.exit(1);
}

// Initialize Sui client
const client = new SuiClient({ url: getFullnodeUrl(NETWORK) });

// Get signer from private key
function getSigner() {
  try {
    const keypair = Ed25519Keypair.fromSecretKey(fromB64(PRIVATE_KEY));
    return keypair;
  } catch (error) {
    console.error("❌ Failed to parse private key:", error);
    process.exit(1);
  }
}

async function main() {
  console.log("🚀 Creating MarketPool for existing Market...\n");
  console.log(`Market ID: ${MARKET_ID}`);
  console.log(`Network: ${NETWORK}`);
  console.log(`Package ID: ${PACKAGE_ID}\n`);

  const signer = getSigner();
  const address = signer.toSuiAddress();
  console.log(`Signer address: ${address}\n`);

  try {
    // Verify Market exists
    console.log("📋 Verifying Market exists...");
    const market = await client.getObject({
      id: MARKET_ID,
      options: {
        showContent: true,
        showType: true,
      },
    });

    if (!market.data) {
      console.error(`❌ Market ${MARKET_ID} not found`);
      process.exit(1);
    }

    if (market.data.content && "fields" in market.data.content) {
      const fields = market.data.content.fields as any;
      
      // Check if pool_id already exists
      if (fields.pool_id) {
        console.log("⚠️  Market already has a pool_id:");
        const poolId = typeof fields.pool_id === "string" 
          ? fields.pool_id 
          : fields.pool_id?.id || String(fields.pool_id);
        console.log(`   ${poolId}\n`);
        console.log("If you want to create a new pool, please use a different Market or update the Market object.");
        process.exit(0);
      }

      // Extract market_id from Market object
      const marketIdFromFields = fields.id?.id || MARKET_ID;
      console.log(`✅ Market found (market_id: ${marketIdFromFields})`);
    }

    // Create transaction to initialize MarketPool
    console.log("\n📝 Building transaction...");
    const tx = new Transaction();

    // Call market_pool::init_market_pool(market_id, ctx)
    // Note: We use the Market ID as the market_id parameter
    tx.moveCall({
      target: `${PACKAGE_ID}::market_pool::init_market_pool`,
      arguments: [
        tx.pure.id(MARKET_ID), // Use Market ID as market_id
      ],
    });

    // Execute transaction
    console.log("⏳ Executing transaction...\n");
    const result = await client.signAndExecuteTransaction({
      signer,
      transaction: tx,
      options: {
        showEffects: true,
        showEvents: true,
        showObjectChanges: true,
      },
    });

    console.log(`✅ Transaction successful!\n`);
    console.log(`Transaction digest: ${result.digest}\n`);

    // Extract pool ID from transaction result
    let poolId: string | null = null;

    // Method 1: Check objectChanges for created MarketPool
    if (result.objectChanges) {
      for (const change of result.objectChanges) {
        if (change.type === "created" && change.objectType?.includes("MarketPool")) {
          poolId = change.objectId;
          console.log(`✅ Found MarketPool in objectChanges: ${poolId}`);
          break;
        }
      }
    }

    // Method 2: Check events for pool creation (if any)
    if (!poolId && result.events) {
      for (const event of result.events) {
        if (event.type?.includes("MarketPool") || event.type?.includes("pool_id")) {
          console.log("Found pool-related event:", event);
        }
      }
    }

    // Method 3: Check effects.created
    if (!poolId && result.effects?.created) {
      for (const created of result.effects.created) {
        if (created.reference?.objectId) {
          try {
            const obj = await client.getObject({
              id: created.reference.objectId,
              options: { showType: true, showContent: false },
            });
            if (obj.data?.type?.includes("MarketPool")) {
              poolId = created.reference.objectId;
              console.log(`✅ Found MarketPool in effects: ${poolId}`);
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
      console.warn("Please check the transaction manually:");
      console.warn(`https://suiexplorer.com/txblock/${result.digest}?network=${NETWORK}\n`);
      console.warn("All created objects:");
      const created = result.objectChanges?.filter(c => c.type === "created") || [];
      for (const obj of created) {
        console.warn(`  - ${obj.objectId}: ${obj.objectType || "unknown"}`);
      }
    } else {
      console.log(`\n✅ MarketPool created successfully!`);
      console.log(`\nPool ID: ${poolId}`);
      console.log(`\n⚠️  Note: This pool_id is not automatically added to the Market object.`);
      console.log(`   You'll need to manually update SEED_DATA.json or use this pool_id directly in the frontend.`);
      console.log(`\nTo use this pool in the frontend, update app/public/SEED_DATA.json:`);
      console.log(`  "poolId": "${poolId}"`);
    }

    console.log(`\n📊 Transaction details:`);
    console.log(`   Explorer: https://suiexplorer.com/txblock/${result.digest}?network=${NETWORK}`);
  } catch (error: any) {
    console.error("\n❌ Error creating MarketPool:", error.message);
    if (error.data) {
      console.error("Error details:", JSON.stringify(error.data, null, 2));
    }
    process.exit(1);
  }
}

main();

