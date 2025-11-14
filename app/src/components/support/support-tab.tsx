"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Heart, TrendingUp, Users, Coins } from "lucide-react";

interface Fighter {
  id: string;
  name: string;
  weightClass: string;
}

interface SupportTabProps {
  eventId: string;
  fighters: Fighter[];
}

// Mock vault data
const mockVaults = [
  {
    fighterId: "1",
    fighterName: "Fighter A",
    totalRaised: 12500,
    supporterCount: 45,
    tier: "bronze" as const,
  },
  {
    fighterId: "2",
    fighterName: "Fighter B",
    totalRaised: 8900,
    supporterCount: 32,
    tier: "silver" as const,
  },
];

export function SupportTab({ eventId, fighters }: SupportTabProps) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight mb-2">Support Vaults</h2>
        <p className="text-muted-foreground">
          Support emerging fighters by contributing to their vaults. Earn Supporter NFTs and help shape the future of ONE Championship.
        </p>
      </div>

      {/* Vaults Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        {mockVaults.map((vault) => (
          <Card key={vault.fighterId} className="transition-all hover:shadow-lg">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12">
                    <AvatarFallback className="bg-primary text-primary-foreground font-bold">
                      {vault.fighterName.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle className="text-lg">{vault.fighterName}</CardTitle>
                    <CardDescription className="mt-1">
                      {fighters.find((f) => f.id === vault.fighterId)?.weightClass || "Unknown"}
                    </CardDescription>
                  </div>
                </div>
                <Badge variant="secondary" className="capitalize">
                  {vault.tier}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Stats */}
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-lg border border-border bg-muted/50 p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Coins className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium text-muted-foreground">Raised</span>
                  </div>
                  <div className="text-2xl font-bold">
                    {(vault.totalRaised / 1000).toFixed(1)}K
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">SUI</div>
                </div>
                <div className="rounded-lg border border-border bg-muted/50 p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Users className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium text-muted-foreground">Supporters</span>
                  </div>
                  <div className="text-2xl font-bold">{vault.supporterCount}</div>
                  <div className="text-xs text-muted-foreground mt-1">NFTs minted</div>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Progress</span>
                  <span className="font-medium">25%</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full bg-primary transition-all"
                    style={{ width: "25%" }}
                  />
                </div>
              </div>

              {/* Action Button */}
              <Button className="w-full gap-2" variant="default">
                <Heart className="h-4 w-4" />
                Support Fighter
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {mockVaults.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Heart className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No support vaults available</h3>
            <p className="text-sm text-muted-foreground text-center">
              Support vaults will appear here once fighters are registered.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

