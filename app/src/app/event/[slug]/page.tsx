"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, MapPin, Users, TrendingUp, Heart } from "lucide-react";
import { MarketsTab } from "@/components/market/markets-tab";
import { SupportTab } from "@/components/support/support-tab";

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

  return (
    <main className="container mx-auto px-4 py-8">
      {/* Event Header */}
      <div className="mb-8">
        <div className="mb-4 flex items-center gap-3">
          <Badge variant="secondary">{event.status.toUpperCase()}</Badge>
          <span className="text-sm text-muted-foreground">Event ID: {event.id}</span>
        </div>
        <h1 className="mb-4 text-4xl font-bold tracking-tight">{event.title}</h1>
        <div className="flex flex-wrap items-center gap-6 text-muted-foreground">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            <span>{event.date}</span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            <span>{event.location}</span>
          </div>
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            <span>{event.fighters.length} Fighters</span>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <Tabs defaultValue="markets" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2 mb-8">
          <TabsTrigger value="markets" className="gap-2">
            <TrendingUp className="h-4 w-4" />
            Markets
          </TabsTrigger>
          <TabsTrigger value="support" className="gap-2">
            <Heart className="h-4 w-4" />
            Support
          </TabsTrigger>
        </TabsList>

        <TabsContent value="markets" className="space-y-6">
          <MarketsTab eventId={event.id} />
        </TabsContent>

        <TabsContent value="support" className="space-y-6">
          <SupportTab eventId={event.id} fighters={event.fighters} />
        </TabsContent>
      </Tabs>
    </main>
  );
}

