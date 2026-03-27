import React, { memo, useCallback } from "react";
import { Platform, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BlurView } from "expo-blur";

import Colors from "@/constants/colors";

type Props = {
  title: string;
  subtitle?: string;
  onPress: () => void;
  disabled?: boolean;
  bottomOffset?: number;
  testID?: string;
};

function BottomCTAInner({ title, subtitle, onPress, disabled, bottomOffset, testID }: Props) {
  const insets = useSafeAreaInsets();

  const onPressSafe = useCallback(() => {
    if (disabled) return;
    console.log("[BottomCTA] pressed", { title, disabled: Boolean(disabled) });
    onPress();
  }, [disabled, onPress, title]);

  const bottomPad = Math.max(12, insets.bottom + 10);
  const resolvedBottomOffset = bottomOffset ?? (Platform.OS === "web" ? 68 : 64);

  const content = (
    <TouchableOpacity
      onPress={onPressSafe}
      activeOpacity={0.85}
      disabled={disabled}
      style={styles.innerRow}
      testID={testID}
    >
      <View style={styles.textCol}>
        <Text style={styles.title} numberOfLines={1} testID={testID ? `${testID}-title` : undefined}>
          {title}
        </Text>
        {subtitle ? (
          <Text style={styles.subtitle} numberOfLines={1} testID={testID ? `${testID}-subtitle` : undefined}>
            {subtitle}
          </Text>
        ) : null}
      </View>

      <View style={[styles.button, disabled && styles.buttonDisabled]}>
        <Text style={styles.buttonText}>{title}</Text>
      </View>
    </TouchableOpacity>
  );

  if (Platform.OS === "web") {
    return (
      <View
        style={[styles.root, styles.shellWeb, { bottom: resolvedBottomOffset, paddingBottom: bottomPad }]}
        testID={testID ? `${testID}-root` : undefined}
      >
        {content}
      </View>
    );
  }

  return (
    <View
      pointerEvents="box-none"
      style={[styles.root, { bottom: resolvedBottomOffset }]}
      testID={testID ? `${testID}-root` : undefined}
    >
      <BlurView
        intensity={28}
        tint="light"
        style={[styles.shell, { paddingBottom: bottomPad }]}
      >
        {content}
      </BlurView>
    </View>
  );
}

export const BottomCTA = memo(BottomCTAInner);

const styles = StyleSheet.create({
  root: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 50,
    elevation: 20,
  },
  shell: {
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
    paddingTop: 10,
    paddingHorizontal: 16,
    backgroundColor: "rgba(255,255,255,0.72)",
  },
  shellWeb: {
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
    paddingTop: 10,
    paddingHorizontal: 16,
    backgroundColor: "rgba(255,255,255,0.95)",
  },
  innerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  textCol: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    fontSize: 12,
    fontWeight: "900" as const,
    color: Colors.light.textSecondary,
    letterSpacing: 0.4,
    textTransform: "uppercase",
  },
  subtitle: {
    marginTop: 2,
    fontSize: 13,
    fontWeight: "700" as const,
    color: Colors.light.text,
  },
  button: {
    backgroundColor: Colors.light.tint,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 14,
    elevation: 4,
  },
  buttonDisabled: {
    opacity: 0.55,
  },
  buttonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "900" as const,
  },
});
