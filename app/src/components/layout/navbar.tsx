"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { ConnectButton } from "@mysten/wallet-kit";
import { useWalletKit } from "@mysten/wallet-kit";
import { cn } from "@/lib/utils";

export function Navbar() {
  const { isConnected, currentAccount } = useWalletKit();
  const pathname = usePathname();

  const address = currentAccount?.address;
  const displayAddress = address
    ? `${address.slice(0, 6)}...${address.slice(-4)}`
    : "";

  const navLinks = [
    { href: "/", label: "Events" },
    { href: "/markets", label: "Markets" },
    { href: "/fighters", label: "Fighters" },
  ];

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="container mx-auto flex h-14 items-center justify-between px-6">
        {/* Logo and Brand */}
        <div className="flex items-center gap-4">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="flex h-9 w-9 items-center justify-center rounded bg-one-yellow text-one-gray font-bold text-base transition-transform group-hover:scale-105">
              ONE
            </div>
            <span className="text-lg font-semibold tracking-tight text-foreground hidden sm:inline-block">
              Fight Arena DAO
            </span>
          </Link>
        </div>

        {/* Navigation Links */}
        <div className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => {
            const isActive = pathname === link.href || (link.href !== "/" && pathname?.startsWith(link.href));
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "px-3 py-1.5 text-sm font-medium rounded transition-colors",
                  isActive
                    ? "bg-one-yellow/10 text-one-yellow"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                )}
              >
                {link.label}
              </Link>
            );
          })}
        </div>

        {/* Right Side Actions */}
        <div className="flex items-center gap-3">
          <Badge variant="secondary" className="hidden sm:flex text-xs font-medium px-2 py-0.5">
            Testnet
          </Badge>
          {isConnected && address && (
            <Badge variant="outline" className="hidden sm:flex font-mono text-xs px-2 py-0.5">
              {displayAddress}
            </Badge>
          )}
          <div className="[&_button]:bg-one-yellow [&_button]:text-one-gray [&_button]:hover:bg-one-yellow-dark [&_button]:font-medium [&_button]:text-sm [&_button]:px-4 [&_button]:py-1.5 [&_button]:rounded">
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
      </div>
    </nav>
  );
}

