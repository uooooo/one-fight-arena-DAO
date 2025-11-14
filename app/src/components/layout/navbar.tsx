"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Wallet } from "lucide-react";
import { useWalletKit } from "@mysten/wallet-kit";

export function Navbar() {
  const { currentWallet, connect, disconnect, isConnected, currentAccount } = useWalletKit();

  const handleWalletClick = async () => {
    if (isConnected) {
      await disconnect();
    } else {
      // connect() requires wallet name, but we'll use the modal approach
      // The WalletKitProvider will show a modal when connect is called
      try {
        await connect("Sui Wallet"); // Default wallet name
      } catch (error) {
        // If specific wallet fails, try opening the modal
        console.error("Failed to connect:", error);
      }
    }
  };

  const address = currentAccount?.address;
  const displayAddress = address
    ? `${address.slice(0, 6)}...${address.slice(-4)}`
    : "";

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        {/* Logo and Brand */}
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground font-bold text-lg">
              ONE
            </div>
            <span className="text-xl font-bold tracking-tight">Fight Arena DAO</span>
          </Link>
        </div>

        {/* Navigation Links */}
        <div className="hidden md:flex items-center gap-6">
          <Link
            href="/events"
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            Events
          </Link>
          <Link
            href="/markets"
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            Markets
          </Link>
          <Link
            href="/fighters"
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            Fighters
          </Link>
        </div>

        {/* Right Side Actions */}
        <div className="flex items-center gap-4">
          <Badge variant="secondary" className="hidden sm:flex">
            Testnet
          </Badge>
          {isConnected && address && (
            <Badge variant="outline" className="hidden sm:flex font-mono text-xs">
              {displayAddress}
            </Badge>
          )}
          <Button
            variant={isConnected ? "outline" : "default"}
            onClick={handleWalletClick}
            className="gap-2"
          >
            <Wallet className="h-4 w-4" />
            <span className="hidden sm:inline">
              {isConnected ? "Disconnect" : "Connect Wallet"}
            </span>
            <span className="sm:hidden">{isConnected ? "Disconnect" : "Connect"}</span>
          </Button>
        </div>
      </div>
    </nav>
  );
}

