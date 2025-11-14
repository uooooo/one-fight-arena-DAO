"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Heart, Users, Coins, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";
import { useWalletKit } from "@mysten/wallet-kit";
import { Transaction } from "@mysten/sui/transactions";
import { depositToVaultTx, mintSupporterNFTTx } from "@/lib/sui/execute";
import { suiClient } from "@/lib/sui/client";

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
    amount: 5, // SUI
    tier: 1 as const,
  },
  silver: {
    label: "Silver",
    className: "bg-gray-400/10 text-gray-400 border-gray-400/20",
    icon: Trophy,
    amount: 15, // SUI
    tier: 2 as const,
  },
  gold: {
    label: "Gold",
    className: "bg-one-yellow/10 text-one-yellow border-one-yellow/20",
    icon: Trophy,
    amount: 50, // SUI
    tier: 3 as const,
  },
};

interface SupportDialogProps {
  vault: typeof mockVaults[0];
  fighter: Fighter | undefined;
}

function SupportDialog({ vault, fighter }: SupportDialogProps) {
  const { signAndExecuteTransactionBlock, currentAccount } = useWalletKit();
  const [open, setOpen] = useState(false);
  const [selectedTier, setSelectedTier] = useState<keyof typeof tierConfig>("bronze");
  const [customAmount, setCustomAmount] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Use actual vault ID from seed data
  // These IDs are updated from SEED_DATA.json after deployment
  // Testnet IDs (update these after testnet deployment)
  const vaultId = "0xcfa550799b47e4df67097c8675577317c794fe6a16361aedaba9dae560cc3ccf"; // From SEED_DATA.json (testnet)
  const fighterId = "0x7f35a33fca3ed3e23b0f104cb1acc1f4b9aeaf7d28a50463d2ca705d7fbc2904"; // From SEED_DATA.json (testnet)

  const handleSupport = async () => {
    if (!currentAccount || !signAndExecuteTransactionBlock) {
      alert("Please connect your wallet first.");
      return;
    }

    const tier = tierConfig[selectedTier];
    const amount = customAmount ? parseFloat(customAmount) : tier.amount;
    
    if (!amount || amount <= 0) {
      alert("Please enter a valid amount.");
      return;
    }

    setIsSubmitting(true);
    try {
      const tx = new Transaction();
      
      // Convert SUI to MIST (1 SUI = 1,000,000,000 MIST)
      const amountMist = BigInt(Math.floor(amount * 1_000_000_000));
      
      // Deposit to vault
      depositToVaultTx(vaultId, amountMist, tx);
      
      // Mint Supporter NFT
      const metadataUrl = `https://one-fight-arena-dao.vercel.app/fighter/${fighterId}`;
      mintSupporterNFTTx(fighterId, tier.tier, metadataUrl, tx);

      // Execute transaction
      const result = await signAndExecuteTransactionBlock({
        transaction: tx,
        options: {
          showEffects: true,
          showEvents: true,
          showObjectChanges: true,
          showBalanceChanges: true,
        },
      });

      console.log("Transaction result:", result);
      
      // Wait for transaction to be indexed
      await suiClient.waitForTransaction({
        digest: result.digest,
      });

      alert(`Support successful! Transaction: ${result.digest}`);
      setOpen(false);
      setCustomAmount("");
    } catch (error: any) {
      console.error("Error supporting fighter:", error);
      const errorMessage = error?.message || "Failed to support fighter. Please try again.";
      alert(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="w-full gap-2 bg-one-yellow text-one-gray hover:bg-one-yellow-dark font-medium h-10">
          <Heart className="h-3.5 w-3.5" />
          Support Fighter
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Support {vault.fighterName}</DialogTitle>
          <DialogDescription>
            Choose a supporter tier or enter a custom amount. You'll receive a Supporter NFT for your contribution.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-6 py-4">
          {/* Tier Selection */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Supporter Tier</Label>
            <div className="grid grid-cols-3 gap-3">
              {Object.entries(tierConfig).map(([key, config]) => (
                <button
                  key={key}
                  onClick={() => {
                    setSelectedTier(key as keyof typeof tierConfig);
                    setCustomAmount("");
                  }}
                  className={cn(
                    "rounded-md border-2 p-4 text-center transition-all",
                    selectedTier === key
                      ? config.className + " border-current"
                      : "border-border bg-muted/30 hover:border-border hover:bg-muted/50"
                  )}
                >
                  <config.icon className="h-5 w-5 mx-auto mb-2" />
                  <div className="text-sm font-semibold">{config.label}</div>
                  <div className="text-xs text-muted-foreground mt-1">{config.amount} SUI</div>
                </button>
              ))}
            </div>
          </div>

          {/* Custom Amount */}
          <div className="space-y-2">
            <Label htmlFor="custom-amount" className="text-sm font-medium">Or Custom Amount (SUI)</Label>
            <Input
              id="custom-amount"
              type="number"
              step="0.1"
              placeholder="Enter amount"
              value={customAmount}
              onChange={(e) => {
                setCustomAmount(e.target.value);
                if (e.target.value) {
                  setSelectedTier("bronze"); // Reset tier selection
                }
              }}
              className="h-10"
            />
          </div>

          {/* Summary */}
          <div className="rounded-md border border-border bg-muted/30 p-4 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Amount:</span>
              <span className="font-semibold text-foreground">
                {customAmount || tierConfig[selectedTier].amount} SUI
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Tier:</span>
              <Badge className={cn("text-xs", tierConfig[selectedTier].className)}>
                {tierConfig[selectedTier].label}
              </Badge>
            </div>
          </div>

          {/* Submit Button */}
          <Button
            onClick={handleSupport}
            disabled={!currentAccount || isSubmitting}
            className="w-full gap-2 bg-one-yellow text-one-gray hover:bg-one-yellow-dark font-medium h-10"
          >
            {isSubmitting ? (
              "Processing..."
            ) : (
              <>
                <Heart className="h-3.5 w-3.5" />
                Support {customAmount || tierConfig[selectedTier].amount} SUI
              </>
            )}
          </Button>

          {!currentAccount && (
            <p className="text-xs text-muted-foreground text-center">
              Please connect your wallet to support fighters
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

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
                <SupportDialog vault={vault} fighter={fighter} />
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

