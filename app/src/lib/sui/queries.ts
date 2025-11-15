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
      // Sui returns vector<u8> as an array of numbers (ASCII codes)
      // The question may be stored as hex string bytes (e.g., "57696c6c..." as ASCII)
      let question: string;
      try {
        const questionBytes = fields.question;
        if (Array.isArray(questionBytes)) {
          // Convert array of numbers to string first
          const hexString = Buffer.from(questionBytes).toString("utf-8");
          
          // Check if the resulting string is a hex string (even length, only hex chars)
          // and if it decodes to valid UTF-8
          if (/^[0-9a-fA-F]+$/.test(hexString) && hexString.length % 2 === 0 && hexString.length > 0) {
            try {
              // Try to decode as hex string
              const decoded = Buffer.from(hexString, "hex").toString("utf-8");
              // If decoded string is readable (not just control chars), use it
              if (decoded.length > 0 && !/^[\x00-\x1F\x7F]*$/.test(decoded)) {
                question = decoded;
              } else {
                // Fallback: use the hex string as-is
                question = hexString;
              }
            } catch {
              // If hex decode fails, use the direct string conversion
              question = hexString;
            }
          } else {
            // Not a hex string, use directly as UTF-8
            question = hexString;
          }
        } else if (typeof questionBytes === "string") {
          // If it's already a string, use it directly
          question = questionBytes;
        } else {
          // Fallback: try to convert to string directly
          question = String(questionBytes || "");
        }
      } catch (error) {
        console.error("Error decoding question field:", error, fields.question);
        question = String(fields.question || "");
      }

      // Parse state (0 = OPEN, 1 = RESOLVED)
      const state = fields.state === "0" || fields.state === 0 ? "open" : "resolved";

      // Parse winning coin type if exists
      let winningCoinType: string | undefined;
      if (fields.winning_coin_type && fields.winning_coin_type !== "0x1::option::none") {
        const winningCoinBytes = fields.winning_coin_type.fields?.vec || [];
        winningCoinType = Buffer.from(winningCoinBytes).toString("utf-8");
      }

      // Parse pool_id (ID type is returned as a string or object with id field)
      // Note: Older Market objects may not have pool_id if created before CPMM integration
      let poolId: string | undefined;
      if (fields.pool_id) {
        if (typeof fields.pool_id === "string") {
          poolId = fields.pool_id;
        } else if (fields.pool_id && typeof fields.pool_id === "object" && fields.pool_id.id) {
          // ID type has nested structure: { id: "0x..." }
          poolId = fields.pool_id.id;
        } else {
          poolId = String(fields.pool_id);
        }
      } else {
        // pool_id doesn't exist - this Market was created before CPMM integration
        // We'll need to query MarketPool by market_id or check if it exists
        console.warn("Market object does not have pool_id field. This may be an older Market created before CPMM integration.");
      }

      return {
        id: marketId,
        eventId: fields.event_id || "",
        question,
        state,
        feeBps: parseInt(fields.fee_bps || "500"),
        vaultAddress: fields.vault_address || "",
        winningCoinType,
        poolId, // Pool ID for CPMM
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
  // Validate poolId format (Sui object IDs are hex strings starting with 0x)
  if (!poolId || poolId === "PLACEHOLDER_POOL_ID" || poolId.startsWith("PLACEHOLDER") || !poolId.startsWith("0x")) {
    console.warn("Invalid pool ID:", poolId);
    return null;
  }

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
export async function getUsdoBalance(address: string, customCoinType?: string): Promise<bigint> {
  try {
    // If customCoinType is provided, use it; otherwise construct from OPEN_CORNER_PACKAGE_ID
    // Note: customCoinType should be passed from the component to ensure correct package ID
    const usdoCoinType = customCoinType || `${OPEN_CORNER_PACKAGE_ID}::usdo::USDO`;
    
    console.log("🔍 getUsdoBalance - Querying USDO balance:", {
      address,
      coinType: usdoCoinType,
      hasCustomCoinType: !!customCoinType,
    });
    
    const coins = await suiClient.getCoins({
      owner: address,
      coinType: usdoCoinType,
    });

    console.log("💰 getUsdoBalance - Found coins:", {
      count: coins.data.length,
      coins: coins.data.map(c => ({ id: c.coinObjectId, balance: c.balance })),
    });

    let totalBalance = BigInt(0);
    for (const coin of coins.data) {
      totalBalance += BigInt(coin.balance || "0");
    }

    console.log("💰 getUsdoBalance - Total balance:", totalBalance.toString());
    return totalBalance;
  } catch (error) {
    console.error("Error fetching USDO balance:", error);
    return BigInt(0);
  }
}

/**
 * Try to find TreasuryCap<USDO> ID by querying package owner's objects
 * @param packageId - Package ID
 * @returns TreasuryCap<USDO> ID if found, null otherwise
 */
export async function findTreasuryCapUsdoId(packageId: string): Promise<string | null> {
  try {
    console.log("🔍 Searching for TreasuryCap<USDO> ID for package:", packageId);
    
    // Get package info to find the publisher
    const packageInfo = await suiClient.getObject({
      id: packageId,
      options: {
        showContent: true,
        showOwner: true,
        showPreviousTransaction: true,
      },
    });

    console.log("📦 Package info:", {
      hasPreviousTx: !!packageInfo.data?.previousTransaction,
      owner: packageInfo.data?.owner,
    });

    // Try to get package owner from previous transaction
    // TreasuryCap is typically owned by the package publisher
    if (packageInfo.data?.previousTransaction) {
      const txDigest = packageInfo.data.previousTransaction;
      console.log("📋 Fetching publish transaction:", txDigest);
      
      const tx = await suiClient.getTransactionBlock({
        digest: txDigest,
        options: {
          showObjectChanges: true,
          showEffects: true,
          showInput: true,
        },
      });

      console.log("🔍 Transaction details:", {
        hasObjectChanges: !!tx.objectChanges,
        objectChangesCount: tx.objectChanges?.length || 0,
        sender: tx.transaction?.data?.sender,
      });

      // Look for TreasuryCap in object changes
      if (tx.objectChanges) {
        for (const change of tx.objectChanges) {
          const objType = "objectType" in change ? change.objectType : null;
          const objId = "objectId" in change ? change.objectId : null;
          
          console.log("🔎 Checking object change:", {
            type: change.type,
            objType,
            objId,
          });

          // Check if this is a TreasuryCap<USDO>
          if (objType && typeof objType === "string" && objType.includes("TreasuryCap") && objType.includes("USDO")) {
            console.log("✅ Found TreasuryCap<USDO> in objectChanges:", objId);
            
            // Check owner
            if ("owner" in change) {
              const owner = change.owner;
              if (typeof owner === "object") {
                if ("AddressOwner" in owner) {
                  console.log("✅ TreasuryCap<USDO> is owned by address:", owner.AddressOwner);
                  return objId || null;
                } else {
                  console.log("⚠️ TreasuryCap<USDO> owner type:", Object.keys(owner));
                }
              }
            }
          }
        }
      }

      // Also try querying by type from the sender of the publish transaction
      if (tx.transaction?.data?.sender) {
        const sender = tx.transaction.data.sender;
        console.log("🔍 Querying TreasuryCap from sender:", sender);
        
        // First, try querying all objects (more reliable)
        try {
          console.log("🔄 Querying all owned objects from sender...");
          const allObjects = await suiClient.getOwnedObjects({
            owner: sender,
            options: {
              showType: true,
              showContent: true,
            },
            limit: 50, // Limit to first 50 objects
          });

          console.log("📋 All objects count:", allObjects.data?.length || 0);
          
          if (allObjects.data) {
            // Log all object types for debugging
            const objectTypes = allObjects.data
              .map(obj => obj.data?.type)
              .filter(Boolean);
            console.log("📋 Object types found:", objectTypes);
            
            // Look for TreasuryCap<USDO>
            for (const obj of allObjects.data) {
              const objType = obj.data?.type;
              if (objType) {
                console.log("🔎 Checking object:", {
                  id: obj.data?.objectId,
                  type: objType,
                });
                
                if (objType.includes("TreasuryCap") && objType.includes("USDO")) {
                  const treasuryCapId = obj.data?.objectId;
                  console.log("✅ Found TreasuryCap<USDO> ID:", treasuryCapId);
                  return treasuryCapId || null;
                }
              }
            }
          }
        } catch (fallbackError: any) {
          console.error("❌ Error querying all objects:", fallbackError?.message || fallbackError);
        }
        
        // Also try the specific type query
        const treasuryCapType = `0x2::coin::TreasuryCap<${OPEN_CORNER_PACKAGE_ID}::usdo::USDO>`;
        console.log("🔍 Also trying specific type query:", treasuryCapType);
        
        try {
          const objects = await suiClient.getOwnedObjects({
            owner: sender,
            filter: {
              StructType: treasuryCapType,
            },
            options: {
              showContent: true,
              showType: true,
            },
          });

          console.log("📋 Specific type query result:", {
            hasData: !!objects.data,
            count: objects.data?.length || 0,
          });

          if (objects.data && objects.data.length > 0) {
            const treasuryCapId = objects.data[0].data?.objectId;
            console.log("✅ Found TreasuryCap<USDO> ID via specific query:", treasuryCapId);
            return treasuryCapId || null;
          }
        } catch (queryError: any) {
          console.warn("⚠️ Error querying TreasuryCap by specific type:", queryError?.message || queryError);
        }
      }
    }
  } catch (error: any) {
    console.error("❌ Error finding TreasuryCap<USDO> ID:", error?.message || error);
  }

  console.warn("⚠️ Could not find TreasuryCap<USDO> ID");
  return null;
}
