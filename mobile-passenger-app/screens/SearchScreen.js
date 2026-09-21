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
import { useTheme } from "../context/ThemeContext";

export default function SearchScreen({ navigation }) {
  const { theme } = useTheme();
  const styles = createStyles(theme);
  const [departureCity, setDepartureCity] = useState("Yaoundé");
  const [destinationCity, setDestinationCity] = useState("Douala");
  const [date, setDate] = useState(""); // optional, format YYYY-MM-DD
  const [loading, setLoading] = useState(false);

  async function handleSearch() {
    if (!departureCity || !destinationCity) {
      Alert.alert("Missing info", "Enter both a departure and destination city.");
      return;
    }
    if (date && !/^\d{4}-\d{2}-\d{2}$/.test(date.trim())) {
      Alert.alert(
        "Check the date",
        "Enter the date as YYYY-MM-DD (e.g. 2026-09-25), or leave it blank to see every upcoming trip."
      );
      return;
    }
    setLoading(true);
    try {
      const schedules = await api.searchCompanies(
        departureCity.trim(),
        destinationCity.trim(),
        date ? date.trim() : undefined
      );
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
          placeholderTextColor={theme.muted}
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
          placeholderTextColor={theme.muted}
        />

        <Text style={styles.label}>Date (optional)</Text>
        <TextInput
          style={styles.input}
          value={date}
          onChangeText={setDate}
          placeholder="YYYY-MM-DD"
          placeholderTextColor={theme.muted}
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

function createStyles(theme) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.bg, padding: 24, justifyContent: "center" },
    logo: { width: 72, height: 72, alignSelf: "center", borderRadius: 18, marginBottom: 16 },
    title: { fontSize: 20, fontWeight: "700", textAlign: "center", color: theme.navy },
    subtitle: { fontSize: 13, color: theme.muted, textAlign: "center", marginBottom: 20 },
    card: { backgroundColor: theme.card, borderRadius: 14, padding: 18, marginBottom: 20 },
    label: { fontSize: 12, color: theme.muted, marginBottom: 4, marginTop: 8 },
    input: {
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: 10,
      padding: 12,
      fontSize: 15,
      color: theme.text,
    },
    swapButton: { alignSelf: "flex-end", marginTop: 6 },
    swapText: { color: theme.navy, fontSize: 13, fontWeight: "600" },
    searchButton: {
      backgroundColor: theme.navy,
      borderRadius: 12,
      paddingVertical: 14,
      alignItems: "center",
    },
    searchButtonText: { color: "#fff", fontWeight: "700", fontSize: 15 },
    myTicketsLink: {
      textAlign: "center",
      color: theme.navy,
      marginTop: 18,
      fontWeight: "600",
      fontSize: 13,
    },
  });
}
