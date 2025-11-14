"use client";

import { MarketsTab } from "@/components/market/markets-tab";

export default function MarketsPage() {
  return (
    <main className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold tracking-tight mb-2">All Markets</h1>
        <p className="text-muted-foreground">
          View all active prediction markets across all events
        </p>
      </div>
      <MarketsTab eventId="all" />
    </main>
  );
}

