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

      console.log("Transaction result:", result);
      
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
    <Card>
      <CardHeader>
        <CardTitle>Place Order</CardTitle>
        <CardDescription>Buy YES or NO coins on DeepBook</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Side Selection */}
        <Tabs value={side} onValueChange={(v) => setSide(v as "yes" | "no")}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="yes" className="gap-2">
              <TrendingUp className="h-4 w-4" />
              Buy YES
            </TabsTrigger>
            <TabsTrigger value="no" className="gap-2">
              <TrendingDown className="h-4 w-4" />
              Buy NO
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Price Input */}
        <div className="space-y-2">
          <Label htmlFor="price">Price (SUI)</Label>
          <Input
            id="price"
            type="number"
            step="0.01"
            placeholder="0.00"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            className="text-lg"
          />
        </div>

        {/* Quantity Input */}
        <div className="space-y-2">
          <Label htmlFor="quantity">Quantity (SUI)</Label>
          <Input
            id="quantity"
            type="number"
            step="0.01"
            placeholder="0.00"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            className="text-lg"
          />
        </div>

        {/* Order Summary */}
        {price && quantity && (
          <div className="rounded-lg border border-border bg-muted/50 p-4 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Side:</span>
              <Badge variant={side === "yes" ? "default" : "secondary"}>
                {side === "yes" ? "YES" : "NO"}
              </Badge>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Total:</span>
              <span className="font-medium">
                {(parseFloat(price) * parseFloat(quantity)).toFixed(4)} SUI
              </span>
            </div>
          </div>
        )}

        {/* Submit Button */}
        <Button
          onClick={handlePlaceOrder}
          disabled={!currentAccount || !price || !quantity || isSubmitting}
          className="w-full gap-2"
          size="lg"
        >
          {isSubmitting ? (
            "Processing..."
          ) : (
            <>
              Place {side === "yes" ? "YES" : "NO"} Order
              <ArrowRight className="h-4 w-4" />
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

