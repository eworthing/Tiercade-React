import React from "react";
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  ScrollView
} from "react-native";

interface TierMoveModalProps {
  visible: boolean;
  itemName: string;
  tierOrder: string[];
  tierLabels: Record<string, string>;
  tierColors: Record<string, string>;
  onSelectTier: (tierId: string) => void;
  onClose: () => void;
}

export const TierMoveModal: React.FC<TierMoveModalProps> = ({
  visible,
  itemName,
  tierOrder,
  tierLabels,
  tierColors,
  onSelectTier,
  onClose
}) => {
  const allTiers = [...tierOrder, "unranked"];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>Move Item</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeText}>✕</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.itemName} numberOfLines={2}>
            {itemName}
          </Text>

          <Text style={styles.label}>Select destination tier:</Text>

          <ScrollView style={styles.tierList}>
            {allTiers.map((tierId) => {
              const label = tierLabels[tierId] ?? tierId;
              const color = tierColors[tierId] ?? "#1E293B";

              return (
                <TouchableOpacity
                  key={tierId}
                  style={[
                    styles.tierOption,
                    { borderLeftColor: color, borderLeftWidth: 4 }
                  ]}
                  onPress={() => onSelectTier(tierId)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.tierBadge, { backgroundColor: color }]}>
                    <Text style={styles.tierBadgeText}>{label}</Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20
  },
  container: {
    backgroundColor: "#0F172A",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#334155",
    width: "100%",
    maxWidth: 400,
    maxHeight: "80%",
    padding: 20
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: "#E2E8F0"
  },
  closeButton: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center"
  },
  closeText: {
    fontSize: 24,
    color: "#94A3B8",
    fontWeight: "300"
  },
  itemName: {
    fontSize: 15,
    color: "#CBD5E1",
    marginBottom: 16,
    fontWeight: "500"
  },
  label: {
    fontSize: 13,
    color: "#94A3B8",
    marginBottom: 12,
    fontWeight: "600",
    textTransform: "uppercase"
  },
  tierList: {
    maxHeight: 400
  },
  tierOption: {
    backgroundColor: "#1E293B",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#334155",
    padding: 12,
    marginBottom: 8
  },
  tierBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6
  },
  tierBadgeText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
    textTransform: "uppercase"
  }
});
