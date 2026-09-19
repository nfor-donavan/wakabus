import React, { useState, useMemo } from "react";
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from "react-native";

export default function SeatSelectionScreen({ route, navigation }) {
  const {
    tenantId,
    companyName,
    scheduleId,
    availableSeats,
    totalSeats,
    basePrice,
    busClass,
  } = route.params;
  const [selectedSeat, setSelectedSeat] = useState(null);

  const availableSet = useMemo(() => new Set(availableSeats), [availableSeats]);
  const seatCount = totalSeats || Math.max(...availableSeats, 0);
  const seatNumbers = Array.from({ length: seatCount }, (_, i) => i + 1);

  function handleContinue() {
    if (!selectedSeat) return;
    navigation.navigate("Booking", {
      tenantId,
      companyName,
      scheduleId,
      seatNumber: selectedSeat,
      farePaid: basePrice,
    });
  }

  return (
    <View style={styles.container}>
      <Text style={styles.subtitle}>
        {companyName} · {busClass} · {basePrice?.toLocaleString()} XAF
      </Text>

      <View style={styles.legendRow}>
        <LegendDot color="#e2e6ef" label="Taken" />
        <LegendDot color="#fff" border="#0B2E8A" label="Available" />
        <LegendDot color="#0B2E8A" label="Selected" />
      </View>

      <ScrollView contentContainerStyle={styles.grid}>
        {seatNumbers.map((seat) => {
          const isAvailable = availableSet.has(seat);
          const isSelected = selectedSeat === seat;
          return (
            <TouchableOpacity
              key={seat}
              disabled={!isAvailable}
              onPress={() => setSelectedSeat(seat)}
              style={[
                styles.seat,
                !isAvailable && styles.seatTaken,
                isSelected && styles.seatSelected,
              ]}
            >
              <Text
                style={[
                  styles.seatText,
                  !isAvailable && styles.seatTextTaken,
                  isSelected && styles.seatTextSelected,
                ]}
              >
                {seat}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <TouchableOpacity
        style={[styles.continueButton, !selectedSeat && styles.continueButtonDisabled]}
        onPress={handleContinue}
        disabled={!selectedSeat}
      >
        <Text style={styles.continueText}>
          {selectedSeat ? `Continue with seat ${selectedSeat}` : "Select a seat"}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

function LegendDot({ color, border, label }) {
  return (
    <View style={styles.legendItem}>
      <View style={[styles.legendDot, { backgroundColor: color, borderColor: border || color }]} />
      <Text style={styles.legendLabel}>{label}</Text>
    </View>
  );
}

const SEAT_SIZE = 52;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", padding: 16 },
  subtitle: { fontSize: 14, color: "#374151", marginBottom: 12, textAlign: "center" },
  legendRow: { flexDirection: "row", justifyContent: "center", gap: 16, marginBottom: 16 },
  legendItem: { flexDirection: "row", alignItems: "center" },
  legendDot: { width: 14, height: 14, borderRadius: 4, borderWidth: 1, marginRight: 6 },
  legendLabel: { fontSize: 12, color: "#6b7280" },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 10,
    paddingBottom: 20,
  },
  seat: {
    width: SEAT_SIZE,
    height: SEAT_SIZE,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: "#0B2E8A",
    alignItems: "center",
    justifyContent: "center",
  },
  seatTaken: { borderColor: "#e2e6ef", backgroundColor: "#e2e6ef" },
  seatSelected: { backgroundColor: "#0B2E8A" },
  seatText: { fontWeight: "700", color: "#0B2E8A" },
  seatTextTaken: { color: "#9ca3af" },
  seatTextSelected: { color: "#fff" },
  continueButton: {
    backgroundColor: "#0B2E8A",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 8,
  },
  continueButtonDisabled: { backgroundColor: "#c7cede" },
  continueText: { color: "#fff", fontWeight: "700", fontSize: 15 },
});
