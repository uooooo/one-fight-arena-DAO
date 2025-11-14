"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, TrendingUp, Users, Trophy } from "lucide-react";

export function Hero() {
  return (
    <section className="relative overflow-hidden border-b border-border bg-gradient-to-b from-background to-muted/20">
      <div className="container mx-auto px-4 py-24 md:py-32">
        <div className="mx-auto max-w-3xl text-center">
          {/* Badge */}
          <div className="mb-6 flex justify-center">
            <Badge variant="secondary" className="gap-2 px-4 py-1.5">
              <TrendingUp className="h-3.5 w-3.5" />
              Powered by Sui Blockchain
            </Badge>
          </div>

          {/* Main Heading */}
          <h1 className="mb-6 text-5xl font-bold tracking-tight sm:text-6xl md:text-7xl">
            Predict. Support.{" "}
            <span className="text-primary">Win.</span>
          </h1>

          {/* Description */}
          <p className="mb-8 text-lg text-muted-foreground sm:text-xl md:text-2xl">
            The future of fight promotion is here. Bet on outcomes, support emerging fighters,
            and shape the next generation of ONE Championship stars.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Button size="lg" className="gap-2 px-8">
              Explore Events
              <ArrowRight className="h-4 w-4" />
            </Button>
            <Button size="lg" variant="outline" className="gap-2 px-8">
              Learn More
            </Button>
          </div>

          {/* Stats */}
          <div className="mt-16 grid grid-cols-1 gap-8 sm:grid-cols-3">
            <div className="flex flex-col items-center gap-2">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <Trophy className="h-6 w-6 text-primary" />
              </div>
              <div className="text-3xl font-bold">0</div>
              <div className="text-sm text-muted-foreground">Active Markets</div>
            </div>
            <div className="flex flex-col items-center gap-2">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <div className="text-3xl font-bold">0</div>
              <div className="text-sm text-muted-foreground">Fighters Supported</div>
            </div>
            <div className="flex flex-col items-center gap-2">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <TrendingUp className="h-6 w-6 text-primary" />
              </div>
              <div className="text-3xl font-bold">0 SUI</div>
              <div className="text-sm text-muted-foreground">Total Volume</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

