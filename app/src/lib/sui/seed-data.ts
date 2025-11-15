import seedDataJson from "../../../SEED_DATA.json";

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
  timestamp: string;
}

// Load seed data
export const SEED_DATA: SeedData = seedDataJson as SeedData;

