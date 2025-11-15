#!/usr/bin/env bun

/**
 * Find TreasuryCap IDs for YES_COIN and NO_COIN from a package
 * Usage: bun run scripts/find-treasury-caps.ts <package-id> [network]
 */

import { SuiClient, getFullnodeUrl } from "@mysten/sui/client";

const PACKAGE_ID = process.argv[2];
const NETWORK = (process.argv[3] || "testnet") as "testnet" | "mainnet" | "localnet";

if (!PACKAGE_ID) {
  console.error("❌ Please provide a package ID");
  console.log("Usage: bun run scripts/find-treasury-caps.ts <package-id> [network]");
  process.exit(1);
}

const client = new SuiClient({
  url: getFullnodeUrl(NETWORK),
});

async function findTreasuryCaps() {
  console.log(`🔍 Finding TreasuryCap IDs for package: ${PACKAGE_ID}`);
  console.log(`🌐 Network: ${NETWORK}\n`);

  try {
    // Search for TreasuryCap<YES_COIN> objects
    const yesCoinType = `${PACKAGE_ID}::yes_coin::YES_COIN`;
    const noCoinType = `${PACKAGE_ID}::no_coin::NO_COIN`;
    
    console.log(`📦 YES_COIN type: ${yesCoinType}`);
    console.log(`📦 NO_COIN type: ${noCoinType}\n`);

    // Search for TreasuryCap objects
    const treasuryCapYesType = `0x2::coin::TreasuryCap<${yesCoinType}>`;
    const treasuryCapNoType = `0x2::coin::TreasuryCap<${noCoinType}>`;

    console.log(`🔎 Searching for TreasuryCap<YES_COIN>...`);
    console.log(`   Type: ${treasuryCapYesType}`);
    
    const yesCaps = await client.getOwnedObjects({
      filter: {
        StructType: treasuryCapYesType,
      },
      options: {
        showContent: true,
        showType: true,
      },
    });

    console.log(`   Found ${yesCaps.data.length} TreasuryCap<YES_COIN> objects`);
    if (yesCaps.data.length > 0) {
      for (const cap of yesCaps.data) {
        console.log(`   ✅ TreasuryCap<YES_COIN> ID: ${cap.data?.objectId}`);
      }
    }

    console.log(`\n🔎 Searching for TreasuryCap<NO_COIN>...`);
    console.log(`   Type: ${treasuryCapNoType}`);
    
    const noCaps = await client.getOwnedObjects({
      filter: {
        StructType: treasuryCapNoType,
      },
      options: {
        showContent: true,
        showType: true,
      },
    });

    console.log(`   Found ${noCaps.data.length} TreasuryCap<NO_COIN> objects`);
    if (noCaps.data.length > 0) {
      for (const cap of noCaps.data) {
        console.log(`   ✅ TreasuryCap<NO_COIN> ID: ${cap.data?.objectId}`);
      }
    }

    // Also try to find by querying all objects with the package ID
    console.log(`\n🔎 Alternative: Searching for objects created by package...`);
    try {
      const packageObj = await client.getObject({
        id: PACKAGE_ID,
        options: {
          showContent: true,
          showType: true,
        },
      });

      if (packageObj.data) {
        console.log(`   ✅ Package found`);
        console.log(`   📋 Package type: ${packageObj.data.type}`);
      }
    } catch (error: any) {
      console.log(`   ⚠️  Could not fetch package object: ${error.message}`);
    }

    console.log(`\n💡 Note: TreasuryCap objects are typically owned by the package publisher.`);
    console.log(`   You may need to check the transaction that created the coins.`);

  } catch (error: any) {
    console.error("❌ Error finding TreasuryCaps:", error.message);
    console.error(error);
    process.exit(1);
  }
}

findTreasuryCaps();

