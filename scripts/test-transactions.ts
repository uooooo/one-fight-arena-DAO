#!/usr/bin/env bun

/**
 * Integration test script for Move package transactions
 * Tests actual transaction execution without requiring wallet extension
 */

import { SuiClient, getFullnodeUrl } from "@mysten/sui/client";
import { Transaction } from "@mysten/sui/transactions";
import { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519";
import { fromB64 } from "@mysten/sui/utils";
import { execSync } from "child_process";

// Import decodeSuiPrivateKey if available
let decodeSuiPrivateKey: ((key: string) => { secretKey: Uint8Array }) | null = null;
try {
  const suiUtils = await import("@mysten/sui/cryptography");
  decodeSuiPrivateKey = suiUtils.decodeSuiPrivateKey as any;
} catch {
  // Try alternative import
  try {
    const suiUtils = await import("@mysten/sui/utils");
    decodeSuiPrivateKey = (suiUtils as any).decodeSuiPrivateKey;
  } catch {
    // Will use fallback method
  }
}

const NETWORK = process.argv[2] || "local";
const RPC_URL = NETWORK === "local" ? "http://127.0.0.1:9000" : getFullnodeUrl("testnet");

// Read seed data
const seedDataFile = Bun.file("SEED_DATA.json");
const seedDataText = await seedDataFile.text();
const seedData = JSON.parse(seedDataText);

const packageId = seedData.packageId;
const vaultId = seedData.vaultId;
const fighterId = seedData.fighterId;
const adminCapId = seedData.adminCapId;

console.log("🧪 Testing Move package transactions...\n");
console.log(`📦 Package ID: ${packageId}`);
console.log(`💰 Vault ID: ${vaultId}`);
console.log(`👊 Fighter ID: ${fighterId}`);
console.log(`🔑 Admin Cap ID: ${adminCapId}\n`);

// Initialize Sui client
const client = new SuiClient({ url: RPC_URL });

// Get active address from Sui CLI
let activeAddress: string;
try {
  const activeEnv = execSync("sui client active-address", { encoding: "utf-8" }).trim();
  activeAddress = activeEnv;
  console.log(`✅ Active address: ${activeAddress}\n`);
} catch (error) {
  console.error("❌ Failed to get active address. Make sure Sui CLI is configured.");
  process.exit(1);
}

// Get gas coins
async function getGasCoins() {
  const coins = await client.getCoins({
    owner: activeAddress,
    coinType: "0x2::sui::SUI",
  });
  
  if (coins.data.length === 0) {
    console.error("❌ No gas coins found. Please request SUI from faucet.");
    process.exit(1);
  }
  
  return coins.data;
}

// Test 1: Deposit to Support Vault
async function testDepositToVault() {
  console.log("📝 Test 1: Deposit to Support Vault");
  console.log("─".repeat(50));
  
  try {
    const coins = await getGasCoins();
    const tx = new Transaction();
    
    // Split 1 SUI for deposit
    const amountMist = BigInt(1_000_000_000); // 1 SUI
    const [coin] = tx.splitCoins(tx.gas, [tx.pure.u64(amountMist)]);
    
    // Deposit to vault
    tx.moveCall({
      target: `${packageId}::support::deposit`,
      arguments: [
        tx.object(vaultId),
        coin,
      ],
    });
    
    // Build and execute transaction
    const result = await client.signAndExecuteTransaction({
      signer: await getSigner(),
      transaction: tx,
      options: {
        showEffects: true,
        showEvents: true,
        showObjectChanges: true,
        showBalanceChanges: true,
      },
    });
    
    console.log(`✅ Deposit successful!`);
    console.log(`   Transaction: ${result.digest}`);
    
    // Wait for transaction to be indexed
    await client.waitForTransaction({ digest: result.digest });
    
    // Check vault balance
    const vault = await client.getObject({
      id: vaultId,
      options: { showContent: true },
    });
    
    console.log(`   Vault object: ${JSON.stringify(vault.data?.content, null, 2).substring(0, 200)}...`);
    console.log();
    
    return true;
  } catch (error: any) {
    console.error(`❌ Deposit failed: ${error.message}`);
    console.error(`   ${error.stack}`);
    console.log();
    return false;
  }
}

// Test 2: Mint Supporter NFT
async function testMintSupporterNFT() {
  console.log("📝 Test 2: Mint Supporter NFT");
  console.log("─".repeat(50));
  
  try {
    const tx = new Transaction();
    
    // Mint Bronze tier NFT
    const metadataUrl = `https://one-fight-arena-dao.vercel.app/fighter/${fighterId}`;
    tx.moveCall({
      target: `${packageId}::support::mint_supporter_nft`,
      arguments: [
        tx.pure.id(fighterId),
        tx.pure.u8(1), // BRONZE tier
        tx.pure.vector("u8", Array.from(Buffer.from(metadataUrl, "utf-8"))),
      ],
    });
    
    // Build and execute transaction
    const result = await client.signAndExecuteTransaction({
      signer: await getSigner(),
      transaction: tx,
      options: {
        showEffects: true,
        showEvents: true,
        showObjectChanges: true,
        showBalanceChanges: true,
      },
    });
    
    console.log(`✅ NFT minted successfully!`);
    console.log(`   Transaction: ${result.digest}`);
    
    // Wait for transaction to be indexed
    await client.waitForTransaction({ digest: result.digest });
    
    // Check for created NFT
    if (result.objectChanges) {
      const nft = result.objectChanges.find(
        (change: any) => change.type === "created" && change.objectType?.includes("SupporterNFT")
      );
      if (nft) {
        console.log(`   NFT ID: ${(nft as any).objectId}`);
      }
    }
    
    console.log();
    return true;
  } catch (error: any) {
    console.error(`❌ NFT mint failed: ${error.message}`);
    console.error(`   ${error.stack}`);
    console.log();
    return false;
  }
}

// Test 3: Create a new market
async function testCreateMarket() {
  console.log("📝 Test 3: Create Prediction Market");
  console.log("─".repeat(50));
  
  try {
    const tx = new Transaction();
    
    // Create a test event ID (using a dummy ID)
    const eventId = "0x" + "1".repeat(64);
    const question = "Will this test market resolve correctly?";
    const vaultAddress = activeAddress; // Use active address as vault address
    
    tx.moveCall({
      target: `${packageId}::markets::create_market`,
      arguments: [
        tx.object(adminCapId),
        tx.pure.id(eventId),
        tx.pure.vector("u8", Array.from(Buffer.from(question, "utf-8"))),
        tx.pure.u64(500), // 5% fee
        tx.pure.address(vaultAddress),
      ],
    });
    
    // Build and execute transaction
    const result = await client.signAndExecuteTransaction({
      signer: await getSigner(),
      transaction: tx,
      options: {
        showEffects: true,
        showEvents: true,
        showObjectChanges: true,
        showBalanceChanges: true,
      },
    });
    
    console.log(`✅ Market created successfully!`);
    console.log(`   Transaction: ${result.digest}`);
    
    // Wait for transaction to be indexed
    await client.waitForTransaction({ digest: result.digest });
    
    // Check for created market
    if (result.objectChanges) {
      const market = result.objectChanges.find(
        (change: any) => change.type === "created" && change.objectType?.includes("Market")
      );
      if (market) {
        console.log(`   Market ID: ${(market as any).objectId}`);
      }
    }
    
    console.log();
    return true;
  } catch (error: any) {
    console.error(`❌ Market creation failed: ${error.message}`);
    console.error(`   ${error.stack}`);
    console.log();
    return false;
  }
}

// Get signer from Sui CLI
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
    // The format is usually "suiprivkey1..." which is base64 encoded
    const privateKeyStr = keyExport.exportedPrivateKey || keyExport.key?.exportedPrivateKey;
    if (!privateKeyStr) {
      throw new Error("Could not find exportedPrivateKey in export output");
    }
    
    // Parse the Sui private key format (suiprivkey1...)
    // This is a base58-encoded key with a prefix
    if (privateKeyStr.startsWith("suiprivkey1")) {
      // Try to use decodeSuiPrivateKey if available
      if (decodeSuiPrivateKey) {
        const decoded = decodeSuiPrivateKey(privateKeyStr);
        return Ed25519Keypair.fromSecretKey(decoded.secretKey);
      } else {
        // Fallback: Use Ed25519Keypair.fromSecretKey directly
        // The suiprivkey1 format includes the secret key after the prefix
        // We need to decode it properly
        // For now, try to use the keypair constructor directly
        try {
          return Ed25519Keypair.fromSecretKey(fromB64(privateKeyStr));
        } catch {
          // Last resort: try to parse the key manually
          // The suiprivkey1 format is base58 encoded, but we'll use a simpler approach
          // Export the key in raw format if possible
          throw new Error("Could not decode suiprivkey1 format. Please ensure @mysten/sui/cryptography is available.");
        }
      }
    } else {
      // Try base64 decode
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
    console.error("   Make sure Sui CLI is configured and you have an active address.");
    throw error;
  }
}

// Run all tests
async function runTests() {
  const results = {
    deposit: false,
    mintNFT: false,
    createMarket: false,
  };
  
  console.log("🚀 Starting integration tests...\n");
  
  // Test 1: Deposit to vault
  results.deposit = await testDepositToVault();
  
  // Test 2: Mint NFT
  results.mintNFT = await testMintSupporterNFT();
  
  // Test 3: Create market
  results.createMarket = await testCreateMarket();
  
  // Summary
  console.log("📊 Test Summary");
  console.log("═".repeat(50));
  console.log(`Deposit to Vault:     ${results.deposit ? "✅ PASS" : "❌ FAIL"}`);
  console.log(`Mint Supporter NFT:   ${results.mintNFT ? "✅ PASS" : "❌ FAIL"}`);
  console.log(`Create Market:        ${results.createMarket ? "✅ PASS" : "❌ FAIL"}`);
  console.log("═".repeat(50));
  
  const allPassed = Object.values(results).every((r) => r);
  console.log(`\n${allPassed ? "✅ All tests passed!" : "❌ Some tests failed."}\n`);
  
  process.exit(allPassed ? 0 : 1);
}

// Run tests
runTests().catch((error) => {
  console.error("❌ Test execution failed:", error);
  process.exit(1);
});

