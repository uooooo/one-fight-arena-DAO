#!/usr/bin/env bun

/**
 * Deploy Move package to Sui network (local or testnet)
 * 
 * Usage:
 *   bun run scripts/deploy-package.ts [local|testnet]
 * 
 * Default: local
 */

import { $ } from "bun";
import { existsSync } from "fs";
import { join } from "path";

const network = process.argv[2] || "local";
const packageDir = join(import.meta.dir, "..", "move", "open_corner");

if (!existsSync(packageDir)) {
  console.error(`Package directory not found: ${packageDir}`);
  process.exit(1);
}

console.log(`🚀 Deploying Move package to ${network} network...\n`);

// Step 1: Build the package
console.log("📦 Building Move package...");
try {
  await $`cd ${packageDir} && sui move build`.quiet();
  console.log("✅ Build successful\n");
} catch (error) {
  console.error("❌ Build failed:", error);
  process.exit(1);
}

// Step 2: Run tests
console.log("🧪 Running Move tests...");
try {
  await $`cd ${packageDir} && sui move test`.quiet();
  console.log("✅ Tests passed\n");
} catch (error) {
  console.error("❌ Tests failed:", error);
  process.exit(1);
}

// Step 3: Switch to target network
console.log(`🌐 Switching to ${network} network...`);
try {
  if (network === "local") {
    // Check if local environment exists, create if not
    const envs = await $`sui client envs`.text();
    if (!envs.includes("local")) {
      console.log("Creating local environment...");
      await $`sui client new-env --alias local --rpc http://127.0.0.1:9000`.quiet();
    }
    await $`sui client switch --env local`.quiet();
  } else if (network === "testnet") {
    const envs = await $`sui client envs`.text();
    if (!envs.includes("testnet")) {
      console.log("Creating testnet environment...");
      await $`sui client new-env --alias testnet --rpc https://fullnode.testnet.sui.io:443`.quiet();
    }
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

// Step 4: Check gas balance
console.log("💰 Checking gas balance...");
try {
  const gasOutput = await $`sui client gas`.text();
  console.log(gasOutput);
  
  if (network === "local" || network === "testnet") {
    // Check if we have gas, request from faucet if needed
    if (gasOutput.includes("No gas coins")) {
      console.log("Requesting SUI from faucet...");
      await $`sui client faucet`.quiet();
      // Wait a bit for faucet to process
      await new Promise(resolve => setTimeout(resolve, 2000));
      const newGasOutput = await $`sui client gas`.text();
      console.log(newGasOutput);
    }
  }
  console.log();
} catch (error) {
  console.error("❌ Failed to check gas:", error);
  process.exit(1);
}

// Step 5: Publish package
console.log("📤 Publishing package...");
try {
  const publishOutput = await $`cd ${packageDir} && sui client publish --gas-budget 100000000 .`.text();
  console.log(publishOutput);
  
  // Extract package ID from output
  const packageIdMatch = publishOutput.match(/PackageID:\s*(0x[a-fA-F0-9]+)/);
  if (packageIdMatch) {
    const packageId = packageIdMatch[1];
    console.log(`\n✅ Package published successfully!`);
    console.log(`📦 Package ID: ${packageId}\n`);
    
    // Save package ID to file
    const packageIdFile = join(packageDir, "PACKAGE_ID.txt");
    await Bun.write(packageIdFile, `${packageId}\n`);
    console.log(`💾 Package ID saved to ${packageIdFile}`);
    
    // Update .env.example if it exists
    const envExamplePath = join(import.meta.dir, "..", "app", ".env.example");
    if (existsSync(envExamplePath)) {
      let envContent = await Bun.file(envExamplePath).text();
      if (envContent.includes("NEXT_PUBLIC_SUI_PACKAGE_ID=")) {
        envContent = envContent.replace(
          /NEXT_PUBLIC_SUI_PACKAGE_ID=.*/,
          `NEXT_PUBLIC_SUI_PACKAGE_ID=${packageId}`
        );
      } else {
        envContent += `\nNEXT_PUBLIC_SUI_PACKAGE_ID=${packageId}\n`;
      }
      await Bun.write(envExamplePath, envContent);
      console.log(`💾 Updated .env.example with package ID`);
    }
    
    // Update README.md
    const readmePath = join(packageDir, "README.md");
    if (existsSync(readmePath)) {
      let readmeContent = await Bun.file(readmePath).text();
      readmeContent = readmeContent.replace(
        /## Package ID\s*\n\s*\(To be updated after Testnet deployment\)/,
        `## Package ID\n\n\`${packageId}\` (${network})`
      );
      await Bun.write(readmePath, readmeContent);
      console.log(`💾 Updated README.md with package ID`);
    }
  } else {
    console.warn("⚠️  Could not extract package ID from output");
  }
} catch (error) {
  console.error("❌ Failed to publish package:", error);
  process.exit(1);
}

console.log("\n🎉 Deployment complete!");

