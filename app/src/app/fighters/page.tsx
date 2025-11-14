import { SupportTab } from "@/components/support/support-tab";

export default function FightersPage() {
  // Mock fighters data
  const fighters = [
    { id: "1", name: "Fighter A", weightClass: "Lightweight" },
    { id: "2", name: "Fighter B", weightClass: "Featherweight" },
    { id: "3", name: "Fighter C", weightClass: "Welterweight" },
  ];

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold tracking-tight mb-2">Fighters</h1>
        <p className="text-muted-foreground">
          Support emerging fighters and help shape the future of ONE Championship
        </p>
      </div>
      <SupportTab eventId="all" fighters={fighters} />
    </main>
  );
}

