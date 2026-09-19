import React from "react";
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from "react-native";

export default function ResultsScreen({ route, navigation }) {
  const { schedules, departureCity, destinationCity } = route.params;

  function renderItem({ item }) {
    const company = item.tenantId?.companyName || "Unknown company";
    const bus = item.busId;
    const departure = new Date(item.departureTime);

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() =>
          navigation.navigate("SeatSelection", {
            tenantId: item.tenantId._id,
            companyName: company,
            scheduleId: item._id,
            availableSeats: item.availableSeats,
            totalSeats: bus?.totalSeats,
            basePrice: item.routeId?.basePrice,
            busClass: bus?.busClass,
          })
        }
      >
        <View style={styles.row}>
          <Text style={styles.company}>{company}</Text>
          <Text style={styles.price}>{item.routeId?.basePrice?.toLocaleString()} XAF</Text>
        </View>
        <Text style={styles.time}>
          {departure.toLocaleDateString()} · {departure.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </Text>
        <View style={styles.row}>
          <Text style={styles.meta}>{bus?.busClass} · {bus?.registrationNumber}</Text>
          <Text style={styles.meta}>{item.availableSeats.length} seats left</Text>
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.header}>
        {departureCity} → {destinationCity}
      </Text>
      <FlatList
        data={schedules}
        keyExtractor={(item) => item._id}
        renderItem={renderItem}
        ListEmptyComponent={
          <Text style={styles.empty}>No trips found for this route yet. Try another date.</Text>
        }
        contentContainerStyle={{ paddingBottom: 24 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F4F6FB", padding: 16 },
  header: { fontSize: 15, fontWeight: "700", color: "#0B2E8A", marginBottom: 12 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  company: { fontSize: 16, fontWeight: "700" },
  price: { fontSize: 16, fontWeight: "700", color: "#f5a623" },
  time: { fontSize: 14, color: "#374151", marginTop: 4 },
  meta: { fontSize: 12, color: "#6b7280", marginTop: 6 },
  empty: { textAlign: "center", color: "#6b7280", marginTop: 40 },
});
