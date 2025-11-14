"use client";

import { EventCard } from "./event-card";

// Mock data - will be replaced with real data later
const mockEvents = [
  {
    id: "one-165",
    title: "ONE Championship 165",
    date: "Jan 28, 2025",
    location: "Lumpinee Stadium, Bangkok",
    fighterCount: 12,
    marketCount: 6,
    status: "upcoming" as const,
  },
  {
    id: "one-164",
    title: "ONE Championship 164",
    date: "Jan 14, 2025",
    location: "Singapore Indoor Stadium",
    fighterCount: 10,
    marketCount: 5,
    status: "live" as const,
  },
  {
    id: "one-163",
    title: "ONE Championship 163",
    date: "Dec 31, 2024",
    location: "Tokyo, Japan",
    fighterCount: 14,
    marketCount: 7,
    status: "completed" as const,
  },
];

export function EventList() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {mockEvents.map((event) => (
        <EventCard key={event.id} {...event} />
      ))}
    </div>
  );
}

