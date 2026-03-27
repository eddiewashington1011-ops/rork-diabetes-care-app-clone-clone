import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { TrendingDown, TrendingUp, Minus, ChevronDown, ChevronUp } from "lucide-react-native";
import Colors from "@/constants/colors";
import { sugarTips, SugarTip } from "@/mocks/sugarTips";

type FilterType = "all" | "lower" | "raise" | "maintain";

const filters: { key: FilterType; label: string; icon: React.ReactNode; color: string }[] = [
  { key: "all", label: "All Tips", icon: null, color: Colors.light.tint },
  { key: "lower", label: "Lower", icon: <TrendingDown size={14} color={Colors.light.success} />, color: Colors.light.success },
  { key: "raise", label: "Raise", icon: <TrendingUp size={14} color={Colors.light.accent} />, color: Colors.light.accent },
  { key: "maintain", label: "Maintain", icon: <Minus size={14} color={Colors.light.tint} />, color: Colors.light.tint },
];

function TipCard({ tip }: { tip: SugarTip }) {
  const [expanded, setExpanded] = useState(false);

  const getBgColor = () => {
    switch (tip.type) {
      case "lower":
        return Colors.light.successLight;
      case "raise":
        return Colors.light.accentLight;
      default:
        return Colors.light.tintLight;
    }
  };

  const getTextColor = () => {
    switch (tip.type) {
      case "lower":
        return Colors.light.success;
      case "raise":
        return Colors.light.accent;
      default:
        return Colors.light.tint;
    }
  };

  return (
    <TouchableOpacity
      style={styles.tipCard}
      onPress={() => setExpanded(!expanded)}
      activeOpacity={0.7}
    >
      <View style={styles.tipHeader}>
        <View style={[styles.iconContainer, { backgroundColor: getBgColor() }]}>
          <Text style={styles.tipIcon}>{tip.icon}</Text>
        </View>
        <View style={styles.tipContent}>
          <Text style={styles.tipTitle}>{tip.title}</Text>
          <Text style={styles.tipDescription}>{tip.description}</Text>
        </View>
        <View style={[styles.typeIndicator, { backgroundColor: getBgColor() }]}>
          {expanded ? (
            <ChevronUp size={18} color={getTextColor()} />
          ) : (
            <ChevronDown size={18} color={getTextColor()} />
          )}
        </View>
      </View>

      {expanded && (
        <View style={styles.detailsContainer}>
          {tip.details.map((detail, index) => (
            <View key={index} style={styles.detailRow}>
              <View style={[styles.bullet, { backgroundColor: getTextColor() }]} />
              <Text style={styles.detailText}>{detail}</Text>
            </View>
          ))}
        </View>
      )}
    </TouchableOpacity>
  );
}

export default function SugarTipsScreen() {
  const [activeFilter, setActiveFilter] = useState<FilterType>("all");

  const filteredTips = activeFilter === "all"
    ? sugarTips
    : sugarTips.filter((tip) => tip.type === activeFilter);

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterScroll}
        contentContainerStyle={styles.filterContainer}
      >
        {filters.map((filter) => (
          <TouchableOpacity
            key={filter.key}
            style={[
              styles.filterChip,
              activeFilter === filter.key && { backgroundColor: filter.color },
            ]}
            onPress={() => setActiveFilter(filter.key)}
          >
            {filter.icon}
            <Text
              style={[
                styles.filterText,
                activeFilter === filter.key && styles.filterTextActive,
              ]}
            >
              {filter.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView
        style={styles.tipsScroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.tipsContainer}
      >
        {filteredTips.map((tip) => (
          <TipCard key={tip.id} tip={tip} />
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  filterScroll: {
    maxHeight: 56,
  },
  filterContainer: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 8,
    flexDirection: "row",
  },
  filterChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.light.surface,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  filterText: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.light.textSecondary,
  },
  filterTextActive: {
    color: "#fff",
  },
  tipsScroll: {
    flex: 1,
  },
  tipsContainer: {
    padding: 20,
    paddingTop: 8,
    gap: 12,
  },
  tipCard: {
    backgroundColor: Colors.light.surface,
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  tipHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  tipIcon: {
    fontSize: 24,
  },
  tipContent: {
    flex: 1,
  },
  tipTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: Colors.light.text,
    marginBottom: 4,
  },
  tipDescription: {
    fontSize: 13,
    color: Colors.light.textSecondary,
    lineHeight: 18,
  },
  typeIndicator: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  detailsContainer: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
    gap: 10,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  bullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 6,
  },
  detailText: {
    flex: 1,
    fontSize: 13,
    color: Colors.light.text,
    lineHeight: 20,
  },
});
