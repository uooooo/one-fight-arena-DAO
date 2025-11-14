"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TrendingUp, TrendingDown, ArrowRight } from "lucide-react";
import { useWalletKit } from "@mysten/wallet-kit";
import { Transaction } from "@mysten/sui/transactions";
import { placeBetTx } from "@/lib/sui/transactions";
import { suiClient } from "@/lib/sui/client";

interface PlaceOrderProps {
  poolId: string;
  yesCoinType: string;
  noCoinType: string;
  marketId: string;
}

export function PlaceOrder({ poolId, yesCoinType, noCoinType, marketId }: PlaceOrderProps) {
  const { signAndExecuteTransactionBlock, currentAccount } = useWalletKit();
  const [side, setSide] = useState<"yes" | "no">("yes");
  const [price, setPrice] = useState("");
  const [quantity, setQuantity] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handlePlaceOrder = async () => {
    if (!currentAccount || !price || !quantity) {
      return;
    }

    setIsSubmitting(true);
    try {
      const tx = new Transaction();
      
      // Place bet transaction
      placeBetTx(
        poolId,
        price,
        quantity,
        side === "yes",
        yesCoinType,
        noCoinType,
        tx.gas, // Using gas coin as payment for now
        tx
      );

      // Build and sign the transaction
      // Note: Transaction API needs to be properly integrated with wallet-kit
      // For MVP, we'll show a placeholder message
      alert("Transaction functionality will be implemented after Move package deployment. Please ensure your wallet is connected.");
      
      // TODO: Implement proper transaction signing once Move package is deployed
      // const result = await signAndExecuteTransactionBlock({
      //   transaction: tx,
      //   options: {
      //     showEffects: true,
      //     showEvents: true,
      //   },
      // });

      // console.log("Transaction result:", result);
      
      // Reset form
      setPrice("");
      setQuantity("");
    } catch (error) {
      console.error("Error placing order:", error);
      alert("Failed to place order. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="border-border bg-card">
      <CardHeader className="pb-4">
        <CardTitle className="text-base font-semibold">Place Order</CardTitle>
        <CardDescription className="text-xs mt-1">Buy YES or NO coins on DeepBook</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Side Selection */}
        <Tabs value={side} onValueChange={(v) => setSide(v as "yes" | "no")}>
          <TabsList className="inline-flex h-9 items-center justify-start rounded-md bg-muted p-1 text-muted-foreground w-full">
            <TabsTrigger 
              value="yes" 
              className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
            >
              <TrendingUp className="h-3.5 w-3.5" />
              Buy YES
            </TabsTrigger>
            <TabsTrigger 
              value="no" 
              className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
            >
              <TrendingDown className="h-3.5 w-3.5" />
              Buy NO
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Price Input */}
        <div className="space-y-2">
          <Label htmlFor="price" className="text-sm font-medium">Price (SUI)</Label>
          <Input
            id="price"
            type="number"
            step="0.01"
            placeholder="0.00"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            className="h-10 text-base"
          />
        </div>

        {/* Quantity Input */}
        <div className="space-y-2">
          <Label htmlFor="quantity" className="text-sm font-medium">Quantity (SUI)</Label>
          <Input
            id="quantity"
            type="number"
            step="0.01"
            placeholder="0.00"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            className="h-10 text-base"
          />
        </div>

        {/* Order Summary */}
        {price && quantity && (
          <div className="rounded-md border border-border bg-muted/30 p-4 space-y-2.5">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Side:</span>
              <Badge className={side === "yes" ? "bg-one-yellow/10 text-one-yellow border-one-yellow/20" : "bg-muted text-muted-foreground"}>
                {side === "yes" ? "YES" : "NO"}
              </Badge>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Total:</span>
              <span className="font-semibold text-foreground">
                {(parseFloat(price) * parseFloat(quantity)).toFixed(4)} SUI
              </span>
            </div>
          </div>
        )}

        {/* Submit Button */}
        <Button
          onClick={handlePlaceOrder}
          disabled={!currentAccount || !price || !quantity || isSubmitting}
          className="w-full gap-2 bg-one-yellow text-one-gray hover:bg-one-yellow-dark font-medium h-10"
        >
          {isSubmitting ? (
            "Processing..."
          ) : (
            <>
              Place {side === "yes" ? "YES" : "NO"} Order
              <ArrowRight className="h-3.5 w-3.5" />
            </>
          )}
        </Button>

        {!currentAccount && (
          <p className="text-xs text-muted-foreground text-center">
            Please connect your wallet to place orders
          </p>
        )}
      </CardContent>
    </Card>
  );
}

