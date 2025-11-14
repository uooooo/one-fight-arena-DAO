"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { ConnectButton } from "@mysten/wallet-kit";
import { useWalletKit } from "@mysten/wallet-kit";

export function Navbar() {
  const { isConnected, currentAccount } = useWalletKit();

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
          <ConnectButton 
            connectText={
              <span className="hidden sm:inline">Connect Wallet</span>
            }
            connectedText={
              <span className="hidden sm:inline">Disconnect</span>
            }
          />
        </div>
      </div>
    </nav>
  );
}

