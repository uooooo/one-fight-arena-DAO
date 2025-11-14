import { EventList } from "@/components/event/event-list";

export default function EventsPage() {
  return (
    <main className="flex min-h-screen flex-col">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold tracking-tight mb-2">All Events</h1>
          <p className="text-muted-foreground">
            Browse all ONE Championship events and prediction markets
          </p>
        </div>
        <EventList />
      </div>
    </main>
  );
}

