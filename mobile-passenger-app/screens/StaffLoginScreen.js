import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from "react-native";
import { staffApi } from "../services/staffApi";
import { useTheme } from "../context/ThemeContext";
import { useLanguage } from "../context/LanguageContext";

export default function StaffLoginScreen({ navigation }) {
  const { theme } = useTheme();
  const styles = createStyles(theme);
  const { t } = useLanguage();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    if (!email || !password) {
      Alert.alert(t("common.missingInfo"), t("staff.enterCreds"));
      return;
    }
    setLoading(true);
    try {
      await staffApi.login(email.trim(), password);
      navigation.replace("StaffScanner");
    } catch (err) {
      Alert.alert(t("staff.loginFailed"), err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t("staff.title")}</Text>
      <Text style={styles.subtitle}>{t("staff.subtitle")}</Text>

      <TextInput
        style={styles.input}
        placeholder={t("staff.email")}
        placeholderTextColor={theme.muted}
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
      />
      <TextInput
        style={styles.input}
        placeholder={t("staff.password")}
        placeholderTextColor={theme.muted}
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      {loading ? (
        <ActivityIndicator size="large" color={theme.navy} />
      ) : (
        <TouchableOpacity style={styles.button} onPress={handleLogin}>
          <Text style={styles.buttonText}>{t("staff.signIn")}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

function createStyles(theme) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.bg, padding: 24, justifyContent: "center" },
    title: { fontSize: 20, fontWeight: "700", textAlign: "center", color: theme.navy },
    subtitle: { fontSize: 13, color: theme.muted, textAlign: "center", marginBottom: 24 },
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
