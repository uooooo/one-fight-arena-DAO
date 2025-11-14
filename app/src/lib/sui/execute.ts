/**
 * Transaction execution helpers using wallet-kit
 */

import { Transaction } from "@mysten/sui/transactions";
import { useWalletKit } from "@mysten/wallet-kit";
import { suiClient } from "./client";
import { OPEN_CORNER_PACKAGE_ID } from "./constants";

/**
 * Execute a transaction using the connected wallet
 */
export async function executeTransaction(
  transaction: Transaction,
  signAndExecuteTransaction: ReturnType<typeof useWalletKit>["signAndExecuteTransaction"]
) {
  if (!signAndExecuteTransaction) {
    throw new Error("Wallet not connected");
  }

  const result = await signAndExecuteTransaction({
    transaction,
    options: {
      showEffects: true,
      showEvents: true,
      showObjectChanges: true,
      showBalanceChanges: true,
    },
  });

  // Wait for transaction to be indexed
  await suiClient.waitForTransaction({
    digest: result.digest,
  });

  return result;
}

/**
 * Create a fighter profile
 */
export function createFighterTx(
  nameHash: string,
  socialsHash: string,
  tx: Transaction
) {
  tx.moveCall({
    target: `${OPEN_CORNER_PACKAGE_ID}::fighters::create_fighter`,
    arguments: [
      tx.pure.vector("u8", Array.from(Buffer.from(nameHash, "hex"))),
      tx.pure.vector("u8", Array.from(Buffer.from(socialsHash, "hex"))),
    ],
  });
}

/**
 * Create a support vault for a fighter
 */
export function createVaultTx(
  fighterId: string,
  tx: Transaction
) {
  tx.moveCall({
    target: `${OPEN_CORNER_PACKAGE_ID}::support::create_vault`,
    arguments: [
      tx.pure.id(fighterId),
    ],
  });
}

/**
 * Deposit SUI into a support vault
 */
export function depositToVaultTx(
  vaultId: string,
  amount: bigint,
  tx: Transaction
) {
  // Split coin from gas
  const [coin] = tx.splitCoins(tx.gas, [tx.pure.u64(amount)]);
  
  tx.moveCall({
    target: `${OPEN_CORNER_PACKAGE_ID}::support::deposit`,
    arguments: [
      tx.object(vaultId),
      coin,
    ],
  });
}

/**
 * Mint a supporter NFT
 */
export function mintSupporterNFTTx(
  fighterId: string,
  tier: 1 | 2 | 3, // BRONZE, SILVER, GOLD
  metadataUrl: string,
  tx: Transaction
) {
  tx.moveCall({
    target: `${OPEN_CORNER_PACKAGE_ID}::support::mint_supporter_nft`,
    arguments: [
      tx.pure.id(fighterId),
      tx.pure.u8(tier),
      tx.pure.vector("u8", Array.from(Buffer.from(metadataUrl, "utf-8"))),
    ],
  });
}

/**
 * Create a position NFT (when placing a bet)
 */
export function createPositionNFTTx(
  marketId: string,
  coinTypeName: string,
  amount: bigint,
  tx: Transaction
) {
  tx.moveCall({
    target: `${OPEN_CORNER_PACKAGE_ID}::markets::create_position`,
    arguments: [
      tx.pure.id(marketId),
      tx.pure.vector("u8", Array.from(Buffer.from(coinTypeName, "utf-8"))),
      tx.pure.u64(amount),
    ],
  });
}

