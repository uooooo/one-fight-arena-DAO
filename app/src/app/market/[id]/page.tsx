"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TrendingUp, TrendingDown, Coins, Clock, ArrowLeft } from "lucide-react";
import { SimpleChart } from "@/components/market/simple-chart";
import { useWalletKit } from "@mysten/wallet-kit";
import { Transaction } from "@mysten/sui/transactions";
import { placeBetTx } from "@/lib/sui/transactions";
import { suiClient } from "@/lib/sui/client";
import Link from "next/link";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface MarketPageProps {
  params: {
    id: string;
  };
}

// Mock market data
const mockMarketData = {
  id: "market-1",
  question: "Will Fighter A win by KO/TKO?",
  yesPrice: 54.2,
  noPrice: 45.8,
  volume: 12500,
  liquidity: 50000,
  status: "open" as const,
  eventName: "ONE Championship 165",
  // Mock pool and coin types (these should come from actual market data)
  poolId: "0x1234567890abcdef", // Mock pool ID - should be fetched from actual market
  yesCoinType: "0x2::sui::SUI", // Mock - should be actual YES coin type from market
  noCoinType: "0x2::sui::SUI", // Mock - should be actual NO coin type from market
  // Mock chart data
  chartData: [
    { time: "12:00", yes: 48, no: 52 },
    { time: "13:00", yes: 50, no: 50 },
    { time: "14:00", yes: 52, no: 48 },
    { time: "15:00", yes: 51, no: 49 },
    { time: "16:00", yes: 53, no: 47 },
    { time: "17:00", yes: 54, no: 46 },
    { time: "18:00", yes: 54.2, no: 45.8 },
  ],
};

export default function MarketPage({ params }: MarketPageProps) {
  const { signAndExecuteTransactionBlock, currentAccount } = useWalletKit();
  const [amount, setAmount] = useState("");
  const [selectedSide, setSelectedSide] = useState<"yes" | "no">("yes");
  const [selectedTimeframe, setSelectedTimeframe] = useState<"1H" | "6H" | "1D" | "1W" | "1M" | "ALL">("ALL");
  const [isTrading, setIsTrading] = useState(false);

  const market = mockMarketData; // In real app, fetch by params.id

  const handleTrade = async (side: "yes" | "no") => {
    if (!currentAccount || !amount || !signAndExecuteTransactionBlock) {
      if (!currentAccount) {
        alert("Please connect your wallet first.");
      } else {
        alert("Please enter an amount.");
      }
      return;
    }

    setIsTrading(true);
    try {
      const tx = new Transaction();

      // Calculate price based on current market price
      // For market orders, we use the current price (yesPrice or noPrice as percentage)
      // Convert to SUI price (0.542 for 54.2%)
      const priceInSui = side === "yes" 
        ? (market.yesPrice / 100).toFixed(6)
        : (market.noPrice / 100).toFixed(6);

      // Place bet transaction
      placeBetTx(
        market.poolId,
        priceInSui,
        amount,
        side === "yes",
        market.yesCoinType,
        market.noCoinType,
        tx.gas,
        tx
      );

      // Execute transaction
      const result = await signAndExecuteTransactionBlock({
        transaction: tx,
        options: {
          showEffects: true,
          showEvents: true,
          showObjectChanges: true,
          showBalanceChanges: true,
        },
      });

      console.log("Transaction result:", result);

      // Wait for transaction to be indexed
      await suiClient.waitForTransaction({
        digest: result.digest,
      });

      alert(`Order placed successfully! Transaction: ${result.digest}`);
      
      // Reset form
      setAmount("");
    } catch (error: any) {
      console.error("Trade error:", error);
      const errorMessage = error?.message || "Trade failed. Please try again.";
      alert(errorMessage);
    } finally {
      setIsTrading(false);
    }
  };

  return (
    <main className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6">
        {/* Back button */}
        <Link 
          href="/markets" 
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-one-yellow transition-colors mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Markets
        </Link>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Left Column - Market Info & Chart */}
          <div className="lg:col-span-2 space-y-6">
            {/* Market Header */}
            <Card className="border-border bg-card">
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div className="flex-1">
                    <CardTitle className="text-2xl font-bold text-foreground mb-2">
                      {market.question}
                    </CardTitle>
                    <CardDescription className="text-sm">
                      {market.eventName}
                    </CardDescription>
                  </div>
                  <Badge className="bg-one-yellow text-one-gray text-xs font-medium px-2.5 py-1">
                    <span className="flex items-center gap-1.5">
                      <Clock className="h-3 w-3" />
                      Live
                    </span>
                  </Badge>
                </div>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1.5">
                    <Coins className="h-4 w-4" />
                    <span>Vol: {(market.volume / 1000).toFixed(1)}K SUI</span>
                  </div>
                  <span>•</span>
                  <span>Liq: {(market.liquidity / 1000).toFixed(1)}K SUI</span>
                </div>
              </CardHeader>
            </Card>

            {/* Chart */}
            <Card className="border-border bg-card">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-semibold">Price Chart</CardTitle>
                  <Tabs value={selectedTimeframe} onValueChange={(v) => setSelectedTimeframe(v as typeof selectedTimeframe)}>
                    <TabsList className="inline-flex h-8 items-center justify-start rounded-md bg-muted p-1 text-muted-foreground">
                      {(["1H", "6H", "1D", "1W", "1M", "ALL"] as const).map((tf) => (
                        <TabsTrigger
                          key={tf}
                          value={tf}
                          className="inline-flex items-center justify-center whitespace-nowrap rounded-sm px-2 py-1 text-xs font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
                        >
                          {tf}
                        </TabsTrigger>
                      ))}
                    </TabsList>
                  </Tabs>
                </div>
              </CardHeader>
              <CardContent>
                <div className="mb-4 flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-one-yellow"></div>
                    <span className="text-muted-foreground">Yes</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-muted-foreground"></div>
                    <span className="text-muted-foreground">No</span>
                  </div>
                </div>
                <SimpleChart data={market.chartData} selectedTimeframe={selectedTimeframe} />
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Trading Panel */}
          <div className="lg:col-span-1">
            <Card className="border-border bg-card sticky top-20">
              <CardHeader className="pb-4">
                <CardTitle className="text-base font-semibold">Trade</CardTitle>
                <CardDescription className="text-xs">Market orders via DeepBook</CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                {/* Current Prices */}
                <div className="space-y-3">
                  <div className="rounded-md border-2 border-one-yellow/40 bg-one-yellow/10 p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-one-yellow" />
                        <span className="text-sm font-medium text-muted-foreground uppercase">Yes</span>
                      </div>
                      <div className="text-right">
                        <div className="text-xl font-bold text-one-yellow">{market.yesPrice.toFixed(1)}%</div>
                        <div className="text-xs text-muted-foreground">{market.yesPrice.toFixed(2)}¢</div>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-md border-2 border-border bg-muted/30 p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <TrendingDown className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium text-muted-foreground uppercase">No</span>
                      </div>
                      <div className="text-right">
                        <div className="text-xl font-bold text-foreground">{market.noPrice.toFixed(1)}%</div>
                        <div className="text-xs text-muted-foreground">{market.noPrice.toFixed(2)}¢</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Side Selection */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Select Side</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      variant={selectedSide === "yes" ? "default" : "outline"}
                      onClick={() => setSelectedSide("yes")}
                      className={selectedSide === "yes" ? "bg-one-yellow text-one-gray hover:bg-one-yellow-dark border-one-yellow" : ""}
                    >
                      <TrendingUp className="h-4 w-4 mr-2" />
                      Buy YES
                    </Button>
                    <Button
                      variant={selectedSide === "no" ? "default" : "outline"}
                      onClick={() => setSelectedSide("no")}
                      className={selectedSide === "no" ? "bg-one-yellow text-one-gray hover:bg-one-yellow-dark border-one-yellow" : ""}
                    >
                      <TrendingDown className="h-4 w-4 mr-2" />
                      Buy NO
                    </Button>
                  </div>
                </div>

                {/* Amount Input */}
                <div className="space-y-2">
                  <Label htmlFor="amount" className="text-sm font-medium">Amount (SUI)</Label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="h-10 text-base"
                  />
                  <div className="flex gap-2">
                    {["1", "10", "50", "100"].map((val) => (
                      <Button
                        key={val}
                        variant="outline"
                        size="sm"
                        onClick={() => setAmount(val)}
                        className="flex-1 text-xs h-7"
                      >
                        +{val}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Trade Button */}
                <Button
                  onClick={() => handleTrade(selectedSide)}
                  disabled={!currentAccount || !amount || isTrading}
                  className="w-full bg-one-yellow text-one-gray hover:bg-one-yellow-dark font-semibold h-11 text-base"
                >
                  {isTrading ? (
                    "Processing..."
                  ) : (
                    `Trade ${selectedSide.toUpperCase()}`
                  )}
                </Button>

                {!currentAccount && (
                  <p className="text-xs text-muted-foreground text-center">
                    Connect wallet to trade
                  </p>
                )}

                {/* Disclaimer */}
                <p className="text-xs text-muted-foreground text-center pt-2 border-t border-border">
                  By trading, you agree to the Terms of Use.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </main>
  );
}

