import React, { useCallback, useState } from "react";
import { View, Text, FlatList, StyleSheet, TouchableOpacity } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import QRCode from "react-native-qrcode-svg";
import { getAllOfflineTickets } from "../services/ticketStorage";
import { useTheme } from "../context/ThemeContext";

/**
 * Reads straight from AsyncStorage — works with zero connectivity. This is
 * the screen a passenger opens at the boarding gate if they closed the app
 * after booking, or booked earlier while they had signal.
 */
export default function MyTicketsScreen() {
  const { theme } = useTheme();
  const styles = createStyles(theme);
  const [tickets, setTickets] = useState([]);
  const [expandedCode, setExpandedCode] = useState(null);

  useFocusEffect(
    useCallback(() => {
      getAllOfflineTickets().then(setTickets);
    }, [])
  );

  function renderItem({ item }) {
    const isExpanded = expandedCode === item.ticketCode;
    const departure = new Date(item.departureTime);

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => setExpandedCode(isExpanded ? null : item.ticketCode)}
      >
        <View style={styles.row}>
          <Text style={styles.route}>
            {item.departureCity} → {item.destinationCity}
          </Text>
          <Text style={styles.seat}>Seat {item.seatNumber}</Text>
        </View>
        <Text style={styles.time}>
          {departure.toLocaleDateString()} · {departure.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </Text>
        <Text style={styles.code}>{item.ticketCode}</Text>

        {isExpanded && (
          <View style={styles.qrWrapper}>
            <QRCode value={item.signedQrPayload} size={160} />
          </View>
        )}
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={tickets}
        keyExtractor={(item) => item.ticketCode}
        renderItem={renderItem}
        ListEmptyComponent={
          <Text style={styles.empty}>
            No saved tickets yet. Once you book and pay for a trip, it appears here — and stays
            available even offline.
          </Text>
        }
        contentContainerStyle={{ paddingBottom: 24 }}
      />
    </View>
  );
}

function createStyles(theme) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.bg, padding: 16 },
    card: { backgroundColor: theme.card, borderRadius: 12, padding: 16, marginBottom: 12 },
    row: { flexDirection: "row", justifyContent: "space-between" },
    route: { fontSize: 15, fontWeight: "700", color: theme.text },
    seat: { fontSize: 13, fontWeight: "600", color: theme.navy },
    time: { fontSize: 12, color: theme.muted, marginTop: 4 },
    code: { fontSize: 12, fontWeight: "600", marginTop: 6, letterSpacing: 0.5, color: theme.text },
    // Fixed white background behind the QR — react-native-qrcode-svg already
    // draws its own white tile, but this keeps the surrounding padding
    // consistent and readable in dark mode too.
    qrWrapper: {
      alignItems: "center",
      marginTop: 14,
      backgroundColor: "#fff",
      borderRadius: 10,
      paddingVertical: 12,
    },
    empty: { textAlign: "center", color: theme.muted, marginTop: 40, paddingHorizontal: 20 },
  });
}
