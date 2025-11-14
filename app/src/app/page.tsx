import { EventList } from "@/components/event/event-list";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col">
      <div className="container mx-auto px-4 py-12">
        <div className="mb-10">
          <h1 className="text-4xl font-bold tracking-tight mb-3 text-foreground">Events</h1>
          <p className="text-muted-foreground text-lg">
            Explore ONE Championship events, prediction markets, and fighter support vaults
          </p>
        </div>
        <EventList />
      </div>
    </main>
  );
}
