import { Hero } from "@/components/layout/hero";
import { EventList } from "@/components/event/event-list";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col">
      <Hero />
      <EventList />
    </main>
  );
}
