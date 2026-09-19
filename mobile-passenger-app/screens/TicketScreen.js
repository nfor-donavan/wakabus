import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity } from "react-native";
import QRCode from "react-native-qrcode-svg";
import { api } from "../services/api";
import { saveTicketOffline } from "../services/ticketStorage";

export default function TicketScreen({ route, navigation }) {
  const { bookingId, tenantId, companyName } = route.params;
  const [ticket, setTicket] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const data = await api.getTicket(bookingId, tenantId);
        setTicket(data);
        // Cache immediately — this is what makes the ticket work with zero
        // signal at the terminal (see services/ticketStorage.js).
        await saveTicketOffline(data);
      } catch (err) {
        setError(err.message);
      }
    })();
  }, [bookingId, tenantId]);

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  if (!ticket) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#0B2E8A" />
        <Text style={styles.loadingText}>Issuing your ticket…</Text>
      </View>
    );
  }

  const departure = new Date(ticket.departureTime);

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.company}>{companyName}</Text>
        <Text style={styles.route}>
          {ticket.departureCity} → {ticket.destinationCity}
        </Text>
        <Text style={styles.time}>
          {departure.toLocaleDateString()} · {departure.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </Text>

        <View style={styles.qrWrapper}>
          <QRCode value={ticket.signedQrPayload} size={180} />
        </View>

        <Text style={styles.ticketCode}>{ticket.ticketCode}</Text>

        <View style={styles.detailsRow}>
          <View>
            <Text style={styles.detailLabel}>Seat</Text>
            <Text style={styles.detailValue}>{ticket.seatNumber}</Text>
          </View>
          <View>
            <Text style={styles.detailLabel}>Passenger</Text>
            <Text style={styles.detailValue}>{ticket.passengerName}</Text>
          </View>
          <View>
            <Text style={styles.detailLabel}>Fare</Text>
            <Text style={styles.detailValue}>{ticket.farePaid?.toLocaleString()} XAF</Text>
          </View>
        </View>

        <Text style={styles.offlineNote}>
          Saved on this device — this screen works even with no signal at the terminal.
        </Text>
      </View>

      <TouchableOpacity style={styles.doneButton} onPress={() => navigation.popToTop()}>
        <Text style={styles.doneText}>Book another trip</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F4F6FB", padding: 20, justifyContent: "center" },
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 20 },
  loadingText: { marginTop: 12, color: "#6b7280" },
  errorText: { color: "#d64545", textAlign: "center" },
  card: { backgroundColor: "#fff", borderRadius: 16, padding: 24, alignItems: "center" },
  company: { fontSize: 18, fontWeight: "700", color: "#0B2E8A" },
  route: { fontSize: 15, fontWeight: "600", marginTop: 4 },
  time: { fontSize: 13, color: "#6b7280", marginBottom: 16 },
  qrWrapper: { padding: 12, backgroundColor: "#fff", borderRadius: 12, marginBottom: 12 },
  ticketCode: { fontSize: 16, fontWeight: "700", letterSpacing: 1, marginBottom: 16 },
  detailsRow: { flexDirection: "row", gap: 24, marginBottom: 12 },
  detailLabel: { fontSize: 11, color: "#6b7280", textAlign: "center" },
  detailValue: { fontSize: 14, fontWeight: "700", textAlign: "center" },
  offlineNote: { fontSize: 11, color: "#9ca3af", textAlign: "center", marginTop: 8 },
  doneButton: {
    backgroundColor: "#0B2E8A",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 20,
  },
  doneText: { color: "#fff", fontWeight: "700", fontSize: 15 },
});
