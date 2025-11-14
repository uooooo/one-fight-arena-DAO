import { Transaction } from "@mysten/sui/transactions";
import { OPEN_CORNER_PACKAGE_ID } from "./constants";
import { createDeepBookPoolTx, placeLimitOrderTx } from "./deepbook";

/**
 * Create a prediction market with YES/NO coins
 */
export function createMarketTx(
  adminCapId: string,
  eventId: string,
  question: string,
  vaultAddress: string,
  tx: Transaction
) {
  tx.moveCall({
    target: `${OPEN_CORNER_PACKAGE_ID}::markets::create_market`,
    arguments: [
      tx.object(adminCapId), // Admin capability
      tx.pure.id(eventId),
      tx.pure.vector("u8", Array.from(Buffer.from(question, "utf-8"))),
      tx.pure.u64(500), // 5% fee in bps
      tx.pure.address(vaultAddress),
    ],
  });
}

/**
 * Create YES and NO coins for a market
 */
export function createMarketCoinsTx(
  yesWitness: any,
  noWitness: any,
  tx: Transaction
) {
  // Create YES coin
  tx.moveCall({
    target: `${OPEN_CORNER_PACKAGE_ID}::yes_coin::create_yes_coin`,
    arguments: [yesWitness],
  });

  // Create NO coin
  tx.moveCall({
    target: `${OPEN_CORNER_PACKAGE_ID}::no_coin::create_no_coin`,
    arguments: [noWitness],
  });
}

/**
 * Create DeepBook pool for YES/NO coin trading
 */
export function createMarketPoolTx(
  yesCoinType: string,
  noCoinType: string,
  tx: Transaction
) {
  createDeepBookPoolTx(
    {
      baseCoinType: yesCoinType,
      quoteCoinType: noCoinType,
      tickSize: "1000000",
      lotSize: "1000000",
    },
    tx
  );
}

/**
 * Place a bet (buy YES or NO coins)
 * @param poolId - DeepBook pool ID
 * @param price - Price in SUI (will be converted to ticks)
 * @param quantity - Quantity in SUI (will be converted to MIST)
 * @param isYes - Whether buying YES (true) or NO (false)
 * @param yesCoinType - YES coin type
 * @param noCoinType - NO coin type
 * @param paymentCoin - Payment coin (unused, using gas coin instead)
 * @param tx - Transaction builder
 */
export function placeBetTx(
  poolId: string,
  price: string,
  quantity: string,
  isYes: boolean,
  yesCoinType: string,
  noCoinType: string,
  paymentCoin: any,
  tx: Transaction
) {
  // Convert SUI to MIST (1 SUI = 1,000,000,000 MIST)
  const quantityMist = BigInt(Math.floor(parseFloat(quantity) * 1_000_000_000));
  
  // Convert price to ticks (DeepBook uses ticks, not decimal prices)
  // Price is in SUI, but DeepBook needs ticks. Assuming 1 SUI = 1,000,000 ticks (as per DEFAULT_TICK_SIZE)
  const priceTicks = BigInt(Math.floor(parseFloat(price) * 1_000_000));

  // Split payment coin from gas
  const [coin] = tx.splitCoins(tx.gas, [tx.pure.u64(quantityMist)]);

  // Place order on DeepBook
  // Note: DeepBook expects price and quantity in their native format (ticks and lot size)
  placeLimitOrderTx(
    {
      poolId,
      price: priceTicks.toString(),
      quantity: quantityMist.toString(),
      isBid: isYes,
      baseCoinType: isYes ? yesCoinType : noCoinType,
      quoteCoinType: "0x2::sui::SUI",
    },
    tx
  );

  // The payment coin is consumed by DeepBook, so we don't need to transfer it manually
  // DeepBook's place_limit_order will handle the payment
}

/**
 * Resolve a market (admin only)
 */
export function resolveMarketTx(
  marketId: string,
  adminCapId: string,
  result: boolean, // true = YES wins
  tx: Transaction
) {
  tx.moveCall({
    target: `${OPEN_CORNER_PACKAGE_ID}::markets::resolve_market`,
    arguments: [
      tx.object(marketId),
      tx.object(adminCapId), // Admin capability
      tx.pure.bool(result),
    ],
  });
}

/**
 * Redeem winning coins
 */
export function redeemWinningCoinsTx(
  marketId: string,
  winningCoins: any,
  tx: Transaction
) {
  tx.moveCall({
    target: `${OPEN_CORNER_PACKAGE_ID}::markets::redeem_winning_coin`,
    arguments: [
      tx.object(marketId),
      winningCoins,
    ],
  });
}

