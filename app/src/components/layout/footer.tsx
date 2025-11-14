"use client";

import Link from "next/link";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";

export function Footer() {
  return (
    <footer className="border-t border-border bg-background mt-auto">
      <div className="container mx-auto px-6 py-10">
        <div className="grid gap-8 md:grid-cols-4">
          {/* Brand */}
          <div className="space-y-3">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded bg-one-yellow text-one-gray font-bold text-base">
                ONE
              </div>
              <span className="text-base font-semibold">Fight Arena DAO</span>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Democratizing fight promotion through prediction markets and fighter support on Sui blockchain.
            </p>
          </div>

          {/* Navigation */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-foreground">Navigation</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/" className="text-muted-foreground hover:text-one-yellow transition-colors">
                  Events
                </Link>
              </li>
              <li>
                <Link href="/markets" className="text-muted-foreground hover:text-one-yellow transition-colors">
                  Markets
                </Link>
              </li>
              <li>
                <Link href="/fighters" className="text-muted-foreground hover:text-one-yellow transition-colors">
                  Fighters
                </Link>
              </li>
            </ul>
          </div>

          {/* Resources */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-foreground">Resources</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <a
                  href="https://docs.sui.io"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-one-yellow transition-colors"
                >
                  Sui Documentation
                </a>
              </li>
              <li>
                <a
                  href="https://deepbook.tech"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-one-yellow transition-colors"
                >
                  DeepBook
                </a>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-foreground">Legal</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/terms" className="text-muted-foreground hover:text-one-yellow transition-colors">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="text-muted-foreground hover:text-one-yellow transition-colors">
                  Privacy Policy
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <Separator className="my-8" />

        <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
          <p className="text-sm text-muted-foreground">
            © 2025 ONE Fight Arena DAO. Built on Sui blockchain.
          </p>
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="text-xs font-medium">
              Testnet
            </Badge>
          </div>
        </div>
      </div>
    </footer>
  );
}

