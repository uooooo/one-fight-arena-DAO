"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Clock, Coins } from "lucide-react";
import { OrderBook } from "./order-book";
import { PlaceOrder } from "./place-order";
import { cn } from "@/lib/utils";
import { getMarketsByEvent, getMarket, type MarketData } from "@/lib/sui/queries";
import { SEED_DATA } from "@/lib/sui/seed-data";

interface MarketsTabProps {
  eventId: string;
}

interface MarketWithMetadata extends MarketData {
  poolId?: string;
  yesCoinType?: string;
  noCoinType?: string;
  yesOdds?: number;
  noOdds?: number;
  volume?: number;
  liquidity?: number;
}

export function MarketsTab({ eventId }: MarketsTabProps) {
  const [markets, setMarkets] = useState<MarketWithMetadata[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchMarkets() {
      setIsLoading(true);
      try {
        // First, try to get markets from Sui by event
        const suiMarkets = await getMarketsByEvent(eventId);

        // If no markets found, use seed data as fallback
        if (suiMarkets.length === 0 && SEED_DATA.marketId) {
          const seedMarket = await getMarket(SEED_DATA.marketId);
          if (seedMarket) {
            suiMarkets.push(seedMarket);
          }
        }

        // Enrich with metadata from SEED_DATA
        const marketsWithMetadata: MarketWithMetadata[] = suiMarkets.map((market) => ({
          ...market,
          poolId: SEED_DATA.poolId,
          yesCoinType: SEED_DATA.yesCoinType,
          noCoinType: SEED_DATA.noCoinType,
          // Mock odds and volume for now (will be replaced with actual DeepBook data)
          yesOdds: 1.85,
          noOdds: 1.95,
          volume: 1250,
          liquidity: 5000,
        }));

        setMarkets(marketsWithMetadata);
      } catch (error) {
        console.error("Error fetching markets:", error);
        // Fallback to empty array or use SEED_DATA if available
        if (SEED_DATA.marketId) {
          setMarkets([
            {
              id: SEED_DATA.marketId,
              eventId,
              question: "Will Rodtang win?",
              state: "open",
              feeBps: 500,
              vaultAddress: SEED_DATA.vaultId,
              poolId: SEED_DATA.poolId,
              yesCoinType: SEED_DATA.yesCoinType,
              noCoinType: SEED_DATA.noCoinType,
              yesOdds: 1.85,
              noOdds: 1.95,
              volume: 1250,
              liquidity: 5000,
            },
          ]);
        }
      } finally {
        setIsLoading(false);
      }
    }

    fetchMarkets();
  }, [eventId]);

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div className="space-y-2">
          <h2 className="text-2xl font-semibold tracking-tight text-foreground">Prediction Markets</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Loading markets...
          </p>
        </div>
      </div>
    );
  }

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
        {markets.map((market) => (
          <div key={market.id} id={`market-${market.id}`} className="scroll-mt-8 space-y-6">
            {/* Market Header Card */}
            <Card className="border-border bg-card">
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between gap-4 mb-3">
                  <CardTitle className="text-lg font-semibold leading-tight pr-2">{market.question}</CardTitle>
                  <Badge className={cn(
                    "text-xs font-medium px-2 py-0.5 shrink-0",
                    market.state === "open" 
                      ? "bg-one-yellow/10 text-one-yellow border-one-yellow/20" 
                      : "bg-muted text-muted-foreground"
                  )}>
                    {market.state === "open" ? (
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
                    <div className="text-2xl font-bold text-one-yellow mb-1">
                      {market.yesOdds ? market.yesOdds.toFixed(2) + "x" : "N/A"}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Volume: <span className="font-medium">{market.volume?.toLocaleString() || "0"}</span> SUI
                    </div>
                  </div>
                  <div className="group relative overflow-hidden rounded-md border-2 border-border bg-muted/30 p-4 transition-all hover:border-border hover:bg-muted/50">
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingDown className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">NO</span>
                    </div>
                    <div className="text-2xl font-bold text-foreground mb-1">
                      {market.noOdds ? market.noOdds.toFixed(2) + "x" : "N/A"}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Volume: <span className="font-medium">{market.volume?.toLocaleString() || "0"}</span> SUI
                    </div>
                  </div>
                </div>

                {/* Market Stats */}
                <div className="flex items-center justify-between pt-3 border-t border-border">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Coins className="h-4 w-4" />
                    <span>Total Liquidity</span>
                  </div>
                  <span className="text-sm font-semibold text-foreground">{market.liquidity?.toLocaleString() || "0"} SUI</span>
                </div>
              </CardContent>
            </Card>

            {/* Order Book and Place Order */}
            <div className="grid gap-6 lg:grid-cols-2">
              <OrderBook
                poolId={market.poolId || ""}
                yesCoinType={market.yesCoinType || ""}
                noCoinType={market.noCoinType || ""}
              />
              <PlaceOrder
                poolId={market.poolId || ""}
                yesCoinType={market.yesCoinType || ""}
                noCoinType={market.noCoinType || ""}
                marketId={market.id}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Empty State (if no markets) */}
      {markets.length === 0 && (
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

