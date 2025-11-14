// Sui network configuration
export const SUI_NETWORK = (process.env.NEXT_PUBLIC_SUI_NETWORK || "testnet") as "testnet" | "local";

// Move package IDs (to be updated after deployment)
export const OPEN_CORNER_PACKAGE_ID = process.env.NEXT_PUBLIC_SUI_PACKAGE_ID || "0x0";
export const DEEPBOOK_PACKAGE_ID = "0x000000000000000000000000000000000000000000000000000000000000dee9";

// Market configuration
export const DEFAULT_FEE_BPS = 500; // 5% fee
export const DEFAULT_TICK_SIZE = "1000000"; // 1 SUI = 1,000,000 ticks
export const DEFAULT_LOT_SIZE = "1000000"; // Minimum order size

// Coin types (will be created per market)
export type CoinType = string;

