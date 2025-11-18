import React from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { useAppDispatch } from "../hooks/useAppDispatch";
import { useAppSelector } from "../hooks/useAppSelector";
import { startHeadToHead, voteCurrentPair, finishHeadToHead } from "@tiercade/state";

export const HeadToHeadScreen: React.FC = () => {
  const dispatch = useAppDispatch();
  const isActive = useAppSelector((state) => state.headToHead.isActive);
  const currentPair = useAppSelector((state) => state.headToHead.currentPair);

  const handleStart = () => {
    dispatch(startHeadToHead());
  };

  const handleVoteLeft = () => {
    if (!currentPair) return;
    dispatch(voteCurrentPair(currentPair[0].id));
  };

  const handleVoteRight = () => {
    if (!currentPair) return;
    dispatch(voteCurrentPair(currentPair[1].id));
  };

  const handleFinish = () => {
    dispatch(finishHeadToHead());
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Head-to-Head (Native)</Text>
      <Text style={styles.subtitle}>
        Uses shared @tiercade/core head-to-head logic and @tiercade/state.
      </Text>
      <Pressable style={styles.button} onPress={handleStart}>
        <Text style={styles.buttonLabel}>
          {isActive ? "Restart Session" : "Start Session"}
        </Text>
      </Pressable>
      {isActive && (
        <Pressable style={[styles.button, styles.applyButton]} onPress={handleFinish}>
          <Text style={styles.buttonLabel}>Apply Results</Text>
        </Pressable>
      )}
      {currentPair && (
        <View style={styles.pairContainer}>
          <Text style={styles.pairLabel}>Current pair</Text>
          <View style={styles.pairButtons}>
            <Pressable style={styles.choice} onPress={handleVoteLeft}>
              <Text style={styles.choiceLabel}>
                {currentPair[0].name ?? currentPair[0].id}
              </Text>
            </Pressable>
            <Text style={styles.vsLabel}>vs</Text>
            <Pressable style={styles.choice} onPress={handleVoteRight}>
              <Text style={styles.choiceLabel}>
                {currentPair[1].name ?? currentPair[1].id}
              </Text>
            </Pressable>
          </View>
        </View>
      )}
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
  },
  button: {
    marginTop: 24,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: "#3B82F6"
  },
  applyButton: {
    backgroundColor: "#0f172a",
    borderWidth: 1,
    borderColor: "#4b5563",
    marginTop: 12
  },
  buttonLabel: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600"
  },
  pairContainer: {
    marginTop: 24,
    alignItems: "center"
  },
  pairLabel: {
    fontSize: 14,
    color: "#e5e7eb",
    marginBottom: 8
  },
  pairButtons: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12
  },
  choice: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: "#0f172a",
    borderWidth: 1,
    borderColor: "#4b5563"
  },
  choiceLabel: {
    color: "#e5e7eb",
    fontSize: 14
  },
  vsLabel: {
    color: "#9ca3af",
    fontSize: 14
  }
});
