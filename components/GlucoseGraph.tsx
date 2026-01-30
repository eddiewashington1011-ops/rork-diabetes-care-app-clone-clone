import React, { useMemo } from "react";
import { View, Text, StyleSheet, Dimensions } from "react-native";
import Svg, { Path, Line, Rect, Circle, Defs, LinearGradient, Stop } from "react-native-svg";
import Colors from "@/constants/colors";
import { CGMReading } from "@/providers/cgm";

type Props = {
  readings: CGMReading[];
  hours?: number;
  height?: number;
  lowThreshold?: number;
  highThreshold?: number;
  showLabels?: boolean;
  compact?: boolean;
};

const SCREEN_WIDTH = Dimensions.get("window").width;

export function GlucoseGraph({
  readings,
  hours = 3,
  height = 180,
  lowThreshold = 70,
  highThreshold = 180,
  showLabels = true,
  compact = false,
}: Props) {
  const width = SCREEN_WIDTH - (compact ? 32 : 48);
  const padding = { top: 20, right: 10, bottom: showLabels ? 30 : 10, left: showLabels ? 40 : 10 };
  const graphWidth = width - padding.left - padding.right;
  const graphHeight = height - padding.top - padding.bottom;

  const { pathData, points, minValue, maxValue, timeLabels } = useMemo(() => {
    if (readings.length === 0) {
      return { pathData: "", points: [], minValue: 40, maxValue: 250, timeLabels: [] };
    }

    const now = Date.now();
    const cutoff = now - hours * 60 * 60 * 1000;
    const filteredReadings = readings
      .filter((r) => new Date(r.timestamp).getTime() >= cutoff)
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    if (filteredReadings.length === 0) {
      return { pathData: "", points: [], minValue: 40, maxValue: 250, timeLabels: [] };
    }

    const values = filteredReadings.map((r) => r.value);
    const minVal = Math.min(40, Math.min(...values) - 10);
    const maxVal = Math.max(250, Math.max(...values) + 10);

    const pts = filteredReadings.map((r) => {
      const time = new Date(r.timestamp).getTime();
      const x = padding.left + ((time - cutoff) / (now - cutoff)) * graphWidth;
      const y = padding.top + graphHeight - ((r.value - minVal) / (maxVal - minVal)) * graphHeight;
      return { x, y, value: r.value, timestamp: r.timestamp };
    });

    let path = "";
    if (pts.length > 0) {
      path = `M ${pts[0].x} ${pts[0].y}`;
      for (let i = 1; i < pts.length; i++) {
        const prev = pts[i - 1];
        const curr = pts[i];
        const cpx1 = prev.x + (curr.x - prev.x) / 3;
        const cpx2 = prev.x + (2 * (curr.x - prev.x)) / 3;
        path += ` C ${cpx1} ${prev.y}, ${cpx2} ${curr.y}, ${curr.x} ${curr.y}`;
      }
    }

    const labels: { time: string; x: number }[] = [];
    const interval = hours <= 3 ? 1 : hours <= 6 ? 2 : 3;
    for (let h = 0; h <= hours; h += interval) {
      const labelTime = new Date(now - (hours - h) * 60 * 60 * 1000);
      const x = padding.left + (h / hours) * graphWidth;
      labels.push({
        time: labelTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        x,
      });
    }

    return { pathData: path, points: pts, minValue: minVal, maxValue: maxVal, timeLabels: labels };
  }, [readings, hours, graphWidth, graphHeight, padding.left, padding.top]);

  const lowY = padding.top + graphHeight - ((lowThreshold - minValue) / (maxValue - minValue)) * graphHeight;
  const highY = padding.top + graphHeight - ((highThreshold - minValue) / (maxValue - minValue)) * graphHeight;

  const latestPoint = points[points.length - 1];

  const getPointColor = (value: number): string => {
    if (value < lowThreshold) return Colors.light.gold;
    if (value > highThreshold) return Colors.light.danger;
    return Colors.light.success;
  };

  if (readings.length === 0) {
    return (
      <View style={[styles.container, { height }]}>
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No CGM data yet</Text>
          <Text style={styles.emptySubtext}>Connect your CGM to see glucose trends</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { height }]}>
      <Svg width={width} height={height}>
        <Defs>
          <LinearGradient id="lineGradient" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={Colors.light.tint} stopOpacity="1" />
            <Stop offset="1" stopColor={Colors.light.tint} stopOpacity="0.3" />
          </LinearGradient>
          <LinearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={Colors.light.tint} stopOpacity="0.2" />
            <Stop offset="1" stopColor={Colors.light.tint} stopOpacity="0.02" />
          </LinearGradient>
        </Defs>

        <Rect
          x={padding.left}
          y={highY}
          width={graphWidth}
          height={lowY - highY}
          fill={Colors.light.successLight}
          opacity={0.4}
        />

        <Line
          x1={padding.left}
          y1={highY}
          x2={padding.left + graphWidth}
          y2={highY}
          stroke={Colors.light.danger}
          strokeWidth={1}
          strokeDasharray="4,4"
          opacity={0.6}
        />
        <Line
          x1={padding.left}
          y1={lowY}
          x2={padding.left + graphWidth}
          y2={lowY}
          stroke={Colors.light.gold}
          strokeWidth={1}
          strokeDasharray="4,4"
          opacity={0.6}
        />

        {pathData && points.length > 1 && (
          <>
            <Path
              d={`${pathData} L ${points[points.length - 1].x} ${padding.top + graphHeight} L ${points[0].x} ${padding.top + graphHeight} Z`}
              fill="url(#areaGradient)"
            />
            <Path d={pathData} stroke={Colors.light.tint} strokeWidth={2.5} fill="none" strokeLinecap="round" />
          </>
        )}

        {points.map((pt, i) => (
          <Circle
            key={i}
            cx={pt.x}
            cy={pt.y}
            r={i === points.length - 1 ? 6 : 3}
            fill={getPointColor(pt.value)}
            stroke={i === points.length - 1 ? "#fff" : "transparent"}
            strokeWidth={i === points.length - 1 ? 2 : 0}
          />
        ))}

        {showLabels && (
          <>
            {[40, 70, 120, 180, 250].map((val) => {
              if (val < minValue || val > maxValue) return null;
              const y = padding.top + graphHeight - ((val - minValue) / (maxValue - minValue)) * graphHeight;
              return (
                <React.Fragment key={val}>
                  <Line
                    x1={padding.left}
                    y1={y}
                    x2={padding.left + graphWidth}
                    y2={y}
                    stroke={Colors.light.border}
                    strokeWidth={0.5}
                    opacity={0.5}
                  />
                </React.Fragment>
              );
            })}
          </>
        )}
      </Svg>

      {showLabels && (
        <>
          <View style={[styles.yLabels, { top: padding.top, height: graphHeight }]}>
            {[250, 180, 120, 70, 40].map((val) => {
              if (val < minValue || val > maxValue) return null;
              const pct = ((val - minValue) / (maxValue - minValue)) * 100;
              return (
                <Text key={val} style={[styles.yLabel, { bottom: `${pct}%` }]}>
                  {val}
                </Text>
              );
            })}
          </View>

          <View style={[styles.xLabels, { left: padding.left, width: graphWidth }]}>
            {timeLabels.map((label, i) => (
              <Text
                key={i}
                style={[
                  styles.xLabel,
                  { left: label.x - padding.left - 20, width: 40 },
                ]}
              >
                {label.time}
              </Text>
            ))}
          </View>
        </>
      )}

      {latestPoint && (
        <View style={[styles.latestBadge, { left: Math.min(latestPoint.x - 20, width - 50), top: Math.max(latestPoint.y - 35, 5) }]}>
          <Text style={[styles.latestValue, { color: getPointColor(latestPoint.value) }]}>
            {latestPoint.value}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "relative",
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyText: {
    fontSize: 14,
    fontWeight: "700" as const,
    color: Colors.light.textSecondary,
    marginBottom: 4,
  },
  emptySubtext: {
    fontSize: 12,
    color: Colors.light.textSecondary,
  },
  yLabels: {
    position: "absolute",
    left: 0,
    width: 35,
  },
  yLabel: {
    position: "absolute",
    fontSize: 10,
    fontWeight: "600" as const,
    color: Colors.light.textSecondary,
    textAlign: "right",
    width: 30,
    transform: [{ translateY: 5 }],
  },
  xLabels: {
    position: "absolute",
    bottom: 5,
    flexDirection: "row",
  },
  xLabel: {
    position: "absolute",
    fontSize: 9,
    fontWeight: "600" as const,
    color: Colors.light.textSecondary,
    textAlign: "center",
  },
  latestBadge: {
    position: "absolute",
    backgroundColor: Colors.light.surface,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  latestValue: {
    fontSize: 12,
    fontWeight: "900" as const,
  },
});
