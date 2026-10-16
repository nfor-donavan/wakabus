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
import BrandFooter from "../components/BrandFooter";
import { useTheme } from "../context/ThemeContext";
import { useLanguage } from "../context/LanguageContext";

export default function SearchScreen({ navigation }) {
  const { theme } = useTheme();
  const styles = createStyles(theme);
  const { t } = useLanguage();
  const [departureCity, setDepartureCity] = useState("Yaoundé");
  const [destinationCity, setDestinationCity] = useState("Douala");
  const [date, setDate] = useState(""); // optional, format YYYY-MM-DD
  const [loading, setLoading] = useState(false);

  async function handleSearch() {
    if (!departureCity || !destinationCity) {
      Alert.alert(t("common.missingInfo"), t("search.missingCities"));
      return;
    }
    if (date && !/^\d{4}-\d{2}-\d{2}$/.test(date.trim())) {
      Alert.alert(
        t("search.checkDate"),
        t("search.badDate")
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
      Alert.alert(t("search.failed"), err.message);
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
      <Text style={styles.title}>{t("search.title")}</Text>
      <Text style={styles.subtitle}>{t("search.subtitle")}</Text>

      <View style={styles.card}>
        <Text style={styles.label}>{t("search.from")}</Text>
        <TextInput
          style={styles.input}
          value={departureCity}
          onChangeText={setDepartureCity}
          placeholder={t("search.fromPlaceholder")}
          placeholderTextColor={theme.muted}
        />

        <TouchableOpacity style={styles.swapButton} onPress={swapCities}>
          <Text style={styles.swapText}>{t("search.swap")}</Text>
        </TouchableOpacity>

        <Text style={styles.label}>{t("search.to")}</Text>
        <TextInput
          style={styles.input}
          value={destinationCity}
          onChangeText={setDestinationCity}
          placeholder={t("search.toPlaceholder")}
          placeholderTextColor={theme.muted}
        />

        <Text style={styles.label}>{t("search.date")}</Text>
        <TextInput
          style={styles.input}
          value={date}
          onChangeText={setDate}
          placeholder={t("search.datePlaceholder")}
          placeholderTextColor={theme.muted}
        />
      </View>

      <TouchableOpacity style={styles.searchButton} onPress={handleSearch} disabled={loading}>
        <Text style={styles.searchButtonText}>{loading ? t("search.searching") : t("search.button")}</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.navigate("MyTickets")}>
        <Text style={styles.myTicketsLink}>{t("search.myTickets")}</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.navigate("StaffLogin")}>
        <Text style={styles.staffLink}>{t("search.staffLink")}</Text>
      </TouchableOpacity>

      <BrandFooter />
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
    // Deliberately understated — this is for counter/admin staff, not a
    // passenger-facing feature, so it shouldn't compete for attention.
    staffLink: {
      textAlign: "center",
      color: theme.muted,
      marginTop: 14,
      fontWeight: "500",
      fontSize: 11,
    },
  });
}
