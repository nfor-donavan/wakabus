import React from "react";
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from "react-native";
import { useTheme } from "../context/ThemeContext";

export default function ResultsScreen({ route, navigation }) {
  const { theme } = useTheme();
  const styles = createStyles(theme);
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
            seatingLayout: bus?.seatingLayout,
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

function createStyles(theme) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.bg, padding: 16 },
    header: { fontSize: 15, fontWeight: "700", color: theme.navy, marginBottom: 12 },
    card: {
      backgroundColor: theme.card,
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
    },
    row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
    company: { fontSize: 16, fontWeight: "700", color: theme.text },
    price: { fontSize: 16, fontWeight: "700", color: theme.gold },
    time: { fontSize: 14, color: theme.text, marginTop: 4 },
    meta: { fontSize: 12, color: theme.muted, marginTop: 6 },
    empty: { textAlign: "center", color: theme.muted, marginTop: 40 },
  });
}
