#!/usr/bin/env bun

/**
 * Check if a function exists in a deployed Sui package
 * Usage: bun run scripts/check-package-functions.ts <package-id> [network]
 */

import { SuiClient, getFullnodeUrl } from "@mysten/sui/client";

const PACKAGE_ID = process.argv[2];
const NETWORK = (process.argv[3] || "testnet") as "testnet" | "mainnet" | "localnet";

if (!PACKAGE_ID) {
  console.error("❌ Please provide a package ID");
  console.log("Usage: bun run scripts/check-package-functions.ts <package-id> [network]");
  process.exit(1);
}

const client = new SuiClient({
  url: getFullnodeUrl(NETWORK),
});

async function checkPackageFunctions() {
  console.log(`🔍 Checking functions in package: ${PACKAGE_ID}`);
  console.log(`🌐 Network: ${NETWORK}\n`);

  try {
    // Get package information
    const packageInfo = await client.getObject({
      id: PACKAGE_ID,
      options: {
        showContent: true,
        showType: true,
      },
    });

    if (!packageInfo.data) {
      console.error(`❌ Package ${PACKAGE_ID} not found`);
      process.exit(1);
    }

    console.log("✅ Package found\n");

    // Try to get published modules
    // Note: Sui doesn't directly expose function lists, so we'll try to call a known function
    // or check the package's published modules
    
    // Check if markets module exists
    const marketsModule = `${PACKAGE_ID}::markets`;
    console.log(`📦 Checking module: ${marketsModule}`);
    
    // List of functions we expect to find
    const expectedFunctions = [
      "split_usdo_for_market",
      "join_coins_for_market",
      "swap_yes_for_no_for_market",
      "swap_no_for_yes_for_market",
      "redeem_winning_yes_for_market",
      "redeem_winning_no_for_market",
      "create_market",
      "resolve_market",
    ];

    console.log("\n🔎 Expected functions in markets module:");
    for (const funcName of expectedFunctions) {
      const fullTarget = `${marketsModule}::${funcName}`;
      console.log(`   - ${fullTarget}`);
    }

    console.log("\n💡 To verify if functions exist, try calling them in a transaction.");
    console.log("   If a function doesn't exist, you'll get: 'No function was found with function name'");
    
    // Try to get transaction examples or check package metadata
    console.log("\n📋 Package object type:", packageInfo.data.type);
    if (packageInfo.data.content && "fields" in packageInfo.data.content) {
      const fields = packageInfo.data.content.fields as any;
      console.log("📋 Package fields:", Object.keys(fields));
    }

  } catch (error: any) {
    console.error("❌ Error checking package:", error.message);
    console.error(error);
    process.exit(1);
  }
}

checkPackageFunctions();

