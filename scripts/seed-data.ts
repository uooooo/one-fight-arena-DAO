#!/usr/bin/env bun

/**
 * Seed initial data for ONE Fight Arena DAO demo
 * 
 * This script creates:
 * - A demo fighter profile
 * - A support vault for the fighter
 * - A demo prediction market
 * 
 * Usage:
 *   bun run scripts/seed-data.ts [local|testnet] [package-id] [admin-cap-id]
 * 
 * Example:
 *   bun run scripts/seed-data.ts local 0x123... 0x456...
 */

import { $ } from "bun";
import { existsSync } from "fs";
import { join } from "path";

const network = process.argv[2] || "local";
const packageId = process.argv[3];
const adminCapId = process.argv[4];

if (!packageId) {
  console.error("❌ Package ID is required");
  console.error("Usage: bun run scripts/seed-data.ts [local|testnet] <package-id> [admin-cap-id]");
  process.exit(1);
}

console.log(`🌱 Seeding initial data on ${network} network...\n`);

// Step 1: Switch to target network
console.log(`🌐 Switching to ${network} network...`);
try {
  if (network === "local") {
    await $`sui client switch --env local`.quiet();
  } else if (network === "testnet") {
    await $`sui client switch --env testnet`.quiet();
  } else {
    console.error(`Unknown network: ${network}. Use 'local' or 'testnet'`);
    process.exit(1);
  }
  console.log(`✅ Switched to ${network}\n`);
} catch (error) {
  console.error(`❌ Failed to switch network:`, error);
  process.exit(1);
}

// Step 2: Get active address
console.log("👤 Getting active address...");
let activeAddress: string;
try {
  activeAddress = (await $`sui client active-address`.text()).trim();
  console.log(`✅ Active address: ${activeAddress}\n`);
} catch (error) {
  console.error("❌ Failed to get active address:", error);
  process.exit(1);
}

// Step 3: Create fighter profile
console.log("👊 Creating fighter profile...");
let fighterId: string;
try {
  const nameHash = Buffer.from("Rodtang Jitmuangnon").toString("hex");
  const socialsHash = Buffer.from("https://instagram.com/rodtang_jitmuangnon").toString("hex");
  
  const result = await $`sui client call --package ${packageId} --module fighters --function create_fighter --args ${nameHash} ${socialsHash} --gas-budget 10000000`.text();
  
  // Extract fighter ID from events
  const fighterIdMatch = result.match(/FighterCreated.*?fighter_id:\s*(0x[a-fA-F0-9]+)/s);
  if (fighterIdMatch) {
    fighterId = fighterIdMatch[1];
    console.log(`✅ Fighter created: ${fighterId}\n`);
  } else {
    // Try alternative pattern
    const objectMatch = result.match(/Created Objects:.*?(0x[a-fA-F0-9]+)/s);
    if (objectMatch) {
      fighterId = objectMatch[1];
      console.log(`✅ Fighter created: ${fighterId}\n`);
    } else {
      console.warn("⚠️  Could not extract fighter ID, but transaction may have succeeded");
      console.log("Please check the transaction output manually");
      fighterId = "UNKNOWN";
    }
  }
} catch (error) {
  console.error("❌ Failed to create fighter:", error);
  process.exit(1);
}

// Step 4: Create support vault
console.log("💰 Creating support vault...");
let vaultId: string;
try {
  const result = await $`sui client call --package ${packageId} --module support --function create_vault --args ${fighterId} --gas-budget 10000000`.text();
  
  const vaultIdMatch = result.match(/Created Objects:.*?(0x[a-fA-F0-9]+)/s);
  if (vaultIdMatch) {
    vaultId = vaultIdMatch[1];
    console.log(`✅ Vault created: ${vaultId}\n`);
  } else {
    console.warn("⚠️  Could not extract vault ID, but transaction may have succeeded");
    vaultId = "UNKNOWN";
  }
} catch (error) {
  console.error("❌ Failed to create vault:", error);
  process.exit(1);
}

// Step 5: Create market (requires admin cap)
if (adminCapId) {
  console.log("📊 Creating prediction market...");
  let marketId: string;
  try {
    const eventId = "0x" + "0".repeat(64); // Placeholder event ID
    const question = Buffer.from("Will Rodtang win by KO in round 1?").toString("hex");
    const feeBps = "500"; // 5%
    const vaultAddress = activeAddress; // Use active address as vault address placeholder
    
    const result = await $`sui client call --package ${packageId} --module markets --function create_market --args ${adminCapId} ${eventId} ${question} ${feeBps} ${vaultAddress} --gas-budget 10000000`.text();
    
    const marketIdMatch = result.match(/Created Objects:.*?(0x[a-fA-F0-9]+)/s);
    if (marketIdMatch) {
      marketId = marketIdMatch[1];
      console.log(`✅ Market created: ${marketId}\n`);
    } else {
      console.warn("⚠️  Could not extract market ID, but transaction may have succeeded");
      marketId = "UNKNOWN";
    }
  } catch (error) {
    console.error("❌ Failed to create market:", error);
    console.error("Note: Market creation requires admin capability");
  }
} else {
  console.log("⏭️  Skipping market creation (admin cap ID not provided)\n");
}

// Step 6: Save seed data to file
const seedDataFile = join(import.meta.dir, "..", "SEED_DATA.json");
const seedData = {
  network,
  packageId,
  adminCapId: adminCapId || null,
  fighterId: fighterId || null,
  vaultId: vaultId || null,
  timestamp: new Date().toISOString(),
};

await Bun.write(seedDataFile, JSON.stringify(seedData, null, 2));
console.log(`💾 Seed data saved to ${seedDataFile}`);

console.log("\n🎉 Seeding complete!");
console.log("\n📋 Summary:");
console.log(`   Package ID: ${packageId}`);
if (fighterId && fighterId !== "UNKNOWN") {
  console.log(`   Fighter ID: ${fighterId}`);
}
if (vaultId && vaultId !== "UNKNOWN") {
  console.log(`   Vault ID: ${vaultId}`);
}
if (adminCapId) {
  console.log(`   Admin Cap ID: ${adminCapId}`);
}

