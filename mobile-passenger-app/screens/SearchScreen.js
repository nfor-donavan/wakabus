import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { api } from "../services/api";

export default function SearchScreen({ navigation }) {
  const [departureCity, setDepartureCity] = useState("Yaoundé");
  const [destinationCity, setDestinationCity] = useState("Douala");
  const [date, setDate] = useState(""); // optional, format YYYY-MM-DD
  const [loading, setLoading] = useState(false);

  async function handleSearch() {
    if (!departureCity || !destinationCity) {
      Alert.alert("Missing info", "Enter both a departure and destination city.");
      return;
    }
    setLoading(true);
    try {
      const schedules = await api.searchCompanies(departureCity, destinationCity, date || undefined);
      navigation.navigate("Results", { schedules, departureCity, destinationCity });
    } catch (err) {
      Alert.alert("Search failed", err.message);
    } finally {
      setLoading(false);
    }
  }

  function swapCities() {
    setDepartureCity(destinationCity);
    setDestinationCity(departureCity);
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <Image source={require("../assets/app-icon.png")} style={styles.logo} />
      <Text style={styles.title}>Book your inter-city trip</Text>
      <Text style={styles.subtitle}>Compare every company running your route</Text>

      <View style={styles.card}>
        <Text style={styles.label}>From</Text>
        <TextInput
          style={styles.input}
          value={departureCity}
          onChangeText={setDepartureCity}
          placeholder="Departure city"
        />

        <TouchableOpacity style={styles.swapButton} onPress={swapCities}>
          <Text style={styles.swapText}>⇅ Swap</Text>
        </TouchableOpacity>

        <Text style={styles.label}>To</Text>
        <TextInput
          style={styles.input}
          value={destinationCity}
          onChangeText={setDestinationCity}
          placeholder="Destination city"
        />

        <Text style={styles.label}>Date (optional)</Text>
        <TextInput
          style={styles.input}
          value={date}
          onChangeText={setDate}
          placeholder="YYYY-MM-DD"
        />
      </View>

      <TouchableOpacity style={styles.searchButton} onPress={handleSearch} disabled={loading}>
        <Text style={styles.searchButtonText}>{loading ? "Searching…" : "Search buses"}</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.navigate("MyTickets")}>
        <Text style={styles.myTicketsLink}>My tickets (offline)</Text>
      </TouchableOpacity>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F4F6FB", padding: 24, justifyContent: "center" },
  logo: { width: 72, height: 72, alignSelf: "center", borderRadius: 18, marginBottom: 16 },
  title: { fontSize: 20, fontWeight: "700", textAlign: "center", color: "#0B2E8A" },
  subtitle: { fontSize: 13, color: "#6b7280", textAlign: "center", marginBottom: 20 },
  card: { backgroundColor: "#fff", borderRadius: 14, padding: 18, marginBottom: 20 },
  label: { fontSize: 12, color: "#6b7280", marginBottom: 4, marginTop: 8 },
  input: {
    borderWidth: 1,
    borderColor: "#e2e6ef",
    borderRadius: 10,
    padding: 12,
    fontSize: 15,
  },
  swapButton: { alignSelf: "flex-end", marginTop: 6 },
  swapText: { color: "#0B2E8A", fontSize: 13, fontWeight: "600" },
  searchButton: {
    backgroundColor: "#0B2E8A",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  searchButtonText: { color: "#fff", fontWeight: "700", fontSize: 15 },
  myTicketsLink: {
    textAlign: "center",
    color: "#0B2E8A",
    marginTop: 18,
    fontWeight: "600",
    fontSize: 13,
  },
});
