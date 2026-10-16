import React from "react";
import { View, Text, Image, StyleSheet } from "react-native";
import { useTheme } from "../context/ThemeContext";
import { useLanguage } from "../context/LanguageContext";
import { BRAND } from "../utils/branding";

// Understated "Powered by" line for the bottom of a screen.
export default function BrandFooter() {
  const { theme } = useTheme();
  const { t } = useLanguage();
  return (
    <View style={styles.row}>
      <Image source={BRAND.emblem} resizeMode="contain" style={styles.emblem} />
      <View>
        <Text style={[styles.strong, { color: theme.text }]}>{t("brand.poweredBy")}</Text>
        <Text style={[styles.slogan, { color: theme.muted }]}>{BRAND.slogan}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 22, opacity: 0.9 },
  emblem: { width: 22, height: 22, borderRadius: 5, backgroundColor: "#fff" },
  strong: { fontSize: 11, fontWeight: "600" },
  slogan: { fontSize: 10, fontStyle: "italic" },
});
