import React from "react";
import { View, Text, StyleSheet } from "react-native";

export const ThemesScreen: React.FC = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Themes (Native)</Text>
      <Text style={styles.subtitle}>
        This screen will browse and apply themes using @tiercade/theme and a theme slice from @tiercade/state.
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

