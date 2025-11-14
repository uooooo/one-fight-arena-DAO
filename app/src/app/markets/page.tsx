"use client";

import { MarketCard } from "@/components/market/market-card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TrendingUp, Zap, Sparkles } from "lucide-react";

// Futarchy/ Promotion Externalization markets
// Conditional markets: "Will X happen?" → "If X happens, will Y exceed threshold?"
// Card comparison markets: Compare different matchups for promotion decisions
const mockMarkets = [
  // Conditional market: Shinya Aoki participation → views
  {
    id: "one173-shinya-aoki-participate",
    question: "Will Shinya Aoki participate in ONE 173?",
    yesPrice: 85.2,
    noPrice: 14.8,
    volume: 31200,
    liquidity: 95000,
    status: "open" as const,
    eventName: "ONE Championship 173",
    imageUrl: "https://www.onefc.com/wp-content/uploads/2024/11/Shinya_Aoki-avatar-500x345-1.jpg",
  },
  {
    id: "one173-shinya-aoki-2m-conditional",
    question: "If Shinya Aoki fights at ONE 173, will it exceed 2M views in 48h?",
    yesPrice: 68.5,
    noPrice: 31.5,
    volume: 24500,
    liquidity: 85000,
    status: "open" as const,
    eventName: "ONE Championship 173",
    imageUrl: "https://www.onefc.com/wp-content/uploads/2024/11/Shinya_Aoki-avatar-500x345-1.jpg",
  },
  // Card comparison: Superbon vs Noiri vs alternative matchups
  {
    id: "one173-superbon-noiri-ppv",
    question: "If Superbon vs Noiri is main event, will PPV exceed $500K?",
    yesPrice: 58.3,
    noPrice: 41.7,
    volume: 18900,
    liquidity: 72000,
    status: "open" as const,
    eventName: "ONE Championship 173",
    imageUrl: "https://www.onefc.com/wp-content/uploads/2024/11/Superbon-Avatar-500x345-1.jpg",
  },
  {
    id: "one173-rodtang-nong-o-ppv",
    question: "If Rodtang vs Nong-O is main event, will PPV exceed $500K?",
    yesPrice: 52.1,
    noPrice: 47.9,
    volume: 15600,
    liquidity: 65000,
    status: "open" as const,
    eventName: "ONE Championship 173",
    imageUrl: "https://www.onefc.com/wp-content/uploads/2024/11/Rodtang_Jitmuangnon-Avatar-500x345-1.jpg",
  },
  {
    id: "one173-christian-lee-main-ppv",
    question: "If Christian Lee vs Rasulov is main event, will PPV exceed $500K?",
    yesPrice: 45.8,
    noPrice: 54.2,
    volume: 12800,
    liquidity: 55000,
    status: "open" as const,
    eventName: "ONE Championship 173",
    imageUrl: "https://www.onefc.com/wp-content/uploads/2024/11/Christian_Lee-avatar-500x345-3.jpg",
  },
  // Social engagement conditional on card composition
  {
    id: "one173-social-engagement",
    question: "Will ONE 173 generate 100K+ social mentions?",
    yesPrice: 61.2,
    noPrice: 38.8,
    volume: 22100,
    liquidity: 78000,
    status: "open" as const,
    eventName: "ONE Championship 173",
    imageUrl: "https://www.onefc.com/wp-content/uploads/2024/11/Yuya_Wakamatsu-avatar-champ-500x345-1.jpg",
  },
  // Japan viewership comparison
  {
    id: "one173-japan-viewership",
    question: "Will ONE 173 attract more Japanese viewers than ONE 172?",
    yesPrice: 72.4,
    noPrice: 27.6,
    volume: 31200,
    liquidity: 95000,
    status: "open" as const,
    eventName: "ONE Championship 173",
    imageUrl: "https://www.onefc.com/wp-content/uploads/2024/11/Maasaki_Noiri-avatar-champ-500x345-1.jpg",
  },
];

export default function MarketsPage() {
  return (
    <main className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold tracking-tight mb-2 text-foreground">Promotion Markets</h1>
          <p className="text-sm text-muted-foreground">
            Futarchy-driven prediction markets for fight promotion externalization. Trade on pre/post-fight narratives and outcomes.
          </p>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="trending" className="mb-6">
          <TabsList className="inline-flex h-9 items-center justify-start rounded-md bg-muted p-1 text-muted-foreground mb-6">
            <TabsTrigger 
              value="trending" 
              className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
            >
              <TrendingUp className="h-3.5 w-3.5" />
              Trending
            </TabsTrigger>
            <TabsTrigger 
              value="new" 
              className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
            >
              <Sparkles className="h-3.5 w-3.5" />
              New
            </TabsTrigger>
            <TabsTrigger 
              value="all" 
              className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
            >
              <Zap className="h-3.5 w-3.5" />
              All
            </TabsTrigger>
          </TabsList>

          <TabsContent value="trending" className="mt-0">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {mockMarkets.slice(0, 6).map((market) => (
                <MarketCard key={market.id} {...market} />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="new" className="mt-0">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {mockMarkets.slice(0, 3).map((market) => (
                <MarketCard key={market.id} {...market} />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="all" className="mt-0">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {mockMarkets.map((market) => (
                <MarketCard key={market.id} {...market} />
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </main>
  );
}
