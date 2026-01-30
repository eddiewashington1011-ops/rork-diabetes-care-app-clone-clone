import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import {
  X,
  Check,
  Crown,
  Sparkles,
  Activity,
  Utensils,
  Dumbbell,
  Bell,
  TrendingUp,
} from "lucide-react-native";

import Colors from "@/constants/colors";
import { useSubscription } from "@/providers/subscription";
import { AnimatedPressable, FadeIn } from "@/components/AnimatedPressable";
import { useAnalytics } from "@/providers/analytics";

const FEATURES = [
  { icon: Activity, title: "Advanced CGM Analytics", description: "Detailed trends & insights" },
  { icon: Utensils, title: "Unlimited Meal Plans", description: "Personalized weekly plans" },
  { icon: Dumbbell, title: "Custom Workout Plans", description: "Tailored exercise routines" },
  { icon: Bell, title: "Smart Reminders", description: "AI-powered notifications" },
  { icon: TrendingUp, title: "Progress Reports", description: "Weekly health summaries" },
];

export default function PaywallScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { offerings, purchasePackage, restorePurchases, isLoading, error } = useSubscription();
  const { trackEvent } = useAnalytics();
  const [selectedPackageId, setSelectedPackageId] = useState<string | null>(null);
  const [isPurchasing, setIsPurchasing] = useState(false);

  const packages = offerings?.availablePackages ?? [];
  const selectedPackage = packages.find((p) => p.identifier === selectedPackageId) ?? packages[0];

  const handleSelectPackage = useCallback((packageId: string) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setSelectedPackageId(packageId);
    trackEvent("paywall_package_selected", { packageId });
  }, [trackEvent]);

  const handlePurchase = useCallback(async () => {
    if (!selectedPackage) {
      Alert.alert("Error", "Please select a plan first");
      return;
    }

    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    setIsPurchasing(true);
    trackEvent("paywall_purchase_started", { packageId: selectedPackage.identifier });

    try {
      const success = await purchasePackage(selectedPackage);
      if (success) {
        trackEvent("paywall_purchase_success", { packageId: selectedPackage.identifier });
        router.back();
      } else {
        trackEvent("paywall_purchase_cancelled", { packageId: selectedPackage.identifier });
      }
    } catch {
      trackEvent("paywall_purchase_error", { packageId: selectedPackage.identifier });
      Alert.alert("Purchase Failed", "Please try again later.");
    } finally {
      setIsPurchasing(false);
    }
  }, [selectedPackage, purchasePackage, trackEvent, router]);

  const handleRestore = useCallback(async () => {
    trackEvent("paywall_restore_started");
    const success = await restorePurchases();
    if (success) {
      trackEvent("paywall_restore_success");
      Alert.alert("Success", "Your purchases have been restored!");
      router.back();
    } else {
      trackEvent("paywall_restore_empty");
      Alert.alert("No Purchases Found", "We couldn't find any previous purchases.");
    }
  }, [restorePurchases, trackEvent, router]);

  const handleClose = useCallback(() => {
    trackEvent("paywall_dismissed");
    router.back();
  }, [trackEvent, router]);

  const formatPrice = (pkg: typeof packages[0]) => {
    return pkg.product.priceString;
  };

  const getPeriod = (pkg: typeof packages[0]) => {
    const id = pkg.identifier.toLowerCase();
    if (id.includes("annual") || id.includes("yearly")) return "year";
    if (id.includes("monthly")) return "month";
    if (id.includes("weekly")) return "week";
    return "month";
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <LinearGradient
        colors={["#0D9488", "#0F766E", "#115E59"]}
        style={StyleSheet.absoluteFill}
      />

      <TouchableOpacity
        style={styles.closeButton}
        onPress={handleClose}
        activeOpacity={0.7}
      >
        <X size={24} color="#fff" />
      </TouchableOpacity>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <FadeIn style={styles.header}>
          <View style={styles.crownContainer}>
            <Crown size={40} color="#FFD700" />
          </View>
          <Text style={styles.title}>Upgrade to Premium</Text>
          <Text style={styles.subtitle}>
            Unlock all features and take control of your health journey
          </Text>
        </FadeIn>

        <View style={styles.featuresContainer}>
          {FEATURES.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <FadeIn key={feature.title} delay={index * 50}>
                <View style={styles.featureRow}>
                  <View style={styles.featureIcon}>
                    <Icon size={20} color={Colors.light.tint} />
                  </View>
                  <View style={styles.featureText}>
                    <Text style={styles.featureTitle}>{feature.title}</Text>
                    <Text style={styles.featureDesc}>{feature.description}</Text>
                  </View>
                  <Check size={20} color={Colors.light.success} />
                </View>
              </FadeIn>
            );
          })}
        </View>

        {packages.length > 0 ? (
          <View style={styles.packagesContainer}>
            {packages.map((pkg, index) => {
              const isSelected = selectedPackage?.identifier === pkg.identifier;
              const period = getPeriod(pkg);
              const isAnnual = period === "year";
              
              return (
                <FadeIn key={pkg.identifier} delay={300 + index * 50}>
                  <AnimatedPressable
                    style={[
                      styles.packageCard,
                      isSelected && styles.packageCardSelected,
                    ]}
                    onPress={() => handleSelectPackage(pkg.identifier)}
                  >
                    {isAnnual && (
                      <View style={styles.bestValueBadge}>
                        <Sparkles size={12} color="#fff" />
                        <Text style={styles.bestValueText}>Best Value</Text>
                      </View>
                    )}
                    <View style={styles.packageContent}>
                      <View style={[styles.radioOuter, isSelected && styles.radioOuterSelected]}>
                        {isSelected && <View style={styles.radioInner} />}
                      </View>
                      <View style={styles.packageInfo}>
                        <Text style={[styles.packageTitle, isSelected && styles.packageTitleSelected]}>
                          {pkg.product.title ?? `${period.charAt(0).toUpperCase() + period.slice(1)}ly`}
                        </Text>
                        <Text style={styles.packageDesc}>{pkg.product.description}</Text>
                      </View>
                      <View style={styles.packagePrice}>
                        <Text style={[styles.priceText, isSelected && styles.priceTextSelected]}>
                          {formatPrice(pkg)}
                        </Text>
                        <Text style={styles.periodText}>/{period}</Text>
                      </View>
                    </View>
                  </AnimatedPressable>
                </FadeIn>
              );
            })}
          </View>
        ) : (
          <View style={styles.noPackagesContainer}>
            {isLoading ? (
              <ActivityIndicator size="large" color="#fff" />
            ) : (
              <Text style={styles.noPackagesText}>
                Unable to load subscription options. Please try again later.
              </Text>
            )}
          </View>
        )}

        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 20) }]}>
        <AnimatedPressable
          style={[styles.purchaseButton, isPurchasing && styles.purchaseButtonDisabled]}
          onPress={handlePurchase}
          disabled={isPurchasing || !selectedPackage}
        >
          {isPurchasing ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Crown size={20} color="#fff" />
              <Text style={styles.purchaseButtonText}>
                Continue with {selectedPackage ? formatPrice(selectedPackage) : "Premium"}
              </Text>
            </>
          )}
        </AnimatedPressable>

        <TouchableOpacity
          style={styles.restoreButton}
          onPress={handleRestore}
          activeOpacity={0.7}
        >
          <Text style={styles.restoreText}>Restore Purchases</Text>
        </TouchableOpacity>

        <Text style={styles.disclaimer}>
          Cancel anytime. Subscription auto-renews unless cancelled 24 hours before the period ends.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  closeButton: {
    position: "absolute",
    top: 60,
    right: 20,
    zIndex: 10,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 60,
  },
  header: {
    alignItems: "center",
    marginBottom: 32,
  },
  crownContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: "800" as const,
    color: "#fff",
    textAlign: "center",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "rgba(255,255,255,0.8)",
    textAlign: "center",
    lineHeight: 24,
  },
  featuresContainer: {
    backgroundColor: "rgba(255,255,255,0.95)",
    borderRadius: 20,
    padding: 16,
    marginBottom: 24,
  },
  featureRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  featureIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Colors.light.tintLight,
    alignItems: "center",
    justifyContent: "center",
  },
  featureText: {
    flex: 1,
    marginLeft: 12,
  },
  featureTitle: {
    fontSize: 15,
    fontWeight: "700" as const,
    color: Colors.light.text,
  },
  featureDesc: {
    fontSize: 13,
    color: Colors.light.textSecondary,
    marginTop: 2,
  },
  packagesContainer: {
    gap: 12,
    marginBottom: 20,
  },
  packageCard: {
    backgroundColor: "rgba(255,255,255,0.95)",
    borderRadius: 16,
    padding: 16,
    borderWidth: 2,
    borderColor: "transparent",
  },
  packageCardSelected: {
    borderColor: Colors.light.tint,
    backgroundColor: "#fff",
  },
  bestValueBadge: {
    position: "absolute",
    top: -10,
    right: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: Colors.light.accent,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  bestValueText: {
    fontSize: 11,
    fontWeight: "700" as const,
    color: "#fff",
  },
  packageContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  radioOuter: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.light.border,
    alignItems: "center",
    justifyContent: "center",
  },
  radioOuterSelected: {
    borderColor: Colors.light.tint,
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.light.tint,
  },
  packageInfo: {
    flex: 1,
    marginLeft: 12,
  },
  packageTitle: {
    fontSize: 16,
    fontWeight: "700" as const,
    color: Colors.light.text,
  },
  packageTitleSelected: {
    color: Colors.light.tint,
  },
  packageDesc: {
    fontSize: 13,
    color: Colors.light.textSecondary,
    marginTop: 2,
  },
  packagePrice: {
    alignItems: "flex-end",
  },
  priceText: {
    fontSize: 20,
    fontWeight: "800" as const,
    color: Colors.light.text,
  },
  priceTextSelected: {
    color: Colors.light.tint,
  },
  periodText: {
    fontSize: 13,
    color: Colors.light.textSecondary,
  },
  noPackagesContainer: {
    alignItems: "center",
    padding: 32,
  },
  noPackagesText: {
    fontSize: 15,
    color: "rgba(255,255,255,0.8)",
    textAlign: "center",
  },
  errorContainer: {
    backgroundColor: "rgba(239,68,68,0.2)",
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  errorText: {
    fontSize: 14,
    color: "#fff",
    textAlign: "center",
  },
  footer: {
    paddingHorizontal: 24,
    paddingTop: 16,
    backgroundColor: "rgba(0,0,0,0.2)",
  },
  purchaseButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
    paddingVertical: 16,
    borderRadius: 16,
    gap: 8,
  },
  purchaseButtonDisabled: {
    opacity: 0.7,
  },
  purchaseButtonText: {
    fontSize: 17,
    fontWeight: "800" as const,
    color: Colors.light.tint,
  },
  restoreButton: {
    alignItems: "center",
    paddingVertical: 12,
  },
  restoreText: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: "rgba(255,255,255,0.8)",
  },
  disclaimer: {
    fontSize: 11,
    color: "rgba(255,255,255,0.6)",
    textAlign: "center",
    lineHeight: 16,
  },
});
