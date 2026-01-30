import React, { useCallback, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
  TouchableOpacity,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import {
  Activity,
  Utensils,
  Bell,
  Dumbbell,
  ChevronRight,
  Check,
  Sparkles,
} from "lucide-react-native";

import Colors from "@/constants/colors";
import { useOnboarding } from "@/providers/onboarding";
import { AnimatedPressable, FadeIn } from "@/components/AnimatedPressable";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

const DIABETES_TYPES = [
  { id: "type1", label: "Type 1 Diabetes", icon: "💉" },
  { id: "type2", label: "Type 2 Diabetes", icon: "💊" },
  { id: "prediabetes", label: "Prediabetes", icon: "⚠️" },
  { id: "gestational", label: "Gestational", icon: "🤰" },
] as const;

const GOALS = [
  { id: "track_glucose", label: "Track glucose levels", icon: Activity },
  { id: "healthy_eating", label: "Eat healthier", icon: Utensils },
  { id: "exercise", label: "Exercise regularly", icon: Dumbbell },
  { id: "reminders", label: "Set medication reminders", icon: Bell },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const {
    currentStep,
    setStep,
    diabetesType,
    setDiabetesType,
    goals,
    toggleGoal,
    completeOnboarding,
    skipOnboarding,
  } = useOnboarding();

  const fadeAnim = useRef(new Animated.Value(1)).current;

  const animateTransition = useCallback((toStep: number) => {
    Animated.sequence([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start();
    
    setTimeout(() => setStep(toStep), 150);
  }, [fadeAnim, setStep]);

  const handleNext = useCallback(() => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    if (currentStep < 3) {
      animateTransition(currentStep + 1);
    } else {
      completeOnboarding().then(() => {
        router.replace("/(tabs)/(home)");
      });
    }
  }, [currentStep, animateTransition, completeOnboarding, router]);

  const handleBack = useCallback(() => {
    if (currentStep > 0) {
      animateTransition(currentStep - 1);
    }
  }, [currentStep, animateTransition]);

  const handleSkip = useCallback(() => {
    skipOnboarding().then(() => {
      router.replace("/(tabs)/(home)");
    });
  }, [skipOnboarding, router]);

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return (
          <FadeIn style={styles.stepContent}>
            <View style={styles.iconContainer}>
              <LinearGradient
                colors={["#0D9488", "#0F766E"]}
                style={styles.iconGradient}
              >
                <Sparkles size={48} color="#fff" />
              </LinearGradient>
            </View>
            <Text style={styles.stepTitle}>Welcome to Dia Care</Text>
            <Text style={styles.stepSubtitle}>
              Your personal diabetes management companion. Let&apos;s personalize your experience.
            </Text>
          </FadeIn>
        );

      case 1:
        return (
          <FadeIn style={styles.stepContent}>
            <Text style={styles.stepTitle}>What type of diabetes do you have?</Text>
            <Text style={styles.stepSubtitle}>
              This helps us tailor recommendations for you.
            </Text>
            <View style={styles.optionsGrid}>
              {DIABETES_TYPES.map((type, index) => (
                <FadeIn key={type.id} delay={index * 50}>
                  <AnimatedPressable
                    style={[
                      styles.optionCard,
                      diabetesType === type.id && styles.optionCardSelected,
                    ]}
                    onPress={() => setDiabetesType(type.id)}
                  >
                    <Text style={styles.optionIcon}>{type.icon}</Text>
                    <Text
                      style={[
                        styles.optionLabel,
                        diabetesType === type.id && styles.optionLabelSelected,
                      ]}
                    >
                      {type.label}
                    </Text>
                    {diabetesType === type.id && (
                      <View style={styles.checkBadge}>
                        <Check size={14} color="#fff" />
                      </View>
                    )}
                  </AnimatedPressable>
                </FadeIn>
              ))}
            </View>
          </FadeIn>
        );

      case 2:
        return (
          <FadeIn style={styles.stepContent}>
            <Text style={styles.stepTitle}>What are your goals?</Text>
            <Text style={styles.stepSubtitle}>
              Select all that apply. We&apos;ll help you achieve them.
            </Text>
            <View style={styles.goalsContainer}>
              {GOALS.map((goal, index) => {
                const Icon = goal.icon;
                const isSelected = goals.includes(goal.id);
                return (
                  <FadeIn key={goal.id} delay={index * 50}>
                    <AnimatedPressable
                      style={[
                        styles.goalCard,
                        isSelected && styles.goalCardSelected,
                      ]}
                      onPress={() => toggleGoal(goal.id)}
                    >
                      <View
                        style={[
                          styles.goalIcon,
                          isSelected && styles.goalIconSelected,
                        ]}
                      >
                        <Icon
                          size={20}
                          color={isSelected ? "#fff" : Colors.light.tint}
                        />
                      </View>
                      <Text
                        style={[
                          styles.goalLabel,
                          isSelected && styles.goalLabelSelected,
                        ]}
                      >
                        {goal.label}
                      </Text>
                      {isSelected && (
                        <View style={styles.goalCheck}>
                          <Check size={16} color={Colors.light.tint} />
                        </View>
                      )}
                    </AnimatedPressable>
                  </FadeIn>
                );
              })}
            </View>
          </FadeIn>
        );

      case 3:
        return (
          <FadeIn style={styles.stepContent}>
            <View style={styles.iconContainer}>
              <LinearGradient
                colors={["#10B981", "#059669"]}
                style={styles.iconGradient}
              >
                <Check size={48} color="#fff" />
              </LinearGradient>
            </View>
            <Text style={styles.stepTitle}>You&apos;re all set!</Text>
            <Text style={styles.stepSubtitle}>
              Start tracking your glucose, discover healthy recipes, and build better habits.
            </Text>
            <View style={styles.featuresList}>
              {[
                "CGM integration for real-time tracking",
                "Personalized meal plans & recipes",
                "Exercise recommendations",
                "Smart reminders & streaks",
              ].map((feature, index) => (
                <FadeIn key={feature} delay={index * 100}>
                  <View style={styles.featureItem}>
                    <Check size={16} color={Colors.light.success} />
                    <Text style={styles.featureText}>{feature}</Text>
                  </View>
                </FadeIn>
              ))}
            </View>
          </FadeIn>
        );

      default:
        return null;
    }
  };

  const canProceed = () => {
    if (currentStep === 1 && !diabetesType) return false;
    if (currentStep === 2 && goals.length === 0) return false;
    return true;
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <LinearGradient
        colors={["#F0FDFA", "#ECFDF5", "#F8FAFB"]}
        style={StyleSheet.absoluteFill}
      />

      <View style={styles.header}>
        <View style={styles.progressContainer}>
          {[0, 1, 2, 3].map((step) => (
            <View
              key={step}
              style={[
                styles.progressDot,
                currentStep >= step && styles.progressDotActive,
              ]}
            />
          ))}
        </View>
        {currentStep > 0 && (
          <TouchableOpacity
            style={styles.skipButton}
            onPress={handleSkip}
            activeOpacity={0.7}
          >
            <Text style={styles.skipText}>Skip</Text>
          </TouchableOpacity>
        )}
      </View>

      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        {renderStep()}
      </Animated.View>

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 20) }]}>
        {currentStep > 0 && (
          <TouchableOpacity
            style={styles.backButton}
            onPress={handleBack}
            activeOpacity={0.7}
          >
            <Text style={styles.backButtonText}>Back</Text>
          </TouchableOpacity>
        )}
        <AnimatedPressable
          style={[
            styles.nextButton,
            !canProceed() && styles.nextButtonDisabled,
            currentStep === 0 && styles.nextButtonFull,
          ]}
          onPress={handleNext}
          disabled={!canProceed()}
        >
          <Text style={styles.nextButtonText}>
            {currentStep === 3 ? "Get Started" : "Continue"}
          </Text>
          <ChevronRight size={20} color="#fff" />
        </AnimatedPressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  progressContainer: {
    flexDirection: "row",
    gap: 8,
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.light.border,
  },
  progressDotActive: {
    backgroundColor: Colors.light.tint,
    width: 24,
  },
  skipButton: {
    padding: 8,
  },
  skipText: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: Colors.light.textSecondary,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  stepContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  iconContainer: {
    marginBottom: 32,
  },
  iconGradient: {
    width: 100,
    height: 100,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
  },
  stepTitle: {
    fontSize: 28,
    fontWeight: "800" as const,
    color: Colors.light.text,
    textAlign: "center",
    marginBottom: 12,
  },
  stepSubtitle: {
    fontSize: 16,
    color: Colors.light.textSecondary,
    textAlign: "center",
    lineHeight: 24,
    maxWidth: 300,
  },
  optionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginTop: 32,
    justifyContent: "center",
  },
  optionCard: {
    width: (SCREEN_WIDTH - 72) / 2,
    backgroundColor: Colors.light.surface,
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    borderWidth: 2,
    borderColor: Colors.light.border,
  },
  optionCardSelected: {
    borderColor: Colors.light.tint,
    backgroundColor: Colors.light.tintLight,
  },
  optionIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  optionLabel: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: Colors.light.text,
    textAlign: "center",
  },
  optionLabelSelected: {
    color: Colors.light.tint,
  },
  checkBadge: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.light.tint,
    alignItems: "center",
    justifyContent: "center",
  },
  goalsContainer: {
    width: "100%",
    marginTop: 32,
    gap: 12,
  },
  goalCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.light.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 2,
    borderColor: Colors.light.border,
  },
  goalCardSelected: {
    borderColor: Colors.light.tint,
    backgroundColor: Colors.light.tintLight,
  },
  goalIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: Colors.light.tintLight,
    alignItems: "center",
    justifyContent: "center",
  },
  goalIconSelected: {
    backgroundColor: Colors.light.tint,
  },
  goalLabel: {
    flex: 1,
    marginLeft: 14,
    fontSize: 16,
    fontWeight: "600" as const,
    color: Colors.light.text,
  },
  goalLabelSelected: {
    color: Colors.light.tint,
  },
  goalCheck: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.light.tintLight,
    alignItems: "center",
    justifyContent: "center",
  },
  featuresList: {
    marginTop: 32,
    gap: 16,
  },
  featureItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  featureText: {
    fontSize: 15,
    color: Colors.light.text,
    fontWeight: "500" as const,
  },
  footer: {
    flexDirection: "row",
    paddingHorizontal: 24,
    gap: 12,
  },
  backButton: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 16,
    backgroundColor: Colors.light.surface,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: "700" as const,
    color: Colors.light.text,
  },
  nextButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 16,
    backgroundColor: Colors.light.tint,
    gap: 8,
  },
  nextButtonFull: {
    flex: 1,
  },
  nextButtonDisabled: {
    opacity: 0.5,
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: "700" as const,
    color: "#fff",
  },
});
