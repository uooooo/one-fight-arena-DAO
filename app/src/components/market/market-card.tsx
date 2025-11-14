"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Coins, Clock, Trophy } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface MarketCardProps {
  id: string;
  question: string;
  yesPrice: number; // Price in cents (0-100)
  noPrice: number; // Price in cents (0-100)
  volume: number;
  liquidity: number;
  status: "open" | "resolved";
  eventName?: string;
  imageUrl?: string;
}

export function MarketCard({
  id,
  question,
  yesPrice,
  noPrice,
  volume,
  liquidity,
  status,
  eventName,
  imageUrl,
}: MarketCardProps) {
  const yesPercent = yesPrice;
  const noPercent = noPrice;

  return (
    <Link href={`/market/${id}`}>
      <Card className="group cursor-pointer transition-all hover:shadow-xl hover:border-one-yellow/50 border-border bg-[hsl(225,7%,32%)] hover:bg-[hsl(225,7%,35%)]">
        <CardContent className="p-0">
          {/* Image */}
          {imageUrl ? (
            <div className="relative h-32 w-full overflow-hidden rounded-t-lg bg-muted">
              <div className="relative w-full h-full">
                <img
                  src={imageUrl}
                  alt={question}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  onError={(e) => {
                    // Fallback if image fails to load
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    const parent = target.parentElement;
                    if (parent && !parent.querySelector('.fallback-icon')) {
                      const fallback = document.createElement('div');
                      fallback.className = 'fallback-icon absolute inset-0 flex items-center justify-center bg-gradient-to-br from-one-yellow/20 to-muted/30';
                      fallback.innerHTML = '<svg class="h-8 w-8 text-one-yellow/50" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" /></svg>';
                      parent.appendChild(fallback);
                    }
                  }}
                />
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-[hsl(225,7%,32%)]/90 to-transparent pointer-events-none" />
            </div>
          ) : (
            <div className="relative h-24 w-full overflow-hidden rounded-t-lg bg-gradient-to-br from-one-yellow/20 to-muted/30 flex items-center justify-center">
              <Trophy className="h-8 w-8 text-one-yellow/50" />
            </div>
          )}
          
          <div className="p-4">
            {/* Header */}
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-semibold text-foreground leading-snug mb-1 line-clamp-2 group-hover:text-one-yellow transition-colors">
                  {question}
                </h3>
                {eventName && (
                  <p className="text-xs text-muted-foreground truncate">{eventName}</p>
                )}
              </div>
              <Badge 
                className={cn(
                  "text-xs font-medium px-2 py-0.5 shrink-0",
                  status === "open" 
                    ? "bg-one-yellow text-one-gray" 
                    : "bg-muted text-muted-foreground"
                )}
              >
                {status === "open" ? (
                  <span className="flex items-center gap-1">
                    <Clock className="h-2.5 w-2.5" />
                    Live
                  </span>
                ) : (
                  "Resolved"
                )}
              </Badge>
            </div>

            {/* Price Display */}
            <div className="grid grid-cols-2 gap-2 mb-3">
              {/* YES */}
              <div className="relative overflow-hidden rounded-md border-2 border-one-yellow/40 bg-one-yellow/10 p-2.5 group-hover:border-one-yellow group-hover:bg-one-yellow/15 transition-all">
                <div className="flex items-center gap-1 mb-1">
                  <TrendingUp className="h-3 w-3 text-one-yellow" />
                  <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">Yes</span>
                </div>
                <div className="text-xl font-bold text-one-yellow mb-0.5">
                  {yesPercent.toFixed(1)}%
                </div>
                <div className="text-[10px] text-muted-foreground">
                  {yesPrice.toFixed(2)}¢
                </div>
              </div>

              {/* NO */}
              <div className="relative overflow-hidden rounded-md border-2 border-border bg-muted/40 p-2.5 group-hover:border-border group-hover:bg-muted/60 transition-all">
                <div className="flex items-center gap-1 mb-1">
                  <TrendingDown className="h-3 w-3 text-muted-foreground" />
                  <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">No</span>
                </div>
                <div className="text-xl font-bold text-foreground mb-0.5">
                  {noPercent.toFixed(1)}%
                </div>
                <div className="text-[10px] text-muted-foreground">
                  {noPrice.toFixed(2)}¢
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="flex items-center justify-between pt-2 border-t border-border">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Coins className="h-3 w-3" />
                <span>Vol: {(volume / 1000).toFixed(1)}K</span>
              </div>
              <div className="text-xs text-muted-foreground">
                Liq: {(liquidity / 1000).toFixed(1)}K
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

