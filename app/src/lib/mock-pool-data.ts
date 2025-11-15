/**
 * Mock pool data for demo mode
 * This allows the UI to work without actual blockchain transactions
 */

export interface MockPoolState {
  yesBalance: bigint;
  noBalance: bigint;
  k: bigint;
  collateral: bigint;
}

// Store mock pool state in memory (per pool ID)
const mockPoolStates = new Map<string, MockPoolState>();

/**
 * Initialize mock pool with initial liquidity
 * Using smaller initial liquidity to make price movements more visible
 */
export function initMockPool(poolId: string, initialUsdo: bigint = BigInt(100 * 1_000_000_000)) {
  // Initial liquidity: 50% YES, 50% NO (100 USDO total = 50 YES + 50 NO)
  // Smaller initial liquidity makes price movements more dramatic
  const initialYes = initialUsdo / BigInt(2);
  const initialNo = initialUsdo / BigInt(2);
  const k = initialYes * initialNo;
  
  mockPoolStates.set(poolId, {
    yesBalance: initialYes,
    noBalance: initialNo,
    k,
    collateral: initialUsdo,
  });
  
  return mockPoolStates.get(poolId)!;
}

/**
 * Get mock pool state
 */
export function getMockPoolState(poolId: string): MockPoolState | null {
  return mockPoolStates.get(poolId) || null;
}

/**
 * Update mock pool state after split_usdo
 * Returns the amount of YES/NO coins the user receives
 */
export function mockSplitUsdo(poolId: string, usdoAmount: bigint): { yesAmount: bigint; noAmount: bigint } {
  const state = mockPoolStates.get(poolId);
  if (!state) {
    // Initialize pool if it doesn't exist
    initMockPool(poolId, usdoAmount);
    return { yesAmount: usdoAmount / BigInt(2), noAmount: usdoAmount / BigInt(2) };
  }
  
  // If pool is empty, add 50% as liquidity, user gets 50%
  if (state.yesBalance === BigInt(0) || state.noBalance === BigInt(0)) {
    const liquidityAmount = usdoAmount / BigInt(2);
    state.yesBalance += liquidityAmount;
    state.noBalance += liquidityAmount;
    state.k = state.yesBalance * state.noBalance;
    state.collateral += usdoAmount;
    return { yesAmount: liquidityAmount, noAmount: liquidityAmount };
  }
  
  // Pool has liquidity, user gets all coins
  state.collateral += usdoAmount;
  return { yesAmount: usdoAmount, noAmount: usdoAmount };
}

/**
 * Update mock pool state after swap_no_for_yes
 * Returns the amount of YES coins the user receives
 */
export function mockSwapNoForYes(poolId: string, noAmount: bigint): bigint {
  const state = mockPoolStates.get(poolId);
  if (!state || state.yesBalance === BigInt(0) || state.noBalance === BigInt(0)) {
    throw new Error("Insufficient liquidity");
  }
  
  // CPMM: (yes_balance - yes_out) * (no_balance + no_in) = k
  // Solving for yes_out: yes_out = (yes_balance * no_in) / (no_balance + no_in)
  const numerator = state.yesBalance * noAmount;
  const denominator = state.noBalance + noAmount;
  const yesOut = numerator / denominator;
  
  // Update pool
  state.yesBalance -= yesOut;
  state.noBalance += noAmount;
  state.k = state.yesBalance * state.noBalance;
  
  return yesOut;
}

/**
 * Update mock pool state after swap_yes_for_no
 * Returns the amount of NO coins the user receives
 */
export function mockSwapYesForNo(poolId: string, yesAmount: bigint): bigint {
  const state = mockPoolStates.get(poolId);
  if (!state || state.yesBalance === BigInt(0) || state.noBalance === BigInt(0)) {
    throw new Error("Insufficient liquidity");
  }
  
  // CPMM: (yes_balance + yes_in) * (no_balance - no_out) = k
  // Solving for no_out: no_out = (no_balance * yes_in) / (yes_balance + yes_in)
  const numerator = state.noBalance * yesAmount;
  const denominator = state.yesBalance + yesAmount;
  const noOut = numerator / denominator;
  
  // Update pool
  state.yesBalance += yesAmount;
  state.noBalance -= noOut;
  state.k = state.yesBalance * state.noBalance;
  
  return noOut;
}

/**
 * Get mock pool data in the format expected by the UI
 */
export function getMockPoolData(poolId: string): {
  id: string;
  marketId: string;
  yesBalance: string;
  noBalance: string;
  k: string;
  collateral: string;
} | null {
  const state = mockPoolStates.get(poolId);
  if (!state) {
    return null;
  }
  
  return {
    id: poolId,
    marketId: "", // Not needed for mock
    yesBalance: state.yesBalance.toString(),
    noBalance: state.noBalance.toString(),
    k: state.k.toString(),
    collateral: state.collateral.toString(),
  };
}

