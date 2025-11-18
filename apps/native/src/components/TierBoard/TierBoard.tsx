import React, { useState } from "react";
import { ScrollView, StyleSheet } from "react-native";
import type { Items } from "@tiercade/core";
import { TierRow } from "./TierRow";
import { TierMoveModal } from "./TierMoveModal";

interface TierBoardProps {
  tiers: Items;
  tierOrder: string[];
  tierColors?: Record<string, string>;
  tierLabels?: Record<string, string>;
  onMoveItem: (itemId: string, targetTierName: string) => void;
}

export const TierBoard: React.FC<TierBoardProps> = ({
  tiers,
  tierOrder,
  tierColors = {},
  tierLabels = {},
  onMoveItem
}) => {
  const [moveModalVisible, setMoveModalVisible] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);

  const allTiers = [...tierOrder, "unranked"];

  // Find the item to get its name for the modal
  const selectedItem = selectedItemId
    ? Object.values(tiers)
        .flat()
        .find((item) => item.id === selectedItemId)
    : null;

  const handleOpenMoveModal = (itemId: string) => {
    setSelectedItemId(itemId);
    setMoveModalVisible(true);
  };

  const handleSelectTier = (tierId: string) => {
    if (selectedItemId) {
      onMoveItem(selectedItemId, tierId);
    }
    setMoveModalVisible(false);
    setSelectedItemId(null);
  };

  const handleCloseModal = () => {
    setMoveModalVisible(false);
    setSelectedItemId(null);
  };

  return (
    <>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
      >
        {allTiers.map((tierId) => (
          <TierRow
            key={tierId}
            tierId={tierId}
            items={tiers[tierId] ?? []}
            tierColor={tierColors[tierId]}
            tierLabel={tierLabels[tierId]}
            onMoveItem={handleOpenMoveModal}
          />
        ))}
      </ScrollView>

      <TierMoveModal
        visible={moveModalVisible}
        itemName={selectedItem?.name ?? selectedItem?.id ?? "Item"}
        tierOrder={tierOrder}
        tierLabels={tierLabels}
        tierColors={tierColors}
        onSelectTier={handleSelectTier}
        onClose={handleCloseModal}
      />
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  contentContainer: {
    padding: 16
  }
});
