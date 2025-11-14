"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Heart, Users, Coins, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";

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
    goal: 50000,
  },
  {
    fighterId: "2",
    fighterName: "Fighter B",
    totalRaised: 8900,
    supporterCount: 32,
    tier: "silver" as const,
    goal: 40000,
  },
];

const tierConfig = {
  bronze: {
    label: "Bronze",
    className: "bg-amber-500/10 text-amber-500 border-amber-500/20",
    icon: Trophy,
  },
  silver: {
    label: "Silver",
    className: "bg-gray-400/10 text-gray-400 border-gray-400/20",
    icon: Trophy,
  },
  gold: {
    label: "Gold",
    className: "bg-one-yellow/10 text-one-yellow border-one-yellow/20",
    icon: Trophy,
  },
};

export function SupportTab({ eventId, fighters }: SupportTabProps) {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <h2 className="text-2xl font-semibold tracking-tight text-foreground">Support Vaults</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Support emerging fighters by contributing to their vaults. Earn Supporter NFTs and help shape the future of ONE Championship.
        </p>
      </div>

      {/* Vaults Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        {mockVaults.map((vault) => {
          const fighter = fighters.find((f) => f.id === vault.fighterId);
          const progress = Math.min((vault.totalRaised / vault.goal) * 100, 100);
          const tier = tierConfig[vault.tier];

          return (
            <Card key={vault.fighterId} className="transition-all hover:shadow-lg hover:border-one-yellow/30 border-border bg-card">
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-12 w-12 border-2 border-border">
                      <AvatarFallback className="bg-one-yellow text-one-gray font-bold text-base">
                        {vault.fighterName.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <CardTitle className="text-lg font-semibold">{vault.fighterName}</CardTitle>
                      <CardDescription className="mt-1 text-xs">
                        {fighter?.weightClass || "Unknown"}
                      </CardDescription>
                    </div>
                  </div>
                  <Badge className={cn("text-xs font-medium px-2 py-0.5 capitalize shrink-0", tier.className)}>
                    {tier.label}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-5">
                {/* Stats */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-md border border-border bg-muted/30 p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Coins className="h-3.5 w-3.5 text-one-yellow" />
                      <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Raised</span>
                    </div>
                    <div className="text-xl font-bold text-foreground mb-0.5">
                      {(vault.totalRaised / 1000).toFixed(1)}K
                    </div>
                    <div className="text-xs text-muted-foreground">SUI</div>
                  </div>
                  <div className="rounded-md border border-border bg-muted/30 p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Users className="h-3.5 w-3.5 text-one-yellow" />
                      <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Supporters</span>
                    </div>
                    <div className="text-xl font-bold text-foreground mb-0.5">{vault.supporterCount}</div>
                    <div className="text-xs text-muted-foreground">NFTs minted</div>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Progress to goal</span>
                    <span className="font-semibold text-foreground">{progress.toFixed(0)}%</span>
                  </div>
                  <Progress value={progress} className="h-2 bg-muted" />
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{vault.totalRaised.toLocaleString()} SUI</span>
                    <span>Goal: {vault.goal.toLocaleString()} SUI</span>
                  </div>
                </div>

                {/* Action Button */}
                <Button className="w-full gap-2 bg-one-yellow text-one-gray hover:bg-one-yellow-dark font-medium h-10">
                  <Heart className="h-3.5 w-3.5" />
                  Support Fighter
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Empty State */}
      {mockVaults.length === 0 && (
        <Card className="border-border">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Heart className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2 text-foreground">No support vaults available</h3>
            <p className="text-sm text-muted-foreground text-center max-w-md">
              Support vaults will appear here once fighters are registered.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

