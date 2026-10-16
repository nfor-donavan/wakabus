import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  ActivityIndicator,
  Alert,
} from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { staffApi } from "../services/staffApi";
import { useTheme } from "../context/ThemeContext";
import { useLanguage } from "../context/LanguageContext";

const NEXT_STATUS = {
  Received_At_Origin: "Loaded_On_Bus",
  Loaded_On_Bus: "Arrived_At_Destination",
};
const NEXT_STATUS_LABEL = {
  Loaded_On_Bus: "scan.markLoaded",
  Arrived_At_Destination: "scan.markArrived",
};

export default function StaffScannerScreen({ navigation }) {
  const { theme } = useTheme();
  const styles = createStyles(theme);
  const { t } = useLanguage();
  const [permission, requestPermission] = useCameraPermissions();
  const [scannedCode, setScannedCode] = useState(null);
  const [pkg, setPkg] = useState(null);
  const [loading, setLoading] = useState(false);
  const [otp, setOtp] = useState("");

  useEffect(() => {
    if (permission && !permission.granted) requestPermission();
  }, [permission]);

  async function handleBarcodeScanned({ data }) {
    if (scannedCode) return; // already looking at a result — ignore further scans
    setScannedCode(data);
    setLoading(true);
    try {
      const result = await staffApi.getPackageByTrackingCode(data.trim());
      setPkg(result);
    } catch (err) {
      Alert.alert(t("scan.notFound"), err.message, [{ text: t("scan.scanAgain"), onPress: resetScanner }]);
    } finally {
      setLoading(false);
    }
  }

  function resetScanner() {
    setScannedCode(null);
    setPkg(null);
    setOtp("");
  }

  async function handleLogout() {
    await staffApi.logout();
    navigation.replace("Search");
  }

  async function handleAdvance() {
    const nextStatus = NEXT_STATUS[pkg.status];
    if (!nextStatus) return;
    setLoading(true);
    try {
      const updated = await staffApi.updatePackageStatus(pkg._id, nextStatus);
      setPkg(updated);
      Alert.alert(t("scan.updated"), t("scan.updatedBody", { code: pkg.trackingCode, status: t(`scan.status.${nextStatus}`) }));
    } catch (err) {
      Alert.alert(t("scan.updateFailed"), err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyPickup() {
    if (!otp.trim()) {
      Alert.alert(t("scan.enterCode"), t("scan.enterCodeBody"));
      return;
    }
    setLoading(true);
    try {
      await staffApi.verifyPickup(pkg.trackingCode, otp.trim());
      Alert.alert(t("scan.handedOver"), t("scan.handedOverBody", { code: pkg.trackingCode }), [
        { text: t("scan.scanNext"), onPress: resetScanner },
      ]);
    } catch (err) {
      Alert.alert(t("scan.verifyFailed"), err.message);
    } finally {
      setLoading(false);
    }
  }

  if (!permission) {
    return <View style={styles.center} />;
  }
  if (!permission.granted) {
    return (
      <View style={styles.center}>
        <Text style={styles.permissionText}>{t("scan.cameraNeeded")}</Text>
        <TouchableOpacity style={styles.button} onPress={requestPermission}>
          <Text style={styles.buttonText}>{t("scan.grant")}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {!scannedCode && (
        <CameraView
          style={styles.camera}
          barcodeScannerSettings={{ barcodeTypes: ["qr", "code128", "ean13", "code39"] }}
          onBarcodeScanned={handleBarcodeScanned}
        >
          <View style={styles.scanFrame} />
          <Text style={styles.scanHint}>{t("scan.hint")}</Text>
        </CameraView>
      )}

      {scannedCode && (
        <View style={styles.resultCard}>
          {loading && !pkg && <ActivityIndicator size="large" color={theme.navy} />}

          {pkg && (
            <>
              <Text style={styles.trackingCode}>{pkg.trackingCode}</Text>
              <Text style={styles.detail}>{pkg.packageDetails?.description}</Text>
              <Text style={styles.detailMuted}>
                {t("scan.from", { name: pkg.sender?.name, phone: pkg.sender?.phone })}
              </Text>
              <Text style={styles.detailMuted}>
                {t("scan.to", { name: pkg.recipient?.name, phone: pkg.recipient?.phone })}
              </Text>
              <Text style={styles.status}>{t(`scan.status.${pkg.status}`)}</Text>

              {NEXT_STATUS[pkg.status] && (
                <TouchableOpacity style={styles.button} onPress={handleAdvance} disabled={loading}>
                  <Text style={styles.buttonText}>
                    {loading ? t("scan.updating") : t(NEXT_STATUS_LABEL[NEXT_STATUS[pkg.status]])}
                  </Text>
                </TouchableOpacity>
              )}

              {pkg.status === "Arrived_At_Destination" && (
                <>
                  <TextInput
                    style={styles.input}
                    placeholder={t("scan.pickupPlaceholder")}
                    placeholderTextColor={theme.muted}
                    value={otp}
                    onChangeText={setOtp}
                    keyboardType="number-pad"
                    maxLength={4}
                  />
                  <TouchableOpacity style={styles.button} onPress={handleVerifyPickup} disabled={loading}>
                    <Text style={styles.buttonText}>{loading ? t("scan.verifying") : t("scan.verifyButton")}</Text>
                  </TouchableOpacity>
                </>
              )}

              {pkg.status === "Collected" && (
                <Text style={styles.detailMuted}>{t("scan.alreadyCollected")}</Text>
              )}
            </>
          )}

          <TouchableOpacity style={styles.secondaryButton} onPress={resetScanner}>
            <Text style={styles.secondaryButtonText}>{t("scan.scanNextPackage")}</Text>
          </TouchableOpacity>
        </View>
      )}

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.secondaryButtonText}>{t("scan.logout")}</Text>
      </TouchableOpacity>
    </View>
  );
}

function createStyles(theme) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.bg },
    center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24, backgroundColor: theme.bg },
    permissionText: { color: theme.text, textAlign: "center", marginBottom: 16 },
    camera: { flex: 1, alignItems: "center", justifyContent: "center" },
    scanFrame: {
      width: 240,
      height: 240,
      borderWidth: 3,
      borderColor: theme.gold,
      borderRadius: 16,
      backgroundColor: "transparent",
    },
    scanHint: {
      position: "absolute",
      bottom: 40,
      color: "#fff",
      fontSize: 13,
      fontWeight: "600",
      backgroundColor: "rgba(0,0,0,0.5)",
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 20,
    },
    resultCard: { flex: 1, padding: 24, justifyContent: "center" },
    trackingCode: { fontSize: 22, fontWeight: "700", color: theme.navy, textAlign: "center" },
    status: {
      fontSize: 13,
      fontWeight: "700",
      color: theme.gold,
      textAlign: "center",
      textTransform: "uppercase",
      marginVertical: 12,
    },
    detail: { fontSize: 15, color: theme.text, textAlign: "center", marginTop: 8 },
    detailMuted: { fontSize: 13, color: theme.muted, textAlign: "center", marginTop: 4 },
    input: {
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: 10,
      padding: 12,
      marginTop: 16,
      fontSize: 18,
      textAlign: "center",
      letterSpacing: 4,
      color: theme.text,
      backgroundColor: theme.card,
    },
    button: {
      backgroundColor: theme.navy,
      borderRadius: 12,
      paddingVertical: 14,
      alignItems: "center",
      marginTop: 16,
    },
    buttonText: { color: "#fff", fontWeight: "700", fontSize: 15 },
    secondaryButton: { alignItems: "center", marginTop: 20, padding: 10 },
    secondaryButtonText: { color: theme.navy, fontWeight: "600", fontSize: 13 },
    logoutButton: { alignItems: "center", paddingVertical: 14, backgroundColor: theme.card },
  });
}
