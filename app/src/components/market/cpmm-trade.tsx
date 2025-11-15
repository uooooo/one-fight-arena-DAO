"use client";

import { useState, useEffect } from "react";
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
  redeemWinningNoTx
} from "@/lib/sui/transactions";
import { suiClient } from "@/lib/sui/client";
import { getMarketPool, getUsdoBalance, type MarketPoolData } from "@/lib/sui/queries";
import { OPEN_CORNER_PACKAGE_ID } from "@/lib/sui/constants";

interface CPMTradeProps {
  marketId: string;
  poolId: string;
  treasuryCapYesId: string;
  treasuryCapNoId: string;
  marketState: "open" | "resolved";
  winningCoinType?: string;
}

type TradeAction = "split" | "join" | "swap" | "redeem";

export function CPMTrade({ 
  marketId, 
  poolId, 
  treasuryCapYesId,
  treasuryCapNoId,
  marketState,
  winningCoinType
}: CPMTradeProps) {
  const { signAndExecuteTransactionBlock, currentAccount } = useWalletKit();
  const [action, setAction] = useState<TradeAction>("split");
  const [amount, setAmount] = useState("");
  const [slippage, setSlippage] = useState("1"); // 1% default slippage
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [poolData, setPoolData] = useState<MarketPoolData | null>(null);
  const [usdoBalance, setUsdoBalance] = useState<bigint>(BigInt(0));
  const [isLoading, setIsLoading] = useState(true);

  // Fetch pool data and USDO balance
  useEffect(() => {
    async function fetchData() {
      // Validate poolId before fetching
      if (!poolId || poolId === "PLACEHOLDER_POOL_ID" || poolId.startsWith("PLACEHOLDER")) {
        console.warn("Pool ID is not set or is a placeholder:", poolId);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        // Fetch pool data
        const pool = await getMarketPool(poolId);
        setPoolData(pool);

        // Fetch USDO balance
        if (currentAccount?.address) {
          const balance = await getUsdoBalance(currentAccount.address);
          setUsdoBalance(balance);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        // Don't set poolData to null on error, keep previous state
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
    // Refresh every 10 seconds
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, [poolId, currentAccount?.address]);

  // Calculate odds from pool data
  const calculateYesOdds = (): number => {
    if (!poolData || poolData.yesBalance === "0" || poolData.noBalance === "0") {
      return 50; // Default to 50% if pool is empty
    }
    const yesBalance = BigInt(poolData.yesBalance);
    const noBalance = BigInt(poolData.noBalance);
    const total = yesBalance + noBalance;
    return Number((yesBalance * BigInt(10000)) / total) / 100;
  };

  const yesOdds = calculateYesOdds();
  const noOdds = 100 - yesOdds;

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

    if (usdoBalance < amountBigInt) {
      alert(`Insufficient USDO balance. You have ${Number(usdoBalance) / 1_000_000_000} USDO.`);
      return;
    }

    setIsSubmitting(true);
    try {
      const tx = new Transaction();
      
      // Get USDO coin (simplified: assume user has a single USDO coin)
      // In production, would need to handle coin merging/splitting
      const usdoCoinType = `${OPEN_CORNER_PACKAGE_ID}::usdo::USDO`;
      const coins = await suiClient.getCoins({
        owner: currentAccount.address,
        coinType: usdoCoinType,
      });

      if (coins.data.length === 0) {
        alert("No USDO coins found. Please acquire USDO first.");
        setIsSubmitting(false);
        return;
      }

      // Use first coin (in production, would merge and split as needed)
      const usdoCoinId = coins.data[0].coinObjectId;

      // Split USDO into YES/NO
      splitUsdoForMarketTx(
        marketId,
        poolId,
        treasuryCapYesId,
        treasuryCapNoId,
        usdoCoinId,
        tx
      );

      const result = await signAndExecuteTransactionBlock({
        transaction: tx,
        options: {
          showEffects: true,
          showEvents: true,
          showObjectChanges: true,
          showBalanceChanges: true,
        },
      });

      await suiClient.waitForTransaction({ digest: result.digest });
      alert(`Successfully split ${amount} USDO into YES/NO pair!`);
      setAmount("");
      
      // Refresh data
      const pool = await getMarketPool(poolId);
      setPoolData(pool);
      if (currentAccount?.address) {
        const balance = await getUsdoBalance(currentAccount.address);
        setUsdoBalance(balance);
      }
    } catch (error: any) {
      console.error("Error splitting USDO:", error);
      alert(error?.message || "Failed to split USDO. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSwap = async (direction: "yes-to-no" | "no-to-yes") => {
    if (!currentAccount || !amount || !signAndExecuteTransactionBlock) {
      alert("Please connect your wallet and enter an amount.");
      return;
    }

    if (!poolData) {
      alert("Pool data not loaded. Please wait.");
      return;
    }

    setIsSubmitting(true);
    try {
      const tx = new Transaction();
      const amountBigInt = BigInt(Math.floor(parseFloat(amount) * 1_000_000_000));

      // Calculate expected output (simplified CPMM calculation)
      // In production, would calculate from pool balances
      const slippageBps = BigInt(Math.floor(parseFloat(slippage) * 100));
      const minOutput = (amountBigInt * (BigInt(10000) - slippageBps)) / BigInt(10000);

      if (direction === "yes-to-no") {
        // Get YES coin
        const yesCoinType = `${OPEN_CORNER_PACKAGE_ID}::yes_coin::YES_COIN`;
        const yesCoins = await suiClient.getCoins({
          owner: currentAccount.address,
          coinType: yesCoinType,
        });

        if (yesCoins.data.length === 0) {
          alert("No YES coins found. Please split USDO first.");
          setIsSubmitting(false);
          return;
        }

        const yesCoinId = yesCoins.data[0].coinObjectId;
        swapYesForNoTx(marketId, poolId, yesCoinId, minOutput, tx);
      } else {
        // Get NO coin
        const noCoinType = `${OPEN_CORNER_PACKAGE_ID}::no_coin::NO_COIN`;
        const noCoins = await suiClient.getCoins({
          owner: currentAccount.address,
          coinType: noCoinType,
        });

        if (noCoins.data.length === 0) {
          alert("No NO coins found. Please split USDO first.");
          setIsSubmitting(false);
          return;
        }

        const noCoinId = noCoins.data[0].coinObjectId;
        swapNoForYesTx(marketId, poolId, noCoinId, minOutput, tx);
      }

      const result = await signAndExecuteTransactionBlock({
        transaction: tx,
        options: {
          showEffects: true,
          showEvents: true,
          showObjectChanges: true,
          showBalanceChanges: true,
        },
      });

      await suiClient.waitForTransaction({ digest: result.digest });
      alert(`Successfully swapped ${amount}!`);
      setAmount("");
      
      // Refresh pool data
      const pool = await getMarketPool(poolId);
      setPoolData(pool);
    } catch (error: any) {
      console.error("Error swapping:", error);
      alert(error?.message || "Failed to swap. Please try again.");
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
              {(Number(usdoBalance) / 1_000_000_000).toFixed(4)} USDO
            </span>
          </div>
        )}

        {/* Action Selection */}
        {marketState === "open" && (
          <Tabs value={action} onValueChange={(v) => setAction(v as TradeAction)}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="split">Split USDO</TabsTrigger>
              <TabsTrigger value="swap">Swap</TabsTrigger>
              <TabsTrigger value="join">Join</TabsTrigger>
            </TabsList>

            {/* Split USDO */}
            <TabsContent value="split" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="split-amount">Amount (USDO)</Label>
                <Input
                  id="split-amount"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="h-10"
                />
                <p className="text-xs text-muted-foreground">
                  Split USDO into YES/NO pair (1 USDO = 1 YES + 1 NO)
                </p>
              </div>
              <Button
                onClick={handleSplit}
                disabled={!currentAccount || !amount || isSubmitting || isLoading}
                className="w-full gap-2"
              >
                {isSubmitting ? "Processing..." : "Split USDO"}
              </Button>
            </TabsContent>

            {/* Swap */}
            <TabsContent value="swap" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="swap-amount">Amount</Label>
                <Input
                  id="swap-amount"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="h-10"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="slippage">Slippage Tolerance (%)</Label>
                <Input
                  id="slippage"
                  type="number"
                  step="0.1"
                  placeholder="1.0"
                  value={slippage}
                  onChange={(e) => setSlippage(e.target.value)}
                  className="h-10"
                />
              </div>
              {amount && (
                <div className="rounded-md border border-border bg-muted/30 p-4 space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">YES → NO:</span>
                    <span className="font-semibold">
                      ≈ {calculateSwapOutput("yes-to-no")} NO
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">NO → YES:</span>
                    <span className="font-semibold">
                      ≈ {calculateSwapOutput("no-to-yes")} YES
                    </span>
                  </div>
                </div>
              )}
              <div className="grid grid-cols-2 gap-3">
                <Button
                  onClick={() => handleSwap("yes-to-no")}
                  disabled={!currentAccount || !amount || isSubmitting || isLoading}
                  variant="outline"
                  className="gap-2"
                >
                  <TrendingDown className="h-4 w-4" />
                  YES → NO
                </Button>
                <Button
                  onClick={() => handleSwap("no-to-yes")}
                  disabled={!currentAccount || !amount || isSubmitting || isLoading}
                  variant="outline"
                  className="gap-2"
                >
                  <TrendingUp className="h-4 w-4" />
                  NO → YES
                </Button>
              </div>
            </TabsContent>

            {/* Join */}
            <TabsContent value="join" className="space-y-4 mt-4">
              <div className="p-4 rounded-md border border-border bg-muted/30">
                <p className="text-sm text-muted-foreground">
                  Join YES/NO pair back into USDO (1 YES + 1 NO = 1 USDO)
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  Note: Requires MarketYes and MarketNo wrappers from split operation.
                </p>
              </div>
              <Button
                disabled
                variant="outline"
                className="w-full"
              >
                Join (Coming Soon)
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

