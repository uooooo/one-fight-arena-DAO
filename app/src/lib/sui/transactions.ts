import { Transaction } from "@mysten/sui/transactions";
import { OPEN_CORNER_PACKAGE_ID } from "./constants";
import { createDeepBookPoolTx, placeLimitOrderTx } from "./deepbook";

/**
 * Create a prediction market with YES/NO coins
 * TreasuryCaps are stored in MarketPool for public access
 * @param adminCapId - ProtocolAdminCap ID
 * @param eventId - Event ID
 * @param question - Market question
 * @param vaultAddress - Support vault address
 * @param treasuryCapYesId - TreasuryCap<YES_COIN> ID (will be transferred to MarketPool)
 * @param treasuryCapNoId - TreasuryCap<NO_COIN> ID (will be transferred to MarketPool)
 * @param tx - Transaction builder
 * @param packageId - Optional: override package ID
 */
export function createMarketTx(
  adminCapId: string,
  eventId: string,
  question: string,
  vaultAddress: string,
  treasuryCapYesId: string,
  treasuryCapNoId: string,
  tx: Transaction,
  packageId?: string
) {
  const targetPackageId = packageId || OPEN_CORNER_PACKAGE_ID;
  const target = `${targetPackageId}::markets::create_market`;
  
  tx.moveCall({
    target,
    arguments: [
      tx.object(adminCapId), // Admin capability
      tx.pure.id(eventId),
      tx.pure.vector("u8", Array.from(Buffer.from(question, "utf-8"))),
      tx.pure.u64(500), // 5% fee in bps
      tx.pure.address(vaultAddress),
      tx.object(treasuryCapYesId), // TreasuryCap<YES_COIN> (transferred to MarketPool)
      tx.object(treasuryCapNoId), // TreasuryCap<NO_COIN> (transferred to MarketPool)
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

// ===== CPMM Market Pool Functions =====

/**
 * Split USDO into YES/NO pair using CPMM
 * TreasuryCaps are stored in MarketPool for public access (new design)
 * @param marketId - Market ID
 * @param poolId - MarketPool ID (contains TreasuryCaps)
 * @param usdoCoin - Coin<USDO> object (from tx.splitCoins or tx.gas)
 * @param tx - Transaction builder
 * @param packageId - Optional: override package ID
 */
export function splitUsdoForMarketTx(
  marketId: string,
  poolId: string,
  usdoCoin: any, // Coin<USDO> object from transaction
  tx: Transaction,
  packageId?: string // Optional: override package ID
) {
  const targetPackageId = packageId || OPEN_CORNER_PACKAGE_ID;
  const target = `${targetPackageId}::markets::split_usdo_for_market`;
  
  // Debug logging
  console.log("🔍 splitUsdoForMarketTx - Debug info:", {
    targetPackageId,
    target,
    marketId,
    poolId,
    hasUsdoCoin: !!usdoCoin,
  });
  
  // TreasuryCaps are stored in MarketPool, so no need to pass them as arguments
  tx.moveCall({
    target,
    arguments: [
      tx.object(marketId), // &Market
      tx.object(poolId), // &mut MarketPool (contains TreasuryCaps)
      usdoCoin, // Coin<USDO> (already a transaction result)
    ],
  });
}

/**
 * Join YES/NO pair back into USDO
 * TreasuryCaps are stored in MarketPool, so no need to pass them as arguments
 * @param marketId - Market ID
 * @param poolId - MarketPool ID
 * @param marketYesId - MarketYes wrapper ID
 * @param marketNoId - MarketNo wrapper ID
 * @param yesCoinId - Coin<YES_COIN> ID
 * @param noCoinId - Coin<NO_COIN> ID
 * @param tx - Transaction builder
 */
export function joinCoinsForMarketTx(
  marketId: string,
  poolId: string,
  marketYesId: string,
  marketNoId: string,
  yesCoinId: string,
  noCoinId: string,
  tx: Transaction
) {
  tx.moveCall({
    target: `${OPEN_CORNER_PACKAGE_ID}::markets::join_coins_for_market`,
    arguments: [
      tx.object(marketId), // &Market
      tx.object(poolId), // &mut MarketPool (contains TreasuryCaps)
      tx.object(marketYesId), // MarketYes
      tx.object(marketNoId), // MarketNo
      tx.object(yesCoinId), // Coin<YES_COIN>
      tx.object(noCoinId), // Coin<NO_COIN>
    ],
  });
}

/**
 * Swap YES for NO using CPMM
 * @param marketId - Market ID
 * @param poolId - MarketPool ID
 * @param yesCoinId - Coin<YES_COIN> ID to swap
 * @param minNoOut - Minimum NO coins to receive (slippage protection)
 * @param tx - Transaction builder
 */
export function swapYesForNoTx(
  marketId: string,
  poolId: string,
  yesCoinId: string,
  minNoOut: bigint,
  tx: Transaction,
  packageId?: string
) {
  const targetPackageId = packageId || OPEN_CORNER_PACKAGE_ID;
  console.log("🔄 swapYesForNoTx - Swapping YES for NO:", {
    marketId,
    poolId,
    yesCoinId,
    minNoOut: minNoOut.toString(),
    targetPackageId,
    target: `${targetPackageId}::markets::swap_yes_for_no_for_market`,
  });
  tx.moveCall({
    target: `${targetPackageId}::markets::swap_yes_for_no_for_market`,
    arguments: [
      tx.object(marketId), // &Market
      tx.object(poolId), // &mut MarketPool
      tx.object(yesCoinId), // Coin<YES_COIN>
      tx.pure.u64(minNoOut), // u64 (minimum NO output)
    ],
  });
}

/**
 * Swap NO for YES using CPMM
 * @param marketId - Market ID
 * @param poolId - MarketPool ID
 * @param noCoinId - Coin<NO_COIN> ID to swap
 * @param minYesOut - Minimum YES coins to receive (slippage protection)
 * @param tx - Transaction builder
 */
export function swapNoForYesTx(
  marketId: string,
  poolId: string,
  noCoinId: string,
  minYesOut: bigint,
  tx: Transaction,
  packageId?: string
) {
  const targetPackageId = packageId || OPEN_CORNER_PACKAGE_ID;
  console.log("🔄 swapNoForYesTx - Swapping NO for YES:", {
    marketId,
    poolId,
    noCoinId,
    minYesOut: minYesOut.toString(),
    targetPackageId,
    target: `${targetPackageId}::markets::swap_no_for_yes_for_market`,
  });
  tx.moveCall({
    target: `${targetPackageId}::markets::swap_no_for_yes_for_market`,
    arguments: [
      tx.object(marketId), // &Market
      tx.object(poolId), // &mut MarketPool
      tx.object(noCoinId), // Coin<NO_COIN>
      tx.pure.u64(minYesOut), // u64 (minimum YES output)
    ],
  });
}

/**
 * Redeem winning YES coins for USDO
 * TreasuryCap is stored in MarketPool, so no need to pass it as argument
 * @param marketId - Market ID
 * @param poolId - MarketPool ID
 * @param marketYesId - MarketYes wrapper ID
 * @param winningYesCoinId - Coin<YES_COIN> ID (winning coins to redeem)
 * @param tx - Transaction builder
 */
export function redeemWinningYesTx(
  marketId: string,
  poolId: string,
  marketYesId: string,
  winningYesCoinId: string,
  tx: Transaction
) {
  tx.moveCall({
    target: `${OPEN_CORNER_PACKAGE_ID}::markets::redeem_winning_yes_for_market`,
    arguments: [
      tx.object(marketId), // &Market
      tx.object(poolId), // &mut MarketPool (contains TreasuryCap)
      tx.object(marketYesId), // MarketYes
      tx.object(winningYesCoinId), // Coin<YES_COIN>
    ],
  });
}

/**
 * Redeem winning NO coins for USDO
 * TreasuryCap is stored in MarketPool, so no need to pass it as argument
 * @param marketId - Market ID
 * @param poolId - MarketPool ID
 * @param marketNoId - MarketNo wrapper ID
 * @param winningNoCoinId - Coin<NO_COIN> ID (winning coins to redeem)
 * @param tx - Transaction builder
 */
export function redeemWinningNoTx(
  marketId: string,
  poolId: string,
  marketNoId: string,
  winningNoCoinId: string,
  tx: Transaction
) {
  tx.moveCall({
    target: `${OPEN_CORNER_PACKAGE_ID}::markets::redeem_winning_no_for_market`,
    arguments: [
      tx.object(marketId), // &Market
      tx.object(poolId), // &mut MarketPool (contains TreasuryCap)
      tx.object(marketNoId), // MarketNo
      tx.object(winningNoCoinId), // Coin<NO_COIN>
    ],
  });
}

/**
 * Mint USDO coins
 * @param treasuryCapUsdoId - TreasuryCap<USDO> ID
 * @param amount - Amount to mint in base units (1 USDO = 10^9 base units)
 * @param tx - Transaction builder
 */
export function mintUsdoTx(
  treasuryCapUsdoId: string,
  amount: bigint,
  recipientAddress: string,
  tx: Transaction,
  coinType?: string
) {
  const usdoCoinType = coinType || `${OPEN_CORNER_PACKAGE_ID}::usdo::USDO`;
  const mintedCoin = tx.moveCall({
    target: `0x2::coin::mint`,
    typeArguments: [usdoCoinType],
    arguments: [
      tx.object(treasuryCapUsdoId), // &mut TreasuryCap<USDO>
      tx.pure.u64(amount), // u64 amount in base units
    ],
  });

  tx.transferObjects(
    [mintedCoin],
    tx.pure.address(recipientAddress)
  );
}

/**
 * Claim USDO from the shared faucet object.
 */
export function claimUsdoFromFaucetTx(
  faucetId: string,
  amount: bigint,
  tx: Transaction,
  packageId?: string
) {
  const faucetPackageId = packageId || OPEN_CORNER_PACKAGE_ID;
  console.log("🚰 claimUsdoFromFaucetTx - Claiming USDO:", {
    faucetId,
    amount: amount.toString(),
    faucetPackageId,
    target: `${faucetPackageId}::usdo_faucet::claim`,
  });
  tx.moveCall({
    target: `${faucetPackageId}::usdo_faucet::claim`,
    arguments: [tx.object(faucetId), tx.pure.u64(amount)],
  });
}
