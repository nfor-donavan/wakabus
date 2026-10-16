import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from "react-native";
import { api } from "../services/api";
import { useTheme } from "../context/ThemeContext";
import { useLanguage } from "../context/LanguageContext";

/**
 * Full passenger flow from here:
 * 1. Reserve a seat (server holds it for RESERVATION_HOLD_MINUTES).
 * 2. Passenger completes Mobile Money PIN prompt (handled by your payment
 *    gateway's SDK/USSD flow — hook it in where marked below).
 * 3. Poll the booking status until the webhook confirms payment.
 * 4. Navigate to the Ticket screen, which fetches and caches the ticket offline.
 */
export default function BookingScreen({ route, navigation }) {
  const { theme } = useTheme();
  const styles = createStyles(theme);
  const { t } = useLanguage();
  const { tenantId, companyName, scheduleId, seatNumber, farePaid } = route.params;
  const [passengerName, setPassengerName] = useState("");
  const [passengerIdCard, setPassengerIdCard] = useState("");
  const [passengerPhone, setPassengerPhone] = useState("");
  const [bookingId, setBookingId] = useState(null);
  const [status, setStatus] = useState("idle"); // idle | reserving | held | polling | error

  async function handleReserve() {
    if (!passengerName || !passengerIdCard || !passengerPhone) {
      Alert.alert(t("common.missingInfo"), t("booking.fillAll"));
      return;
    }
    setStatus("reserving");
    try {
      const data = await api.reserveSeat({
        tenantId,
        scheduleId,
        seatNumber,
        passengerName,
        passengerIdCard,
        passengerPhone,
      });
      setBookingId(data.bookingId);
      setStatus("held");

      // TODO: trigger your Mobile Money gateway SDK here, passing
      // data.bookingId as the payment reference so the webhook
      // (backend/controllers/paymentController.js) can match it back.
      Alert.alert(
        t("booking.seatHeld"),
        t("booking.seatHeldBody")
      );
    } catch (err) {
      setStatus("error");
      Alert.alert(t("booking.reserveFailed"), err.message);
    }
  }

  // Call once the passenger has approved the Mobile Money PIN prompt.
  async function handleCheckPayment() {
    setStatus("polling");
    try {
      const { paymentStatus } = await api.getBookingStatus(bookingId, tenantId);
      if (paymentStatus === "Paid") {
        navigation.replace("Ticket", { bookingId, tenantId, companyName });
      } else if (paymentStatus === "Pending") {
        setStatus("held");
        Alert.alert(t("booking.stillPending"), t("booking.stillPendingBody"));
      } else {
        setStatus("error");
        Alert.alert(t("booking.notCompleted"), t("booking.notCompletedBody", { status: paymentStatus }));
      }
    } catch (err) {
      setStatus("held");
      Alert.alert(t("booking.statusFailed"), err.message);
    }
  }

  return (
    <View style={styles.container}>
      <Image source={require("../assets/app-icon.png")} style={styles.logo} />
      <Text style={styles.title}>{t("booking.seatCompany", { n: seatNumber, company: companyName })}</Text>
      <Text style={styles.fare}>{farePaid?.toLocaleString()} XAF</Text>

      <TextInput
        style={styles.input}
        placeholder={t("booking.fullName")}
        placeholderTextColor={theme.muted}
        value={passengerName}
        onChangeText={setPassengerName}
        editable={status === "idle" || status === "error"}
      />
      <TextInput
        style={styles.input}
        placeholder={t("booking.idCard")}
        placeholderTextColor={theme.muted}
        value={passengerIdCard}
        onChangeText={setPassengerIdCard}
        editable={status === "idle" || status === "error"}
      />
      <TextInput
        style={styles.input}
        placeholder={t("booking.phone")}
        placeholderTextColor={theme.muted}
        value={passengerPhone}
        onChangeText={setPassengerPhone}
        keyboardType="phone-pad"
        editable={status === "idle" || status === "error"}
      />

      {(status === "idle" || status === "error") && (
        <TouchableOpacity style={styles.button} onPress={handleReserve}>
          <Text style={styles.buttonText}>{t("booking.reserveAndPay")}</Text>
        </TouchableOpacity>
      )}

      {status === "reserving" && <ActivityIndicator size="large" color={theme.navy} />}

      {status === "held" && (
        <TouchableOpacity style={styles.button} onPress={handleCheckPayment}>
          <Text style={styles.buttonText}>{t("booking.checkPayment")}</Text>
        </TouchableOpacity>
      )}

      {status === "polling" && <ActivityIndicator size="large" color={theme.navy} />}
    </View>
  );
}

function createStyles(theme) {
  return StyleSheet.create({
    container: { flex: 1, padding: 20, backgroundColor: theme.bg, justifyContent: "center" },
    logo: { width: 64, height: 64, alignSelf: "center", marginBottom: 12, borderRadius: 14 },
    title: { fontSize: 18, fontWeight: "700", marginBottom: 4, textAlign: "center", color: theme.navy },
    fare: { fontSize: 16, fontWeight: "600", textAlign: "center", marginBottom: 20, color: theme.gold },
    input: {
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: 10,
      padding: 12,
      marginBottom: 12,
      fontSize: 15,
      color: theme.text,
      backgroundColor: theme.card,
    },
    button: {
      backgroundColor: theme.navy,
      borderRadius: 12,
      paddingVertical: 14,
      alignItems: "center",
      marginTop: 8,
    },
    buttonText: { color: "#fff", fontWeight: "700", fontSize: 15 },
  });
}
