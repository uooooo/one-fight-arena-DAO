"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Clock, Coins } from "lucide-react";
import { OrderBook } from "./order-book";
import { PlaceOrder } from "./place-order";
import { cn } from "@/lib/utils";

interface MarketsTabProps {
  eventId: string;
}

// Mock market data
const mockMarkets = [
  {
    id: "market-1",
    question: "Will Fighter A win by KO/TKO?",
    yesOdds: 1.85,
    noOdds: 1.95,
    volume: 1250,
    liquidity: 5000,
    status: "open" as const,
    poolId: "0x1234567890abcdef", // Mock pool ID
    yesCoinType: "0x2::sui::SUI", // Mock coin types
    noCoinType: "0x2::sui::SUI",
  },
  {
    id: "market-2",
    question: "Will the fight go to decision?",
    yesOdds: 2.1,
    noOdds: 1.75,
    volume: 890,
    liquidity: 3500,
    status: "open" as const,
    poolId: "0xabcdef1234567890",
    yesCoinType: "0x2::sui::SUI",
    noCoinType: "0x2::sui::SUI",
  },
];

export function MarketsTab({ eventId }: MarketsTabProps) {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <h2 className="text-2xl font-semibold tracking-tight text-foreground">Prediction Markets</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Bet on fight outcomes using DeepBook order book. Trade YES/NO coins for each market.
        </p>
      </div>

      {/* Markets List */}
      <div className="space-y-10">
        {mockMarkets.map((market) => (
          <div key={market.id} id={`market-${market.id}`} className="scroll-mt-8 space-y-6">
            {/* Market Header Card */}
            <Card className="border-border bg-card">
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between gap-4 mb-3">
                  <CardTitle className="text-lg font-semibold leading-tight pr-2">{market.question}</CardTitle>
                  <Badge className={cn(
                    "text-xs font-medium px-2 py-0.5 shrink-0",
                    market.status === "open" 
                      ? "bg-one-yellow/10 text-one-yellow border-one-yellow/20" 
                      : "bg-muted text-muted-foreground"
                  )}>
                    {market.status === "open" ? (
                      <span className="flex items-center gap-1.5">
                        <Clock className="h-3 w-3" />
                        Open
                      </span>
                    ) : (
                      "Resolved"
                    )}
                  </Badge>
                </div>
                <CardDescription className="text-xs font-mono text-muted-foreground">
                  {market.id}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                {/* Odds Display */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="group relative overflow-hidden rounded-md border-2 border-one-yellow/30 bg-one-yellow/5 p-4 transition-all hover:border-one-yellow/50 hover:bg-one-yellow/10">
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingUp className="h-3.5 w-3.5 text-one-yellow" />
                      <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">YES</span>
                    </div>
                    <div className="text-2xl font-bold text-one-yellow mb-1">{market.yesOdds.toFixed(2)}x</div>
                    <div className="text-xs text-muted-foreground">
                      Volume: <span className="font-medium">{market.volume.toLocaleString()}</span> SUI
                    </div>
                  </div>
                  <div className="group relative overflow-hidden rounded-md border-2 border-border bg-muted/30 p-4 transition-all hover:border-border hover:bg-muted/50">
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingDown className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">NO</span>
                    </div>
                    <div className="text-2xl font-bold text-foreground mb-1">{market.noOdds.toFixed(2)}x</div>
                    <div className="text-xs text-muted-foreground">
                      Volume: <span className="font-medium">{market.volume.toLocaleString()}</span> SUI
                    </div>
                  </div>
                </div>

                {/* Market Stats */}
                <div className="flex items-center justify-between pt-3 border-t border-border">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Coins className="h-4 w-4" />
                    <span>Total Liquidity</span>
                  </div>
                  <span className="text-sm font-semibold text-foreground">{market.liquidity.toLocaleString()} SUI</span>
                </div>
              </CardContent>
            </Card>

            {/* Order Book and Place Order */}
            <div className="grid gap-6 lg:grid-cols-2">
              <OrderBook
                poolId={market.poolId}
                yesCoinType={market.yesCoinType}
                noCoinType={market.noCoinType}
              />
              <PlaceOrder
                poolId={market.poolId}
                yesCoinType={market.yesCoinType}
                noCoinType={market.noCoinType}
                marketId={market.id}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Empty State (if no markets) */}
      {mockMarkets.length === 0 && (
        <Card className="border-border">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <TrendingUp className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2 text-foreground">No markets available</h3>
            <p className="text-sm text-muted-foreground text-center max-w-md">
              Markets will appear here once the event is created.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

