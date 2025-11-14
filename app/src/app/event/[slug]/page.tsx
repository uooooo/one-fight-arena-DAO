"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Calendar, MapPin, Users, TrendingUp, Heart } from "lucide-react";
import { MarketsTab } from "@/components/market/markets-tab";
import { SupportTab } from "@/components/support/support-tab";
import { cn } from "@/lib/utils";

interface EventPageProps {
  params: {
    slug: string;
  };
}

export default function EventPage({ params }: EventPageProps) {
  // Mock data - will be replaced with real data later
  const event = {
    id: params.slug,
    title: "ONE Championship 165",
    date: "January 28, 2025",
    location: "Lumpinee Stadium, Bangkok",
    status: "upcoming" as const,
    fighters: [
      { id: "1", name: "Fighter A", weightClass: "Lightweight" },
      { id: "2", name: "Fighter B", weightClass: "Featherweight" },
    ],
  };

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
    <main className="container mx-auto px-6 py-8">
      {/* Event Header */}
      <div className="mb-10">
        <div className="mb-4 flex items-center gap-3">
          <Badge className={cn("text-xs font-semibold px-2.5 py-1 uppercase tracking-wide", config.className)}>
            {config.label}
          </Badge>
          <span className="text-xs text-muted-foreground font-mono">{event.id}</span>
        </div>
        <h1 className="mb-6 text-4xl font-bold tracking-tight text-foreground">{event.title}</h1>
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

      {/* Tabs Navigation */}
      <Tabs defaultValue="markets" className="w-full">
        <TabsList className="inline-flex h-10 items-center justify-start rounded-md bg-muted p-1 text-muted-foreground mb-8">
          <TabsTrigger 
            value="markets" 
            className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
          >
            <TrendingUp className="h-4 w-4" />
            Markets
          </TabsTrigger>
          <TabsTrigger 
            value="support" 
            className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
          >
            <Heart className="h-4 w-4" />
            Support
          </TabsTrigger>
        </TabsList>

        <TabsContent value="markets" className="mt-0">
          <MarketsTab eventId={event.id} />
        </TabsContent>

        <TabsContent value="support" className="mt-0">
          <SupportTab eventId={event.id} fighters={event.fighters} />
        </TabsContent>
      </Tabs>
    </main>
  );
}

