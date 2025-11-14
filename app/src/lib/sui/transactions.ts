import { Transaction } from "@mysten/sui/transactions";
import { OPEN_CORNER_PACKAGE_ID } from "./constants";
import { createDeepBookPoolTx, placeLimitOrderTx } from "./deepbook";

/**
 * Create a prediction market with YES/NO coins
 */
export function createMarketTx(
  eventId: string,
  question: string,
  vaultAddress: string,
  tx: Transaction
) {
  tx.moveCall({
    target: `${OPEN_CORNER_PACKAGE_ID}::markets::create_market`,
    arguments: [
      tx.pure.string(eventId),
      tx.pure.string(question),
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
  // Split payment coin
  const [coin] = tx.splitCoins(tx.gas, [tx.pure.u64(quantity)]);

  // Place order on DeepBook
  placeLimitOrderTx(
    {
      poolId,
      price,
      quantity,
      isBid: isYes,
      baseCoinType: isYes ? yesCoinType : noCoinType,
      quoteCoinType: "0x2::sui::SUI",
    },
    tx
  );

  // Transfer payment
  tx.transferObjects([coin], tx.pure.address(poolId));
}

/**
 * Resolve a market (admin only)
 */
export function resolveMarketTx(
  marketId: string,
  result: boolean, // true = YES wins
  tx: Transaction
) {
  tx.moveCall({
    target: `${OPEN_CORNER_PACKAGE_ID}::markets::resolve_market`,
    arguments: [
      tx.object(marketId),
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

