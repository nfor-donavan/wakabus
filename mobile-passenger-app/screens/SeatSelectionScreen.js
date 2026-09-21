import React, { useMemo, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from "react-native";
import Svg, { Circle, Line, Rect } from "react-native-svg";
import { useTheme } from "../context/ThemeContext";
import { buildSeatRows } from "../utils/seatLayout";

function SteeringWheelIcon({ color }) {
  return (
    <Svg width={26} height={26} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8}>
      <Circle cx="12" cy="12" r="9" />
      <Circle cx="12" cy="12" r="2.4" />
      <Line x1="12" y1="3" x2="12" y2="9.6" />
      <Line x1="5.3" y1="16" x2="9.8" y2="13.4" />
      <Line x1="18.7" y1="16" x2="14.2" y2="13.4" />
    </Svg>
  );
}
function DoorIcon({ color }) {
  return (
    <Svg width={22} height={26} viewBox="0 0 20 24" fill="none" stroke={color} strokeWidth={1.8}>
      <Rect x="2" y="2" width="16" height="20" rx="2" />
      <Circle cx="13" cy="12" r="1.2" fill={color} stroke="none" />
    </Svg>
  );
}

export default function SeatSelectionScreen({ route, navigation }) {
  const { theme } = useTheme();
  const styles = createStyles(theme);
  const {
    tenantId,
    companyName,
    scheduleId,
    availableSeats,
    totalSeats,
    seatingLayout,
    basePrice,
    busClass,
  } = route.params;
  const [selectedSeat, setSelectedSeat] = useState(null);

  const availableSet = useMemo(() => new Set(availableSeats), [availableSeats]);
  const seatCount = totalSeats || Math.max(...availableSeats, 0);
  const { rows, left, right } = useMemo(
    () => buildSeatRows(seatCount, seatingLayout, busClass),
    [seatCount, seatingLayout, busClass]
  );

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

  function renderSeat(seat) {
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
  }

  return (
    <View style={styles.container}>
      <Text style={styles.subtitle}>
        {companyName} · {busClass} · {basePrice?.toLocaleString()} XAF
      </Text>

      <View style={styles.legendRow}>
        <LegendDot theme={theme} color={theme.border} label="Taken" />
        <LegendDot theme={theme} color={theme.card} border={theme.navy} label="Available" />
        <LegendDot theme={theme} color={theme.navy} label="Selected" />
      </View>

      <ScrollView contentContainerStyle={styles.busBody}>
        {/* Front of the bus: driver's cab on the left (Cameroon drives on
            the right side of the road, so the wheel is on the left), the
            entrance door on the right. */}
        <View style={styles.cab}>
          <View style={styles.cabSide}>
            <SteeringWheelIcon color={theme.navy} />
            <Text style={styles.cabLabel}>Driver</Text>
          </View>
          <View style={styles.cabSide}>
            <DoorIcon color={theme.muted} />
            <Text style={styles.cabLabel}>Door</Text>
          </View>
        </View>

        {rows.map((row, rowIndex) => (
          <View key={rowIndex} style={styles.rowWrapper}>
            {rowIndex === 0 && (
              <Text style={styles.besideDriverLabel}>Beside driver</Text>
            )}
            <View style={styles.row}>
              <View style={styles.seatPack}>{row.left.map(renderSeat)}</View>
              <View style={styles.aisle} />
              <View style={styles.seatPack}>{row.right.map(renderSeat)}</View>
            </View>
          </View>
        ))}
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

function LegendDot({ color, border, label, theme }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center" }}>
      <View
        style={{
          width: 14,
          height: 14,
          borderRadius: 4,
          borderWidth: 1,
          backgroundColor: color,
          borderColor: border || color,
          marginRight: 6,
        }}
      />
      <Text style={{ fontSize: 12, color: theme.muted }}>{label}</Text>
    </View>
  );
}

const SEAT_SIZE = 44;

function createStyles(theme) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.bg, padding: 16 },
    subtitle: { fontSize: 14, color: theme.text, marginBottom: 12, textAlign: "center" },
    legendRow: { flexDirection: "row", justifyContent: "center", gap: 16, marginBottom: 14 },

    busBody: {
      backgroundColor: theme.card,
      borderRadius: 24,
      borderWidth: 1,
      borderColor: theme.border,
      paddingVertical: 18,
      paddingHorizontal: 14,
      alignItems: "center",
    },

    cab: {
      flexDirection: "row",
      justifyContent: "space-between",
      width: "100%",
      paddingHorizontal: 6,
      paddingBottom: 16,
      marginBottom: 10,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
      borderStyle: "dashed",
    },
    cabSide: { alignItems: "center", gap: 4 },
    cabLabel: { fontSize: 11, color: theme.muted, fontWeight: "600" },

    rowWrapper: { width: "100%", marginBottom: 4 },
    besideDriverLabel: {
      fontSize: 10,
      color: theme.gold,
      fontWeight: "700",
      textAlign: "center",
      marginBottom: 4,
      textTransform: "uppercase",
      letterSpacing: 0.4,
    },
    row: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 8,
    },
    seatPack: { flexDirection: "row", gap: 8 },
    aisle: { width: 28 },

    seat: {
      width: SEAT_SIZE,
      height: SEAT_SIZE,
      borderRadius: 10,
      borderWidth: 1.5,
      borderColor: theme.navy,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: theme.card,
    },
    seatTaken: { borderColor: theme.border, backgroundColor: theme.border },
    seatSelected: { backgroundColor: theme.navy },
    seatText: { fontWeight: "700", color: theme.navy, fontSize: 13 },
    seatTextTaken: { color: theme.muted },
    seatTextSelected: { color: "#fff" },

    continueButton: {
      backgroundColor: theme.navy,
      borderRadius: 12,
      paddingVertical: 14,
      alignItems: "center",
      marginTop: 14,
    },
    continueButtonDisabled: { backgroundColor: theme.border },
    continueText: { color: "#fff", fontWeight: "700", fontSize: 15 },
  });
}
