import { SuiClient } from "@mysten/sui/client";
import { suiClient } from "./client";
import { OPEN_CORNER_PACKAGE_ID } from "./constants";

/**
 * Market data structure from Sui
 */
export interface MarketData {
  id: string;
  eventId: string;
  question: string;
  state: "open" | "resolved";
  feeBps: number;
  vaultAddress: string;
  winningCoinType?: string;
  poolId?: string; // MarketPool ID for CPMM trading
}

/**
 * MarketPool data structure from Sui
 */
export interface MarketPoolData {
  id: string;
  marketId: string;
  yesBalance: string; // Balance of YES coins
  noBalance: string; // Balance of NO coins
  k: string; // Constant product (yes_balance * no_balance)
  collateral: string; // Locked USDO collateral
}

/**
 * Get Market object from Sui by market ID
 */
export async function getMarket(marketId: string): Promise<MarketData | null> {
  try {
    const marketType = `${OPEN_CORNER_PACKAGE_ID}::markets::Market`;
    const object = await suiClient.getObject({
      id: marketId,
      options: {
        showContent: true,
        showType: true,
      },
    });

    if (object.data?.content && "fields" in object.data.content) {
      const fields = object.data.content.fields as any;
      
      // Parse question from vector<u8>
      const questionBytes = fields.question as number[];
      const question = Buffer.from(questionBytes).toString("utf-8");

      // Parse state (0 = OPEN, 1 = RESOLVED)
      const state = fields.state === "0" || fields.state === 0 ? "open" : "resolved";

      // Parse winning coin type if exists
      let winningCoinType: string | undefined;
      if (fields.winning_coin_type && fields.winning_coin_type !== "0x1::option::none") {
        const winningCoinBytes = fields.winning_coin_type.fields?.vec || [];
        winningCoinType = Buffer.from(winningCoinBytes).toString("utf-8");
      }

      return {
        id: marketId,
        eventId: fields.event_id || "",
        question,
        state,
        feeBps: parseInt(fields.fee_bps || "500"),
        vaultAddress: fields.vault_address || "",
        winningCoinType,
        poolId: fields.pool_id || undefined, // Pool ID for CPMM
      };
    }

    return null;
  } catch (error) {
    console.error("Error fetching market:", error);
    return null;
  }
}

/**
 * Query all Market objects by type
 * Note: Since Market is a shared object, we need to query by type
 */
export async function queryMarketsByType(): Promise<MarketData[]> {
  try {
    const marketType = `${OPEN_CORNER_PACKAGE_ID}::markets::Market`;
    
    // Query all objects of Market type
    // Note: Sui doesn't have a direct "query all objects by type" for shared objects
    // We'll use getObjectsOwnedByAddress with a filter, but for shared objects,
    // we need to know the object IDs first.
    // For MVP, we'll return empty array and rely on known market IDs from SEED_DATA.json
    
    // TODO: Implement proper query for shared objects when Sui API supports it
    return [];
  } catch (error) {
    console.error("Error querying markets:", error);
    return [];
  }
}

/**
 * Query markets by event ID (using events)
 * This function searches for MarketCreated events
 */
export async function getMarketsByEvent(eventId: string): Promise<MarketData[]> {
  try {
    const marketType = `${OPEN_CORNER_PACKAGE_ID}::markets::MarketCreated`;
    
    // Query events for MarketCreated with matching event_id
    const events = await suiClient.queryEvents({
      query: {
        MoveModule: {
          package: OPEN_CORNER_PACKAGE_ID,
          module: "markets",
        },
        MoveEventType: marketType,
      },
      limit: 100,
    });

    const markets: MarketData[] = [];

    for (const event of events.data) {
      if (event.parsedJson) {
        const eventData = event.parsedJson as any;
        // Check if event_id matches (convert both to string for comparison)
        const eventIdStr = typeof eventData.event_id === "string" 
          ? eventData.event_id 
          : eventData.event_id?.id || "";
        
        if (eventIdStr === eventId || eventIdStr.includes(eventId.slice(2))) {
          const marketId = eventData.market_id;
          if (marketId) {
            const market = await getMarket(
              typeof marketId === "string" ? marketId : marketId.id
            );
            if (market) {
              markets.push(market);
            }
          }
        }
      }
    }

    return markets;
  } catch (error) {
    console.error("Error querying markets by event:", error);
    return [];
  }
}

/**
 * Get SupportVault data from Sui
 */
export interface SupportVaultData {
  id: string;
  fighterId: string;
  balance: bigint;
}

export async function getSupportVault(vaultId: string): Promise<SupportVaultData | null> {
  try {
    const object = await suiClient.getObject({
      id: vaultId,
      options: {
        showContent: true,
        showType: true,
      },
    });

    if (object.data?.content && "fields" in object.data.content) {
      const fields = object.data.content.fields as any;
      
      return {
        id: vaultId,
        fighterId: fields.fighter_id || "",
        balance: BigInt(fields.balance || "0"),
      };
    }

    return null;
  } catch (error) {
    console.error("Error fetching support vault:", error);
    return null;
  }
}

/**
 * Get FighterProfile data from Sui
 */
export interface FighterProfileData {
  id: string;
  nameHash: string;
  socialsHash: string;
  vaultCap?: string;
}

export async function getFighterProfile(fighterId: string): Promise<FighterProfileData | null> {
  try {
    const object = await suiClient.getObject({
      id: fighterId,
      options: {
        showContent: true,
        showType: true,
      },
    });

    if (object.data?.content && "fields" in object.data.content) {
      const fields = object.data.content.fields as any;
      
      // Parse name_hash and socials_hash from vector<u8>
      const nameHashBytes = fields.name_hash as number[];
      const socialsHashBytes = fields.socials_hash as number[];
      const nameHash = Buffer.from(nameHashBytes).toString("hex");
      const socialsHash = Buffer.from(socialsHashBytes).toString("hex");

      return {
        id: fighterId,
        nameHash,
        socialsHash,
        vaultCap: fields.vault_cap?.fields?.vec ? undefined : undefined,
      };
    }

      return null;
  } catch (error) {
    console.error("Error fetching fighter profile:", error);
    return null;
  }
}

/**
 * Get MarketPool object from Sui by pool ID
 */
export async function getMarketPool(poolId: string): Promise<MarketPoolData | null> {
  try {
    const poolType = `${OPEN_CORNER_PACKAGE_ID}::market_pool::MarketPool`;
    const object = await suiClient.getObject({
      id: poolId,
      options: {
        showContent: true,
        showType: true,
      },
    });

    if (object.data?.content && "fields" in object.data.content) {
      const fields = object.data.content.fields as any;
      
      return {
        id: poolId,
        marketId: fields.market_id || "",
        yesBalance: fields.yes_balance?.value || "0",
        noBalance: fields.no_balance?.value || "0",
        k: fields.k || "0",
        collateral: fields.collateral?.value || "0",
      };
    }

    return null;
  } catch (error) {
    console.error("Error fetching market pool:", error);
    return null;
  }
}

/**
 * Get USDO coin balance for a user
 * @param address - User address
 * @returns Balance in base units (1 USDO = 10^9 base units)
 */
export async function getUsdoBalance(address: string): Promise<bigint> {
  try {
    const usdoCoinType = `${OPEN_CORNER_PACKAGE_ID}::usdo::USDO`;
    const coins = await suiClient.getCoins({
      owner: address,
      coinType: usdoCoinType,
    });

    let totalBalance = BigInt(0);
    for (const coin of coins.data) {
      totalBalance += BigInt(coin.balance || "0");
    }

    return totalBalance;
  } catch (error) {
    console.error("Error fetching USDO balance:", error);
    return BigInt(0);
  }
}

