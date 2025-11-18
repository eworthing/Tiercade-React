import React from "react";
import { View, Text, StyleSheet } from "react-native";

export const AnalyticsScreen: React.FC = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Analytics (Native)</Text>
      <Text style={styles.subtitle}>
        This screen will visualize tier distributions and stats computed via @tiercade/core.
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#020617",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24
  },
  title: {
    fontSize: 22,
    fontWeight: "600",
    color: "#e5e7eb",
    marginBottom: 8
  },
  subtitle: {
    fontSize: 14,
    color: "#9ca3af",
    textAlign: "center"
  }
});

