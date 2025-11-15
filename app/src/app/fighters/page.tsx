"use client";

import Image from "next/image";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, TrendingUp, Users, Trophy, Award } from "lucide-react";
import { useState } from "react";
import Link from "next/link";

interface Fighter {
  id: string;
  name: string;
  weightClass: string;
  country: string;
  record: string;
  imageUrl?: string;
  supportAmount: number;
  supporters: number;
  status: "active" | "champion" | "rising";
}

const mockFighters: Fighter[] = [
  {
    id: "superbon",
    name: "Superbon",
    weightClass: "Featherweight Kickboxing",
    country: "Thailand",
    record: "115-35-0",
    imageUrl: "/images/fighters/superbon.png",
    supportAmount: 125000,
    supporters: 342,
    status: "champion",
  },
  {
    id: "noiri",
    name: "Masaaki Noiri",
    weightClass: "Featherweight Kickboxing",
    country: "Japan",
    record: "45-8-0",
    imageUrl: "/images/fighters/noiri.png",
    supportAmount: 98000,
    supporters: 289,
    status: "champion",
  },
  {
    id: "shinya-aoki",
    name: "Shinya Aoki",
    weightClass: "Lightweight MMA",
    country: "Japan",
    record: "47-11-1",
    imageUrl: "/images/fighters/shinya-aoki.png",
    supportAmount: 156000,
    supporters: 512,
    status: "active",
  },
  {
    id: "rodtang",
    name: "Rodtang Jitmuangnon",
    weightClass: "Flyweight Muay Thai",
    country: "Thailand",
    record: "271-42-10",
    imageUrl: "/images/fighters/rodtang.png",
    supportAmount: 203000,
    supporters: 678,
    status: "champion",
  },
  {
    id: "christian-lee",
    name: "Christian Lee",
    weightClass: "Lightweight MMA",
    country: "Singapore / USA",
    record: "18-4-0",
    imageUrl: "/images/fighters/christian-lee.png",
    supportAmount: 189000,
    supporters: 445,
    status: "champion",
  },
  {
    id: "wakamatsu",
    name: "Yuya Wakamatsu",
    weightClass: "Flyweight MMA",
    country: "Japan",
    record: "16-5-0",
    imageUrl: "/images/fighters/wakamatsu.png",
    supportAmount: 87000,
    supporters: 234,
    status: "active",
  },
];

export default function FightersPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedWeightClass, setSelectedWeightClass] = useState<string>("all");

  const weightClasses = Array.from(new Set(mockFighters.map((f) => f.weightClass)));

  const filteredFighters = mockFighters.filter((fighter) => {
    const matchesSearch = fighter.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      fighter.country.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesWeightClass = selectedWeightClass === "all" || fighter.weightClass === selectedWeightClass;
    return matchesSearch && matchesWeightClass;
  });

  const sortedFighters = [...filteredFighters].sort((a, b) => b.supportAmount - a.supportAmount);

  return (
    <main className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold tracking-tight mb-2 text-foreground">Fighters</h1>
          <p className="text-muted-foreground text-lg">
            Support emerging fighters and help shape the future of ONE Championship
          </p>
        </div>

        {/* Search and Filter */}
        <div className="mb-6 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search fighters by name or country..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-muted/50 border-border"
            />
          </div>
          <Tabs value={selectedWeightClass} onValueChange={setSelectedWeightClass}>
            <TabsList className="inline-flex h-9 items-center justify-start rounded-md bg-muted p-1 text-muted-foreground">
              <TabsTrigger value="all" className="text-sm">All Classes</TabsTrigger>
              {weightClasses.map((wc) => (
                <TabsTrigger key={wc} value={wc} className="text-sm">
                  {wc.split(" ")[0]}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>

        {/* Stats Summary */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="bg-[hsl(225,7%,32%)] border-border">
            <CardHeader className="pb-2">
              <CardDescription className="text-xs uppercase tracking-wide">Total Fighters</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{mockFighters.length}</div>
            </CardContent>
          </Card>
          <Card className="bg-[hsl(225,7%,32%)] border-border">
            <CardHeader className="pb-2">
              <CardDescription className="text-xs uppercase tracking-wide">Total Support</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                ${(mockFighters.reduce((sum, f) => sum + f.supportAmount, 0) / 1000).toFixed(0)}K
              </div>
            </CardContent>
          </Card>
          <Card className="bg-[hsl(225,7%,32%)] border-border">
            <CardHeader className="pb-2">
              <CardDescription className="text-xs uppercase tracking-wide">Total Supporters</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                {mockFighters.reduce((sum, f) => sum + f.supporters, 0)}
              </div>
            </CardContent>
          </Card>
          <Card className="bg-[hsl(225,7%,32%)] border-border">
            <CardHeader className="pb-2">
              <CardDescription className="text-xs uppercase tracking-wide">Champions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                {mockFighters.filter((f) => f.status === "champion").length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Fighters Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {sortedFighters.map((fighter) => (
            <Link key={fighter.id} href={`/fighter/${fighter.id}`}>
              <Card className="group cursor-pointer transition-all hover:shadow-xl hover:border-one-yellow/50 border-border bg-[hsl(225,7%,32%)] hover:bg-[hsl(225,7%,35%)]">
                {/* Fighter Image */}
                {fighter.imageUrl ? (
                  <div className="relative h-64 w-full overflow-hidden rounded-t-lg bg-muted">
                    <Image
                      src={fighter.imageUrl}
                      alt={fighter.name}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[hsl(225,7%,32%)]/90 to-transparent pointer-events-none" />
                    {fighter.status === "champion" && (
                      <div className="absolute top-4 right-4">
                        <Badge className="bg-one-yellow text-one-gray border-0">
                          <Trophy className="h-3 w-3 mr-1" />
                          Champion
                        </Badge>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="relative h-64 w-full overflow-hidden rounded-t-lg bg-gradient-to-br from-one-yellow/20 to-muted/30 flex items-center justify-center">
                    <Users className="h-16 w-16 text-one-yellow/50" />
                  </div>
                )}

                <CardHeader>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <CardTitle className="text-xl font-bold">{fighter.name}</CardTitle>
                    {fighter.status === "rising" && (
                      <Badge variant="outline" className="text-xs">
                        <TrendingUp className="h-3 w-3 mr-1" />
                        Rising
                      </Badge>
                    )}
                  </div>
                  <CardDescription className="space-y-1">
                    <div className="flex items-center gap-2 text-sm">
                      <Award className="h-3.5 w-3.5" />
                      <span>{fighter.weightClass}</span>
                    </div>
                    <div className="text-xs text-muted-foreground">{fighter.country}</div>
                    <div className="text-xs font-mono text-muted-foreground">Record: {fighter.record}</div>
                  </CardDescription>
                </CardHeader>

                <CardContent className="pt-0">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 rounded-md bg-muted/50">
                      <div>
                        <div className="text-xs text-muted-foreground mb-1">Total Support</div>
                        <div className="text-lg font-bold text-one-yellow">
                          ${(fighter.supportAmount / 1000).toFixed(1)}K
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground mb-1">Supporters</div>
                        <div className="text-lg font-bold text-foreground">{fighter.supporters}</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        {filteredFighters.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <p>No fighters found matching your search.</p>
          </div>
        )}
      </div>
    </main>
  );
}
