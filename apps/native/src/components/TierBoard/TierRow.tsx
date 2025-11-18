import React from "react";
import { View, Text, StyleSheet } from "react-native";
import type { Item } from "@tiercade/core";
import { TierItemCard } from "./TierItemCard";

interface TierRowProps {
  tierId: string;
  items: Item[];
  tierColor?: string;
  tierLabel?: string;
  onMoveItem: (itemId: string) => void;
}

export const TierRow: React.FC<TierRowProps> = ({
  tierId,
  items,
  tierColor = "#1E293B",
  tierLabel,
  onMoveItem
}) => {
  const label = tierLabel ?? (tierId === "unranked" ? "Unranked" : tierId);

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: `${tierColor}20`,
          borderLeftColor: tierColor,
          borderLeftWidth: 4
        }
      ]}
    >
      <View style={styles.header}>
        <View style={[styles.badge, { backgroundColor: tierColor }]}>
          <Text style={styles.badgeText}>{label}</Text>
        </View>
        <Text style={styles.count}>
          {items.length} item{items.length === 1 ? "" : "s"}
        </Text>
      </View>

      <View style={styles.itemsContainer}>
        {items.length === 0 ? (
          <Text style={styles.emptyText}>No items</Text>
        ) : (
          items.map((item) => (
            <TierItemCard
              key={item.id}
              item={item}
              onMove={() => onMoveItem(item.id)}
            />
          ))
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#334155",
    marginBottom: 12,
    padding: 12
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginRight: 8
  },
  badgeText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase"
  },
  count: {
    fontSize: 11,
    color: "#64748B"
  },
  itemsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8
  },
  emptyText: {
    fontSize: 12,
    color: "#475569",
    fontStyle: "italic"
  }
});
