"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { suiClient } from "@/lib/sui/client";
import { getOrderBook } from "@/lib/sui/deepbook";
import { Skeleton } from "@/components/ui/skeleton";

interface OrderBookProps {
  poolId: string;
  yesCoinType: string;
  noCoinType: string;
}

interface OrderBookEntry {
  price: string;
  quantity: string;
  total: string;
}

export function OrderBook({ poolId, yesCoinType, noCoinType }: OrderBookProps) {
  const { data: orderBook, isLoading } = useQuery({
    queryKey: ["orderBook", poolId],
    queryFn: () => getOrderBook(suiClient, poolId),
    refetchInterval: 5000, // Refresh every 5 seconds
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Order Book</CardTitle>
          <CardDescription>Loading order book data...</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-32 w-full" />
        </CardContent>
      </Card>
    );
  }

  const bids: OrderBookEntry[] = orderBook?.bids || [];
  const asks: OrderBookEntry[] = orderBook?.asks || [];
  const spread = orderBook?.spread || "0";
  const midPrice = orderBook?.midPrice || "0";

  return (
    <Card className="border-border bg-card">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base font-semibold">Order Book</CardTitle>
            <CardDescription className="text-xs mt-1">Live order book from DeepBook</CardDescription>
          </div>
          <Badge className="bg-one-yellow/10 text-one-yellow border-one-yellow/20 text-xs font-medium px-2 py-0.5">
            Live
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Market Stats */}
        <div className="grid grid-cols-3 gap-3 pb-4 border-b border-border">
          <div className="text-center">
            <div className="text-xs text-muted-foreground mb-1.5">Mid Price</div>
            <div className="text-base font-semibold text-foreground">{midPrice} SUI</div>
          </div>
          <div className="text-center">
            <div className="text-xs text-muted-foreground mb-1.5">Spread</div>
            <div className="text-base font-semibold text-foreground">{spread} SUI</div>
          </div>
          <div className="text-center">
            <div className="text-xs text-muted-foreground mb-1.5">Pool ID</div>
            <div className="text-xs font-mono truncate text-muted-foreground">{poolId.slice(0, 8)}...</div>
          </div>
        </div>

        {/* Order Book Table */}
        <div className="grid grid-cols-2 gap-4">
          {/* Asks (Sell Orders) */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <TrendingDown className="h-3.5 w-3.5 text-muted-foreground" />
              <h3 className="text-xs font-semibold text-foreground uppercase tracking-wide">Asks (Sell)</h3>
            </div>
            <div className="space-y-0.5">
              {asks.length > 0 ? (
                asks.slice(0, 10).map((ask, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between text-xs py-1.5 px-2 rounded hover:bg-muted/50 transition-colors"
                  >
                    <span className="text-muted-foreground font-mono">{ask.quantity}</span>
                    <span className="font-medium text-foreground">{ask.price}</span>
                    <span className="text-muted-foreground font-mono text-[10px]">{ask.total}</span>
                  </div>
                ))
              ) : (
                <div className="text-xs text-muted-foreground py-6 text-center">
                  No sell orders
                </div>
              )}
            </div>
          </div>

          {/* Bids (Buy Orders) */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="h-3.5 w-3.5 text-one-yellow" />
              <h3 className="text-xs font-semibold text-foreground uppercase tracking-wide">Bids (Buy)</h3>
            </div>
            <div className="space-y-0.5">
              {bids.length > 0 ? (
                bids.slice(0, 10).map((bid, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between text-xs py-1.5 px-2 rounded hover:bg-muted/50 transition-colors"
                  >
                    <span className="text-muted-foreground font-mono">{bid.quantity}</span>
                    <span className="font-medium text-one-yellow">{bid.price}</span>
                    <span className="text-muted-foreground font-mono text-[10px]">{bid.total}</span>
                  </div>
                ))
              ) : (
                <div className="text-xs text-muted-foreground py-6 text-center">
                  No buy orders
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

