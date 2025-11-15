// Note: JSON import from project root doesn't work well with Next.js
// Using explicit values instead of importing from JSON file
export interface SeedData {
  network: string;
  packageId: string;
  adminCapId: string;
  fighterId: string;
  vaultId: string;
  marketId?: string;
  poolId?: string;
  yesCoinType?: string;
  noCoinType?: string;
  treasuryCapYesId?: string; // TreasuryCap<YES_COIN> ID
  treasuryCapNoId?: string; // TreasuryCap<NO_COIN> ID
  treasuryCapUsdoId?: string; // TreasuryCap<USDO> ID
  timestamp: string;
}

// Load seed data from public directory (SEED_DATA.json in app/public)
// This works for both server and client side in Next.js
let cachedSeedData: SeedData | null = null;

async function loadSeedData(): Promise<SeedData> {
  if (cachedSeedData) {
    return cachedSeedData;
  }

  try {
    // Load from public directory (available at /SEED_DATA.json)
    const response = await fetch('/SEED_DATA.json');
    if (response.ok) {
      cachedSeedData = await response.json();
      return cachedSeedData!;
    }
  } catch (error) {
    console.warn('Failed to load SEED_DATA.json, using defaults', error);
  }

  // Fallback to default values from environment variables or hardcoded defaults
  cachedSeedData = {
    network: process.env.NEXT_PUBLIC_SUI_NETWORK || "testnet",
    packageId: process.env.NEXT_PUBLIC_SUI_PACKAGE_ID || "0x0",
    adminCapId: "",
    fighterId: "",
    vaultId: "",
    timestamp: new Date().toISOString(),
  };
  return cachedSeedData;
}

// For synchronous access, export default seed data with fallback to env vars
// Note: This will use env vars if available, otherwise defaults
// For dynamic loading, use getSeedData() instead
export const SEED_DATA: SeedData = {
  network: process.env.NEXT_PUBLIC_SUI_NETWORK || "testnet",
  packageId: process.env.NEXT_PUBLIC_SUI_PACKAGE_ID || "0xef78795a038b2743a2c20a0a2ab8c46f4c0b11dc277f9cf6e2587186b12798e6",
  adminCapId: process.env.NEXT_PUBLIC_ADMIN_CAP_ID || "0x25aa6f9f4ead4f0dccf1de16958a5bdd1d3a8623e7b2d5e6c42d9eea7b04c134",
  fighterId: process.env.NEXT_PUBLIC_FIGHTER_ID || "0x7f35a33fca3ed3e23b0f104cb1acc1f4b9aeaf7d28a50463d2ca705d7fbc2904",
  vaultId: process.env.NEXT_PUBLIC_VAULT_ID || "0xcfa550799b47e4df67097c8675577317c794fe6a16361aedaba9dae560cc3ccf",
  marketId: process.env.NEXT_PUBLIC_MARKET_ID || "0x876c6432bb74ec286e815a864f69b57065eb0bf28a3878f1ba66a0efda90f048",
  poolId: process.env.NEXT_PUBLIC_POOL_ID || "PLACEHOLDER_POOL_ID",
  yesCoinType: process.env.NEXT_PUBLIC_YES_COIN_TYPE || "0xd880a2f382c19e29c8c970d012b6ddfe2bde6e2b23ba9219d62720d1a921001a::yes_coin::YES_COIN",
  noCoinType: process.env.NEXT_PUBLIC_NO_COIN_TYPE || "0xd880a2f382c19e29c8c970d012b6ddfe2bde6e2b23ba9219d62720d1a921001a::no_coin::NO_COIN",
  treasuryCapYesId: process.env.NEXT_PUBLIC_TREASURY_CAP_YES_ID,
  treasuryCapNoId: process.env.NEXT_PUBLIC_TREASURY_CAP_NO_ID,
  treasuryCapUsdoId: process.env.NEXT_PUBLIC_TREASURY_CAP_USDO_ID,
  timestamp: new Date().toISOString(),
};

// Async function to load seed data dynamically (useful for server-side)
export const getSeedData = async (): Promise<SeedData> => {
  return await loadSeedData();
};

