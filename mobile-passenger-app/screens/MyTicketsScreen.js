import React, { useCallback, useState } from "react";
import { View, Text, FlatList, StyleSheet, TouchableOpacity } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import QRCode from "react-native-qrcode-svg";
import { getAllOfflineTickets } from "../services/ticketStorage";

/**
 * Reads straight from AsyncStorage — works with zero connectivity. This is
 * the screen a passenger opens at the boarding gate if they closed the app
 * after booking, or booked earlier while they had signal.
 */
export default function MyTicketsScreen() {
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

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F4F6FB", padding: 16 },
  card: { backgroundColor: "#fff", borderRadius: 12, padding: 16, marginBottom: 12 },
  row: { flexDirection: "row", justifyContent: "space-between" },
  route: { fontSize: 15, fontWeight: "700" },
  seat: { fontSize: 13, fontWeight: "600", color: "#0B2E8A" },
  time: { fontSize: 12, color: "#6b7280", marginTop: 4 },
  code: { fontSize: 12, fontWeight: "600", marginTop: 6, letterSpacing: 0.5 },
  qrWrapper: { alignItems: "center", marginTop: 14 },
  empty: { textAlign: "center", color: "#6b7280", marginTop: 40, paddingHorizontal: 20 },
});
