"use client";

import { EventCard } from "./event-card";

// Mock data - will be replaced with real data later
const mockEvents = [
  {
    id: "one-173",
    title: "ONE Championship 173",
    date: "Nov 16, 2024",
    location: "Ariake Arena, Tokyo",
    fighterCount: 20,
    marketCount: 6,
    status: "upcoming" as const,
    imageUrl: "/images/one173/main-event.jpg",
  },
  {
    id: "one-172",
    title: "ONE Championship 172",
    date: "Oct 5, 2024",
    location: "Lumpinee Stadium, Bangkok",
    fighterCount: 16,
    marketCount: 5,
    status: "completed" as const,
    imageUrl: "/images/one173/keyart.jpg",
  },
  {
    id: "one-174",
    title: "ONE Championship 174",
    date: "TBA, 2025",
    location: "TBA",
    fighterCount: 0,
    marketCount: 0,
    status: "upcoming" as const,
    imageUrl: "/images/one173/press-conference.jpg",
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

