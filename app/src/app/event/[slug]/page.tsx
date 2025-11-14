"use client";

import { use } from "react";
import { Badge } from "@/components/ui/badge";
import { Calendar, MapPin, Users } from "lucide-react";
import { MarketCard } from "@/components/market/market-card";
import { cn } from "@/lib/utils";

interface EventPageProps {
  params: Promise<{
    slug: string;
  }>;
}

// Futarchy/ Promotion Externalization markets
// These markets predict promotion success metrics for decision-making
const getEventMarkets = (eventId: string) => {
  const eventNum = eventId.replace("one-", "").replace("one", "");

  // ONE 173 specific promotion markets (conditional & card comparison)
  if (eventId === "one-173" || eventId === "one173") {
    return [
      // Conditional: Shinya Aoki participation → views
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
      // Card comparison: Different main event options
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
    ];
  }

  // ONE 172 markets (completed event - resolved promotion metrics)
  if (eventId === "one-172" || eventId === "one172") {
    return [
      {
        id: "one172-ppv-revenue",
        question: "Did ONE 172 PPV revenue exceed $400K?",
        yesPrice: 100,
        noPrice: 0,
        volume: 12500,
        liquidity: 50000,
        status: "resolved" as const,
        eventName: "ONE Championship 172",
      },
      {
        id: "one172-social-engagement",
        question: "Did ONE 172 generate 80K+ social mentions?",
        yesPrice: 100,
        noPrice: 0,
        volume: 8900,
        liquidity: 35000,
        status: "resolved" as const,
        eventName: "ONE Championship 172",
      },
    ];
  }

  // Default promotion markets for other events
  return [
    {
      id: `${eventId}-ppv-revenue`,
      question: `Will ONE ${eventNum} PPV revenue exceed $400K?`,
      yesPrice: 54.2,
      noPrice: 45.8,
      volume: 12500,
      liquidity: 50000,
      status: "open" as const,
      eventName: `ONE Championship ${eventNum}`,
    },
    {
      id: `${eventId}-social-engagement`,
      question: `Will ONE ${eventNum} generate 80K+ social mentions?`,
      yesPrice: 47.6,
      noPrice: 52.4,
      volume: 8900,
      liquidity: 35000,
      status: "open" as const,
      eventName: `ONE Championship ${eventNum}`,
    },
  ];
};

// Get event data based on slug
const getEventData = (slug: string) => {
  if (!slug) {
    return {
      id: "unknown",
      title: "Unknown Event",
      date: "TBA",
      location: "TBA",
      status: "upcoming" as const,
      fighters: [],
    };
  }

  if (slug === "one-173" || slug === "one173") {
    return {
      id: slug,
      title: "ONE Championship 173",
      date: "November 16, 2024",
      location: "Ariake Arena, Tokyo",
      status: "upcoming" as const,
      fighters: [
        { id: "1", name: "Superbon", weightClass: "Featherweight Kickboxing" },
        { id: "2", name: "Masaaki Noiri", weightClass: "Featherweight Kickboxing" },
        { id: "3", name: "Shinya Aoki", weightClass: "Lightweight MMA" },
        { id: "4", name: "Hiroyuki Tetsuka", weightClass: "Lightweight MMA" },
      ],
    };
  }

  if (slug === "one-172" || slug === "one172") {
    return {
      id: slug,
      title: "ONE Championship 172",
      date: "October 5, 2024",
      location: "Lumpinee Stadium, Bangkok",
      status: "completed" as const,
      fighters: [
        { id: "1", name: "Fighter A", weightClass: "Lightweight" },
        { id: "2", name: "Fighter B", weightClass: "Featherweight" },
      ],
    };
  }

  if (slug === "one-174" || slug === "one174") {
    return {
      id: slug,
      title: "ONE Championship 174",
      date: "TBA, 2025",
      location: "TBA",
      status: "upcoming" as const,
      fighters: [],
    };
  }
  
  // Default event data
  const eventNum = slug.replace("one-", "") || "Unknown";
  return {
    id: slug,
    title: `ONE Championship ${eventNum}`,
    date: "TBA",
    location: "TBA",
    status: "upcoming" as const,
    fighters: [
      { id: "1", name: "Fighter A", weightClass: "Lightweight" },
      { id: "2", name: "Fighter B", weightClass: "Featherweight" },
    ],
  };
};

export default function EventPage({ params }: EventPageProps) {
  const { slug } = use(params);
  const event = getEventData(slug);
  const markets = getEventMarkets(event.id);

  const statusConfig = {
    upcoming: {
      className: "bg-muted text-muted-foreground",
      label: "UPCOMING",
    },
    live: {
      className: "bg-one-yellow text-one-gray",
      label: "LIVE",
    },
    completed: {
      className: "border-muted text-muted-foreground",
      label: "COMPLETED",
    },
  };

  const config = statusConfig[event.status];

  return (
    <main className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6">
        {/* Event Header */}
        <div className="mb-8">
          <div className="mb-4 flex items-center gap-3">
            <Badge className={cn("text-xs font-semibold px-2.5 py-1 uppercase tracking-wide", config.className)}>
              {config.label}
            </Badge>
            <span className="text-xs text-muted-foreground font-mono">{event.id}</span>
          </div>
          <h1 className="mb-6 text-3xl font-bold tracking-tight text-foreground">{event.title}</h1>
          <div className="flex flex-wrap items-center gap-6 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 shrink-0" />
              <span>{event.date}</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 shrink-0" />
              <span>{event.location}</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 shrink-0" />
              <span>{event.fighters.length} Fighters</span>
            </div>
          </div>
        </div>

        {/* Markets Grid */}
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-4 text-foreground">Markets</h2>
          {markets.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {markets.map((market) => (
                <MarketCard key={market.id} {...market} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <p>No markets available for this event yet.</p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

