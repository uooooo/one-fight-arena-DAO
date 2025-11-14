"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TrendingUp, TrendingDown, Clock } from "lucide-react";

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
  },
  {
    id: "market-2",
    question: "Will the fight go to decision?",
    yesOdds: 2.1,
    noOdds: 1.75,
    volume: 890,
    liquidity: 3500,
    status: "open" as const,
  },
];

export function MarketsTab({ eventId }: MarketsTabProps) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight mb-2">Prediction Markets</h2>
        <p className="text-muted-foreground">
          Bet on fight outcomes using DeepBook order book. Trade YES/NO coins for each market.
        </p>
      </div>

      {/* Markets Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        {mockMarkets.map((market) => (
          <Card key={market.id} className="transition-all hover:shadow-lg">
            <CardHeader>
              <div className="flex items-start justify-between">
                <CardTitle className="text-lg pr-4">{market.question}</CardTitle>
                <Badge variant={market.status === "open" ? "default" : "secondary"}>
                  {market.status === "open" ? (
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      Open
                    </span>
                  ) : (
                    "Resolved"
                  )}
                </Badge>
              </div>
              <CardDescription className="mt-2">
                Market ID: {market.id}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Odds Display */}
              <div className="grid grid-cols-2 gap-4">
                <div className="group relative overflow-hidden rounded-lg border-2 border-primary/20 bg-muted/50 p-4 transition-all hover:border-primary/50 hover:bg-muted/70 cursor-pointer">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium text-muted-foreground">YES</span>
                  </div>
                  <div className="text-2xl font-bold text-primary">{market.yesOdds.toFixed(2)}x</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Volume: {market.volume} SUI
                  </div>
                  <div className="absolute inset-0 bg-primary/5 opacity-0 transition-opacity group-hover:opacity-100" />
                </div>
                <div className="group relative overflow-hidden rounded-lg border-2 border-border bg-muted/50 p-4 transition-all hover:border-border hover:bg-muted/70 cursor-pointer">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingDown className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium text-muted-foreground">NO</span>
                  </div>
                  <div className="text-2xl font-bold">{market.noOdds.toFixed(2)}x</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Volume: {market.volume} SUI
                  </div>
                  <div className="absolute inset-0 bg-muted/20 opacity-0 transition-opacity group-hover:opacity-100" />
                </div>
              </div>

              {/* Market Stats */}
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Total Liquidity:</span>
                <span className="font-medium">{market.liquidity} SUI</span>
              </div>

              {/* Action Button */}
              <Button className="w-full" variant="default">
                View Order Book
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty State (if no markets) */}
      {mockMarkets.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <TrendingUp className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No markets available</h3>
            <p className="text-sm text-muted-foreground text-center">
              Markets will appear here once the event is created.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

