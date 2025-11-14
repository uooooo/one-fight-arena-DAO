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
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Order Book</CardTitle>
            <CardDescription>Live order book from DeepBook</CardDescription>
          </div>
          <Badge variant="secondary">Live</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Market Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-xs text-muted-foreground mb-1">Mid Price</div>
            <div className="text-lg font-bold">{midPrice} SUI</div>
          </div>
          <div className="text-center">
            <div className="text-xs text-muted-foreground mb-1">Spread</div>
            <div className="text-lg font-bold">{spread} SUI</div>
          </div>
          <div className="text-center">
            <div className="text-xs text-muted-foreground mb-1">Pool ID</div>
            <div className="text-xs font-mono truncate">{poolId.slice(0, 8)}...</div>
          </div>
        </div>

        {/* Order Book Table */}
        <div className="grid grid-cols-2 gap-4">
          {/* Asks (Sell Orders) */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <TrendingDown className="h-4 w-4 text-muted-foreground" />
              <h3 className="text-sm font-semibold">Asks (Sell)</h3>
            </div>
            <div className="space-y-1">
              {asks.length > 0 ? (
                asks.slice(0, 10).map((ask, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between text-sm py-1 px-2 rounded hover:bg-muted/50"
                  >
                    <span className="text-muted-foreground">{ask.quantity}</span>
                    <span className="font-medium">{ask.price}</span>
                    <span className="text-muted-foreground">{ask.total}</span>
                  </div>
                ))
              ) : (
                <div className="text-sm text-muted-foreground py-4 text-center">
                  No sell orders
                </div>
              )}
            </div>
          </div>

          {/* Bids (Buy Orders) */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-semibold">Bids (Buy)</h3>
            </div>
            <div className="space-y-1">
              {bids.length > 0 ? (
                bids.slice(0, 10).map((bid, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between text-sm py-1 px-2 rounded hover:bg-muted/50"
                  >
                    <span className="text-muted-foreground">{bid.quantity}</span>
                    <span className="font-medium text-primary">{bid.price}</span>
                    <span className="text-muted-foreground">{bid.total}</span>
                  </div>
                ))
              ) : (
                <div className="text-sm text-muted-foreground py-4 text-center">
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

