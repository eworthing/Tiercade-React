import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import type { Item } from "@tiercade/core";

interface TierItemCardProps {
  item: Item;
  onMove: () => void;
}

export const TierItemCard: React.FC<TierItemCardProps> = ({ item, onMove }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.itemText} numberOfLines={1}>
        {item.name ?? item.id}
      </Text>
      <TouchableOpacity
        style={styles.moveButton}
        onPress={onMove}
        activeOpacity={0.7}
      >
        <Text style={styles.moveButtonText}>↕</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1E293B",
    borderWidth: 1,
    borderColor: "#334155",
    borderRadius: 6,
    paddingLeft: 10,
    paddingRight: 4,
    paddingVertical: 6,
    gap: 6
  },
  itemText: {
    flex: 1,
    fontSize: 13,
    color: "#E2E8F0",
    fontWeight: "500"
  },
  moveButton: {
    width: 28,
    height: 28,
    backgroundColor: "#334155",
    borderRadius: 4,
    alignItems: "center",
    justifyContent: "center"
  },
  moveButtonText: {
    fontSize: 16,
    color: "#94A3B8",
    fontWeight: "600"
  }
});
