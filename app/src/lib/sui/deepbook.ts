import { SuiClient } from "@mysten/sui/client";
import { Transaction } from "@mysten/sui/transactions";
import { DEEPBOOK_PACKAGE_ID } from "@/lib/sui/constants";

// DeepBook package ID for testnet
// This will be updated after deploying the Move package
export const DEEPBOOK_PACKAGE_ID_TESTNET =
  "0x000000000000000000000000000000000000000000000000000000000000dee9";

export interface CreatePoolParams {
  baseCoinType: string;
  quoteCoinType: string;
  tickSize: string;
  lotSize: string;
}

export interface PlaceOrderParams {
  poolId: string;
  price: string;
  quantity: string;
  isBid: boolean;
  baseCoinType: string;
  quoteCoinType: string;
}

/**
 * Create a DeepBook pool for YES/NO coin trading
 */
export function createDeepBookPoolTx(
  params: CreatePoolParams,
  tx: Transaction
) {
  tx.moveCall({
    target: `${DEEPBOOK_PACKAGE_ID_TESTNET}::clob_v2::create_pool`,
    arguments: [
      tx.pure.string(params.baseCoinType),
      tx.pure.string(params.quoteCoinType),
      tx.pure.u64(params.tickSize),
      tx.pure.u64(params.lotSize),
    ],
  });
}

/**
 * Place a limit order on DeepBook
 */
export function placeLimitOrderTx(
  params: PlaceOrderParams,
  tx: Transaction
) {
  tx.moveCall({
    target: `${DEEPBOOK_PACKAGE_ID_TESTNET}::clob_v2::place_limit_order`,
    arguments: [
      tx.object(params.poolId),
      tx.pure.u64(params.price),
      tx.pure.u64(params.quantity),
      tx.pure.bool(params.isBid),
      tx.pure.string(params.baseCoinType),
      tx.pure.string(params.quoteCoinType),
    ],
  });
}

/**
 * Get order book data from DeepBook pool
 */
export async function getOrderBook(
  client: SuiClient,
  poolId: string,
  limit: number = 20
) {
  try {
    // This is a simplified version - actual implementation would use DeepBook's view functions
    const poolObject = await client.getObject({
      id: poolId,
      options: {
        showContent: true,
      },
    });

    // TODO: Parse order book data from pool object
    // DeepBook provides view functions to get order book data
    return {
      bids: [],
      asks: [],
      spread: "0",
      midPrice: "0",
    };
  } catch (error) {
    console.error("Error fetching order book:", error);
    return {
      bids: [],
      asks: [],
      spread: "0",
      midPrice: "0",
    };
  }
}

/**
 * Get market price from DeepBook pool
 */
export async function getMarketPrice(
  client: SuiClient,
  poolId: string
): Promise<string> {
  try {
    const orderBook = await getOrderBook(client, poolId, 1);
    return orderBook.midPrice;
  } catch (error) {
    console.error("Error fetching market price:", error);
    return "0";
  }
}

