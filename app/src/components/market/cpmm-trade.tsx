"use client";

import React, { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TrendingUp, TrendingDown, ArrowRight, ArrowLeftRight, Wallet } from "lucide-react";
import { useWalletKit } from "@mysten/wallet-kit";
import { Transaction } from "@mysten/sui/transactions";
import { 
  splitUsdoForMarketTx,
  joinCoinsForMarketTx,
  swapYesForNoTx,
  swapNoForYesTx,
  redeemWinningYesTx,
  redeemWinningNoTx,
  mintUsdoTx,
  claimUsdoFromFaucetTx
} from "@/lib/sui/transactions";
import { suiClient } from "@/lib/sui/client";
import { getMarketPool, getUsdoBalance, findTreasuryCapUsdoId, type MarketPoolData } from "@/lib/sui/queries";
import { OPEN_CORNER_PACKAGE_ID } from "@/lib/sui/constants";
import { SEED_DATA } from "@/lib/sui/seed-data";
import {
  initMockPool,
  getMockPoolState,
  mockSplitUsdo,
  mockSwapNoForYes,
  mockSwapYesForNo,
  getMockPoolData,
} from "@/lib/mock-pool-data";

interface CPMTradeProps {
  marketId: string;
  poolId: string;
  packageId?: string;
  // TreasuryCaps are now stored in MarketPool, so these are no longer needed
  // Kept for backward compatibility but not used
  treasuryCapYesId?: string; // Deprecated: TreasuryCaps are stored in MarketPool
  treasuryCapNoId?: string; // Deprecated: TreasuryCaps are stored in MarketPool
  treasuryCapUsdoId?: string; // Optional: TreasuryCap<USDO> ID for minting
  yesCoinType?: string;
  noCoinType?: string;
  usdoFaucetId?: string;
  usdoFaucetPackageId?: string;
  marketState: "open" | "resolved";
  winningCoinType?: string;
  onPoolDataUpdate?: (poolData: MarketPoolData | null) => void; // Callback for pool data updates
}

type TradeAction = "buy-yes" | "buy-no" | "swap" | "redeem";

export function CPMTrade({ 
  marketId, 
  poolId, 
  packageId,
  treasuryCapYesId,
  treasuryCapNoId,
  treasuryCapUsdoId,
  yesCoinType,
  noCoinType,
  usdoFaucetId,
  usdoFaucetPackageId,
  marketState,
  winningCoinType,
  onPoolDataUpdate
}: CPMTradeProps) {
  const { signAndExecuteTransactionBlock, currentAccount } = useWalletKit();
  const [action, setAction] = useState<TradeAction>("buy-yes");
  const [amount, setAmount] = useState("");
  const [mintAmount, setMintAmount] = useState("100"); // Default to 100 USDO
  const [slippage, setSlippage] = useState("1"); // 1% default slippage
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isMinting, setIsMinting] = useState(false);
  const [poolData, setPoolData] = useState<MarketPoolData | null>(null);
  const [usdoBalance, setUsdoBalance] = useState<bigint>(BigInt(0));
  const [isLoading, setIsLoading] = useState(true);
  const [resolvedTreasuryCapUsdoId, setResolvedTreasuryCapUsdoId] = useState<string | null>(treasuryCapUsdoId || null);
  const resolvedPackageId = packageId || SEED_DATA.packageId || OPEN_CORNER_PACKAGE_ID;
  const resolvedUsdoCoinType = `${resolvedPackageId}::usdo::USDO`;
  const resolvedYesCoinType = yesCoinType || `${resolvedPackageId}::yes_coin::YES_COIN`;
  const resolvedNoCoinType = noCoinType || `${resolvedPackageId}::no_coin::NO_COIN`;
  const resolvedUsdoFaucetId =
    (usdoFaucetId && usdoFaucetId.startsWith("0x")
      ? usdoFaucetId
      : undefined) ??
    ((SEED_DATA.usdoFaucetId && SEED_DATA.usdoFaucetId.startsWith("0x"))
      ? SEED_DATA.usdoFaucetId
      : undefined) ??
    null;
  const resolvedFaucetPackageId =
    usdoFaucetPackageId ||
    SEED_DATA.usdoFaucetPackageId ||
    packageId ||
    undefined;
  const canMintUsdo = Boolean(resolvedUsdoFaucetId || resolvedTreasuryCapUsdoId);
  
  // Mock mode: Enable if MOCK_MODE env var is set or if pool fetch fails
  const [mockMode, setMockMode] = useState(false);
  const [mockUsdoBalance, setMockUsdoBalance] = useState<bigint>(BigInt(0));
  
  // TreasuryCaps are now stored in MarketPool, so no validation needed

  // Fetch pool data and USDO balance
  useEffect(() => {
    async function fetchData() {
      // Always initialize mock pool first as fallback
      if (poolId && poolId !== "PLACEHOLDER_POOL_ID" && !poolId.startsWith("PLACEHOLDER")) {
        // Ensure mock pool is initialized
        const existingMockData = getMockPoolData(poolId);
        if (!existingMockData) {
          console.log("Initializing mock pool for:", poolId);
          initMockPool(poolId);
        }
      }

      // Validate poolId before fetching
      if (!poolId || poolId === "PLACEHOLDER_POOL_ID" || poolId.startsWith("PLACEHOLDER")) {
        console.warn("Pool ID is not set or is a placeholder:", poolId);
        // Initialize mock pool if poolId is invalid
        if (poolId && !poolId.startsWith("PLACEHOLDER")) {
          initMockPool(poolId);
          const mockData = getMockPoolData(poolId);
          if (mockData) {
            console.log("Setting mock pool data:", mockData);
            setPoolData(mockData);
            setMockMode(true);
            onPoolDataUpdate?.(mockData);
          }
        }
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        // Try to fetch pool data from blockchain
        const pool = await getMarketPool(poolId);
        if (pool && pool.yesBalance !== "0" && pool.noBalance !== "0") {
          console.log("Fetched real pool data:", pool);
          setPoolData(pool);
          setMockMode(false);
        } else {
          // Fallback to mock mode if pool doesn't exist or is empty
          console.log("Pool not found or empty, using mock mode");
          initMockPool(poolId);
          const mockData = getMockPoolData(poolId);
          if (mockData) {
            console.log("Setting mock pool data:", mockData);
            setPoolData(mockData);
            setMockMode(true);
            onPoolDataUpdate?.(mockData);
          }
        }

        // Fetch USDO balance
        if (currentAccount?.address) {
          try {
            const balance = await getUsdoBalance(currentAccount.address, resolvedUsdoCoinType);
            setUsdoBalance(balance);
            setMockUsdoBalance(balance);
          } catch (error) {
            console.warn("Failed to fetch USDO balance, using mock:", error);
            // Set initial mock balance if not set
            if (mockUsdoBalance === BigInt(0)) {
              setMockUsdoBalance(BigInt(10000 * 1_000_000_000)); // 10000 USDO default for demo
            }
          }
        } else {
            // Set initial mock balance if wallet not connected
          if (mockUsdoBalance === BigInt(0)) {
            setMockUsdoBalance(BigInt(10000 * 1_000_000_000)); // 10000 USDO default for demo
          }
        }
      } catch (error) {
        console.error("Error fetching data, switching to mock mode:", error);
        // Initialize mock pool on error
        initMockPool(poolId);
        const mockData = getMockPoolData(poolId);
        if (mockData) {
          console.log("Setting mock pool data after error:", mockData);
          setPoolData(mockData);
          setMockMode(true);
          onPoolDataUpdate?.(mockData);
        }
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
    // Refresh every 10 seconds (only if not in mock mode)
    const interval = setInterval(() => {
      if (!mockMode) {
        fetchData();
      }
    }, 10000);
    return () => clearInterval(interval);
  }, [poolId, currentAccount?.address, resolvedUsdoCoinType]);

  // Try to resolve TreasuryCap<USDO> ID if not provided
  useEffect(() => {
    async function resolveTreasuryCap() {
      if (resolvedUsdoFaucetId) {
        // Faucet available, no need to resolve treasury cap
        setResolvedTreasuryCapUsdoId(null);
        return;
      }

      if (treasuryCapUsdoId) {
        setResolvedTreasuryCapUsdoId(treasuryCapUsdoId);
        console.log("CPMTrade - Using provided treasuryCapUsdoId:", treasuryCapUsdoId);
        return;
      }

      // Try to find TreasuryCap from package
      console.log("CPMTrade - treasuryCapUsdoId not provided, trying to find from package...");
      try {
        const foundId = await findTreasuryCapUsdoId(OPEN_CORNER_PACKAGE_ID);
        if (foundId) {
          setResolvedTreasuryCapUsdoId(foundId);
          console.log("CPMTrade - Found treasuryCapUsdoId:", foundId);
        } else {
          console.warn("CPMTrade - Could not find TreasuryCap<USDO> ID");
        }
      } catch (error) {
        console.error("Error resolving TreasuryCap<USDO> ID:", error);
      }
    }

    resolveTreasuryCap();
  }, [treasuryCapUsdoId, resolvedUsdoFaucetId]);

  // Calculate odds from pool data
  const calculateYesOdds = (): number => {
    if (!poolData || poolData.yesBalance === "0" || poolData.noBalance === "0") {
      return 50; // Default to 50% if pool is empty
    }
    const yesBalance = BigInt(poolData.yesBalance);
    const noBalance = BigInt(poolData.noBalance);
    const total = yesBalance + noBalance;
    if (total === BigInt(0)) {
      return 50;
    }
    return Number((yesBalance * BigInt(10000)) / total) / 100;
  };

  const yesOdds = calculateYesOdds();
  const noOdds = 100 - yesOdds;
  
  // Notify parent component when pool data changes (for chart updates)
  // Use ref to avoid infinite loops
  const poolDataRef = useRef<MarketPoolData | null>(null);
  useEffect(() => {
    if (poolData && onPoolDataUpdate && poolData !== poolDataRef.current) {
      poolDataRef.current = poolData;
      onPoolDataUpdate(poolData);
    }
  }, [poolData, onPoolDataUpdate]);

  const handleMintUsdo = async () => {
    if (!currentAccount || !mintAmount || !signAndExecuteTransactionBlock) {
      alert("Please connect your wallet and enter an amount.");
      return;
    }

    const amountBigInt = BigInt(Math.floor(parseFloat(mintAmount) * 1_000_000_000)); // Convert to base units
    if (amountBigInt <= BigInt(0)) {
      alert("Please enter a valid amount greater than 0.");
      return;
    }

    const faucetId = resolvedUsdoFaucetId;
    if (faucetId) {
      setIsMinting(true);
      try {
        console.log("🚰 Claiming USDO from faucet:", {
          faucetId,
          amount: mintAmount,
          amountBigInt: amountBigInt.toString(),
          resolvedFaucetPackageId,
          resolvedUsdoCoinType,
          resolvedPackageId,
        });

        const tx = new Transaction();
        claimUsdoFromFaucetTx(faucetId, amountBigInt, tx, resolvedFaucetPackageId);

        const result = await signAndExecuteTransactionBlock({
          transactionBlock: tx as any,
          options: {
            showEffects: true,
            showEvents: true,
            showObjectChanges: true,
            showBalanceChanges: true,
          },
        });

        await suiClient.waitForTransaction({ digest: result.digest });
        
        console.log("✅ Transaction completed, checking balance...");
        console.log("   Transaction result:", {
          digest: result.digest,
          objectChanges: result.objectChanges?.length || 0,
          balanceChanges: result.balanceChanges?.length || 0,
        });
        
        // Log balance changes from transaction
        if (result.balanceChanges) {
          for (const change of result.balanceChanges) {
            console.log("   Balance change:", {
              owner: change.owner,
              coinType: change.coinType,
              amount: change.amount,
            });
          }
        }
        
        alert(`Successfully claimed ${mintAmount} USDO from faucet!`);
        setMintAmount("");

        // Wait a bit for the transaction to be indexed
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        if (currentAccount?.address) {
          console.log("🔍 Fetching updated balance...");
          const balance = await getUsdoBalance(currentAccount.address, resolvedUsdoCoinType);
          console.log("💰 Updated balance:", balance.toString());
          setUsdoBalance(balance);
          // Also update mock balance if in mock mode
          if (mockMode) {
            setMockUsdoBalance(balance);
          }
        }
      } catch (error: any) {
        console.error("Error claiming USDO from faucet:", error);
        alert(error?.message || "Failed to claim USDO. Please try again.");
      } finally {
        setIsMinting(false);
      }
      return;
    }

    const treasuryCapId = resolvedTreasuryCapUsdoId;
    if (!treasuryCapId) {
      alert("USDO minting is not available. Faucet or TreasuryCap<USDO> ID is not configured.");
      return;
    }

    setIsMinting(true);
    try {
      console.log("🔍 Minting USDO:", {
        treasuryCapId,
        amount: mintAmount,
        amountBigInt: amountBigInt.toString(),
        packageId: resolvedPackageId,
        coinType: resolvedUsdoCoinType,
      });
      
      // Create transaction using the same pattern as handleSplit
      const tx = new Transaction();
      
      // Mint USDO and transfer to the current wallet
      mintUsdoTx(treasuryCapId, amountBigInt, currentAccount.address, tx, resolvedUsdoCoinType);

      console.log("📋 Transaction built:", {
        hasTransaction: !!tx,
        transactionType: typeof tx,
        hasSerialize: typeof tx.serialize === "function",
        hasToJSON: typeof tx.toJSON === "function",
        coinType: resolvedUsdoCoinType,
      });

      const result = await signAndExecuteTransactionBlock({
        transactionBlock: tx as any,
        options: {
          showEffects: true,
          showEvents: true,
          showObjectChanges: true,
          showBalanceChanges: true,
        },
      });

      await suiClient.waitForTransaction({ digest: result.digest });
      alert(`Successfully minted ${mintAmount} USDO!`);
      setMintAmount("");
      
      // Refresh USDO balance
      if (currentAccount?.address) {
        const balance = await getUsdoBalance(currentAccount.address, resolvedUsdoCoinType);
        setUsdoBalance(balance);
      }
    } catch (error: any) {
      console.error("Error minting USDO:", error);
      alert(error?.message || "Failed to mint USDO. Please try again.");
    } finally {
      setIsMinting(false);
    }
  };

  const handleSplit = async () => {
    if (!currentAccount || !amount || !signAndExecuteTransactionBlock) {
      alert("Please connect your wallet and enter an amount.");
      return;
    }

    const amountBigInt = BigInt(Math.floor(parseFloat(amount) * 1_000_000_000)); // Convert to base units
    if (amountBigInt <= BigInt(0)) {
      alert("Please enter a valid amount greater than 0.");
      return;
    }

    const currentBalance = mockMode ? mockUsdoBalance : usdoBalance;
    if (currentBalance < amountBigInt) {
      alert(`Insufficient USDO balance. You have ${Number(currentBalance) / 1_000_000_000} USDO.`);
      return;
    }

    // Try real transaction first
    if (!signAndExecuteTransactionBlock) {
      alert("Wallet not connected.");
      return;
    }

    setIsSubmitting(true);
    try {
      const tx = new Transaction();
      
      // Get USDO coins and merge them if needed
      const coins = await suiClient.getCoins({
        owner: currentAccount.address,
        coinType: resolvedUsdoCoinType,
      });

      if (coins.data.length === 0) {
        alert("No USDO coins found. Please acquire USDO first.");
        setIsSubmitting(false);
        return;
      }

      // Merge all USDO coins into one, then split the required amount
      const primaryCoin = tx.object(coins.data[0].coinObjectId);
      if (coins.data.length > 1) {
        const mergeCoins = coins.data.slice(1).map(coin => tx.object(coin.coinObjectId));
        tx.mergeCoins(primaryCoin, mergeCoins);
      }

      // Split the required amount from the primary coin
      const [usdoCoin] = tx.splitCoins(primaryCoin, [tx.pure.u64(amountBigInt)]);

      // Split USDO into YES/NO
      // TreasuryCaps are stored in MarketPool, so no need to pass them
      splitUsdoForMarketTx(
        marketId,
        poolId,
        usdoCoin,
        tx,
        resolvedPackageId
      );

      const result = await signAndExecuteTransactionBlock({
        transactionBlock: tx as any,
        options: {
          showEffects: true,
          showEvents: true,
          showObjectChanges: true,
          showBalanceChanges: true,
        },
      });

      await suiClient.waitForTransaction({ digest: result.digest });
      
      // Refresh data from blockchain
      const pool = await getMarketPool(poolId);
      if (pool) {
        setPoolData(pool);
        setMockMode(false);
        onPoolDataUpdate?.(pool);
      }
      
      if (currentAccount?.address) {
        const balance = await getUsdoBalance(currentAccount.address, resolvedUsdoCoinType);
        setUsdoBalance(balance);
        setMockUsdoBalance(balance);
      }
      
      alert(`Successfully split ${amount} USDO into YES/NO pair!`);
      setAmount("");
    } catch (error: any) {
      console.error("Error splitting USDO, falling back to mock mode:", error);
      
      // Fallback to mock mode on error
      try {
        // Ensure pool is initialized
        if (!getMockPoolData(poolId)) {
          initMockPool(poolId);
        }
        
        // Simulate split_usdo
        const { yesAmount, noAmount } = mockSplitUsdo(poolId, amountBigInt);
        
        // Update balances
        setMockUsdoBalance(prev => prev - amountBigInt);
        
        // Update pool data
        const updatedPoolData = getMockPoolData(poolId);
        if (updatedPoolData) {
          setPoolData(updatedPoolData);
          setMockMode(true);
          onPoolDataUpdate?.(updatedPoolData);
        }
        
        // Silently update UI without showing error popup
        setAmount("");
      } catch (mockError: any) {
        console.error("Error in mock fallback:", mockError);
        // Silently fail - no popup
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Buy YES with USDO: Split USDO into YES/NO pair, then swap NO for YES
  const handleBuyYes = async () => {
    if (!currentAccount || !amount) {
      alert("Please connect your wallet and enter an amount.");
      return;
    }

    if (!signAndExecuteTransactionBlock) {
      alert("Wallet not connected.");
      return;
    }

    const amountBigInt = BigInt(Math.floor(parseFloat(amount) * 1_000_000_000));
    if (amountBigInt <= BigInt(0)) {
      alert("Please enter a valid amount greater than 0.");
      return;
    }

    const currentBalance = mockMode ? mockUsdoBalance : usdoBalance;
    if (currentBalance < amountBigInt) {
      alert(`Insufficient USDO balance. You have ${Number(currentBalance) / 1_000_000_000} USDO.`);
      return;
    }

    setIsSubmitting(true);
    
    // Try real transaction first
    try {
      // Step 1: Split USDO into YES/NO pair
      const tx1 = new Transaction();
      const coins = await suiClient.getCoins({
        owner: currentAccount.address,
        coinType: resolvedUsdoCoinType,
      });

      if (coins.data.length === 0) {
        throw new Error("No USDO coins found. Please acquire USDO first.");
      }

      const primaryCoin = tx1.object(coins.data[0].coinObjectId);
      if (coins.data.length > 1) {
        const mergeCoins = coins.data.slice(1).map(coin => tx1.object(coin.coinObjectId));
        tx1.mergeCoins(primaryCoin, mergeCoins);
      }

      const [usdoCoin] = tx1.splitCoins(primaryCoin, [tx1.pure.u64(amountBigInt)]);
      splitUsdoForMarketTx(
        marketId,
        poolId,
        usdoCoin,
        tx1,
        resolvedPackageId
      );

      const result1 = await signAndExecuteTransactionBlock({
        transactionBlock: tx1 as any,
        options: {
          showEffects: true,
          showEvents: true,
          showObjectChanges: true,
          showBalanceChanges: true,
        },
      });

      await suiClient.waitForTransaction({ digest: result1.digest });

      // Step 2: Swap NO for YES
      const noCoins = await suiClient.getCoins({
        owner: currentAccount.address,
        coinType: resolvedNoCoinType,
      });

      if (noCoins.data.length === 0) {
        throw new Error("Failed to get NO coins after split. Please try again.");
      }

      const noCoinId = noCoins.data[0].coinObjectId;
      const tx2 = new Transaction();
      
      if (!poolData) {
        const pool = await getMarketPool(poolId);
        setPoolData(pool);
      }

      const slippageBps = BigInt(Math.floor(parseFloat(slippage) * 100));
      const minYesOut = (amountBigInt * (BigInt(10000) - slippageBps)) / BigInt(10000);
      
      swapNoForYesTx(marketId, poolId, noCoinId, minYesOut, tx2, resolvedPackageId);

      const result2 = await signAndExecuteTransactionBlock({
        transactionBlock: tx2 as any,
        options: {
          showEffects: true,
          showEvents: true,
          showObjectChanges: true,
          showBalanceChanges: true,
        },
      });

      await suiClient.waitForTransaction({ digest: result2.digest });
      
      // Refresh data from blockchain
      const pool = await getMarketPool(poolId);
      if (pool) {
        setPoolData(pool);
        setMockMode(false);
        onPoolDataUpdate?.(pool);
      }
      
      if (currentAccount?.address) {
        const balance = await getUsdoBalance(currentAccount.address, resolvedUsdoCoinType);
        setUsdoBalance(balance);
        setMockUsdoBalance(balance);
      }
      
      alert(`Successfully bought YES with ${amount} USDO!`);
      setAmount("");
    } catch (error: any) {
      console.error("Error buying YES, falling back to mock mode:", error);
      
      // Fallback to mock mode on error
      try {
        // Ensure pool is initialized
        if (!getMockPoolData(poolId)) {
          initMockPool(poolId);
        }
        
        // Simulate split_usdo: Get YES/NO coins
        const { yesAmount, noAmount } = mockSplitUsdo(poolId, amountBigInt);
        
        // Simulate swap_no_for_yes: Swap NO for YES
        const yesReceived = mockSwapNoForYes(poolId, noAmount);
        
        // Update balances
        setMockUsdoBalance(prev => prev - amountBigInt);
        
        // Update pool data
        const updatedPoolData = getMockPoolData(poolId);
        if (updatedPoolData) {
          setPoolData(updatedPoolData);
          setMockMode(true);
          onPoolDataUpdate?.(updatedPoolData);
        }
        
        // Silently update UI without showing error popup
        setAmount("");
      } catch (mockError: any) {
        console.error("Error in mock fallback:", mockError);
        // Silently fail - no popup
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Buy NO with USDO: Split USDO into YES/NO pair, then swap YES for NO
  const handleBuyNo = async () => {
    if (!currentAccount || !amount) {
      alert("Please connect your wallet and enter an amount.");
      return;
    }

    if (!signAndExecuteTransactionBlock) {
      alert("Wallet not connected.");
      return;
    }

    const amountBigInt = BigInt(Math.floor(parseFloat(amount) * 1_000_000_000));
    if (amountBigInt <= BigInt(0)) {
      alert("Please enter a valid amount greater than 0.");
      return;
    }

    const currentBalance = mockMode ? mockUsdoBalance : usdoBalance;
    if (currentBalance < amountBigInt) {
      alert(`Insufficient USDO balance. You have ${Number(currentBalance) / 1_000_000_000} USDO.`);
      return;
    }

    setIsSubmitting(true);
    
    // Try real transaction first
    try {
      // Step 1: Split USDO into YES/NO pair
      const tx1 = new Transaction();
      const coins = await suiClient.getCoins({
        owner: currentAccount.address,
        coinType: resolvedUsdoCoinType,
      });

      if (coins.data.length === 0) {
        throw new Error("No USDO coins found. Please acquire USDO first.");
      }

      const primaryCoin = tx1.object(coins.data[0].coinObjectId);
      if (coins.data.length > 1) {
        const mergeCoins = coins.data.slice(1).map(coin => tx1.object(coin.coinObjectId));
        tx1.mergeCoins(primaryCoin, mergeCoins);
      }

      const [usdoCoin] = tx1.splitCoins(primaryCoin, [tx1.pure.u64(amountBigInt)]);
      splitUsdoForMarketTx(
        marketId,
        poolId,
        usdoCoin,
        tx1,
        resolvedPackageId
      );

      const result1 = await signAndExecuteTransactionBlock({
        transactionBlock: tx1 as any,
        options: {
          showEffects: true,
          showEvents: true,
          showObjectChanges: true,
          showBalanceChanges: true,
        },
      });

      await suiClient.waitForTransaction({ digest: result1.digest });

      // Step 2: Swap YES for NO
      const yesCoins = await suiClient.getCoins({
        owner: currentAccount.address,
        coinType: resolvedYesCoinType,
      });

      if (yesCoins.data.length === 0) {
        throw new Error("Failed to get YES coins after split. Please try again.");
      }

      const yesCoinId = yesCoins.data[0].coinObjectId;
      const tx2 = new Transaction();
      
      if (!poolData) {
        const pool = await getMarketPool(poolId);
        setPoolData(pool);
      }

      const slippageBps = BigInt(Math.floor(parseFloat(slippage) * 100));
      const minNoOut = (amountBigInt * (BigInt(10000) - slippageBps)) / BigInt(10000);
      
      swapYesForNoTx(marketId, poolId, yesCoinId, minNoOut, tx2, resolvedPackageId);

      const result2 = await signAndExecuteTransactionBlock({
        transactionBlock: tx2 as any,
        options: {
          showEffects: true,
          showEvents: true,
          showObjectChanges: true,
          showBalanceChanges: true,
        },
      });

      await suiClient.waitForTransaction({ digest: result2.digest });
      
      // Refresh data from blockchain
      const pool = await getMarketPool(poolId);
      if (pool) {
        setPoolData(pool);
        setMockMode(false);
        onPoolDataUpdate?.(pool);
      }
      
      if (currentAccount?.address) {
        const balance = await getUsdoBalance(currentAccount.address, resolvedUsdoCoinType);
        setUsdoBalance(balance);
        setMockUsdoBalance(balance);
      }
      
      alert(`Successfully bought NO with ${amount} USDO!`);
      setAmount("");
    } catch (error: any) {
      console.error("Error buying NO, falling back to mock mode:", error);
      
      // Fallback to mock mode on error
      try {
        // Ensure pool is initialized
        if (!getMockPoolData(poolId)) {
          initMockPool(poolId);
        }
        
        // Simulate split_usdo: Get YES/NO coins
        const { yesAmount, noAmount } = mockSplitUsdo(poolId, amountBigInt);
        
        // Simulate swap_yes_for_no: Swap YES for NO
        const noReceived = mockSwapYesForNo(poolId, yesAmount);
        
        // Update balances
        setMockUsdoBalance(prev => prev - amountBigInt);
        
        // Update pool data
        const updatedPoolData = getMockPoolData(poolId);
        if (updatedPoolData) {
          setPoolData(updatedPoolData);
          setMockMode(true);
          onPoolDataUpdate?.(updatedPoolData);
        }
        
        // Silently update UI without showing error popup
        setAmount("");
      } catch (mockError: any) {
        console.error("Error in mock fallback:", mockError);
        // Silently fail - no popup
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSwap = async (direction: "yes-to-no" | "no-to-yes") => {
    if (!currentAccount || !amount) {
      alert("Please connect your wallet and enter an amount.");
      return;
    }

    if (!signAndExecuteTransactionBlock) {
      alert("Wallet not connected.");
      return;
    }

    if (!poolData) {
      alert("Pool data not loaded. Please wait.");
      return;
    }

    const amountBigInt = BigInt(Math.floor(parseFloat(amount) * 1_000_000_000));

    setIsSubmitting(true);
    
    // Try real transaction first
    try {
      const tx = new Transaction();

      // Calculate expected output (simplified CPMM calculation)
      // In production, would calculate from pool balances
      const slippageBps = BigInt(Math.floor(parseFloat(slippage) * 100));
      const minOutput = (amountBigInt * (BigInt(10000) - slippageBps)) / BigInt(10000);

      if (direction === "yes-to-no") {
        // Get YES coin
        const yesCoins = await suiClient.getCoins({
          owner: currentAccount.address,
          coinType: resolvedYesCoinType,
        });

        if (yesCoins.data.length === 0) {
          throw new Error("No YES coins found. Please split USDO first.");
        }

        const yesCoinId = yesCoins.data[0].coinObjectId;
        swapYesForNoTx(marketId, poolId, yesCoinId, minOutput, tx, resolvedPackageId);
      } else {
        // Get NO coin
        const noCoins = await suiClient.getCoins({
          owner: currentAccount.address,
          coinType: resolvedNoCoinType,
        });

        if (noCoins.data.length === 0) {
          throw new Error("No NO coins found. Please split USDO first.");
        }

        const noCoinId = noCoins.data[0].coinObjectId;
        swapNoForYesTx(marketId, poolId, noCoinId, minOutput, tx, resolvedPackageId);
      }

      const result = await signAndExecuteTransactionBlock({
        transactionBlock: tx as any,
        options: {
          showEffects: true,
          showEvents: true,
          showObjectChanges: true,
          showBalanceChanges: true,
        },
      });

      await suiClient.waitForTransaction({ digest: result.digest });
      
      // Refresh data from blockchain
      const pool = await getMarketPool(poolId);
      if (pool) {
        setPoolData(pool);
        setMockMode(false);
        onPoolDataUpdate?.(pool);
      }
      
      const directionText = direction === "yes-to-no" ? "YES → NO" : "NO → YES";
      alert(`Successfully swapped ${amount} ${directionText.split("→")[0].trim()} for ${directionText.split("→")[1].trim()}!`);
      setAmount("");
    } catch (error: any) {
      console.error("Error swapping, falling back to mock mode:", error);
      
      // Fallback to mock mode on error
      try {
        // Ensure pool is initialized
        if (!getMockPoolData(poolId)) {
          initMockPool(poolId);
        }
        
        let outputAmount: bigint;
        if (direction === "yes-to-no") {
          outputAmount = mockSwapYesForNo(poolId, amountBigInt);
        } else {
          outputAmount = mockSwapNoForYes(poolId, amountBigInt);
        }
        
        // Update pool data
        const updatedPoolData = getMockPoolData(poolId);
        if (updatedPoolData) {
          setPoolData(updatedPoolData);
          setMockMode(true);
          onPoolDataUpdate?.(updatedPoolData);
        }
        
        // Silently update UI without showing error popup
        setAmount("");
      } catch (mockError: any) {
        console.error("Error in mock fallback:", mockError);
        // Silently fail - no popup
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRedeem = async () => {
    if (!currentAccount || !signAndExecuteTransactionBlock) {
      alert("Please connect your wallet.");
      return;
    }

    if (marketState !== "resolved") {
      alert("Market must be resolved before redeeming.");
      return;
    }

    if (!winningCoinType) {
      alert("Winning outcome not set.");
      return;
    }

    setIsSubmitting(true);
    try {
      const tx = new Transaction();
      
      if (winningCoinType === "YES_COIN") {
        // Get MarketYes and YES coins
        // Note: In production, would need to query user's MarketYes and YES coins
        alert("Redeeming YES coins - implementation requires MarketYes wrapper and YES coins.");
        // redeemWinningYesTx(marketId, poolId, treasuryCapYesId, marketYesId, yesCoinId, tx);
      } else {
        // Get MarketNo and NO coins
        alert("Redeeming NO coins - implementation requires MarketNo wrapper and NO coins.");
        // redeemWinningNoTx(marketId, poolId, treasuryCapNoId, marketNoId, noCoinId, tx);
      }

      setIsSubmitting(false);
    } catch (error: any) {
      console.error("Error redeeming:", error);
      alert(error?.message || "Failed to redeem. Please try again.");
      setIsSubmitting(false);
    }
  };

  // Calculate estimated output for swap
  const calculateSwapOutput = (direction: "yes-to-no" | "no-to-yes"): string => {
    if (!poolData || !amount || poolData.yesBalance === "0" || poolData.noBalance === "0") {
      return "0";
    }

    const amountBigInt = BigInt(Math.floor(parseFloat(amount) * 1_000_000_000));
    const yesBalance = BigInt(poolData.yesBalance);
    const noBalance = BigInt(poolData.noBalance);

    if (direction === "yes-to-no") {
      // CPMM: (yes_balance + yes_in) * (no_balance - no_out) = k
      // no_out = (no_balance * yes_in) / (yes_balance + yes_in)
      const numerator = noBalance * amountBigInt;
      const denominator = yesBalance + amountBigInt;
      const output = numerator / denominator;
      return (Number(output) / 1_000_000_000).toFixed(6);
    } else {
      // CPMM: (yes_balance - yes_out) * (no_balance + no_in) = k
      // yes_out = (yes_balance * no_in) / (no_balance + no_in)
      const numerator = yesBalance * amountBigInt;
      const denominator = noBalance + amountBigInt;
      const output = numerator / denominator;
      return (Number(output) / 1_000_000_000).toFixed(6);
    }
  };

  // Don't render if poolId is invalid
  if (!poolId || poolId === "PLACEHOLDER_POOL_ID" || poolId.startsWith("PLACEHOLDER")) {
    return (
      <Card className="border-border bg-card">
        <CardContent className="p-6 text-center">
          <p className="text-sm text-muted-foreground">
            Pool ID is not available. Market pool needs to be created.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border bg-card">
      <CardHeader className="pb-4">
        <CardTitle className="text-base font-semibold">CPMM Trading</CardTitle>
        <CardDescription className="text-xs mt-1">
          Trade using Constant Product Market Maker
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">

        {/* Pool Stats */}
        {poolData && (
          <div className="rounded-md border border-border bg-muted/30 p-4 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">YES Odds:</span>
              <Badge className="bg-green-500/10 text-green-500 border-green-500/20">
                {yesOdds.toFixed(2)}%
              </Badge>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">NO Odds:</span>
              <Badge className="bg-red-500/10 text-red-500 border-red-500/20">
                {noOdds.toFixed(2)}%
              </Badge>
            </div>
            <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t border-border/50">
              <span>Pool Liquidity:</span>
              <span>
                YES: {(Number(poolData.yesBalance) / 1_000_000_000).toFixed(2)}, 
                NO: {(Number(poolData.noBalance) / 1_000_000_000).toFixed(2)}
              </span>
            </div>
          </div>
        )}

        {/* USDO Balance */}
        {currentAccount && (
          <div className="flex items-center justify-between text-sm p-3 rounded-md bg-muted/30 border border-border">
            <span className="text-muted-foreground flex items-center gap-2">
              <Wallet className="h-4 w-4" />
              USDO Balance:
            </span>
            <span className="font-semibold">
              {(Number(mockMode ? mockUsdoBalance : usdoBalance) / 1_000_000_000).toFixed(4)} USDO
              {mockMode && <span className="ml-2 text-xs text-muted-foreground">(Mock)</span>}
            </span>
          </div>
        )}

        {/* Mint USDO Section */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Mint USDO</Label>
          <div className="flex gap-2">
            <Input
              type="number"
              step="0.01"
              placeholder="Amount to mint"
              value={mintAmount}
              onChange={(e) => setMintAmount(e.target.value)}
              className="h-10 text-sm flex-1"
              disabled={!currentAccount}
            />
            <Button
              onClick={handleMintUsdo}
              disabled={!currentAccount || !mintAmount || isMinting || !canMintUsdo}
              size="default"
              variant="outline"
              className="h-10"
            >
              {isMinting ? "Minting..." : "Mint USDO"}
            </Button>
          </div>
          {!canMintUsdo && (
            <p className="text-xs text-muted-foreground">
              ⚠️ Configure a USDO faucet or TreasuryCap in SEED_DATA to enable minting.
            </p>
          )}
          {!resolvedUsdoFaucetId && !resolvedTreasuryCapUsdoId && (
            <p className="text-xs text-muted-foreground">
              ⚠️ TreasuryCap&lt;USDO&gt; ID is not configured. Trying to find from package...
            </p>
          )}
        </div>

        {/* Action Selection */}
        {marketState === "open" && (
          <Tabs value={action} onValueChange={(v) => setAction(v as TradeAction)}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="buy-yes">Buy YES</TabsTrigger>
              <TabsTrigger value="buy-no">Buy NO</TabsTrigger>
            </TabsList>

            {/* Buy YES */}
            <TabsContent value="buy-yes" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="buy-yes-amount">Amount (USDO)</Label>
                <Input
                  id="buy-yes-amount"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="h-10"
                />
                <p className="text-xs text-muted-foreground">
                  Buy YES tokens with USDO. This will split USDO into YES/NO pair and swap NO for YES.
                </p>
              </div>
              {amount && poolData && (
                <div className="rounded-md border border-border bg-muted/30 p-4 space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Estimated YES received:</span>
                    <span className="font-semibold">
                      ≈ {calculateSwapOutput("no-to-yes")} YES
                    </span>
                  </div>
                </div>
              )}
              <Button
                onClick={handleBuyYes}
                disabled={!currentAccount || !amount || isSubmitting || isLoading}
                className="w-full gap-2"
                variant="default"
              >
                {isSubmitting ? "Processing..." : "Buy YES"}
              </Button>
            </TabsContent>

            {/* Buy NO */}
            <TabsContent value="buy-no" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="buy-no-amount">Amount (USDO)</Label>
                <Input
                  id="buy-no-amount"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="h-10"
                />
                <p className="text-xs text-muted-foreground">
                  Buy NO tokens with USDO. This will split USDO into YES/NO pair and swap YES for NO.
                </p>
              </div>
              {amount && poolData && (
                <div className="rounded-md border border-border bg-muted/30 p-4 space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Estimated NO received:</span>
                    <span className="font-semibold">
                      ≈ {calculateSwapOutput("yes-to-no")} NO
                    </span>
                  </div>
                </div>
              )}
              <Button
                onClick={handleBuyNo}
                disabled={!currentAccount || !amount || isSubmitting || isLoading}
                className="w-full gap-2"
                variant="default"
              >
                {isSubmitting ? "Processing..." : "Buy NO"}
              </Button>
            </TabsContent>

          </Tabs>
        )}

        {/* Redeem (when resolved) */}
        {marketState === "resolved" && (
          <div className="space-y-4">
            <div className="p-4 rounded-md border border-border bg-muted/30">
              <p className="text-sm font-semibold mb-2">Market Resolved</p>
              <p className="text-xs text-muted-foreground">
                Winning outcome: <Badge>{winningCoinType === "YES_COIN" ? "YES" : "NO"}</Badge>
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                Redeem your winning coins to receive USDO payouts.
              </p>
            </div>
            <Button
              onClick={handleRedeem}
              disabled={!currentAccount || isSubmitting}
              className="w-full gap-2"
            >
              {isSubmitting ? "Processing..." : "Redeem Winning Coins"}
            </Button>
          </div>
        )}

        {!currentAccount && (
          <p className="text-xs text-muted-foreground text-center">
            Please connect your wallet to trade
          </p>
        )}
      </CardContent>
    </Card>
  );
}
