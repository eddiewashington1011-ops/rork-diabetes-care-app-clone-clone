import { useCallback, useEffect, useMemo, useState } from "react";
import { Platform } from "react-native";
import createContextHook from "@nkzw/create-context-hook";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Purchases, {
  PurchasesOffering,
  PurchasesPackage,
  CustomerInfo,
  LOG_LEVEL,
} from "react-native-purchases";

type SubscriptionState = {
  isProUser: boolean;
  isLoading: boolean;
  offerings: PurchasesOffering | null;
  customerInfo: CustomerInfo | null;
  purchasePackage: (pkg: PurchasesPackage) => Promise<boolean>;
  restorePurchases: () => Promise<boolean>;
  error: string | null;
};

const ENTITLEMENT_ID = "premium";

function getRCApiKey(): string | undefined {
  if (__DEV__ || Platform.OS === "web") {
    return process.env.EXPO_PUBLIC_REVENUECAT_TEST_API_KEY;
  }
  return Platform.select({
    ios: process.env.EXPO_PUBLIC_REVENUECAT_IOS_API_KEY,
    android: process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY,
    default: process.env.EXPO_PUBLIC_REVENUECAT_TEST_API_KEY,
  });
}

const apiKey = getRCApiKey();
let isConfigured = false;

if (apiKey) {
  try {
    Purchases.setLogLevel(LOG_LEVEL.DEBUG);
    Purchases.configure({ apiKey });
    isConfigured = true;
    console.log("[subscription] RevenueCat configured successfully");
  } catch (e) {
    console.warn("[subscription] Failed to configure RevenueCat", e);
  }
} else {
  console.log("[subscription] RevenueCat API key not found, running in demo mode");
}

export const [SubscriptionProvider, useSubscription] = createContextHook<SubscriptionState>(() => {
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);

  const customerInfoQuery = useQuery({
    queryKey: ["revenuecat", "customerInfo"],
    queryFn: async () => {
      if (!isConfigured) return null;
      try {
        const info = await Purchases.getCustomerInfo();
        console.log("[subscription] Customer info fetched", {
          entitlements: Object.keys(info.entitlements.active),
        });
        return info;
      } catch (e) {
        console.error("[subscription] Failed to get customer info", e);
        return null;
      }
    },
    staleTime: 60_000,
    retry: 2,
  });

  const offeringsQuery = useQuery({
    queryKey: ["revenuecat", "offerings"],
    queryFn: async () => {
      if (!isConfigured) return null;
      try {
        const offerings = await Purchases.getOfferings();
        console.log("[subscription] Offerings fetched", {
          current: offerings.current?.identifier,
          packages: offerings.current?.availablePackages.length,
        });
        return offerings.current ?? null;
      } catch (e) {
        console.error("[subscription] Failed to get offerings", e);
        return null;
      }
    },
    staleTime: 300_000,
    retry: 2,
  });

  const purchaseMutation = useMutation({
    mutationFn: async (pkg: PurchasesPackage) => {
      if (!isConfigured) {
        throw new Error("RevenueCat not configured");
      }
      console.log("[subscription] Purchasing package", pkg.identifier);
      const result = await Purchases.purchasePackage(pkg);
      return result;
    },
    onSuccess: (result) => {
      console.log("[subscription] Purchase successful", {
        entitlements: Object.keys(result.customerInfo.entitlements.active),
      });
      queryClient.invalidateQueries({ queryKey: ["revenuecat", "customerInfo"] });
      setError(null);
    },
    onError: (e: any) => {
      const message = e?.message ?? "Purchase failed";
      console.error("[subscription] Purchase failed", e);
      if (!e?.userCancelled) {
        setError(message);
      }
    },
  });

  const restoreMutation = useMutation({
    mutationFn: async () => {
      if (!isConfigured) {
        throw new Error("RevenueCat not configured");
      }
      console.log("[subscription] Restoring purchases");
      const info = await Purchases.restorePurchases();
      return info;
    },
    onSuccess: (info) => {
      console.log("[subscription] Restore successful", {
        entitlements: Object.keys(info.entitlements.active),
      });
      queryClient.invalidateQueries({ queryKey: ["revenuecat", "customerInfo"] });
      setError(null);
    },
    onError: (e: any) => {
      const message = e?.message ?? "Restore failed";
      console.error("[subscription] Restore failed", e);
      setError(message);
    },
  });

  useEffect(() => {
    if (!isConfigured) return;

    const listener = (info: CustomerInfo) => {
      console.log("[subscription] Customer info updated", {
        entitlements: Object.keys(info.entitlements.active),
      });
      queryClient.setQueryData(["revenuecat", "customerInfo"], info);
    };

    Purchases.addCustomerInfoUpdateListener(listener);
    return () => {
      Purchases.removeCustomerInfoUpdateListener(listener);
    };
  }, [queryClient]);

  const isProUser = useMemo(() => {
    if (!customerInfoQuery.data) return false;
    return ENTITLEMENT_ID in customerInfoQuery.data.entitlements.active;
  }, [customerInfoQuery.data]);

  const purchasePackageAsync = purchaseMutation.mutateAsync;
  const purchasePackage = useCallback(
    async (pkg: PurchasesPackage): Promise<boolean> => {
      try {
        await purchasePackageAsync(pkg);
        return true;
      } catch {
        return false;
      }
    },
    [purchasePackageAsync]
  );

  const restorePurchasesAsync = restoreMutation.mutateAsync;
  const restorePurchases = useCallback(async (): Promise<boolean> => {
    try {
      const info = await restorePurchasesAsync();
      return ENTITLEMENT_ID in info.entitlements.active;
    } catch {
      return false;
    }
  }, [restorePurchasesAsync]);

  const isLoading =
    customerInfoQuery.isLoading ||
    offeringsQuery.isLoading ||
    purchaseMutation.isPending ||
    restoreMutation.isPending;

  const value: SubscriptionState = useMemo(
    () => ({
      isProUser,
      isLoading,
      offerings: offeringsQuery.data ?? null,
      customerInfo: customerInfoQuery.data ?? null,
      purchasePackage,
      restorePurchases,
      error,
    }),
    [
      isProUser,
      isLoading,
      offeringsQuery.data,
      customerInfoQuery.data,
      purchasePackage,
      restorePurchases,
      error,
    ]
  );

  return value;
});
