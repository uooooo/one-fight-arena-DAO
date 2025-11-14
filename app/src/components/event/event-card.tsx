"use client";

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, MapPin, Users, TrendingUp, ArrowRight } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface EventCardProps {
  id: string;
  title: string;
  date: string;
  location: string;
  fighterCount: number;
  marketCount: number;
  status: "upcoming" | "live" | "completed";
}

export function EventCard({
  id,
  title,
  date,
  location,
  fighterCount,
  marketCount,
  status,
}: EventCardProps) {
  const statusConfig = {
    upcoming: {
      variant: "secondary" as const,
      label: "Upcoming",
      className: "bg-muted text-muted-foreground",
    },
    live: {
      variant: "default" as const,
      label: "Live",
      className: "bg-one-yellow text-one-gray",
    },
    completed: {
      variant: "outline" as const,
      label: "Completed",
      className: "border-muted text-muted-foreground",
    },
  };

  const config = statusConfig[status];

  return (
    <Card className="group transition-all hover:shadow-lg hover:border-one-yellow/30 border-border bg-card">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between gap-3 mb-3">
          <CardTitle className="text-lg font-semibold leading-tight pr-2">{title}</CardTitle>
          <Badge className={cn("text-xs font-medium px-2 py-0.5 shrink-0", config.className)}>
            {config.label}
          </Badge>
        </div>
        <CardDescription className="space-y-2 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Calendar className="h-3.5 w-3.5 shrink-0" />
            <span>{date}</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <MapPin className="h-3.5 w-3.5 shrink-0" />
            <span className="line-clamp-1">{location}</span>
          </div>
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-0 pb-4">
        <div className="flex items-center gap-6 text-sm">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Users className="h-4 w-4" />
            <span className="font-medium">{fighterCount}</span>
            <span className="text-xs">fighters</span>
          </div>
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <TrendingUp className="h-4 w-4" />
            <span className="font-medium">{marketCount}</span>
            <span className="text-xs">markets</span>
          </div>
        </div>
      </CardContent>
      <CardFooter className="pt-0">
        <Button 
          asChild 
          variant="outline" 
          className="w-full border-border hover:border-one-yellow hover:text-one-yellow hover:bg-one-yellow/5 transition-colors"
        >
          <Link href={`/event/${id}`} className="flex items-center justify-center gap-2 text-sm font-medium">
            View Details
            <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}

