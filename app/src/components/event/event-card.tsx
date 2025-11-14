"use client";

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, MapPin, Users, ArrowRight } from "lucide-react";
import Link from "next/link";

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
  const statusColors = {
    upcoming: "secondary",
    live: "default",
    completed: "outline",
  } as const;

  const statusLabels = {
    upcoming: "Upcoming",
    live: "Live",
    completed: "Completed",
  } as const;

  return (
    <Card className="group transition-all hover:shadow-lg hover:border-primary/50">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-xl">{title}</CardTitle>
            <CardDescription className="flex items-center gap-4 pt-2">
              <span className="flex items-center gap-1.5 text-sm">
                <Calendar className="h-4 w-4" />
                {date}
              </span>
              <span className="flex items-center gap-1.5 text-sm">
                <MapPin className="h-4 w-4" />
                {location}
              </span>
            </CardDescription>
          </div>
          <Badge variant={statusColors[status]}>{statusLabels[status]}</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-6 text-sm text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <Users className="h-4 w-4" />
            <span>{fighterCount} Fighters</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span>{marketCount} Markets</span>
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button asChild variant="outline" className="w-full group-hover:border-primary group-hover:text-primary">
          <Link href={`/event/${id}`} className="flex items-center justify-center gap-2">
            View Details
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}

