import { SuiClient, getFullnodeUrl } from "@mysten/sui/client";

// Initialize Sui client for Testnet
export const suiClient = new SuiClient({
  url: getFullnodeUrl("testnet"),
});

// Helper function to get object details
export async function getObject(objectId: string) {
  return await suiClient.getObject({
    id: objectId,
    options: {
      showContent: true,
      showType: true,
      showOwner: true,
      showPreviousTransaction: true,
    },
  });
}

// Helper function to get multiple objects
export async function getObjects(objectIds: string[]) {
  return await suiClient.multiGetObjects({
    ids: objectIds,
    options: {
      showContent: true,
      showType: true,
      showOwner: true,
    },
  });
}

// Helper function to query objects by type
export async function queryObjectsByType(type: string) {
  return await suiClient.getOwnedObjects({
    filter: {
      StructType: type,
    },
    options: {
      showContent: true,
      showType: true,
    },
  });
}

